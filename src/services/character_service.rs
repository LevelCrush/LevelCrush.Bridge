use crate::models::{Character, CreateCharacterRequest, CharacterDeathRequest, CharacterStats};
use crate::utils::AppError;
use chrono::Utc;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct CharacterService;

impl CharacterService {
    /// Create a new character for a dynasty
    pub async fn create_character(
        pool: &PgPool,
        dynasty_id: Uuid,
        request: CreateCharacterRequest,
    ) -> Result<Character, AppError> {
        // Get dynasty info
        let dynasty: (i32,) = sqlx::query_as(
            "SELECT generation FROM dynasties WHERE id = $1 AND is_active = true"
        )
        .bind(dynasty_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("Dynasty not found".to_string()))?;

        let generation = dynasty.0;

        // Generate initial stats with some randomness
        use rand::Rng;
        
        // Generate all random values before any await point
        let (health, stamina, charisma, intelligence, luck) = {
            let mut rng = rand::thread_rng();
            (
                50 + rng.gen_range(0..31),        // 50-80
                50 + rng.gen_range(0..31),        // 50-80
                40 + rng.gen_range(0..41),        // 40-80
                40 + rng.gen_range(0..41),        // 40-80
                30 + rng.gen_range(0..51),        // 30-80
            )
        };

        let character = sqlx::query_as::<_, Character>(
            r#"
            INSERT INTO characters (
                dynasty_id, name, birth_date, health, stamina,
                charisma, intelligence, luck, generation,
                parent_character_id, inheritance_received
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            "#
        )
        .bind(dynasty_id)
        .bind(&request.name)
        .bind(Utc::now())
        .bind(health)
        .bind(stamina)
        .bind(charisma)
        .bind(intelligence)
        .bind(luck)
        .bind(generation)
        .bind(request.parent_character_id)
        .bind(rust_decimal::Decimal::from(0))
        .fetch_one(pool)
        .await?;

        Ok(character)
    }

    /// Get a character by ID
    pub async fn get_character(
        pool: &PgPool,
        character_id: Uuid,
    ) -> Result<Character, AppError> {
        let character = sqlx::query_as::<_, Character>(
            "SELECT * FROM characters WHERE id = $1"
        )
        .bind(character_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("Character not found".to_string()))?;

        Ok(character)
    }

    /// Get all characters for a dynasty (both living and dead)
    pub async fn get_dynasty_characters(
        pool: &PgPool,
        dynasty_id: Uuid,
    ) -> Result<Vec<Character>, AppError> {
        let characters = sqlx::query_as::<_, Character>(
            "SELECT * FROM characters WHERE dynasty_id = $1 ORDER BY is_alive DESC, birth_date DESC"
        )
        .bind(dynasty_id)
        .fetch_all(pool)
        .await?;

        Ok(characters)
    }

    /// Process character death
    pub async fn process_character_death(
        pool: &PgPool,
        character_id: Uuid,
        death_request: CharacterDeathRequest,
    ) -> Result<(), AppError> {
        let mut tx = pool.begin().await?;

        // Update character death
        let character: Character = sqlx::query_as(
            r#"
            UPDATE characters 
            SET death_date = $1, death_cause = $2, is_alive = false, updated_at = $1
            WHERE id = $3 AND is_alive = true
            RETURNING *
            "#
        )
        .bind(Utc::now())
        .bind(&death_request.death_cause)
        .bind(character_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| AppError::NotFound("Character not found or already dead".to_string()))?;

        // Calculate wealth (simplified for now)
        // Note: We need to calculate wealth before the transaction for now
        // TODO: Refactor to work with transaction
        let wealth = rust_decimal::Decimal::from(1000); // Placeholder

        // Create death event
        sqlx::query(
            r#"
            INSERT INTO death_events (
                character_id, dynasty_id, death_date, death_cause,
                location_id, wealth_at_death, reputation_at_death,
                market_impact_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(character.id)
        .bind(character.dynasty_id)
        .bind(character.death_date.unwrap())
        .bind(&death_request.death_cause)
        .bind(character.location_id)
        .bind(wealth)
        .bind(0) // TODO: Calculate reputation
        .bind(Self::calculate_market_impact(&character, &wealth))
        .execute(&mut *tx)
        .await?;

        // Handle inheritance
        if wealth > rust_decimal::Decimal::from(0) {
            Self::process_inheritance(&mut tx, &character, wealth).await?;
        }

        tx.commit().await?;
        Ok(())
    }

    /// Apply aging effects to all living characters
    pub async fn apply_aging_to_all_characters(pool: &PgPool) -> Result<i32, AppError> {
        let mut affected = 0;
        
        // Get all living characters
        let characters = sqlx::query_as::<_, Character>(
            "SELECT * FROM characters WHERE is_alive = true"
        )
        .fetch_all(pool)
        .await?;

        for mut character in characters {
            character.apply_aging_effects();
            
            // Update character stats
            sqlx::query(
                r#"
                UPDATE characters 
                SET health = $1, stamina = $2, charisma = $3, 
                    intelligence = $4, updated_at = $5
                WHERE id = $6
                "#
            )
            .bind(character.health)
            .bind(character.stamina)
            .bind(character.charisma)
            .bind(character.intelligence)
            .bind(Utc::now())
            .bind(character.id)
            .execute(pool)
            .await?;

            // Check for death
            if character.should_die_of_old_age() {
                let death_request = CharacterDeathRequest {
                    death_cause: "Old Age".to_string(),
                };
                
                if let Err(e) = Self::process_character_death(pool, character.id, death_request).await {
                    tracing::error!("Failed to process death for character {}: {}", character.id, e);
                }
            }

            affected += 1;
        }

        Ok(affected)
    }

    /// Get character stats with additional computed fields
    pub async fn get_character_stats(
        pool: &PgPool,
        character_id: Uuid,
    ) -> Result<CharacterStats, AppError> {
        let character = Self::get_character(pool, character_id).await?;
        let wealth = Self::calculate_character_wealth(pool, character_id).await?;
        
        // Get location name if available
        let location_name: Option<(String,)> = if let Some(location_id) = character.location_id {
            sqlx::query_as("SELECT name FROM regions WHERE id = $1")
                .bind(location_id)
                .fetch_optional(pool)
                .await?
                .map(|(name,)| (name,))
        } else {
            None
        };

        Ok(CharacterStats {
            character_id: character.id,
            name: character.name.clone(),
            age: character.age(),
            health: character.health,
            stamina: character.stamina,
            charisma: character.charisma,
            intelligence: character.intelligence,
            luck: character.luck,
            trading_bonus: character.trading_bonus(),
            location: location_name.map(|(name,)| name),
            wealth,
        })
    }

    // Helper methods

    async fn calculate_character_wealth(
        pool: &PgPool,
        character_id: Uuid,
    ) -> Result<rust_decimal::Decimal, AppError> {
        // For now, just count inventory value
        // TODO: Add market prices, property, etc.
        let wealth: (rust_decimal::Decimal,) = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(quantity), 0) as total_wealth
            FROM character_inventory
            WHERE character_id = $1
            "#
        )
        .bind(character_id)
        .fetch_one(pool)
        .await?;

        Ok(wealth.0)
    }

    fn calculate_market_impact(character: &Character, wealth: &rust_decimal::Decimal) -> i32 {
        
        let wealth_value = wealth.to_string().parse::<f64>().unwrap_or(0.0);
        let base_impact = (wealth_value / 1000.0) as i32;
        let reputation_modifier = 1; // TODO: Get from actual reputation
        let generation_modifier = character.generation;
        
        base_impact * reputation_modifier * generation_modifier
    }

    async fn process_inheritance(
        tx: &mut Transaction<'_, Postgres>,
        deceased: &Character,
        wealth: rust_decimal::Decimal,
    ) -> Result<(), AppError> {
        // Find living children
        let children: Vec<(Uuid,)> = sqlx::query_as(
            r#"
            SELECT id FROM characters 
            WHERE parent_character_id = $1 AND is_alive = true
            "#
        )
        .bind(deceased.id)
        .fetch_all(&mut **tx)
        .await?;

        if children.is_empty() {
            // No direct heirs, wealth goes to dynasty treasury
            sqlx::query(
                r#"
                UPDATE dynasties 
                SET total_wealth = total_wealth + $1
                WHERE id = $2
                "#
            )
            .bind(wealth)
            .bind(deceased.dynasty_id)
            .execute(&mut **tx)
            .await?;
        } else {
            // Divide among children
                let child_count = rust_decimal::Decimal::from(children.len() as i64);
            let per_child = wealth / &child_count;
            
            for (child_id,) in children {
                sqlx::query(
                    r#"
                    UPDATE characters 
                    SET inheritance_received = inheritance_received + $1
                    WHERE id = $2
                    "#
                )
                .bind(per_child)
                .bind(child_id)
                .execute(&mut **tx)
                .await?;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Tests would go here but require a test database setup
}
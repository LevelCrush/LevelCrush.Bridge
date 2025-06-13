use crate::models::{Character, Dynasty, MarketEvent, MarketEventType};
use crate::services::MarketService;
use crate::utils::AppError;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use sqlx::{PgPool, Transaction, Postgres};
use std::str::FromStr;
use uuid::Uuid;

pub struct DeathService;

#[derive(Debug, Clone)]
pub struct DeathEvent {
    pub character_id: Uuid,
    pub dynasty_id: Uuid,
    pub death_cause: String,
    pub character_wealth: Decimal,
    pub location_id: Uuid,
    pub died_at: DateTime<Utc>,
}

impl DeathService {
    /// Process a character death and all its consequences
    pub async fn process_character_death(
        pool: &PgPool,
        character_id: Uuid,
        death_cause: String,
    ) -> Result<DeathEvent, AppError> {
        let mut tx = pool.begin().await?;

        // Get character details
        let character: Character = sqlx::query_as(
            "SELECT * FROM characters WHERE id = $1 AND is_alive = true FOR UPDATE"
        )
        .bind(character_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| AppError::NotFound("Character not found or already dead".to_string()))?;

        // Mark character as dead
        sqlx::query(
            r#"
            UPDATE characters 
            SET is_alive = false, 
                died_at = NOW(), 
                death_cause = $1
            WHERE id = $2
            "#
        )
        .bind(&death_cause)
        .bind(character_id)
        .execute(&mut *tx)
        .await?;

        // Calculate inheritance
        let character_wealth = Self::calculate_character_wealth(&mut tx, character_id).await?;
        let inheritance_tax = character_wealth * Decimal::from_str("0.1").unwrap(); // 10% death tax
        let net_inheritance = character_wealth - inheritance_tax;

        // Update dynasty with death event
        sqlx::query(
            r#"
            UPDATE dynasties 
            SET total_deaths = total_deaths + 1,
                treasury = treasury + $1,
                last_death_at = NOW()
            WHERE id = $2
            "#
        )
        .bind(net_inheritance)
        .bind(character.dynasty_id)
        .execute(&mut *tx)
        .await?;

        // Create ghost market listings for valuable items
        let _ghost_count = Self::create_ghost_listings(&mut tx, character_id).await?;

        // Record the death event
        let death_event_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO death_events (
                id, character_id, dynasty_id, death_cause,
                character_wealth, inheritance_tax, net_inheritance,
                market_events_created, died_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            "#
        )
        .bind(death_event_id)
        .bind(character_id)
        .bind(character.dynasty_id)
        .bind(&death_cause)
        .bind(character_wealth)
        .bind(inheritance_tax)
        .bind(net_inheritance)
        .bind(0) // We'll create market events after the transaction commits
        .execute(&mut *tx)
        .await?;

        let location_id = character.location_id.unwrap_or_default();
        tx.commit().await?;

        // Create market events after transaction commits
        let _market_events = Self::create_market_impact_events_after_death(
            pool,
            &character,
            character_wealth,
        ).await?;

        // Announce death to other systems
        Self::announce_death(pool, &character, &death_cause).await?;

        Ok(DeathEvent {
            character_id,
            dynasty_id: character.dynasty_id,
            death_cause,
            character_wealth,
            location_id,
            died_at: Utc::now(),
        })
    }

    /// Calculate total wealth of a character (inventory + currency)
    async fn calculate_character_wealth(
        tx: &mut Transaction<'_, Postgres>,
        character_id: Uuid,
    ) -> Result<Decimal, AppError> {
        // Get liquid wealth (simplified - using inheritance_received as wallet)
        let liquid_wealth: (Decimal,) = sqlx::query_as(
            "SELECT COALESCE(inheritance_received, 0) FROM characters WHERE id = $1"
        )
        .bind(character_id)
        .fetch_one(&mut **tx)
        .await?;

        // Calculate inventory value
        let inventory_value: (Decimal,) = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(ci.quantity * i.base_price), 0)
            FROM character_inventory ci
            JOIN items i ON ci.item_id = i.id
            WHERE ci.character_id = $1
            "#
        )
        .bind(character_id)
        .fetch_one(&mut **tx)
        .await?;

        Ok(liquid_wealth.0 + inventory_value.0)
    }

    /// Create market events based on character death (after transaction commits)
    async fn create_market_impact_events_after_death(
        pool: &PgPool,
        character: &Character,
        wealth: Decimal,
    ) -> Result<Vec<MarketEvent>, AppError> {
        let mut events = Vec::new();

        // Determine impact severity based on wealth
        let wealth_value = wealth.to_string().parse::<f64>().unwrap_or(0.0);
        let impact_score = wealth_value / 1000.0;
        
        let severity = match impact_score {
            x if x > 10.0 => 5,  // Major impact
            x if x > 5.0 => 3,   // Moderate impact
            x if x > 1.0 => 2,   // Minor impact
            _ => 1,              // Minimal impact
        };

        // Create regional market shock if character was wealthy
        if wealth > Decimal::from(10000) && character.location_id.is_some() {
            let event = MarketService::create_market_event(
                pool,
                MarketEventType::Disaster,
                severity,
                character.location_id,
                None, // Affects all items in region
                24, // 24 hour duration
                Decimal::from_str("1.1").unwrap(), // 10% price increase
                Some(format!("Market shock from death of wealthy trader {}", character.name)),
            ).await?;
            events.push(event);
        }

        // Get major holdings for the character
        let major_holdings: Vec<(Uuid, i32)> = sqlx::query_as(
            r#"
            SELECT item_id, SUM(quantity) as total_quantity
            FROM character_inventory 
            WHERE character_id = $1 
            GROUP BY item_id
            HAVING SUM(quantity) > 100
            ORDER BY total_quantity DESC
            LIMIT 3
            "#
        )
        .bind(character.id)
        .fetch_all(pool)
        .await?;

        for (item_id, quantity) in major_holdings {
            let price_modifier = if quantity > 1000 {
                Decimal::from_str("0.9").unwrap() // 10% price drop from surplus
            } else {
                Decimal::from_str("1.05").unwrap() // 5% price increase from scarcity
            };

            let event = MarketService::create_market_event(
                pool,
                MarketEventType::Surplus,
                2,
                character.location_id,
                Some(item_id),
                12, // 12 hour duration
                price_modifier,
                Some(format!("Estate liquidation of {} items", quantity)),
            ).await?;
            events.push(event);
        }

        Ok(events)
    }

    /// Create ghost market listings for character's valuable items
    async fn create_ghost_listings(
        tx: &mut Transaction<'_, Postgres>,
        character_id: Uuid,
    ) -> Result<i32, AppError> {
        // Get character's location for listings
        let location: Option<(Uuid,)> = sqlx::query_as(
            "SELECT location_id FROM characters WHERE id = $1"
        )
        .bind(character_id)
        .fetch_optional(&mut **tx)
        .await?;

        let region_id = location
            .and_then(|l| l.0.into())
            .unwrap_or_else(|| Uuid::parse_str("d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a").unwrap()); // Default to The Hub

        // Convert valuable inventory items to ghost listings
        let ghost_count = sqlx::query(
            r#"
            INSERT INTO market_listings (
                region_id, item_id, seller_character_id, price,
                quantity, original_quantity, is_ghost_listing,
                ghost_price_modifier, expires_at
            )
            SELECT 
                $1, ci.item_id, NULL, i.base_price * 0.8,
                ci.quantity, ci.quantity, true,
                1.2, NOW() + INTERVAL '7 days'
            FROM character_inventory ci
            JOIN items i ON ci.item_id = i.id
            WHERE ci.character_id = $2
            AND i.base_price > 50
            AND ci.quantity > 0
            "#
        )
        .bind(region_id)
        .bind(character_id)
        .execute(&mut **tx)
        .await?;

        // Remove items from dead character's inventory
        sqlx::query(
            "DELETE FROM character_inventory WHERE character_id = $1"
        )
        .bind(character_id)
        .execute(&mut **tx)
        .await?;

        Ok(ghost_count.rows_affected() as i32)
    }

    /// Announce death to other systems
    async fn announce_death(
        pool: &PgPool,
        character: &Character,
        death_cause: &str,
    ) -> Result<(), AppError> {
        // Get dynasty info for announcement
        let dynasty: Dynasty = sqlx::query_as(
            "SELECT * FROM dynasties WHERE id = $1"
        )
        .bind(character.dynasty_id)
        .fetch_one(pool)
        .await?;

        // Log the death announcement
        tracing::info!(
            "Character {} of Dynasty {} has died at age {} from {}. Wealth impact: significant",
            character.name,
            dynasty.name,
            character.age(),
            death_cause
        );

        // TODO: Implement webhook notifications
        // TODO: Send Discord notifications
        // TODO: Update leaderboards
        // TODO: Trigger achievement checks

        Ok(())
    }

    /// Check if any characters should die of old age
    pub async fn check_natural_deaths(pool: &PgPool) -> Result<Vec<DeathEvent>, AppError> {
        let mut death_events = Vec::new();

        // Find characters who should die of old age
        let elderly_characters: Vec<(Uuid,)> = sqlx::query_as(
            r#"
            SELECT id FROM characters 
            WHERE is_alive = true 
            AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) > 70 
            AND RANDOM() < (EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) - 70) * 0.05  -- 5% chance per year over 70
            LIMIT 10  -- Process max 10 deaths per tick
            "#
        )
        .fetch_all(pool)
        .await?;

        for (character_id,) in elderly_characters {
            match Self::process_character_death(pool, character_id, "Old Age".to_string()).await {
                Ok(event) => death_events.push(event),
                Err(e) => tracing::error!("Failed to process natural death for {}: {:?}", character_id, e),
            }
        }

        // Check for disease/accident deaths (lower chance)
        let random_deaths: Vec<(Uuid, i32)> = sqlx::query_as(
            r#"
            SELECT c.id, c.health 
            FROM characters c
            WHERE c.is_alive = true 
            AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) > 16  -- Adults only
            AND RANDOM() < CASE 
                WHEN c.health < 20 THEN 0.01   -- 1% if very low health
                WHEN c.health < 50 THEN 0.001  -- 0.1% if low health
                ELSE 0.0001                    -- 0.01% if healthy
            END
            LIMIT 5  -- Process max 5 random deaths per tick
            "#
        )
        .fetch_all(pool)
        .await?;

        for (character_id, health) in random_deaths {
            let death_cause = if health < 20 {
                "Disease"
            } else if health < 50 {
                "Accident"
            } else {
                "Mysterious Circumstances"
            };

            match Self::process_character_death(pool, character_id, death_cause.to_string()).await {
                Ok(event) => death_events.push(event),
                Err(e) => tracing::error!("Failed to process death for {}: {:?}", character_id, e),
            }
        }

        Ok(death_events)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_death_event_creation() {
        let event = DeathEvent {
            character_id: Uuid::new_v4(),
            dynasty_id: Uuid::new_v4(),
            death_cause: "Testing".to_string(),
            character_wealth: Decimal::from(1000),
            location_id: Uuid::new_v4(),
            died_at: Utc::now(),
        };

        assert_eq!(event.death_cause, "Testing");
        assert_eq!(event.character_wealth, Decimal::from(1000));
    }
}
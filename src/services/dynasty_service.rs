use crate::models::{Dynasty, CreateDynastyRequest, DynastyStats};
use crate::utils::AppError;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

pub struct DynastyService;

impl DynastyService {
    /// Create a new dynasty for a user
    pub async fn create_dynasty(
        pool: &PgPool,
        user_id: Uuid,
        request: CreateDynastyRequest,
    ) -> Result<Dynasty, AppError> {
        // Check if user already has an active dynasty
        let existing: Option<(i64,)> = sqlx::query_as(
            "SELECT COUNT(*) FROM dynasties WHERE user_id = $1 AND is_active = true"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some((count,)) = existing {
            if count > 0 {
                return Err(AppError::BadRequest("User already has an active dynasty".to_string()));
            }
        }

        let dynasty = sqlx::query_as::<_, Dynasty>(
            r#"
            INSERT INTO dynasties (user_id, name, motto)
            VALUES ($1, $2, $3)
            RETURNING *
            "#
        )
        .bind(user_id)
        .bind(&request.name)
        .bind(&request.motto)
        .fetch_one(pool)
        .await?;

        Ok(dynasty)
    }

    /// Get dynasty by ID
    pub async fn get_dynasty(
        pool: &PgPool,
        dynasty_id: Uuid,
    ) -> Result<Dynasty, AppError> {
        let dynasty = sqlx::query_as::<_, Dynasty>(
            "SELECT * FROM dynasties WHERE id = $1"
        )
        .bind(dynasty_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("Dynasty not found".to_string()))?;

        Ok(dynasty)
    }

    /// Get dynasty by user ID
    pub async fn get_user_dynasty(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Dynasty, AppError> {
        let dynasty = sqlx::query_as::<_, Dynasty>(
            "SELECT * FROM dynasties WHERE user_id = $1 AND is_active = true"
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("No active dynasty found for user".to_string()))?;

        Ok(dynasty)
    }

    /// Get detailed dynasty statistics
    pub async fn get_dynasty_stats(
        pool: &PgPool,
        dynasty_id: Uuid,
    ) -> Result<DynastyStats, AppError> {
        let dynasty = Self::get_dynasty(pool, dynasty_id).await?;
        
        // Count characters
        let character_counts: (i64, i64) = sqlx::query_as(
            r#"
            SELECT 
                COUNT(*) FILTER (WHERE is_alive = true) as active,
                COUNT(*) as total
            FROM characters
            WHERE dynasty_id = $1
            "#
        )
        .bind(dynasty_id)
        .fetch_one(pool)
        .await?;

        Ok(DynastyStats {
            id: dynasty.id,
            name: dynasty.name.clone(),
            motto: dynasty.motto.clone(),
            generation: dynasty.generation,
            total_wealth: dynasty.total_wealth,
            reputation: dynasty.reputation,
            legacy_points: dynasty.legacy_points,
            prestige: dynasty.calculate_prestige(),
            perks: dynasty.get_perks(),
            active_characters: character_counts.0 as i32,
            total_characters: character_counts.1 as i32,
            founded_at: dynasty.founded_at,
        })
    }

    /// Update dynasty generation when a new heir is born
    pub async fn advance_generation(
        pool: &PgPool,
        dynasty_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE dynasties 
            SET generation = generation + 1
            WHERE id = $1
            "#
        )
        .bind(dynasty_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Add reputation to a dynasty
    pub async fn modify_reputation(
        pool: &PgPool,
        dynasty_id: Uuid,
        amount: i32,
    ) -> Result<i32, AppError> {
        let result: (i32,) = sqlx::query_as(
            r#"
            UPDATE dynasties 
            SET reputation = GREATEST(0, reputation + $1)
            WHERE id = $2
            RETURNING reputation
            "#
        )
        .bind(amount)
        .bind(dynasty_id)
        .fetch_one(pool)
        .await?;

        Ok(result.0)
    }

    /// Add legacy points (earned through significant achievements)
    pub async fn add_legacy_points(
        pool: &PgPool,
        dynasty_id: Uuid,
        points: i32,
    ) -> Result<i32, AppError> {
        let result: (i32,) = sqlx::query_as(
            r#"
            UPDATE dynasties 
            SET legacy_points = legacy_points + $1
            WHERE id = $2
            RETURNING legacy_points
            "#
        )
        .bind(points)
        .bind(dynasty_id)
        .fetch_one(pool)
        .await?;

        Ok(result.0)
    }

    /// Record dynasty wealth snapshot for historical tracking
    pub async fn record_wealth_snapshot(
        pool: &PgPool,
        dynasty_id: Uuid,
    ) -> Result<(), AppError> {
        let dynasty = Self::get_dynasty(pool, dynasty_id).await?;
        let stats = Self::get_dynasty_stats(pool, dynasty_id).await?;

        sqlx::query(
            r#"
            INSERT INTO dynasty_wealth_history (
                time, dynasty_id, total_wealth, active_characters,
                deceased_characters, reputation, generation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#
        )
        .bind(Utc::now())
        .bind(dynasty_id)
        .bind(dynasty.total_wealth)
        .bind(stats.active_characters)
        .bind(stats.total_characters - stats.active_characters)
        .bind(dynasty.reputation)
        .bind(dynasty.generation)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Get top dynasties by various metrics
    pub async fn get_leaderboard(
        pool: &PgPool,
        metric: &str,
        limit: i64,
    ) -> Result<Vec<DynastyStats>, AppError> {
        let order_by = match metric {
            "wealth" => "total_wealth DESC",
            "reputation" => "reputation DESC",
            "generation" => "generation DESC",
            "legacy" => "legacy_points DESC",
            _ => return Err(AppError::BadRequest("Invalid metric".to_string())),
        };

        let query = format!(
            "SELECT * FROM dynasties WHERE is_active = true ORDER BY {} LIMIT $1",
            order_by
        );

        let dynasties = sqlx::query_as::<_, Dynasty>(&query)
            .bind(limit)
            .fetch_all(pool)
            .await?;

        let mut stats = Vec::new();
        for dynasty in dynasties {
            if let Ok(dynasty_stats) = Self::get_dynasty_stats(pool, dynasty.id).await {
                stats.push(dynasty_stats);
            }
        }

        Ok(stats)
    }
}
use crate::services::DeathService;
use crate::utils::{AppError, Claims};
use axum::{
    extract::{Path, State},
    response::Json,
    Extension,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct KillCharacterRequest {
    pub death_cause: String,
}

/// Kill a character (admin only in production, but for testing we'll allow it)
pub async fn kill_character(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Path(character_id): Path<Uuid>,
    Json(request): Json<KillCharacterRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Verify the character belongs to this user
    let owner_check: Option<(Uuid,)> = sqlx::query_as(
        r#"
        SELECT d.user_id 
        FROM characters c
        JOIN dynasties d ON c.dynasty_id = d.id
        WHERE c.id = $1
        "#
    )
    .bind(character_id)
    .fetch_optional(&*pool)
    .await?;

    match owner_check {
        Some((owner_id,)) if owner_id != user_id => {
            return Err(AppError::ForbiddenWithReason("Cannot kill another player's character".to_string()));
        }
        None => {
            return Err(AppError::NotFound("Character not found".to_string()));
        }
        _ => {}
    }

    let death_event = DeathService::process_character_death(
        &pool,
        character_id,
        request.death_cause,
    ).await?;

    Ok(Json(json!({
        "death_event": {
            "character_id": death_event.character_id,
            "dynasty_id": death_event.dynasty_id,
            "death_cause": death_event.death_cause,
            "character_wealth": death_event.wealth_at_death,
            "location_id": death_event.location_id,
            "died_at": death_event.death_date,
        },
        "message": "Character has died. Their wealth has been added to the dynasty treasury."
    })))
}

/// Get recent deaths across all dynasties
pub async fn get_recent_deaths(
    State(pool): State<Arc<PgPool>>,
) -> Result<Json<Value>, AppError> {
    let deaths: Vec<(
        Uuid, String, i32, String, String, 
        rust_decimal::Decimal, i32, 
        chrono::DateTime<chrono::Utc>, i64
    )> = sqlx::query_as(
        r#"
        SELECT 
            de.id,
            c.name as character_name,
            c.age as character_age,
            d.name as dynasty_name,
            de.death_cause,
            COALESCE(de.wealth_at_death, 0) as character_wealth,
            COALESCE(de.market_impact_score, 0) as market_events_created,
            de.death_date,
            COUNT(DISTINCT ml.id) as ghost_listings
        FROM death_events de
        JOIN characters c ON de.character_id = c.id
        JOIN dynasties d ON de.dynasty_id = d.id
        LEFT JOIN market_listings ml ON ml.seller_character_id IS NULL 
            AND ml.is_ghost_listing = true 
            AND ml.listed_at >= de.death_date 
            AND ml.listed_at < de.death_date + INTERVAL '1 minute'
        WHERE de.death_date > CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY de.id, c.name, c.age, d.name, de.death_cause, 
                 de.wealth_at_death, de.market_impact_score, 
                 de.death_date
        ORDER BY de.death_date DESC
        LIMIT 50
        "#
    )
    .fetch_all(&*pool)
    .await?;

    let deaths: Vec<_> = deaths.into_iter().map(|(
        id, character_name, character_age, dynasty_name, death_cause,
        character_wealth, market_events_created,
        death_date, ghost_listings
    )| {
        // Calculate net inheritance (90% of wealth after 10% death tax)
        let net_inheritance = character_wealth * rust_decimal::Decimal::new(9, 1) / rust_decimal::Decimal::new(10, 0);
        
        json!({
            "id": id,
            "character_name": character_name,
            "character_age": character_age,
            "dynasty_name": dynasty_name,
            "death_cause": death_cause,
            "character_wealth": character_wealth,
            "net_inheritance": net_inheritance,
            "market_events_created": market_events_created,
            "ghost_listings_created": ghost_listings,
            "died_at": death_date,
        })
    }).collect();

    Ok(Json(json!({
        "recent_deaths": deaths,
        "count": deaths.len()
    })))
}

/// Get death statistics for a dynasty
pub async fn get_dynasty_death_stats(
    State(pool): State<Arc<PgPool>>,
    Path(dynasty_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Get total deaths and wealth impact
    let stats: (i32, rust_decimal::Decimal) = sqlx::query_as(
        r#"
        SELECT 
            COUNT(*)::INTEGER,
            COALESCE(SUM(wealth_at_death), 0)
        FROM death_events
        WHERE dynasty_id = $1
        "#
    )
    .bind(dynasty_id)
    .fetch_one(&*pool)
    .await?;

    // Get death causes breakdown
    let death_causes: Vec<(String, i64)> = sqlx::query_as(
        r#"
        SELECT death_cause, COUNT(*) as count
        FROM death_events
        WHERE dynasty_id = $1
        GROUP BY death_cause
        ORDER BY count DESC
        "#
    )
    .bind(dynasty_id)
    .fetch_all(&*pool)
    .await?;

    let causes: Vec<_> = death_causes.into_iter().map(|(cause, count)| {
        json!({
            "cause": cause,
            "count": count
        })
    }).collect();

    // Calculate total inheritance (90% of total wealth lost)
    let total_inheritance = stats.1 * rust_decimal::Decimal::new(9, 1) / rust_decimal::Decimal::new(10, 0);
    
    Ok(Json(json!({
        "dynasty_id": dynasty_id,
        "total_deaths": stats.0,
        "total_wealth_lost": stats.1,
        "total_inheritance_gained": total_inheritance,
        "death_causes": causes
    })))
}
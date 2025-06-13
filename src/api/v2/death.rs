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
            "character_wealth": death_event.character_wealth,
            "location_id": death_event.location_id,
            "died_at": death_event.died_at,
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
        rust_decimal::Decimal, rust_decimal::Decimal, i32, 
        chrono::DateTime<chrono::Utc>, i64
    )> = sqlx::query_as(
        r#"
        SELECT 
            de.id,
            c.name as character_name,
            c.age as character_age,
            d.name as dynasty_name,
            de.death_cause,
            de.character_wealth,
            de.net_inheritance,
            de.market_events_created,
            de.died_at,
            COUNT(DISTINCT ml.id) as ghost_listings
        FROM death_events de
        JOIN characters c ON de.character_id = c.id
        JOIN dynasties d ON de.dynasty_id = d.id
        LEFT JOIN market_listings ml ON ml.seller_character_id IS NULL 
            AND ml.is_ghost_listing = true 
            AND ml.listed_at >= de.died_at 
            AND ml.listed_at < de.died_at + INTERVAL '1 minute'
        WHERE de.died_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY de.id, c.name, c.age, d.name, de.death_cause, 
                 de.character_wealth, de.net_inheritance, 
                 de.market_events_created, de.died_at
        ORDER BY de.died_at DESC
        LIMIT 50
        "#
    )
    .fetch_all(&*pool)
    .await?;

    let deaths: Vec<_> = deaths.into_iter().map(|(
        id, character_name, character_age, dynasty_name, death_cause,
        character_wealth, net_inheritance, market_events_created,
        died_at, ghost_listings
    )| {
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
            "died_at": died_at,
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
    let stats: (i32, rust_decimal::Decimal, rust_decimal::Decimal) = sqlx::query_as(
        r#"
        SELECT 
            COUNT(*),
            COALESCE(SUM(character_wealth), 0),
            COALESCE(SUM(net_inheritance), 0)
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

    Ok(Json(json!({
        "dynasty_id": dynasty_id,
        "total_deaths": stats.0,
        "total_wealth_lost": stats.1,
        "total_inheritance_gained": stats.2,
        "death_causes": causes
    })))
}
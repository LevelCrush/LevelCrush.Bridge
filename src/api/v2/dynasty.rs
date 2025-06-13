use crate::utils::Claims;
use crate::models::CreateDynastyRequest;
use crate::services::DynastyService;
use crate::utils::AppError;
use axum::{
    extract::{Path, Query, State},
    response::Json,
    Extension,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LeaderboardQuery {
    pub metric: String,
    pub limit: Option<i64>,
}

/// Create a new dynasty
pub async fn create_dynasty(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateDynastyRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    let dynasty = DynastyService::create_dynasty(&pool, user_id, request).await?;

    Ok(Json(json!({
        "dynasty": dynasty
    })))
}

/// Get current user's dynasty
pub async fn get_my_dynasty(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    let dynasty = DynastyService::get_user_dynasty(&pool, user_id).await?;

    Ok(Json(json!({
        "dynasty": dynasty
    })))
}

/// Get dynasty stats
pub async fn get_dynasty_stats(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    let dynasty = DynastyService::get_user_dynasty(&pool, user_id).await?;
    let stats = DynastyService::get_dynasty_stats(&pool, dynasty.id).await?;

    Ok(Json(json!({
        "stats": stats
    })))
}

/// Get dynasty by ID (public info)
pub async fn get_dynasty(
    State(pool): State<Arc<PgPool>>,
    Path(dynasty_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let stats = DynastyService::get_dynasty_stats(&pool, dynasty_id).await?;

    // Return public information only
    Ok(Json(json!({
        "dynasty": {
            "id": stats.id,
            "name": stats.name,
            "motto": stats.motto,
            "generation": stats.generation,
            "prestige": stats.prestige,
            "perks": stats.perks,
            "founded_at": stats.founded_at,
        }
    })))
}

/// Get dynasty leaderboard
pub async fn get_leaderboard(
    State(pool): State<Arc<PgPool>>,
    Query(params): Query<LeaderboardQuery>,
) -> Result<Json<Value>, AppError> {
    let limit = params.limit.unwrap_or(10).min(100);
    
    let dynasties = DynastyService::get_leaderboard(&pool, &params.metric, limit).await?;

    Ok(Json(json!({
        "leaderboard": dynasties,
        "metric": params.metric,
        "limit": limit
    })))
}

/// Modify dynasty reputation (admin only in future)
pub async fn modify_reputation(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<serde_json::Map<String, Value>>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    let amount = request.get("amount")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| AppError::BadRequest("Invalid amount".to_string()))? as i32;
    
    let dynasty = DynastyService::get_user_dynasty(&pool, user_id).await?;
    let new_reputation = DynastyService::modify_reputation(&pool, dynasty.id, amount).await?;

    Ok(Json(json!({
        "new_reputation": new_reputation
    })))
}

#[derive(Debug, Deserialize)]
pub struct SimpleCreateCharacterRequest {
    pub name: String,
    pub dynasty_id: Uuid,
}

/// Create a new character (temporary location)
pub async fn create_character_temp(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<SimpleCreateCharacterRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Verify user owns this dynasty
    let owns_dynasty: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM dynasties WHERE id = $1 AND user_id = $2)"
    )
    .bind(req.dynasty_id)
    .bind(user_id)
    .fetch_one(&*pool)
    .await?;
    
    if !owns_dynasty {
        return Err(AppError::Forbidden);
    }
    
    // Generate initial stats with some randomness
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    // Base stats plus random bonus (ensures all stats are positive)
    let health = 50 + rng.gen_range(0..31);        // 50-80
    let stamina = 50 + rng.gen_range(0..31);       // 50-80
    let charisma = 40 + rng.gen_range(0..41);      // 40-80
    let intelligence = 40 + rng.gen_range(0..41);  // 40-80
    let luck = 30 + rng.gen_range(0..51);          // 30-80

    let character_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    
    // Insert character directly
    sqlx::query!(
        r#"
        INSERT INTO characters (
            id, dynasty_id, name, birth_date, health, stamina,
            charisma, intelligence, luck, generation,
            parent_character_id, inheritance_received,
            is_alive, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NULL, 0, true, $4, $4)
        "#,
        character_id,
        req.dynasty_id,
        req.name,
        now,
        health,
        stamina,
        charisma,
        intelligence,
        luck
    )
    .execute(&*pool)
    .await?;

    Ok(Json(json!({
        "character": {
            "id": character_id,
            "dynasty_id": req.dynasty_id,
            "name": req.name,
            "health": health,
            "stamina": stamina,
            "charisma": charisma,
            "intelligence": intelligence,
            "luck": luck,
            "birth_date": now,
            "is_alive": true,
            "generation": 1
        }
    })))
}
use crate::models::{CreateCharacterRequest, CharacterDeathRequest};
use crate::services::CharacterService;
use crate::utils::{AppError, Claims};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct SimpleCreateCharacterRequest {
    pub name: String,
    pub dynasty_id: Uuid,
}

pub async fn create_character(
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
    
    // Create the internal request
    let request = CreateCharacterRequest {
        dynasty_id: req.dynasty_id,
        name: req.name,
        parent_character_id: None,
    };

    let character = CharacterService::create_character(&pool, req.dynasty_id, request).await?;

    Ok(Json(json!({
        "character": character
    })))
}

/// Get character by ID
pub async fn get_character(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Path(character_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Verify character belongs to user's dynasty
    let character = CharacterService::get_character(&pool, character_id).await?;
    
    let owns_character: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM dynasties WHERE id = $1 AND user_id = $2)"
    )
    .bind(character.dynasty_id)
    .bind(user_id)
    .fetch_one(&*pool)
    .await?;

    if !owns_character {
        return Err(AppError::Forbidden);
    }

    Ok(Json(json!({
        "character": character
    })))
}

/// Get character stats
pub async fn get_character_stats(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Path(character_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Verify character belongs to user's dynasty
    let character = CharacterService::get_character(&pool, character_id).await?;
    
    let owns_character: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM dynasties WHERE id = $1 AND user_id = $2)"
    )
    .bind(character.dynasty_id)
    .bind(user_id)
    .fetch_one(&*pool)
    .await?;

    if !owns_character {
        return Err(AppError::Forbidden);
    }

    let stats = CharacterService::get_character_stats(&pool, character_id).await?;

    Ok(Json(json!({
        "stats": stats
    })))
}

/// Get all characters for user's dynasty
pub async fn get_dynasty_characters(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Get user's dynasty
    let dynasty_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM dynasties WHERE user_id = $1 AND is_active = true"
    )
    .bind(user_id)
    .fetch_one(&*pool)
    .await
    .map_err(|_| AppError::NotFound("User has no active dynasty".to_string()))?;

    let characters = CharacterService::get_dynasty_characters(&pool, dynasty_id).await?;

    Ok(Json(json!({
        "characters": characters
    })))
}

/// Process character death
pub async fn process_character_death(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Path(character_id): Path<Uuid>,
    Json(request): Json<CharacterDeathRequest>,
) -> Result<StatusCode, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Verify character belongs to user's dynasty
    let character = CharacterService::get_character(&pool, character_id).await?;
    
    let owns_character: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM dynasties WHERE id = $1 AND user_id = $2)"
    )
    .bind(character.dynasty_id)
    .bind(user_id)
    .fetch_one(&*pool)
    .await?;

    if !owns_character {
        return Err(AppError::Forbidden);
    }

    CharacterService::process_character_death(&pool, character_id, request).await?;

    Ok(StatusCode::OK)
}
use axum::{
    routing::{get, post, put},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;

pub mod character;
pub mod dynasty;

use crate::api::middleware::auth_pg::auth_middleware_pg;

pub fn routes(pool: Arc<PgPool>) -> Router {
    Router::new()
        // Dynasty routes
        .route("/dynasties", post(dynasty::create_dynasty))
        .route("/dynasties/me", get(dynasty::get_my_dynasty))
        .route("/dynasties/me/stats", get(dynasty::get_dynasty_stats))
        .route("/dynasties/:id", get(dynasty::get_dynasty))
        .route("/dynasties/leaderboard", get(dynasty::get_leaderboard))
        .route("/dynasties/me/reputation", put(dynasty::modify_reputation))
        
        // Character routes
        .route("/characters", post(character::create_character))
        .route("/characters", get(character::get_dynasty_characters))
        .route("/characters/:id", get(character::get_character))
        .route("/characters/:id/stats", get(character::get_character_stats))
        .route("/characters/:id/death", post(character::process_character_death))
        
        .layer(axum::middleware::from_fn_with_state(
            pool.clone(),
            auth_middleware_pg,
        ))
        .with_state(pool)
}
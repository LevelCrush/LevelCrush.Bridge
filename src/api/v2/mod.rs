use axum::{
    routing::{get, post, put},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;

pub mod character;
pub mod dynasty;
pub mod market;
pub mod death;

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
        
        // Market routes
        .route("/market/listings", post(market::create_listing))
        .route("/market/purchase", post(market::purchase_listing))
        .route("/market/regions", get(market::get_regions))
        .route("/market/regions/:id/listings", get(market::get_region_listings))
        .route("/market/regions/:id/stats", get(market::get_market_stats))
        .route("/market/regions/:id/routes", get(market::get_trade_routes))
        .route("/market/regions/:region_id/items/:item_id/history", get(market::get_price_history))
        .route("/market/events", get(market::get_market_events))
        
        // Death routes
        .route("/deaths/recent", get(death::get_recent_deaths))
        .route("/dynasties/:id/deaths", get(death::get_dynasty_death_stats))
        
        .layer(axum::middleware::from_fn_with_state(
            pool.clone(),
            auth_middleware_pg,
        ))
        .with_state(pool)
}
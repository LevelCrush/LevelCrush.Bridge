use axum::{
    routing::{get, post, put},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;

pub mod auth;
pub mod character;
pub mod dynasty;
pub mod market;
pub mod death;

use crate::api::middleware::auth_pg::auth_middleware_pg;

pub fn routes(pool: Arc<PgPool>) -> Router {
    // Create protected routes with state and middleware
    let protected_routes = Router::new()
        // Auth routes that require authentication
        .route("/auth/logout", post(auth::logout))
        .route("/auth/verify", get(auth::verify_token))
        
        // Dynasty routes
        .route("/dynasties", post(dynasty::create_dynasty))
        .route("/dynasties/me", get(dynasty::get_my_dynasty))
        .route("/dynasties/me/stats", get(dynasty::get_dynasty_stats))
        .route("/dynasties/:id", get(dynasty::get_dynasty))
        .route("/dynasties/leaderboard", get(dynasty::get_leaderboard))
        .route("/dynasties/me/reputation", put(dynasty::modify_reputation))
        
        // Character routes
        .route("/characters", post({
            use crate::models::CreateCharacterRequest;
            use crate::services::CharacterService;
            
            #[derive(serde::Deserialize)]
            struct CreateReq {
                name: String,
                dynasty_id: uuid::Uuid,
            }
            
            |axum::extract::State(pool): axum::extract::State<Arc<PgPool>>, 
             axum::Extension(claims): axum::Extension<crate::utils::Claims>,
             axum::Json(req): axum::Json<CreateReq>| async move {
                let user_id = uuid::Uuid::parse_str(&claims.sub)
                    .map_err(|_| crate::utils::AppError::BadRequest("Invalid user ID".to_string()))?;
                
                // Verify user owns this dynasty
                let owns_dynasty: bool = sqlx::query_scalar(
                    "SELECT EXISTS(SELECT 1 FROM dynasties WHERE id = $1 AND user_id = $2)"
                )
                .bind(req.dynasty_id)
                .bind(user_id)
                .fetch_one(&*pool)
                .await
                .map_err(|e| crate::utils::AppError::Database(e))?;
                
                if !owns_dynasty {
                    return Err(crate::utils::AppError::Forbidden);
                }
                
                // Create the internal request
                let request = CreateCharacterRequest {
                    dynasty_id: req.dynasty_id,
                    name: req.name,
                    parent_character_id: None,
                };

                let character = CharacterService::create_character(&pool, req.dynasty_id, request).await?;

                Ok(axum::Json(serde_json::json!({
                    "character": character
                })))
            }
        }))
        .route("/characters", get(character::get_dynasty_characters))
        .route("/characters/:id", get(character::get_character))
        .route("/characters/:id/stats", get(character::get_character_stats))
        .route("/characters/:id/inventory", get(character::get_character_inventory))
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
        .with_state(pool.clone())
        .layer(axum::middleware::from_fn_with_state(
            pool.clone(),
            auth_middleware_pg,
        ));

    Router::new()
        // Auth routes (public - no auth middleware)
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route("/auth/refresh", post(auth::refresh_token))
        .merge(protected_routes)
        .with_state(pool)
}
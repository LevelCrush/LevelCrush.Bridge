use crate::models::{CreateMarketListingRequest, PurchaseRequest};
use crate::services::MarketService;
use crate::utils::{AppError, Claims};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ListingQuery {
    pub item_id: Option<Uuid>,
}

/// Create a market listing
pub async fn create_listing(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateMarketListingRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Get user's active character
    let character_id: Uuid = sqlx::query_scalar(
        r#"
        SELECT c.id FROM characters c
        JOIN dynasties d ON c.dynasty_id = d.id
        WHERE d.user_id = $1 AND c.is_alive = true
        ORDER BY c.created_at DESC
        LIMIT 1
        "#
    )
    .bind(user_id)
    .fetch_one(&*pool)
    .await
    .map_err(|_| AppError::NotFound("No active character found".to_string()))?;

    let listing = MarketService::create_listing(&pool, character_id, request).await?;

    Ok(Json(json!({
        "listing": listing
    })))
}

/// Purchase from a market listing
pub async fn purchase_listing(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<PurchaseRequest>,
) -> Result<StatusCode, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    
    // Get user's active character
    let character_id: Uuid = sqlx::query_scalar(
        r#"
        SELECT c.id FROM characters c
        JOIN dynasties d ON c.dynasty_id = d.id
        WHERE d.user_id = $1 AND c.is_alive = true
        ORDER BY c.created_at DESC
        LIMIT 1
        "#
    )
    .bind(user_id)
    .fetch_one(&*pool)
    .await
    .map_err(|_| AppError::NotFound("No active character found".to_string()))?;

    MarketService::purchase_from_listing(&pool, character_id, request).await?;

    Ok(StatusCode::OK)
}

/// Get listings for a region
pub async fn get_region_listings(
    State(pool): State<Arc<PgPool>>,
    Path(region_id): Path<Uuid>,
    Query(query): Query<ListingQuery>,
) -> Result<Json<Value>, AppError> {
    let listings = MarketService::get_region_listings(&pool, region_id, query.item_id).await?;

    Ok(Json(json!({
        "listings": listings,
        "count": listings.len()
    })))
}

/// Get market statistics for a region
pub async fn get_market_stats(
    State(pool): State<Arc<PgPool>>,
    Path(region_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let stats = MarketService::get_market_stats(&pool, region_id).await?;

    Ok(Json(json!({
        "stats": stats
    })))
}

/// Get active market events
pub async fn get_market_events(
    State(pool): State<Arc<PgPool>>,
    Query(query): Query<ListingQuery>,
) -> Result<Json<Value>, AppError> {
    // Reuse ListingQuery structure but interpret item_id as region_id
    let region_id = query.item_id;
    let events = MarketService::get_active_events(&pool, region_id).await?;

    Ok(Json(json!({
        "events": events,
        "count": events.len()
    })))
}

/// Get all regions
pub async fn get_regions(
    State(pool): State<Arc<PgPool>>,
) -> Result<Json<Value>, AppError> {
    let regions: Vec<(Uuid, String, Option<String>, rust_decimal::Decimal, i32, i32)> = sqlx::query_as(
        "SELECT id, name, description, tax_rate, safety_level, prosperity_level FROM regions ORDER BY name"
    )
    .fetch_all(&*pool)
    .await?;

    let regions: Vec<_> = regions.into_iter().map(|(id, name, description, tax_rate, safety_level, prosperity_level)| {
        json!({
            "id": id,
            "name": name,
            "description": description,
            "tax_rate": tax_rate,
            "safety_level": safety_level,
            "prosperity_level": prosperity_level
        })
    }).collect();

    Ok(Json(json!({
        "regions": regions
    })))
}

/// Get trade routes from a region
pub async fn get_trade_routes(
    State(pool): State<Arc<PgPool>>,
    Path(from_region_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let routes: Vec<(Uuid, Uuid, Uuid, i32, i32, rust_decimal::Decimal, bool)> = sqlx::query_as(
        r#"
        SELECT tr.id, tr.from_region_id, tr.to_region_id, tr.distance, 
               tr.danger_level, tr.toll_cost, tr.is_active
        FROM trade_routes tr
        WHERE tr.from_region_id = $1 AND tr.is_active = true
        ORDER BY tr.distance ASC
        "#
    )
    .bind(from_region_id)
    .fetch_all(&*pool)
    .await?;

    let routes: Vec<_> = routes.into_iter().map(|(id, from_id, to_id, distance, danger_level, toll_cost, is_active)| {
        json!({
            "id": id,
            "from_region_id": from_id,
            "to_region_id": to_id,
            "distance": distance,
            "danger_level": danger_level,
            "toll_cost": toll_cost,
            "is_active": is_active
        })
    }).collect();

    Ok(Json(json!({
        "routes": routes
    })))
}

/// Get price history for an item in a region
pub async fn get_price_history(
    State(pool): State<Arc<PgPool>>,
    Path((region_id, item_id)): Path<(Uuid, Uuid)>,
    Query(time_range): Query<TimeRangeQuery>,
) -> Result<Json<Value>, AppError> {
    let hours = time_range.hours.unwrap_or(24).min(168); // Max 1 week
    
    let prices: Vec<(DateTime<chrono::Utc>, rust_decimal::Decimal, rust_decimal::Decimal, rust_decimal::Decimal, i32)> = 
        sqlx::query_as(
            r#"
            SELECT time, avg_price, min_price, max_price, volume
            FROM market_prices
            WHERE region_id = $1 AND item_id = $2 
            AND time > NOW() - INTERVAL '1 hour' * $3
            ORDER BY time DESC
            "#
        )
        .bind(region_id)
        .bind(item_id)
        .bind(hours)
        .fetch_all(&*pool)
        .await?;

    let prices: Vec<_> = prices.into_iter().map(|(time, avg, min, max, volume)| {
        json!({
            "time": time,
            "avg_price": avg,
            "min_price": min,
            "max_price": max,
            "volume": volume
        })
    }).collect();

    Ok(Json(json!({
        "price_history": prices,
        "region_id": region_id,
        "item_id": item_id,
        "hours": hours
    })))
}

#[derive(Deserialize)]
pub struct TimeRangeQuery {
    pub hours: Option<i32>,
}

use chrono::DateTime;
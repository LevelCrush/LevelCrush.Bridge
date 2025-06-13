use crate::models::{
    MarketListing, MarketEvent, MarketStats, Region,
    CreateMarketListingRequest, PurchaseRequest, MarketEventType
};
use crate::utils::AppError;
use crate::api::websocket::{MarketBroadcaster, broadcast_market_update, broadcast_price_update};
use chrono::{Duration, Utc};
use rust_decimal::Decimal;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

pub struct MarketService;

impl MarketService {
    /// Create a new market listing
    pub async fn create_listing(
        pool: &PgPool,
        character_id: Uuid,
        request: CreateMarketListingRequest,
    ) -> Result<MarketListing, AppError> {
        // Verify character has the item in inventory
        let inventory_check: Option<(i32,)> = sqlx::query_as(
            "SELECT quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2"
        )
        .bind(character_id)
        .bind(request.item_id)
        .fetch_optional(pool)
        .await?;

        let inventory_quantity = inventory_check
            .map(|(q,)| q)
            .ok_or_else(|| AppError::BadRequest("Item not in inventory".to_string()))?;

        if inventory_quantity < request.quantity {
            return Err(AppError::BadRequest("Insufficient inventory".to_string()));
        }

        let mut tx = pool.begin().await?;

        // Remove items from inventory
        if inventory_quantity == request.quantity {
            sqlx::query(
                "DELETE FROM character_inventory WHERE character_id = $1 AND item_id = $2"
            )
            .bind(character_id)
            .bind(request.item_id)
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query(
                "UPDATE character_inventory SET quantity = quantity - $1 
                 WHERE character_id = $2 AND item_id = $3"
            )
            .bind(request.quantity)
            .bind(character_id)
            .bind(request.item_id)
            .execute(&mut *tx)
            .await?;
        }

        // Create the listing
        let expires_at = request.expires_in_hours
            .map(|hours| Utc::now() + Duration::hours(hours as i64));

        let listing = sqlx::query_as::<_, MarketListing>(
            r#"
            INSERT INTO market_listings (
                region_id, item_id, seller_character_id, price, 
                quantity, original_quantity, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $5, $6)
            RETURNING *
            "#
        )
        .bind(request.region_id)
        .bind(request.item_id)
        .bind(character_id)
        .bind(request.price)
        .bind(request.quantity)
        .bind(expires_at)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;

        // Record price data
        Self::record_price_data(pool, request.region_id, request.item_id, request.price).await?;

        Ok(listing)
    }

    /// Purchase items from a listing
    pub async fn purchase_from_listing(
        pool: &PgPool,
        buyer_character_id: Uuid,
        request: PurchaseRequest,
    ) -> Result<(), AppError> {
        let mut tx = pool.begin().await?;

        // Get and lock the listing
        let listing: MarketListing = sqlx::query_as(
            "SELECT * FROM market_listings WHERE id = $1 AND is_active = true FOR UPDATE"
        )
        .bind(request.listing_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| AppError::NotFound("Listing not found".to_string()))?;

        // Validate purchase
        if listing.is_expired() {
            return Err(AppError::BadRequest("Listing has expired".to_string()));
        }

        if listing.quantity < request.quantity {
            return Err(AppError::BadRequest("Insufficient quantity available".to_string()));
        }

        if listing.seller_character_id == Some(buyer_character_id) {
            return Err(AppError::BadRequest("Cannot purchase from yourself".to_string()));
        }

        // Calculate total cost with region tax
        let region: Region = sqlx::query_as(
            "SELECT * FROM regions WHERE id = $1"
        )
        .bind(listing.region_id)
        .fetch_one(&mut *tx)
        .await?;

        let item_cost = listing.effective_price() * Decimal::from(request.quantity);
        let tax_amount = item_cost * region.tax_rate / Decimal::from(100);
        let total_cost = item_cost + tax_amount;

        // Check buyer has sufficient funds (simplified - using inheritance_received as wallet)
        let buyer_funds: (Decimal,) = sqlx::query_as(
            "SELECT inheritance_received FROM characters WHERE id = $1"
        )
        .bind(buyer_character_id)
        .fetch_one(&mut *tx)
        .await?;

        if buyer_funds.0 < total_cost {
            return Err(AppError::BadRequest("Insufficient funds".to_string()));
        }

        // Process the transaction
        // 1. Deduct funds from buyer
        sqlx::query(
            "UPDATE characters SET inheritance_received = inheritance_received - $1 WHERE id = $2"
        )
        .bind(total_cost)
        .bind(buyer_character_id)
        .execute(&mut *tx)
        .await?;

        // 2. Add funds to seller (minus tax)
        if let Some(seller_id) = listing.seller_character_id {
            sqlx::query(
                "UPDATE characters SET inheritance_received = inheritance_received + $1 WHERE id = $2"
            )
            .bind(item_cost)
            .bind(seller_id)
            .execute(&mut *tx)
            .await?;
        }

        // 3. Add tax to region treasury (simplified - add to dynasty alliance treasury)
        // TODO: Implement proper regional treasuries

        // 4. Transfer items to buyer inventory
        let existing_inventory: Option<(i32,)> = sqlx::query_as(
            "SELECT quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2"
        )
        .bind(buyer_character_id)
        .bind(listing.item_id)
        .fetch_optional(&mut *tx)
        .await?;

        if let Some((_existing_qty,)) = existing_inventory {
            sqlx::query(
                "UPDATE character_inventory SET quantity = quantity + $1 
                 WHERE character_id = $2 AND item_id = $3"
            )
            .bind(request.quantity)
            .bind(buyer_character_id)
            .bind(listing.item_id)
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query(
                r#"
                INSERT INTO character_inventory (character_id, item_id, quantity, acquired_price)
                VALUES ($1, $2, $3, $4)
                "#
            )
            .bind(buyer_character_id)
            .bind(listing.item_id)
            .bind(request.quantity)
            .bind(listing.effective_price())
            .execute(&mut *tx)
            .await?;
        }

        // 5. Update listing quantity
        if listing.quantity == request.quantity {
            sqlx::query(
                "UPDATE market_listings SET is_active = false, quantity = 0 WHERE id = $1"
            )
            .bind(listing.id)
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query(
                "UPDATE market_listings SET quantity = quantity - $1 WHERE id = $2"
            )
            .bind(request.quantity)
            .bind(listing.id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        // Record the transaction price
        Self::record_price_data(pool, listing.region_id, listing.item_id, listing.effective_price()).await?;

        Ok(())
    }

    /// Get active listings for a region
    pub async fn get_region_listings(
        pool: &PgPool,
        region_id: Uuid,
        item_id: Option<Uuid>,
    ) -> Result<Vec<MarketListing>, AppError> {
        let mut query = String::from(
            "SELECT * FROM market_listings 
             WHERE region_id = $1 AND is_active = true"
        );

        if item_id.is_some() {
            query.push_str(" AND item_id = $2");
        }

        query.push_str(" ORDER BY price ASC, listed_at DESC");

        let listings = if let Some(item_id) = item_id {
            sqlx::query_as::<_, MarketListing>(&query)
                .bind(region_id)
                .bind(item_id)
                .fetch_all(pool)
                .await?
        } else {
            sqlx::query_as::<_, MarketListing>(&query)
                .bind(region_id)
                .fetch_all(pool)
                .await?
        };

        Ok(listings)
    }

    /// Get market statistics for a region
    pub async fn get_market_stats(
        pool: &PgPool,
        region_id: Uuid,
    ) -> Result<MarketStats, AppError> {
        // Get region info
        let region: Region = sqlx::query_as(
            "SELECT * FROM regions WHERE id = $1"
        )
        .bind(region_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("Region not found".to_string()))?;

        // Count active listings
        let listing_count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM market_listings WHERE region_id = $1 AND is_active = true"
        )
        .bind(region_id)
        .fetch_one(pool)
        .await?;

        // Get 24h volume (simplified - sum of all completed trades)
        let volume_24h: (Decimal,) = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(avg_price * volume), 0)
            FROM market_prices
            WHERE region_id = $1 AND time > NOW() - INTERVAL '24 hours'
            "#
        )
        .bind(region_id)
        .fetch_one(pool)
        .await?;

        // Get average prices and trending items
        // TODO: Implement proper price tracking and trending calculation
        let average_prices = Vec::new();
        let trending_items = Vec::new();

        Ok(MarketStats {
            region_id,
            region_name: region.name,
            total_listings: listing_count.0 as i32,
            total_volume_24h: volume_24h.0,
            average_prices,
            trending_items,
        })
    }

    /// Create a market event
    pub async fn create_market_event(
        pool: &PgPool,
        event_type: MarketEventType,
        severity: i32,
        affected_region_id: Option<Uuid>,
        affected_item_id: Option<Uuid>,
        duration_hours: i32,
        price_modifier: Decimal,
        description: Option<String>,
    ) -> Result<MarketEvent, AppError> {
        let event = sqlx::query_as::<_, MarketEvent>(
            r#"
            INSERT INTO market_events (
                event_type, severity, affected_region_id, affected_item_id,
                description, expires_at, price_modifier
            ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour' * $6, $7)
            RETURNING *
            "#
        )
        .bind(event_type)
        .bind(severity)
        .bind(affected_region_id)
        .bind(affected_item_id)
        .bind(description)
        .bind(duration_hours)
        .bind(price_modifier)
        .fetch_one(pool)
        .await?;

        Ok(event)
    }

    /// Get active market events
    pub async fn get_active_events(
        pool: &PgPool,
        region_id: Option<Uuid>,
    ) -> Result<Vec<MarketEvent>, AppError> {
        let query = if region_id.is_some() {
            sqlx::query_as::<_, MarketEvent>(
                r#"
                SELECT * FROM market_events 
                WHERE is_active = true 
                AND (affected_region_id = $1 OR affected_region_id IS NULL)
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY severity DESC, started_at DESC
                "#
            )
            .bind(region_id)
        } else {
            sqlx::query_as::<_, MarketEvent>(
                r#"
                SELECT * FROM market_events 
                WHERE is_active = true 
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY severity DESC, started_at DESC
                "#
            )
        };

        Ok(query.fetch_all(pool).await?)
    }

    /// Record price data for TimescaleDB
    async fn record_price_data(
        pool: &PgPool,
        region_id: Uuid,
        item_id: Uuid,
        price: Decimal,
    ) -> Result<(), AppError> {
        // This would typically aggregate data over time windows
        // For now, just insert a record
        sqlx::query(
            r#"
            INSERT INTO market_prices (
                time, region_id, item_id, avg_price, 
                min_price, max_price, volume
            ) VALUES (NOW(), $1, $2, $3, $3, $3, 1)
            "#
        )
        .bind(region_id)
        .bind(item_id)
        .bind(price)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Process expired listings
    pub async fn process_expired_listings(pool: &PgPool) -> Result<i32, AppError> {
        let mut tx = pool.begin().await?;
        
        // Get expired listings with items to return
        let expired: Vec<(Uuid, Option<Uuid>, Uuid, i32)> = sqlx::query_as(
            r#"
            SELECT id, seller_character_id, item_id, quantity
            FROM market_listings 
            WHERE is_active = true 
            AND expires_at IS NOT NULL 
            AND expires_at < NOW()
            FOR UPDATE
            "#
        )
        .fetch_all(&mut *tx)
        .await?;

        let count = expired.len() as i32;

        for (listing_id, seller_id, item_id, quantity) in expired {
            // Mark listing as inactive
            sqlx::query(
                "UPDATE market_listings SET is_active = false WHERE id = $1"
            )
            .bind(listing_id)
            .execute(&mut *tx)
            .await?;

            // Return items to seller if they exist
            if let Some(seller_id) = seller_id {
                let existing: Option<(i32,)> = sqlx::query_as(
                    "SELECT quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2"
                )
                .bind(seller_id)
                .bind(item_id)
                .fetch_optional(&mut *tx)
                .await?;

                if let Some((_existing_qty,)) = existing {
                    sqlx::query(
                        "UPDATE character_inventory SET quantity = quantity + $1 
                         WHERE character_id = $2 AND item_id = $3"
                    )
                    .bind(quantity)
                    .bind(seller_id)
                    .bind(item_id)
                    .execute(&mut *tx)
                    .await?;
                } else {
                    sqlx::query(
                        r#"
                        INSERT INTO character_inventory (character_id, item_id, quantity)
                        VALUES ($1, $2, $3)
                        "#
                    )
                    .bind(seller_id)
                    .bind(item_id)
                    .bind(quantity)
                    .execute(&mut *tx)
                    .await?;
                }
            }
        }

        tx.commit().await?;
        Ok(count)
    }
}
use crate::services::MarketService;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{interval, Duration};

/// Background task that processes expired market listings
pub struct MarketExpirationTask {
    pool: Arc<PgPool>,
    interval_seconds: u64,
}

impl MarketExpirationTask {
    pub fn new(pool: Arc<PgPool>, interval_seconds: u64) -> Self {
        Self {
            pool,
            interval_seconds,
        }
    }

    /// Start the market expiration task
    pub async fn start(self) {
        let mut interval = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            tracing::info!("Processing expired market listings...");
            
            match MarketService::process_expired_listings(&self.pool).await {
                Ok(count) => {
                    if count > 0 {
                        tracing::info!("Processed {} expired market listings", count);
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to process expired listings: {}", e);
                }
            }
        }
    }
}

/// Background task that records market price snapshots
pub struct MarketPriceSnapshotTask {
    pool: Arc<PgPool>,
    interval_seconds: u64,
}

impl MarketPriceSnapshotTask {
    pub fn new(pool: Arc<PgPool>, interval_seconds: u64) -> Self {
        Self {
            pool,
            interval_seconds,
        }
    }

    /// Start the price snapshot task
    pub async fn start(self) {
        let mut interval = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            tracing::info!("Recording market price snapshots...");
            
            // Get all active listings grouped by region and item
            match self.aggregate_market_prices().await {
                Ok(count) => {
                    if count > 0 {
                        tracing::info!("Recorded {} price snapshots", count);
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to record price snapshots: {}", e);
                }
            }
        }
    }

    async fn aggregate_market_prices(&self) -> Result<usize, sqlx::Error> {
        // Aggregate current market prices by region and item
        let prices: Vec<(uuid::Uuid, uuid::Uuid, rust_decimal::Decimal, rust_decimal::Decimal, rust_decimal::Decimal, i64)> = 
            sqlx::query_as(
                r#"
                SELECT 
                    region_id,
                    item_id,
                    AVG(price) as avg_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    SUM(quantity) as total_quantity
                FROM market_listings
                WHERE is_active = true
                GROUP BY region_id, item_id
                "#
            )
            .fetch_all(&*self.pool)
            .await?;

        let mut count = 0;
        for (region_id, item_id, avg_price, min_price, max_price, volume) in prices {
            // Calculate simple volatility as (max - min) / avg
            let volatility = if avg_price > rust_decimal::Decimal::ZERO {
                (max_price - min_price) / avg_price
            } else {
                rust_decimal::Decimal::ZERO
            };

            sqlx::query(
                r#"
                INSERT INTO market_prices (
                    time, region_id, item_id, avg_price, 
                    min_price, max_price, volume, volatility
                ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)
                "#
            )
            .bind(region_id)
            .bind(item_id)
            .bind(avg_price)
            .bind(min_price)
            .bind(max_price)
            .bind(volume)
            .bind(volatility)
            .execute(&*self.pool)
            .await?;

            count += 1;
        }

        Ok(count)
    }
}

use uuid;
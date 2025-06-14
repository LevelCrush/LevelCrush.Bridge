use crate::utils::AppError;
use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct MarketOverview {
    pub total_market_cap: Decimal,
    pub total_volume_24h: Decimal,
    pub active_listings: i64,
    pub price_change_percent: Decimal,
    pub top_gainers: Vec<TopMover>,
    pub top_losers: Vec<TopMover>,
    pub volatile_items: Vec<VolatileItem>,
    pub arbitrage_opportunities: Vec<ArbitrageOpportunity>,
}

#[derive(Debug, Serialize)]
pub struct TopMover {
    pub item_id: Uuid,
    pub item_name: String,
    pub category: String,
    pub current_price: Decimal,
    pub price_change: Decimal,
    pub price_change_percent: Decimal,
    pub volume_24h: Decimal,
}

#[derive(Debug, Serialize)]
pub struct VolatileItem {
    pub item_id: Uuid,
    pub item_name: String,
    pub category: String,
    pub current_price: Decimal,
    pub volatility: Decimal, // Coefficient of variation
    pub volume_24h: Decimal,
}

#[derive(Debug, Serialize)]
pub struct ArbitrageOpportunity {
    pub item_id: Uuid,
    pub item_name: String,
    pub buy_region_id: Uuid,
    pub buy_region_name: String,
    pub sell_region_id: Uuid,
    pub sell_region_name: String,
    pub buy_price: Decimal,
    pub sell_price: Decimal,
    pub profit_margin: Decimal,
    pub profit_after_taxes: Decimal,
    pub buy_region_tax_rate: Decimal,
    pub sell_region_tax_rate: Decimal,
}

#[derive(Debug, Serialize)]
pub struct RegionalAnalytics {
    pub region_id: Uuid,
    pub region_name: String,
    pub total_volume_24h: Decimal,
    pub avg_price_change: Decimal,
    pub active_listings: i64,
    pub market_health: String, // "strong", "moderate", "weak"
    pub dominant_categories: Vec<String>,
    pub top_items_by_volume: Vec<TopItemByVolume>,
    pub liquidity_score: Decimal,
}

#[derive(Debug, Serialize)]
pub struct TopItemByVolume {
    pub item_id: Uuid,
    pub item_name: String,
    pub volume_24h: Decimal,
    pub avg_price: Decimal,
}

#[derive(Debug, Serialize)]
pub struct TechnicalIndicators {
    pub item_id: Uuid,
    pub region_id: Uuid,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub sma_7: Option<Decimal>,
    pub sma_14: Option<Decimal>,
    pub sma_30: Option<Decimal>,
    pub ema_7: Option<Decimal>,
    pub ema_14: Option<Decimal>,
    pub bollinger_upper: Option<Decimal>,
    pub bollinger_lower: Option<Decimal>,
    pub bollinger_middle: Option<Decimal>,
    pub rsi: Option<Decimal>,
    pub macd: Option<Decimal>,
    pub macd_signal: Option<Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct PriceHistoryQuery {
    pub timeframe: Option<String>, // "1H", "4H", "1D", "1W", "1M"
    pub limit: Option<i32>,
    pub indicators: Option<bool>,
}

/// Get comprehensive market overview
pub async fn get_market_overview(
    State(pool): State<Arc<PgPool>>,
) -> Result<Json<Value>, AppError> {
    // Calculate total market cap (sum of all active listings * price)
    let market_cap: (Decimal,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(price * quantity), 0) as total_market_cap
        FROM market_listings
        WHERE is_active = true
        "#
    )
    .fetch_one(&*pool)
    .await?;

    // Calculate 24h volume from transactions
    let volume_24h: (Decimal,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(total_price), 0) as volume_24h
        FROM market_transactions
        WHERE created_at > NOW() - INTERVAL '24 hours'
        "#
    )
    .fetch_one(&*pool)
    .await?;

    // Count active listings
    let active_listings: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM market_listings WHERE is_active = true"
    )
    .fetch_one(&*pool)
    .await?;

    // Calculate overall price change (weighted average)
    let price_change: (Option<Decimal>,) = sqlx::query_as(
        r#"
        WITH current_prices AS (
            SELECT 
                i.id,
                AVG(ml.price) as current_avg_price,
                SUM(ml.quantity) as total_quantity
            FROM items i
            JOIN market_listings ml ON i.id = ml.item_id
            WHERE ml.is_active = true
            GROUP BY i.id
        ),
        historical_prices AS (
            SELECT 
                mp.item_id,
                AVG(mp.avg_price) as historical_avg_price
            FROM market_prices mp
            WHERE mp.time > NOW() - INTERVAL '24 hours'
            AND mp.time <= NOW() - INTERVAL '23 hours'
            GROUP BY mp.item_id
        )
        SELECT 
            COALESCE(
                (SUM((cp.current_avg_price - hp.historical_avg_price) * cp.total_quantity) / 
                 SUM(cp.total_quantity)) * 100, 0
            ) as weighted_price_change_percent
        FROM current_prices cp
        JOIN historical_prices hp ON cp.id = hp.item_id
        "#
    )
    .fetch_one(&*pool)
    .await?;

    // Get top gainers
    let top_gainers: Vec<(Uuid, String, String, Decimal, Decimal, Decimal, Decimal)> = sqlx::query_as(
        r#"
        WITH price_changes AS (
            SELECT 
                i.id as item_id,
                i.name as item_name,
                i.category,
                AVG(ml.price) as current_price,
                (
                    SELECT AVG(mp.avg_price)
                    FROM market_prices mp
                    WHERE mp.item_id = i.id
                    AND mp.time > NOW() - INTERVAL '24 hours'
                    AND mp.time <= NOW() - INTERVAL '23 hours'
                ) as previous_price,
                COALESCE(SUM(mt.quantity * mt.price_per_unit), 0) as volume_24h
            FROM items i
            LEFT JOIN market_listings ml ON i.id = ml.item_id AND ml.is_active = true
            LEFT JOIN market_transactions mt ON i.id = mt.item_id 
                AND mt.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY i.id, i.name, i.category
            HAVING AVG(ml.price) IS NOT NULL
        )
        SELECT 
            item_id,
            item_name,
            category,
            current_price,
            (current_price - COALESCE(previous_price, current_price)) as price_change,
            CASE 
                WHEN previous_price > 0 THEN 
                    ((current_price - previous_price) / previous_price) * 100
                ELSE 0
            END as price_change_percent,
            volume_24h
        FROM price_changes
        WHERE previous_price IS NOT NULL
        AND previous_price > 0
        ORDER BY price_change_percent DESC
        LIMIT 10
        "#
    )
    .fetch_all(&*pool)
    .await?;

    // Get top losers (similar query but ORDER BY ASC)
    let top_losers: Vec<(Uuid, String, String, Decimal, Decimal, Decimal, Decimal)> = sqlx::query_as(
        r#"
        WITH price_changes AS (
            SELECT 
                i.id as item_id,
                i.name as item_name,
                i.category,
                AVG(ml.price) as current_price,
                (
                    SELECT AVG(mp.avg_price)
                    FROM market_prices mp
                    WHERE mp.item_id = i.id
                    AND mp.time > NOW() - INTERVAL '24 hours'
                    AND mp.time <= NOW() - INTERVAL '23 hours'
                ) as previous_price,
                COALESCE(SUM(mt.quantity * mt.price_per_unit), 0) as volume_24h
            FROM items i
            LEFT JOIN market_listings ml ON i.id = ml.item_id AND ml.is_active = true
            LEFT JOIN market_transactions mt ON i.id = mt.item_id 
                AND mt.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY i.id, i.name, i.category
            HAVING AVG(ml.price) IS NOT NULL
        )
        SELECT 
            item_id,
            item_name,
            category,
            current_price,
            (current_price - COALESCE(previous_price, current_price)) as price_change,
            CASE 
                WHEN previous_price > 0 THEN 
                    ((current_price - previous_price) / previous_price) * 100
                ELSE 0
            END as price_change_percent,
            volume_24h
        FROM price_changes
        WHERE previous_price IS NOT NULL
        AND previous_price > 0
        ORDER BY price_change_percent ASC
        LIMIT 10
        "#
    )
    .fetch_all(&*pool)
    .await?;

    // Get volatile items (high standard deviation)
    let volatile_items: Vec<(Uuid, String, String, Decimal, Decimal, Decimal)> = sqlx::query_as(
        r#"
        WITH volatility_calc AS (
            SELECT 
                i.id as item_id,
                i.name as item_name,
                i.category,
                AVG(mp.avg_price) as avg_price,
                STDDEV(mp.avg_price) as price_stddev,
                COALESCE(SUM(mt.quantity * mt.price_per_unit), 0) as volume_24h
            FROM items i
            JOIN market_prices mp ON i.id = mp.item_id
            LEFT JOIN market_transactions mt ON i.id = mt.item_id 
                AND mt.created_at > NOW() - INTERVAL '24 hours'
            WHERE mp.time > NOW() - INTERVAL '7 days'
            GROUP BY i.id, i.name, i.category
            HAVING COUNT(mp.avg_price) >= 10 AND AVG(mp.avg_price) > 0
        )
        SELECT 
            item_id,
            item_name,
            category,
            avg_price,
            CASE 
                WHEN avg_price > 0 THEN (price_stddev / avg_price) * 100
                ELSE 0
            END as volatility_percent,
            volume_24h
        FROM volatility_calc
        ORDER BY volatility_percent DESC
        LIMIT 10
        "#
    )
    .fetch_all(&*pool)
    .await?;

    // Get arbitrage opportunities
    let arbitrage_opportunities = get_arbitrage_opportunities(&pool).await?;

    let market_overview = MarketOverview {
        total_market_cap: market_cap.0,
        total_volume_24h: volume_24h.0,
        active_listings: active_listings.0,
        price_change_percent: price_change.0.unwrap_or(Decimal::ZERO),
        top_gainers: top_gainers.into_iter().map(|(id, name, category, price, change, change_pct, volume)| {
            TopMover {
                item_id: id,
                item_name: name,
                category,
                current_price: price,
                price_change: change,
                price_change_percent: change_pct,
                volume_24h: volume,
            }
        }).collect(),
        top_losers: top_losers.into_iter().map(|(id, name, category, price, change, change_pct, volume)| {
            TopMover {
                item_id: id,
                item_name: name,
                category,
                current_price: price,
                price_change: change,
                price_change_percent: change_pct,
                volume_24h: volume,
            }
        }).collect(),
        volatile_items: volatile_items.into_iter().map(|(id, name, category, price, volatility, volume)| {
            VolatileItem {
                item_id: id,
                item_name: name,
                category,
                current_price: price,
                volatility,
                volume_24h: volume,
            }
        }).collect(),
        arbitrage_opportunities,
    };

    Ok(Json(json!(market_overview)))
}

/// Get arbitrage opportunities across regions
async fn get_arbitrage_opportunities(pool: &PgPool) -> Result<Vec<ArbitrageOpportunity>, AppError> {
    let opportunities: Vec<(
        Uuid, String, Uuid, String, Uuid, String, 
        Decimal, Decimal, Decimal, Decimal, Decimal
    )> = sqlx::query_as(
        r#"
        WITH regional_prices AS (
            SELECT 
                ml.item_id,
                i.name as item_name,
                ml.region_id,
                r.name as region_name,
                r.tax_rate,
                AVG(ml.price) as avg_price,
                COUNT(*) as listing_count
            FROM market_listings ml
            JOIN items i ON ml.item_id = i.id
            JOIN regions r ON ml.region_id = r.id
            WHERE ml.is_active = true
            GROUP BY ml.item_id, i.name, ml.region_id, r.name, r.tax_rate
            HAVING COUNT(*) >= 3 -- Ensure sufficient liquidity
        ),
        price_pairs AS (
            SELECT 
                rp1.item_id,
                rp1.item_name,
                rp1.region_id as buy_region_id,
                rp1.region_name as buy_region_name,
                rp2.region_id as sell_region_id,
                rp2.region_name as sell_region_name,
                rp1.avg_price as buy_price,
                rp2.avg_price as sell_price,
                rp1.tax_rate as buy_tax_rate,
                rp2.tax_rate as sell_tax_rate,
                ((rp2.avg_price - rp1.avg_price) / rp1.avg_price) * 100 as gross_profit_margin
            FROM regional_prices rp1
            JOIN regional_prices rp2 ON rp1.item_id = rp2.item_id
            WHERE rp1.region_id != rp2.region_id
            AND rp2.avg_price > rp1.avg_price
        )
        SELECT 
            item_id,
            item_name,
            buy_region_id,
            buy_region_name,
            sell_region_id,
            sell_region_name,
            buy_price,
            sell_price,
            gross_profit_margin,
            buy_tax_rate,
            sell_tax_rate
        FROM price_pairs
        WHERE gross_profit_margin > 5 -- At least 5% profit margin
        ORDER BY gross_profit_margin DESC
        LIMIT 20
        "#
    )
    .fetch_all(pool)
    .await?;

    let mut arbitrage_list = Vec::new();
    for (item_id, item_name, buy_region_id, buy_region_name, sell_region_id, sell_region_name, 
         buy_price, sell_price, gross_margin, buy_tax, sell_tax) in opportunities {
        
        // Calculate profit after taxes
        let buy_cost = buy_price * (Decimal::ONE + buy_tax);
        let sell_revenue = sell_price * (Decimal::ONE - sell_tax);
        let net_profit = sell_revenue - buy_cost;
        let net_profit_margin = if buy_cost > Decimal::ZERO {
            (net_profit / buy_cost) * Decimal::from(100)
        } else {
            Decimal::ZERO
        };

        if net_profit_margin > Decimal::ZERO {
            arbitrage_list.push(ArbitrageOpportunity {
                item_id,
                item_name,
                buy_region_id,
                buy_region_name,
                sell_region_id,
                sell_region_name,
                buy_price,
                sell_price,
                profit_margin: gross_margin,
                profit_after_taxes: net_profit,
                buy_region_tax_rate: buy_tax,
                sell_region_tax_rate: sell_tax,
            });
        }
    }

    Ok(arbitrage_list)
}

/// Get regional market analytics
pub async fn get_regional_analytics(
    State(pool): State<Arc<PgPool>>,
) -> Result<Json<Value>, AppError> {
    let regions: Vec<(Uuid, String, Decimal, Decimal, i64)> = sqlx::query_as(
        r#"
        SELECT 
            r.id,
            r.name,
            COALESCE(SUM(mt.total_price), 0) as volume_24h,
            COALESCE(AVG(
                CASE 
                    WHEN mp_prev.avg_price > 0 THEN 
                        ((mp_curr.avg_price - mp_prev.avg_price) / mp_prev.avg_price) * 100
                    ELSE 0
                END
            ), 0) as avg_price_change,
            COUNT(DISTINCT ml.id) as active_listings
        FROM regions r
        LEFT JOIN market_transactions mt ON mt.region_id = r.id 
            AND mt.created_at > NOW() - INTERVAL '24 hours'
        LEFT JOIN market_listings ml ON ml.region_id = r.id AND ml.is_active = true
        LEFT JOIN market_prices mp_curr ON mp_curr.region_id = r.id 
            AND mp_curr.time > NOW() - INTERVAL '1 hour'
        LEFT JOIN market_prices mp_prev ON mp_prev.region_id = r.id 
            AND mp_prev.item_id = mp_curr.item_id
            AND mp_prev.time > NOW() - INTERVAL '25 hours'
            AND mp_prev.time <= NOW() - INTERVAL '23 hours'
        GROUP BY r.id, r.name
        ORDER BY volume_24h DESC
        "#
    )
    .fetch_all(&*pool)
    .await?;

    let mut regional_analytics = Vec::new();
    
    for (region_id, region_name, volume_24h, avg_price_change, active_listings) in regions {
        // Get dominant categories for this region
        let dominant_categories: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT i.category
            FROM market_listings ml
            JOIN items i ON ml.item_id = i.id
            WHERE ml.region_id = $1 AND ml.is_active = true
            GROUP BY i.category
            ORDER BY SUM(ml.quantity * ml.price) DESC
            LIMIT 3
            "#
        )
        .bind(region_id)
        .fetch_all(&*pool)
        .await?;

        // Calculate market health score
        let health_score = calculate_market_health(volume_24h, active_listings, avg_price_change);
        let market_health = match health_score {
            score if score >= 7.0 => "strong",
            score if score >= 4.0 => "moderate",
            _ => "weak",
        };

        // Get top items by volume
        let top_items: Vec<(Uuid, String, Decimal, Option<Decimal>)> = sqlx::query_as(
            r#"
            SELECT 
                i.id,
                i.name,
                COALESCE(SUM(mt.quantity * mt.price_per_unit), 0) as volume_24h,
                AVG(ml.price) as avg_price
            FROM items i
            LEFT JOIN market_transactions mt ON i.id = mt.item_id 
                AND mt.region_id = $1
                AND mt.created_at > NOW() - INTERVAL '24 hours'
            LEFT JOIN market_listings ml ON i.id = ml.item_id 
                AND ml.region_id = $1 
                AND ml.is_active = true
            GROUP BY i.id, i.name
            HAVING COALESCE(SUM(mt.quantity * mt.price_per_unit), 0) > 0
            ORDER BY volume_24h DESC
            LIMIT 5
            "#
        )
        .bind(region_id)
        .fetch_all(&*pool)
        .await?;

        regional_analytics.push(RegionalAnalytics {
            region_id,
            region_name,
            total_volume_24h: volume_24h,
            avg_price_change,
            active_listings,
            market_health: market_health.to_string(),
            dominant_categories: dominant_categories.into_iter().map(|(cat,)| cat).collect(),
            top_items_by_volume: top_items.into_iter().map(|(id, name, volume, price)| {
                TopItemByVolume {
                    item_id: id,
                    item_name: name,
                    volume_24h: volume,
                    avg_price: price.unwrap_or(Decimal::ZERO),
                }
            }).collect(),
            liquidity_score: Decimal::from_f64_retain(health_score).unwrap_or(Decimal::ZERO),
        });
    }

    Ok(Json(json!(regional_analytics)))
}

fn calculate_market_health(volume: Decimal, listings: i64, price_change: Decimal) -> f64 {
    let volume_score = (volume.to_string().parse::<f64>().unwrap_or(0.0) / 10000.0).min(3.0);
    let listings_score = (listings as f64 / 100.0).min(3.0);
    let stability_score = (5.0 - price_change.abs().to_string().parse::<f64>().unwrap_or(0.0)).max(0.0).min(4.0);
    
    volume_score + listings_score + stability_score
}

/// Get technical indicators for an item in a region
pub async fn get_technical_indicators(
    State(pool): State<Arc<PgPool>>,
    Path((region_id, item_id)): Path<(Uuid, Uuid)>,
    Query(params): Query<PriceHistoryQuery>,
) -> Result<Json<Value>, AppError> {
    let timeframe = params.timeframe.as_deref().unwrap_or("1D");
    let limit = params.limit.unwrap_or(100);

    // Get base price data
    let interval = match timeframe {
        "1H" => "1 hour",
        "4H" => "4 hours", 
        "1D" => "1 day",
        "1W" => "1 week",
        _ => "1 day",
    };

    let price_data: Vec<(chrono::DateTime<chrono::Utc>, Decimal, Decimal, Decimal, Decimal)> = sqlx::query_as(
        &format!(
            r#"
            SELECT 
                time_bucket('{}', time) as bucket,
                AVG(avg_price) as avg_price,
                MIN(min_price) as min_price,
                MAX(max_price) as max_price,
                SUM(volume) as total_volume
            FROM market_prices
            WHERE region_id = $1 AND item_id = $2
            AND time > NOW() - INTERVAL '30 days'
            GROUP BY bucket
            ORDER BY bucket DESC
            LIMIT $3
            "#, interval
        )
    )
    .bind(region_id)
    .bind(item_id)
    .bind(limit)
    .fetch_all(&*pool)
    .await?;

    // Calculate technical indicators
    let indicators = calculate_technical_indicators(price_data, region_id, item_id);

    Ok(Json(json!(indicators)))
}

fn calculate_technical_indicators(
    price_data: Vec<(chrono::DateTime<chrono::Utc>, Decimal, Decimal, Decimal, Decimal)>,
    region_id: Uuid,
    item_id: Uuid,
) -> Vec<TechnicalIndicators> {
    let mut indicators = Vec::new();
    let prices: Vec<f64> = price_data.iter()
        .map(|(_, avg, _, _, _)| avg.to_string().parse().unwrap_or(0.0))
        .collect();

    for (i, (timestamp, _avg_price, _, _, _)) in price_data.iter().enumerate() {
        let mut indicator = TechnicalIndicators {
            item_id,
            region_id,
            timestamp: *timestamp,
            sma_7: None,
            sma_14: None,
            sma_30: None,
            ema_7: None,
            ema_14: None,
            bollinger_upper: None,
            bollinger_lower: None,
            bollinger_middle: None,
            rsi: None,
            macd: None,
            macd_signal: None,
        };

        // Calculate SMA (Simple Moving Average)
        if i >= 6 {
            let sma_7: f64 = prices[i-6..=i].iter().sum::<f64>() / 7.0;
            indicator.sma_7 = Some(Decimal::from_f64_retain(sma_7).unwrap_or(Decimal::ZERO));
        }
        
        if i >= 13 {
            let sma_14: f64 = prices[i-13..=i].iter().sum::<f64>() / 14.0;
            indicator.sma_14 = Some(Decimal::from_f64_retain(sma_14).unwrap_or(Decimal::ZERO));
        }
        
        if i >= 29 {
            let sma_30: f64 = prices[i-29..=i].iter().sum::<f64>() / 30.0;
            indicator.sma_30 = Some(Decimal::from_f64_retain(sma_30).unwrap_or(Decimal::ZERO));
        }

        // Calculate EMA (Exponential Moving Average)
        if i >= 6 {
            let alpha = 2.0 / 8.0; // For 7-period EMA
            let mut ema = prices[0];
            for &price in &prices[1..=i] {
                ema = alpha * price + (1.0 - alpha) * ema;
            }
            indicator.ema_7 = Some(Decimal::from_f64_retain(ema).unwrap_or(Decimal::ZERO));
        }

        // Calculate RSI (Relative Strength Index)
        if i >= 13 {
            let rsi = calculate_rsi(&prices[i-13..=i]);
            indicator.rsi = Some(Decimal::from_f64_retain(rsi).unwrap_or(Decimal::ZERO));
        }

        // Calculate Bollinger Bands
        if i >= 19 {
            let window = &prices[i-19..=i];
            let mean: f64 = window.iter().sum::<f64>() / window.len() as f64;
            let variance: f64 = window.iter()
                .map(|&x| (x - mean).powi(2))
                .sum::<f64>() / window.len() as f64;
            let std_dev = variance.sqrt();
            
            indicator.bollinger_middle = Some(Decimal::from_f64_retain(mean).unwrap_or(Decimal::ZERO));
            indicator.bollinger_upper = Some(Decimal::from_f64_retain(mean + 2.0 * std_dev).unwrap_or(Decimal::ZERO));
            indicator.bollinger_lower = Some(Decimal::from_f64_retain(mean - 2.0 * std_dev).unwrap_or(Decimal::ZERO));
        }

        indicators.push(indicator);
    }

    indicators
}

fn calculate_rsi(prices: &[f64]) -> f64 {
    if prices.len() < 2 {
        return 50.0; // Neutral RSI
    }

    let mut gains = 0.0;
    let mut losses = 0.0;
    let mut count = 0;

    for window in prices.windows(2) {
        let change = window[1] - window[0];
        if change > 0.0 {
            gains += change;
        } else {
            losses -= change; // Make positive
        }
        count += 1;
    }

    if count == 0 || losses == 0.0 {
        return if gains > 0.0 { 100.0 } else { 50.0 };
    }

    let avg_gain = gains / count as f64;
    let avg_loss = losses / count as f64;
    let rs = avg_gain / avg_loss;
    
    100.0 - (100.0 / (1.0 + rs))
}
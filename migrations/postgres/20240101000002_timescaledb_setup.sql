-- TimescaleDB setup for time-series market data

-- Create market prices table for time-series data
CREATE TABLE market_prices (
    time TIMESTAMPTZ NOT NULL,
    region_id UUID NOT NULL,
    item_id UUID NOT NULL,
    avg_price DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    volume INTEGER NOT NULL DEFAULT 0,
    volatility DECIMAL(5,4)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('market_prices', 'time', if_not_exists => TRUE);

-- Create composite index for efficient querying
CREATE INDEX idx_market_prices_region_item_time 
ON market_prices (region_id, item_id, time DESC);

-- Create continuous aggregate for hourly market stats
CREATE MATERIALIZED VIEW market_stats_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    region_id,
    item_id,
    AVG(avg_price) as avg_price,
    MIN(min_price) as min_price,
    MAX(max_price) as max_price,
    SUM(volume) as total_volume,
    COUNT(*) as price_updates
FROM market_prices
GROUP BY bucket, region_id, item_id
WITH NO DATA;

-- Create continuous aggregate for daily market stats
CREATE MATERIALIZED VIEW market_stats_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS bucket,
    region_id,
    item_id,
    AVG(avg_price) as avg_price,
    MIN(min_price) as min_price,
    MAX(max_price) as max_price,
    SUM(volume) as total_volume,
    COUNT(*) as price_updates,
    STDDEV(avg_price) as price_stddev
FROM market_prices
GROUP BY bucket, region_id, item_id
WITH NO DATA;

-- Add retention policy (keep detailed data for 30 days, aggregates longer)
SELECT add_retention_policy('market_prices', INTERVAL '30 days', if_not_exists => TRUE);

-- Create refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('market_stats_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('market_stats_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE);

-- Create compression policy for older data
ALTER TABLE market_prices SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'region_id, item_id'
);

SELECT add_compression_policy('market_prices', INTERVAL '7 days', if_not_exists => TRUE);

-- Create function to calculate market volatility
CREATE OR REPLACE FUNCTION calculate_volatility(
    p_region_id UUID,
    p_item_id UUID,
    p_hours INTEGER DEFAULT 24
) RETURNS DECIMAL AS $$
DECLARE
    v_volatility DECIMAL;
BEGIN
    SELECT STDDEV(avg_price) / NULLIF(AVG(avg_price), 0)
    INTO v_volatility
    FROM market_prices
    WHERE region_id = p_region_id
    AND item_id = p_item_id
    AND time > NOW() - (p_hours || ' hours')::INTERVAL;
    
    RETURN COALESCE(v_volatility, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get trending items
CREATE OR REPLACE FUNCTION get_trending_items(
    p_region_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    item_id UUID,
    price_change_pct DECIMAL,
    volume_change_pct DECIMAL,
    trend_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_data AS (
        SELECT 
            item_id,
            AVG(CASE WHEN time > NOW() - INTERVAL '1 hour' THEN avg_price END) as price_1h,
            AVG(CASE WHEN time > NOW() - INTERVAL '24 hours' THEN avg_price END) as price_24h,
            SUM(CASE WHEN time > NOW() - INTERVAL '1 hour' THEN volume END) as volume_1h,
            SUM(CASE WHEN time > NOW() - INTERVAL '24 hours' THEN volume END) as volume_24h
        FROM market_prices
        WHERE region_id = p_region_id
        AND time > NOW() - INTERVAL '24 hours'
        GROUP BY item_id
    )
    SELECT 
        item_id,
        ((price_1h - price_24h) / NULLIF(price_24h, 0) * 100)::DECIMAL as price_change_pct,
        ((volume_1h - volume_24h/24) / NULLIF(volume_24h/24, 0) * 100)::DECIMAL as volume_change_pct,
        (ABS((price_1h - price_24h) / NULLIF(price_24h, 0)) + 
         (volume_1h / NULLIF(volume_24h/24, 0)))::DECIMAL as trend_score
    FROM recent_data
    WHERE price_1h IS NOT NULL
    ORDER BY trend_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
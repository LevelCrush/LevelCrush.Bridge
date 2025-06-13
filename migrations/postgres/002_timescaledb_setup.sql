-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert market_prices to a hypertable for time-series data
-- This enables efficient storage and querying of historical price data
SELECT create_hypertable('market_prices', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create continuous aggregate for hourly price summaries
CREATE MATERIALIZED VIEW market_prices_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    region_id,
    item_id,
    AVG(avg_price) as avg_price,
    MIN(min_price) as min_price,
    MAX(max_price) as max_price,
    SUM(volume) as total_volume,
    AVG(volatility) as avg_volatility
FROM market_prices
GROUP BY hour, region_id, item_id
WITH NO DATA;

-- Create continuous aggregate for daily price summaries
CREATE MATERIALIZED VIEW market_prices_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS day,
    region_id,
    item_id,
    AVG(avg_price) as avg_price,
    MIN(min_price) as min_price,
    MAX(max_price) as max_price,
    SUM(volume) as total_volume,
    AVG(volatility) as avg_volatility,
    STDDEV(avg_price) as price_stddev
FROM market_prices
GROUP BY day, region_id, item_id
WITH NO DATA;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('market_prices_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('market_prices_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- Create a table for character metrics over time
CREATE TABLE character_metrics (
    time TIMESTAMPTZ NOT NULL,
    character_id UUID NOT NULL,
    health INTEGER,
    stamina INTEGER,
    wealth DECIMAL(20,2),
    reputation INTEGER,
    location_id UUID,
    trades_completed INTEGER DEFAULT 0,
    distance_traveled INTEGER DEFAULT 0
);

-- Convert to hypertable
SELECT create_hypertable('character_metrics', 'time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Create index on character_id for efficient lookups
CREATE INDEX idx_character_metrics_character ON character_metrics(character_id, time DESC);

-- Create compression policy for older data
SELECT add_compression_policy('market_prices', INTERVAL '7 days');
SELECT add_compression_policy('character_metrics', INTERVAL '30 days');

-- Data retention policies (keep detailed data for 1 year, aggregated data longer)
SELECT add_retention_policy('market_prices', INTERVAL '365 days');
SELECT add_retention_policy('character_metrics', INTERVAL '180 days');

-- Create a table for tracking dynasty wealth over time
CREATE TABLE dynasty_wealth_history (
    time TIMESTAMPTZ NOT NULL,
    dynasty_id UUID NOT NULL,
    total_wealth DECIMAL(20,2) NOT NULL,
    active_characters INTEGER DEFAULT 0,
    deceased_characters INTEGER DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    generation INTEGER NOT NULL
);

SELECT create_hypertable('dynasty_wealth_history', 'time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Create useful functions for market analysis

-- Function to calculate market volatility
CREATE OR REPLACE FUNCTION calculate_market_volatility(
    p_region_id UUID,
    p_item_id UUID,
    p_time_window INTERVAL DEFAULT '24 hours'
)
RETURNS DECIMAL AS $$
DECLARE
    v_volatility DECIMAL;
BEGIN
    SELECT STDDEV(avg_price) / AVG(avg_price) * 100
    INTO v_volatility
    FROM market_prices
    WHERE region_id = p_region_id
    AND item_id = p_item_id
    AND time >= NOW() - p_time_window;
    
    RETURN COALESCE(v_volatility, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get price trend
CREATE OR REPLACE FUNCTION get_price_trend(
    p_region_id UUID,
    p_item_id UUID,
    p_time_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE(
    trend_direction VARCHAR(10),
    percentage_change DECIMAL,
    current_price DECIMAL,
    previous_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH price_data AS (
        SELECT 
            first(avg_price, time) as previous_price,
            last(avg_price, time) as current_price
        FROM market_prices
        WHERE region_id = p_region_id
        AND item_id = p_item_id
        AND time >= NOW() - p_time_window
    )
    SELECT 
        CASE 
            WHEN current_price > previous_price THEN 'UP'
            WHEN current_price < previous_price THEN 'DOWN'
            ELSE 'STABLE'
        END as trend_direction,
        ((current_price - previous_price) / previous_price * 100)::DECIMAL(5,2) as percentage_change,
        current_price,
        previous_price
    FROM price_data;
END;
$$ LANGUAGE plpgsql;

-- Create a view for death market impacts
CREATE VIEW death_market_impacts AS
SELECT 
    de.id,
    de.character_id,
    de.dynasty_id,
    de.death_date,
    de.location_id,
    de.market_impact_score,
    c.name as character_name,
    d.name as dynasty_name,
    r.name as death_location,
    de.wealth_at_death,
    de.reputation_at_death
FROM death_events de
JOIN characters c ON de.character_id = c.id
JOIN dynasties d ON de.dynasty_id = d.id
LEFT JOIN regions r ON de.location_id = r.id
WHERE de.market_impact_score > 0
ORDER BY de.death_date DESC;
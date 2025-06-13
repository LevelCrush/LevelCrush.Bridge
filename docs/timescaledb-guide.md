# TimescaleDB Guide for Dynasty Trader

## What is TimescaleDB?

TimescaleDB is a PostgreSQL extension that provides powerful time-series data capabilities. It's perfect for Dynasty Trader because we need to:
- Track market prices over time
- Monitor character health/wealth changes
- Analyze trading patterns
- Store historical dynasty performance

## Key Concepts

### 1. Hypertables
Hypertables are the core of TimescaleDB. They look like regular PostgreSQL tables but are optimized for time-series data:

```sql
-- Regular table
CREATE TABLE market_prices (
    time TIMESTAMPTZ,
    region_id UUID,
    item_id UUID,
    price DECIMAL(10,2)
);

-- Convert to hypertable
SELECT create_hypertable('market_prices', 'time');
```

### 2. Chunks
TimescaleDB automatically partitions data into chunks based on time intervals:
- Each chunk typically contains 1 day or 1 week of data
- Old chunks can be compressed or dropped
- Queries automatically span multiple chunks

### 3. Continuous Aggregates
Pre-computed views that update automatically:

```sql
CREATE MATERIALIZED VIEW prices_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    region_id,
    AVG(price) as avg_price
FROM market_prices
GROUP BY hour, region_id;
```

## Dynasty Trader Implementation

### Market Price Tracking
```sql
-- Insert price data
INSERT INTO market_prices (time, region_id, item_id, avg_price, volume)
VALUES (NOW(), $1, $2, $3, $4);

-- Query recent prices
SELECT * FROM market_prices
WHERE region_id = $1 
AND item_id = $2
AND time > NOW() - INTERVAL '24 hours'
ORDER BY time DESC;
```

### Character Metrics
```sql
-- Track character stats over time
INSERT INTO character_metrics (
    time, character_id, health, wealth, location_id
) VALUES (NOW(), $1, $2, $3, $4);

-- Get character health trend
SELECT 
    time_bucket('1 hour', time) as hour,
    AVG(health) as avg_health
FROM character_metrics
WHERE character_id = $1
AND time > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

## Best Practices

### 1. Time-based Queries
Always include time predicates for performance:
```sql
-- Good: Time predicate helps TimescaleDB optimize
WHERE time > NOW() - INTERVAL '7 days'

-- Bad: No time predicate means scanning all chunks
WHERE region_id = 'abc'
```

### 2. Batch Inserts
Insert multiple rows at once for better performance:
```sql
INSERT INTO market_prices (time, region_id, item_id, avg_price, volume)
VALUES 
    (NOW(), $1, $2, $3, $4),
    (NOW(), $5, $6, $7, $8),
    (NOW(), $9, $10, $11, $12);
```

### 3. Data Retention
Set up automatic data cleanup:
```sql
-- Keep detailed data for 1 year
SELECT add_retention_policy('market_prices', INTERVAL '365 days');

-- Keep aggregated data longer
SELECT add_retention_policy('prices_daily', INTERVAL '5 years');
```

## Common Pitfalls

### 1. Incorrect Time Bucketing
```sql
-- Bad: Creates too many buckets
time_bucket('1 second', time)

-- Good: Reasonable bucket size
time_bucket('5 minutes', time)
```

### 2. Missing Indexes
```sql
-- Always index non-time columns used in WHERE clauses
CREATE INDEX ON market_prices (region_id, item_id, time DESC);
```

### 3. Not Using Continuous Aggregates
```sql
-- Bad: Computing aggregates on every query
SELECT AVG(price) FROM market_prices WHERE...

-- Good: Using pre-computed aggregates
SELECT avg_price FROM prices_hourly WHERE...
```

## Monitoring & Maintenance

### Check Chunk Sizes
```sql
SELECT hypertable_name, chunk_name, 
       pg_size_pretty(total_bytes) as size
FROM timescaledb_information.chunks
WHERE hypertable_name = 'market_prices'
ORDER BY range_start DESC
LIMIT 10;
```

### Compression Status
```sql
SELECT hypertable_name,
       SUM(before_compression_total_bytes) as before,
       SUM(after_compression_total_bytes) as after
FROM timescaledb_information.compressed_chunk_stats
GROUP BY hypertable_name;
```

## Dynasty Trader Specific Patterns

### Death Event Market Impact
```sql
-- When a character dies, record market impact
WITH death_impact AS (
    INSERT INTO death_events (
        character_id, dynasty_id, death_date, 
        market_impact_score, wealth_at_death
    ) VALUES ($1, $2, NOW(), $3, $4)
    RETURNING *
)
-- Trigger price changes in affected markets
INSERT INTO market_prices (time, region_id, item_id, avg_price, volume, volatility)
SELECT 
    NOW(),
    r.region_id,
    i.item_id,
    i.price * (1 + (d.market_impact_score / 100.0)),
    0,
    d.market_impact_score
FROM death_impact d
CROSS JOIN affected_items i
CROSS JOIN affected_regions r;
```

### Dynasty Wealth Tracking
```sql
-- Record dynasty wealth snapshots
INSERT INTO dynasty_wealth_history (
    time, dynasty_id, total_wealth, active_characters, generation
)
SELECT 
    NOW(),
    d.id,
    COALESCE(SUM(cm.wealth), 0),
    COUNT(c.id),
    d.generation
FROM dynasties d
LEFT JOIN characters c ON c.dynasty_id = d.id AND c.is_alive = true
LEFT JOIN LATERAL (
    SELECT wealth 
    FROM character_metrics 
    WHERE character_id = c.id 
    ORDER BY time DESC 
    LIMIT 1
) cm ON true
GROUP BY d.id;
```

## Performance Tips

1. **Use time_bucket() for grouping**: More efficient than DATE_TRUNC
2. **Leverage LATERAL joins**: For getting latest values per entity
3. **Create supporting indexes**: On (entity_id, time DESC) patterns
4. **Use continuous aggregates**: For frequently accessed summaries
5. **Monitor chunk sizes**: Adjust chunk_time_interval if needed

## Troubleshooting

### Slow Queries
1. Check EXPLAIN ANALYZE output
2. Ensure time predicates are present
3. Verify indexes exist
4. Consider continuous aggregates

### High Disk Usage
1. Check retention policies
2. Enable compression on old chunks
3. Drop unnecessary continuous aggregates
4. Review chunk_time_interval settings

### Memory Issues
1. Tune shared_buffers (25% of RAM)
2. Adjust work_mem for complex queries
3. Monitor continuous aggregate refresh jobs
4. Use connection pooling
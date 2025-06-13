-- Create death_events table to track all character deaths and their impacts
CREATE TABLE IF NOT EXISTS death_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    death_cause VARCHAR(255) NOT NULL,
    character_wealth DECIMAL(20,2) NOT NULL DEFAULT 0,
    inheritance_tax DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_inheritance DECIMAL(20,2) NOT NULL DEFAULT 0,
    market_events_created INTEGER NOT NULL DEFAULT 0,
    died_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_death_events_dynasty ON death_events(dynasty_id);
CREATE INDEX IF NOT EXISTS idx_death_events_died_at ON death_events(died_at);

-- Add columns to dynasties if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'dynasties' AND column_name = 'total_deaths') THEN
        ALTER TABLE dynasties 
        ADD COLUMN total_deaths INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'dynasties' AND column_name = 'last_death_at') THEN
        ALTER TABLE dynasties 
        ADD COLUMN last_death_at TIMESTAMPTZ;
    END IF;
END$$;

-- Add death tracking columns to characters if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'characters' AND column_name = 'death_cause') THEN
        ALTER TABLE characters
        ADD COLUMN death_cause VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'characters' AND column_name = 'died_at') THEN
        ALTER TABLE characters
        ADD COLUMN died_at TIMESTAMPTZ;
    END IF;
END$$;

-- Create a view for recent deaths with impact
CREATE OR REPLACE VIEW recent_deaths_with_impact AS
SELECT 
    de.id,
    c.name as character_name,
    EXTRACT(YEAR FROM AGE(COALESCE(c.death_date, de.died_at), c.birth_date))::INTEGER as character_age,
    d.name as dynasty_name,
    de.death_cause,
    de.character_wealth,
    de.net_inheritance,
    de.market_events_created,
    de.died_at,
    COUNT(DISTINCT ml.id) as ghost_listings_created
FROM death_events de
JOIN characters c ON de.character_id = c.id
JOIN dynasties d ON de.dynasty_id = d.id
LEFT JOIN market_listings ml ON ml.seller_character_id IS NULL 
    AND ml.is_ghost_listing = true 
    AND ml.listed_at >= de.died_at 
    AND ml.listed_at < de.died_at + INTERVAL '1 minute'
WHERE de.died_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY de.id, c.name, c.birth_date, c.death_date, d.name, de.death_cause, 
         de.character_wealth, de.net_inheritance, 
         de.market_events_created, de.died_at
ORDER BY de.died_at DESC;

-- Create function to get dynasty death statistics
CREATE OR REPLACE FUNCTION get_dynasty_death_stats(p_dynasty_id UUID)
RETURNS TABLE (
    total_deaths BIGINT,
    total_wealth_lost DECIMAL,
    total_inheritance DECIMAL,
    avg_death_age DECIMAL,
    common_death_cause TEXT,
    death_causes JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH death_stats AS (
        SELECT 
            COUNT(*) as death_count,
            SUM(de.character_wealth) as wealth_lost,
            SUM(de.net_inheritance) as inheritance,
            AVG(EXTRACT(YEAR FROM AGE(COALESCE(c.death_date, de.died_at), c.birth_date))) as avg_age,
            MODE() WITHIN GROUP (ORDER BY de.death_cause) as top_cause,
            jsonb_object_agg(de.death_cause, cause_count) as causes
        FROM death_events de
        JOIN characters c ON de.character_id = c.id
        CROSS JOIN LATERAL (
            SELECT de.death_cause, COUNT(*) as cause_count
            FROM death_events de2
            WHERE de2.dynasty_id = p_dynasty_id
            GROUP BY de2.death_cause
        ) cause_counts
        WHERE de.dynasty_id = p_dynasty_id
    )
    SELECT 
        death_count,
        wealth_lost,
        inheritance,
        avg_age,
        top_cause,
        causes
    FROM death_stats;
END;
$$ LANGUAGE plpgsql;
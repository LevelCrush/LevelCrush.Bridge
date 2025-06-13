-- Create death_events table to track all character deaths and their impacts
CREATE TABLE death_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    death_cause VARCHAR(255) NOT NULL,
    character_wealth DECIMAL(20,2) NOT NULL DEFAULT 0,
    inheritance_tax DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_inheritance DECIMAL(20,2) NOT NULL DEFAULT 0,
    market_events_created INTEGER NOT NULL DEFAULT 0,
    died_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for querying
    INDEX idx_death_events_dynasty (dynasty_id),
    INDEX idx_death_events_died_at (died_at)
);

-- Add column to dynasties if not exists
ALTER TABLE dynasties 
ADD COLUMN IF NOT EXISTS total_deaths INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_death_at TIMESTAMPTZ;

-- Add death tracking columns to characters if not exists
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS death_cause VARCHAR(255),
ADD COLUMN IF NOT EXISTS died_at TIMESTAMPTZ;

-- Create a view for recent deaths with impact
CREATE OR REPLACE VIEW recent_deaths_with_impact AS
SELECT 
    de.id,
    c.name as character_name,
    c.age as character_age,
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
GROUP BY de.id, c.name, c.age, d.name, de.death_cause, 
         de.character_wealth, de.net_inheritance, 
         de.market_events_created, de.died_at
ORDER BY de.died_at DESC;
-- Dynasty Trader Initial Schema
-- This creates the core tables for the Dynasty Trader game

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (keeping compatibility with existing Bridge structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ
);

-- Dynasty table - represents a player's multi-generational trading empire
CREATE TABLE dynasties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    motto VARCHAR(255),
    founded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    generation INTEGER DEFAULT 1,
    total_wealth DECIMAL(20,2) DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    legacy_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, name)
);

-- Characters table - individual characters within a dynasty
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    birth_date TIMESTAMPTZ NOT NULL,
    death_date TIMESTAMPTZ,
    death_cause VARCHAR(255),
    -- Age will be calculated in application logic since generated columns need immutable expressions
    health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
    stamina INTEGER DEFAULT 100 CHECK (stamina >= 0 AND stamina <= 100),
    
    -- Character stats that affect trading
    charisma INTEGER DEFAULT 10 CHECK (charisma >= 0 AND charisma <= 100),
    intelligence INTEGER DEFAULT 10 CHECK (intelligence >= 0 AND intelligence <= 100),
    luck INTEGER DEFAULT 10 CHECK (luck >= 0 AND luck <= 100),
    
    -- Character state
    location_id UUID,
    is_alive BOOLEAN DEFAULT true,
    generation INTEGER NOT NULL,
    
    -- Inheritance
    parent_character_id UUID REFERENCES characters(id),
    inheritance_received DECIMAL(20,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Regions/Locations for the game world
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    -- Regional modifiers
    tax_rate DECIMAL(5,2) DEFAULT 10.0,
    safety_level INTEGER DEFAULT 50 CHECK (safety_level >= 0 AND safety_level <= 100),
    prosperity_level INTEGER DEFAULT 50 CHECK (prosperity_level >= 0 AND prosperity_level <= 100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Market listings for regional markets
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID NOT NULL REFERENCES regions(id),
    item_id UUID NOT NULL,
    seller_character_id UUID REFERENCES characters(id),
    
    -- Price and quantity
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    original_quantity INTEGER NOT NULL,
    
    -- Listing metadata
    listed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- For ghost markets
    is_ghost_listing BOOLEAN DEFAULT false,
    ghost_price_modifier DECIMAL(5,2) DEFAULT 1.0
);

-- Market price history (this will be converted to TimescaleDB hypertable)
CREATE TABLE market_prices (
    time TIMESTAMPTZ NOT NULL,
    region_id UUID NOT NULL REFERENCES regions(id),
    item_id UUID NOT NULL,
    avg_price DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    volume INTEGER NOT NULL,
    volatility DECIMAL(5,2),
    PRIMARY KEY (time, region_id, item_id)
);

-- Death events that affect markets
CREATE TABLE death_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    death_date TIMESTAMPTZ NOT NULL,
    death_cause VARCHAR(255) NOT NULL,
    location_id UUID REFERENCES regions(id),
    
    -- Market impact
    market_impact_score INTEGER DEFAULT 0,
    wealth_at_death DECIMAL(20,2),
    reputation_at_death INTEGER,
    
    -- Legacy effects
    ghost_market_active BOOLEAN DEFAULT false,
    ghost_market_expires TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trade routes between regions
CREATE TABLE trade_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_region_id UUID NOT NULL REFERENCES regions(id),
    to_region_id UUID NOT NULL REFERENCES regions(id),
    distance INTEGER NOT NULL CHECK (distance > 0),
    danger_level INTEGER DEFAULT 50 CHECK (danger_level >= 0 AND danger_level <= 100),
    toll_cost DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(from_region_id, to_region_id)
);

-- Character inventory (compatible with existing Bridge inventory system)
CREATE TABLE character_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id),
    item_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acquired_price DECIMAL(10,2),
    UNIQUE(character_id, item_id)
);

-- Dynasty alliances (evolution of clans)
CREATE TABLE dynasty_alliances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    founded_by_dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    founded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reputation INTEGER DEFAULT 0,
    treasury DECIMAL(20,2) DEFAULT 0
);

-- Dynasty alliance memberships
CREATE TABLE alliance_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    alliance_id UUID NOT NULL REFERENCES dynasty_alliances(id),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'member',
    contribution_total DECIMAL(20,2) DEFAULT 0,
    UNIQUE(dynasty_id, alliance_id)
);

-- Market events that affect prices
CREATE TABLE market_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity INTEGER DEFAULT 50 CHECK (severity >= 0 AND severity <= 100),
    affected_region_id UUID REFERENCES regions(id),
    affected_item_id UUID,
    description TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    price_modifier DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_characters_dynasty_id ON characters(dynasty_id);
CREATE INDEX idx_characters_location_id ON characters(location_id);
CREATE INDEX idx_characters_alive ON characters(dynasty_id) WHERE death_date IS NULL;
CREATE INDEX idx_market_listings_region_item ON market_listings(region_id, item_id) WHERE is_active = true;
CREATE INDEX idx_market_prices_region_time ON market_prices(region_id, time DESC);
CREATE INDEX idx_death_events_dynasty ON death_events(dynasty_id);
CREATE INDEX idx_death_events_impact ON death_events(market_impact_score) WHERE market_impact_score > 0;

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
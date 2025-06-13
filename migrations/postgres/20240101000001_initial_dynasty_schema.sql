-- Initial Dynasty Trader schema
-- This is the foundation for the Dynasty Trader game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (compatible with existing Bridge auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) UNIQUE,
    discord_username VARCHAR(255),
    discord_avatar VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- Create dynasties table
CREATE TABLE dynasties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    founded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    generation INTEGER NOT NULL DEFAULT 1,
    total_characters INTEGER NOT NULL DEFAULT 0,
    living_characters INTEGER NOT NULL DEFAULT 0,
    total_wealth DECIMAL(20,2) NOT NULL DEFAULT 0,
    treasury DECIMAL(20,2) NOT NULL DEFAULT 0,
    reputation_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_dynasty UNIQUE(user_id)
);

-- Create regions table
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    safety_level INTEGER NOT NULL DEFAULT 5 CHECK (safety_level BETWEEN 1 AND 10),
    prosperity_level INTEGER NOT NULL DEFAULT 5 CHECK (prosperity_level BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create characters table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    birth_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    death_date TIMESTAMPTZ,
    health INTEGER NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
    stamina INTEGER NOT NULL DEFAULT 100 CHECK (stamina >= 0 AND stamina <= 100),
    charisma INTEGER NOT NULL DEFAULT 50 CHECK (charisma >= 0 AND charisma <= 100),
    intelligence INTEGER NOT NULL DEFAULT 50 CHECK (intelligence >= 0 AND intelligence <= 100),
    luck INTEGER NOT NULL DEFAULT 50 CHECK (luck >= 0 AND luck <= 100),
    location_id UUID REFERENCES regions(id),
    is_alive BOOLEAN NOT NULL DEFAULT true,
    generation INTEGER NOT NULL DEFAULT 1,
    parent_character_id UUID REFERENCES characters(id),
    inheritance_received DECIMAL(20,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create character inventory table
CREATE TABLE character_inventory (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acquired_price DECIMAL(10,2),
    
    PRIMARY KEY (character_id, item_id)
);

-- Create wealth snapshots table for tracking dynasty wealth over time
CREATE TABLE dynasty_wealth_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dynasty_id UUID NOT NULL REFERENCES dynasties(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_characters INTEGER NOT NULL,
    living_characters INTEGER NOT NULL,
    treasury_amount DECIMAL(20,2) NOT NULL,
    inventory_value DECIMAL(20,2) NOT NULL,
    total_wealth DECIMAL(20,2) NOT NULL,
    
    INDEX idx_wealth_snapshots_dynasty_time (dynasty_id, snapshot_time DESC)
);

-- Create market listings table
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID NOT NULL REFERENCES regions(id),
    item_id UUID NOT NULL,
    seller_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    original_quantity INTEGER NOT NULL CHECK (original_quantity > 0),
    listed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_ghost_listing BOOLEAN DEFAULT false,
    ghost_price_modifier DECIMAL(3,2) DEFAULT 1.0,
    
    INDEX idx_market_listings_region_active (region_id, is_active),
    INDEX idx_market_listings_item (item_id),
    INDEX idx_market_listings_expires (expires_at)
);

-- Create trade routes table
CREATE TABLE trade_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_region_id UUID NOT NULL REFERENCES regions(id),
    to_region_id UUID NOT NULL REFERENCES regions(id),
    distance INTEGER NOT NULL CHECK (distance > 0),
    danger_level INTEGER NOT NULL DEFAULT 1 CHECK (danger_level BETWEEN 1 AND 10),
    toll_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_trade_route UNIQUE(from_region_id, to_region_id)
);

-- Create market events table
CREATE TABLE market_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
    affected_region_id UUID REFERENCES regions(id),
    affected_item_id UUID,
    description TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    price_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    
    INDEX idx_market_events_active (is_active, expires_at)
);

-- Create dynasty alliances table (evolution of clans)
CREATE TABLE dynasty_alliances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    founded_by_dynasty_id UUID NOT NULL REFERENCES dynasties(id),
    treasury DECIMAL(20,2) NOT NULL DEFAULT 0,
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create dynasty alliance members table
CREATE TABLE dynasty_alliance_members (
    alliance_id UUID NOT NULL REFERENCES dynasty_alliances(id) ON DELETE CASCADE,
    dynasty_id UUID NOT NULL REFERENCES dynasties(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    contribution_total DECIMAL(20,2) NOT NULL DEFAULT 0,
    
    PRIMARY KEY (alliance_id, dynasty_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_characters_dynasty ON characters(dynasty_id);
CREATE INDEX idx_characters_alive ON characters(is_alive);
CREATE INDEX idx_dynasties_user ON dynasties(user_id);
CREATE INDEX idx_users_discord ON users(discord_id) WHERE discord_id IS NOT NULL;

-- Add check constraint to ensure death_date is set when is_alive is false
ALTER TABLE characters ADD CONSTRAINT check_death_consistency 
    CHECK ((is_alive = true AND death_date IS NULL) OR (is_alive = false AND death_date IS NOT NULL));
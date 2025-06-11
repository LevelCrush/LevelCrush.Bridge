-- Bridge Database Schema
-- Initial migration

-- Drop tables in reverse order of dependencies to allow clean re-runs
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS app_secrets;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS auction_bids;
DROP TABLE IF EXISTS marketplace_listings;
DROP TABLE IF EXISTS trade_items;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS user_connections;
DROP TABLE IF EXISTS clan_inventory;
DROP TABLE IF EXISTS clan_members;
DROP TABLE IF EXISTS clans;
DROP TABLE IF EXISTS user_item_modifiers;
DROP TABLE IF EXISTS user_inventory;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS item_modifiers;
DROP TABLE IF EXISTS modifier_categories;
DROP TABLE IF EXISTS item_rarities;
DROP TABLE IF EXISTS user_games;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    discord_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_discord_id (discord_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Item rarity enum
CREATE TABLE item_rarities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) NOT NULL, -- hex color
    weight INT NOT NULL DEFAULT 100, -- for drop rates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default rarities
INSERT INTO item_rarities (name, color, weight) VALUES
('Common', '#B0B0B0', 1000),
('Uncommon', '#1EFF00', 400),
('Rare', '#0080FF', 150),
('Epic', '#B335F7', 50),
('Legendary', '#FF8000', 10),
('Mythic', '#FF0080', 1);

-- Modifier categories
CREATE TABLE modifier_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default modifier categories
INSERT INTO modifier_categories (name, description) VALUES
('Offensive', 'Modifiers that increase damage output'),
('Defensive', 'Modifiers that improve survivability'),
('Utility', 'Modifiers that provide various utilities'),
('Economic', 'Modifiers that affect credits and trading'),
('Special', 'Unique and rare modifiers');

-- Item modifiers (roguelike perks)
CREATE TABLE item_modifiers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    effect_type VARCHAR(50) NOT NULL, -- damage_boost, defense_boost, credit_multiplier, etc.
    effect_value DECIMAL(10,2) NOT NULL,
    tier INT NOT NULL DEFAULT 1, -- 1-5 for scaling
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES modifier_categories(id),
    INDEX idx_category (category_id),
    INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Base item definitions
CREATE TABLE inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL, -- weapon, armor, consumable, etc.
    rarity_id INT NOT NULL,
    base_credit_value INT NOT NULL DEFAULT 0,
    max_modifiers INT NOT NULL DEFAULT 3,
    icon_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rarity_id) REFERENCES item_rarities(id),
    INDEX idx_rarity (rarity_id),
    INDEX idx_type (item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User inventory (instances of items with modifiers)
CREATE TABLE user_inventory (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    item_id INT NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_tradeable BOOLEAN DEFAULT TRUE,
    is_equipped BOOLEAN DEFAULT FALSE,
    custom_name VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    INDEX idx_user (user_id),
    INDEX idx_item (item_id),
    INDEX idx_equipped (user_id, is_equipped)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Applied modifiers to user items
CREATE TABLE user_item_modifiers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_item_id CHAR(36) NOT NULL,
    modifier_id INT NOT NULL,
    modifier_tier INT NOT NULL DEFAULT 1,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_item_id) REFERENCES user_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (modifier_id) REFERENCES item_modifiers(id),
    UNIQUE KEY unique_item_modifier (user_item_id, modifier_id),
    INDEX idx_user_item (user_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Clans
CREATE TABLE clans (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tag VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    federation_id CHAR(36), -- for clan federations
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    max_members INT DEFAULT 50,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (federation_id) REFERENCES clans(id),
    INDEX idx_name (name),
    INDEX idx_tag (tag),
    INDEX idx_federation (federation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Clan members
CREATE TABLE clan_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clan_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    rank VARCHAR(50) NOT NULL DEFAULT 'Member', -- Leader, Officer, Member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INT DEFAULT 0,
    FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_clan_member (clan_id, user_id),
    INDEX idx_clan (clan_id),
    INDEX idx_user (user_id),
    INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Clan inventory (shared items)
CREATE TABLE clan_inventory (
    id CHAR(36) PRIMARY KEY,
    clan_id CHAR(36) NOT NULL,
    item_id INT NOT NULL,
    deposited_by CHAR(36) NOT NULL,
    deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    min_rank_to_withdraw VARCHAR(50) DEFAULT 'Member',
    FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (deposited_by) REFERENCES users(id),
    INDEX idx_clan (clan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Friends/Social connections
CREATE TABLE user_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id CHAR(36) NOT NULL,
    connected_user_id CHAR(36) NOT NULL,
    connection_type VARCHAR(50) NOT NULL, -- friend, trader, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (connected_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (user_id, connected_user_id, connection_type),
    INDEX idx_user (user_id),
    INDEX idx_connected (connected_user_id),
    INDEX idx_type (connection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Direct trades between players
CREATE TABLE trades (
    id CHAR(36) PRIMARY KEY,
    initiator_id CHAR(36) NOT NULL,
    recipient_id CHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, cancelled, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (initiator_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    INDEX idx_initiator (initiator_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trade items
CREATE TABLE trade_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trade_id CHAR(36) NOT NULL,
    user_item_id CHAR(36) NOT NULL,
    offered_by CHAR(36) NOT NULL,
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    FOREIGN KEY (user_item_id) REFERENCES user_inventory(id),
    FOREIGN KEY (offered_by) REFERENCES users(id),
    UNIQUE KEY unique_trade_item (trade_id, user_item_id),
    INDEX idx_trade (trade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Marketplace/Auction House listings
CREATE TABLE marketplace_listings (
    id CHAR(36) PRIMARY KEY,
    seller_id CHAR(36) NOT NULL,
    user_item_id CHAR(36) NOT NULL,
    price INT NOT NULL,
    listing_type VARCHAR(50) NOT NULL DEFAULT 'fixed', -- fixed, auction
    visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- public, clan_only
    clan_id CHAR(36), -- if clan_only
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, sold, cancelled, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    sold_at TIMESTAMP NULL,
    buyer_id CHAR(36),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (user_item_id) REFERENCES user_inventory(id),
    FOREIGN KEY (clan_id) REFERENCES clans(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    INDEX idx_visibility (visibility),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auction bids
CREATE TABLE auction_bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id CHAR(36) NOT NULL,
    bidder_id CHAR(36) NOT NULL,
    bid_amount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users(id),
    INDEX idx_listing (listing_id),
    INDEX idx_bidder (bidder_id),
    INDEX idx_amount (bid_amount DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY,
    sender_id CHAR(36) NOT NULL,
    recipient_id CHAR(36) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    INDEX idx_sender (sender_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_unread (recipient_id, is_read),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Application secrets and configuration
CREATE TABLE app_secrets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User sessions for auth
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Game links (for tracking which games users play)
CREATE TABLE user_games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id CHAR(36) NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    game_user_id VARCHAR(255),
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game (user_id, game_name),
    INDEX idx_user (user_id),
    INDEX idx_game (game_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
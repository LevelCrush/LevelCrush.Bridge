-- Add missing columns to users table for Dynasty Trader

-- Add discord columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS discord_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS discord_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS discord_avatar VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
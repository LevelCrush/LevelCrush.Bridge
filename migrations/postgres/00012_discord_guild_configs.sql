-- Discord bot guild configuration table
CREATE TABLE IF NOT EXISTS discord_guild_configs (
    guild_id VARCHAR(255) PRIMARY KEY,
    market_alerts_channel VARCHAR(255),
    death_announcements_channel VARCHAR(255),
    leaderboard_channel VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discord_guild_configs_channels 
ON discord_guild_configs(market_alerts_channel, death_announcements_channel, leaderboard_channel) 
WHERE market_alerts_channel IS NOT NULL 
   OR death_announcements_channel IS NOT NULL 
   OR leaderboard_channel IS NOT NULL;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_discord_guild_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discord_guild_configs_updated_at
BEFORE UPDATE ON discord_guild_configs
FOR EACH ROW
EXECUTE FUNCTION update_discord_guild_configs_updated_at();
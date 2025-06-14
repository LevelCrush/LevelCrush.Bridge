import { Pool } from 'pg';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

// In production, this should use the Dynasty Trader database
// For now, we'll use an in-memory store
const guildConfigs = new Map<string, GuildConfig>();

export interface GuildConfig {
  guild_id: string;
  market_alerts_channel?: string | null;
  death_announcements_channel?: string | null;
  leaderboard_channel?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Initialize database connection if available
let dbPool: Pool | null = null;

try {
  if (config.database.url) {
    dbPool = new Pool({
      connectionString: config.database.url,
    });
    
    // Create table if it doesn't exist
    dbPool.query(`
      CREATE TABLE IF NOT EXISTS discord_guild_configs (
        guild_id VARCHAR(255) PRIMARY KEY,
        market_alerts_channel VARCHAR(255),
        death_announcements_channel VARCHAR(255),
        leaderboard_channel VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(err => {
      logger.error('Failed to create guild configs table:', err);
    });
  }
} catch (error) {
  logger.warn('Database not available, using in-memory storage for guild configs');
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig | null> {
  // Try database first
  if (dbPool) {
    try {
      const result = await dbPool.query(
        'SELECT * FROM discord_guild_configs WHERE guild_id = $1',
        [guildId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Failed to fetch guild config from database:', error);
    }
  }

  // Fallback to in-memory
  return guildConfigs.get(guildId) || null;
}

export async function setGuildConfig(
  guildId: string, 
  configType: string, 
  value: string | null
): Promise<void> {
  const now = new Date();
  
  // Get existing config or create new one
  let config = await getGuildConfig(guildId) || {
    guild_id: guildId,
    market_alerts_channel: null,
    death_announcements_channel: null,
    leaderboard_channel: null,
    created_at: now,
    updated_at: now,
  };

  // Update the specific field
  switch (configType) {
    case 'market_alerts':
      config.market_alerts_channel = value;
      break;
    case 'death_announcements':
      config.death_announcements_channel = value;
      break;
    case 'leaderboard':
      config.leaderboard_channel = value;
      break;
    case 'all':
      // Reset all channels
      config.market_alerts_channel = null;
      config.death_announcements_channel = null;
      config.leaderboard_channel = null;
      break;
  }

  config.updated_at = now;

  // Save to database if available
  if (dbPool) {
    try {
      await dbPool.query(`
        INSERT INTO discord_guild_configs 
          (guild_id, market_alerts_channel, death_announcements_channel, leaderboard_channel, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (guild_id) DO UPDATE SET
          market_alerts_channel = EXCLUDED.market_alerts_channel,
          death_announcements_channel = EXCLUDED.death_announcements_channel,
          leaderboard_channel = EXCLUDED.leaderboard_channel,
          updated_at = EXCLUDED.updated_at
      `, [
        config.guild_id,
        config.market_alerts_channel,
        config.death_announcements_channel,
        config.leaderboard_channel,
        config.updated_at
      ]);
    } catch (error) {
      logger.error('Failed to save guild config to database:', error);
    }
  }

  // Always save to in-memory as well
  guildConfigs.set(guildId, config);
}

export async function getAllGuildConfigs(): Promise<GuildConfig[]> {
  const configs: GuildConfig[] = [];

  // Try database first
  if (dbPool) {
    try {
      const result = await dbPool.query('SELECT * FROM discord_guild_configs');
      configs.push(...result.rows);
    } catch (error) {
      logger.error('Failed to fetch all guild configs from database:', error);
    }
  }

  // Add any in-memory configs not in database
  for (const [guildId, config] of guildConfigs) {
    if (!configs.find(c => c.guild_id === guildId)) {
      configs.push(config);
    }
  }

  return configs;
}

// Get all guilds that have a specific channel type configured
export async function getGuildsWithChannel(channelType: 'market_alerts' | 'death_announcements' | 'leaderboard'): Promise<Map<string, string>> {
  const guildsMap = new Map<string, string>();
  const configs = await getAllGuildConfigs();

  for (const config of configs) {
    let channelId: string | null | undefined = null;
    
    switch (channelType) {
      case 'market_alerts':
        channelId = config.market_alerts_channel;
        break;
      case 'death_announcements':
        channelId = config.death_announcements_channel;
        break;
      case 'leaderboard':
        channelId = config.leaderboard_channel;
        break;
    }

    if (channelId) {
      guildsMap.set(config.guild_id, channelId);
    }
  }

  return guildsMap;
}
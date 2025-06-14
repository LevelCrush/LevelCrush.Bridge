import { Client, TextChannel } from 'discord.js';
import { dynastyTraderAPI } from './api.js';
import { createDeathEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { getGuildsWithChannel } from './guildConfig.js';

let deathWatchInterval: NodeJS.Timeout | null = null;
const announcedDeaths = new Set<string>();

export function startDeathWatcher(client: Client) {
  if (deathWatchInterval) {
    clearInterval(deathWatchInterval);
  }

  deathWatchInterval = setInterval(async () => {
    try {
      await checkForDeaths(client);
    } catch (error) {
      logger.error('Error in death watcher:', error);
    }
  }, config.game.deathCheckInterval);

  logger.info('Death watcher started');
}

async function checkForDeaths(client: Client) {
  // Get all guilds with death announcements configured
  const guildsWithAnnouncements = await getGuildsWithChannel('death_announcements');
  
  if (guildsWithAnnouncements.size === 0) {
    logger.debug('No guilds have death announcements configured');
    return;
  }

  try {
    const recentDeaths = await dynastyTraderAPI.getRecentDeaths(20);
    
    for (const death of recentDeaths) {
      // Skip if already announced
      if (announcedDeaths.has(death.id)) {
        continue;
      }

      // Skip deaths older than 5 minutes (on startup)
      const deathTime = new Date(death.death_date).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (deathTime < fiveMinutesAgo) {
        announcedDeaths.add(death.id);
        continue;
      }

      // Create and send embed
      const embed = createDeathEmbed(death);
      
      // Send to all configured channels
      for (const [guildId, channelId] of guildsWithAnnouncements) {
        try {
          const channel = client.channels.cache.get(channelId) as TextChannel;
          if (channel) {
            await channel.send({ embeds: [embed] });
          } else {
            logger.warn(`Death announcements channel ${channelId} not found for guild ${guildId}`);
          }
        } catch (error) {
          logger.error(`Failed to send death announcement to guild ${guildId}:`, error);
        }
      }
      
      // Mark as announced
      announcedDeaths.add(death.id);
      
      // Limit stored death IDs to prevent memory issues
      if (announcedDeaths.size > 1000) {
        const oldestIds = Array.from(announcedDeaths).slice(0, 500);
        oldestIds.forEach(id => announcedDeaths.delete(id));
      }
    }
  } catch (error) {
    logger.error('Error checking for deaths:', error);
  }
}

export function stopDeathWatcher() {
  if (deathWatchInterval) {
    clearInterval(deathWatchInterval);
    deathWatchInterval = null;
    logger.info('Death watcher stopped');
  }
}
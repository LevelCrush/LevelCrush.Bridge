import { Client, TextChannel } from 'discord.js';
import { dynastyTraderAPI } from './api.js';
import { createDeathEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

let deathWatchInterval: NodeJS.Timeout | null = null;
const announcedDeaths = new Set<string>();

export function startDeathWatcher(client: Client) {
  if (deathWatchInterval) {
    clearInterval(deathWatchInterval);
  }

  // Don't start if no channel configured
  if (!config.channels.deathAnnouncements) {
    logger.info('Death announcements channel not configured, skipping death watcher');
    return;
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
  const channel = client.channels.cache.get(config.channels.deathAnnouncements!) as TextChannel;
  if (!channel) {
    logger.warn('Death announcements channel not found');
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
      await channel.send({ embeds: [embed] });
      
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
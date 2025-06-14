import { Client, TextChannel } from 'discord.js';
import { dynastyTraderAPI } from './api.js';
import { createMarketEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { getGuildsWithChannel } from './guildConfig.js';

let marketWatchInterval: NodeJS.Timeout | null = null;
const previousPrices = new Map<string, Map<string, number>>();

export function startMarketWatcher(client: Client) {
  if (marketWatchInterval) {
    clearInterval(marketWatchInterval);
  }

  marketWatchInterval = setInterval(async () => {
    try {
      await checkMarketChanges(client);
    } catch (error) {
      logger.error('Error in market watcher:', error);
    }
  }, config.game.marketUpdateInterval);

  logger.info('Market watcher started');
}

async function checkMarketChanges(client: Client) {
  // Get all guilds with market alerts configured
  const guildsWithAlerts = await getGuildsWithChannel('market_alerts');
  
  if (guildsWithAlerts.size === 0) {
    logger.debug('No guilds have market alerts configured');
    return;
  }

  try {
    const regions = await dynastyTraderAPI.getRegions();
    
    for (const region of regions) {
      const stats = await dynastyTraderAPI.getMarketStats(region.id);
      
      // Check for significant volume changes
      const regionPrices = previousPrices.get(region.id) || new Map();
      const currentVolume = parseFloat(stats.total_volume_24h || '0');
      const previousVolume = regionPrices.get('volume') || currentVolume;
      
      const volumeChange = ((currentVolume - previousVolume) / previousVolume) * 100;
      
      // Alert on 20% volume change
      if (Math.abs(volumeChange) > 20 && previousVolume > 0) {
        const embed = createMarketEmbed(region, stats)
          .setTitle(`📊 Market Alert: ${region.name}`)
          .setDescription(`Significant volume change detected!`)
          .addFields({
            name: volumeChange > 0 ? '📈 Volume Surge' : '📉 Volume Drop',
            value: `${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)}% change in 24h volume`,
            inline: false
          });

        // Send to all configured channels
        for (const [guildId, channelId] of guildsWithAlerts) {
          try {
            const channel = client.channels.cache.get(channelId) as TextChannel;
            if (channel) {
              await channel.send({ embeds: [embed] });
            } else {
              logger.warn(`Market alerts channel ${channelId} not found for guild ${guildId}`);
            }
          } catch (error) {
            logger.error(`Failed to send market alert to guild ${guildId}:`, error);
          }
        }
      }

      // Update stored values
      regionPrices.set('volume', currentVolume);
      previousPrices.set(region.id, regionPrices);
    }

    // Check for market events
    const events = await dynastyTraderAPI.getMarketEvents();
    // TODO: Track and alert on new market events
    
  } catch (error) {
    logger.error('Error checking market changes:', error);
  }
}

export function stopMarketWatcher() {
  if (marketWatchInterval) {
    clearInterval(marketWatchInterval);
    marketWatchInterval = null;
    logger.info('Market watcher stopped');
  }
}
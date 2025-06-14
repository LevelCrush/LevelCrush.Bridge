import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { dynastyTraderAPI } from './api.js';
import { createLeaderboardEmbed, Colors } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { getGuildsWithChannel } from './guildConfig.js';

let leaderboardUpdateInterval: NodeJS.Timeout | null = null;
const lastLeaderboardMessages = new Map<string, string>(); // guildId -> messageId

export function startLeaderboardUpdater(client: Client) {
  if (leaderboardUpdateInterval) {
    clearInterval(leaderboardUpdateInterval);
  }

  // Initial update after 10 seconds
  setTimeout(() => updateLeaderboards(client), 10000);

  leaderboardUpdateInterval = setInterval(async () => {
    try {
      await updateLeaderboards(client);
    } catch (error) {
      logger.error('Error in leaderboard updater:', error);
    }
  }, config.game.leaderboardUpdateInterval || 300000); // 5 minutes default

  logger.info('Leaderboard updater started');
}

async function updateLeaderboards(client: Client) {
  // Get all guilds with leaderboard configured
  const guildsWithLeaderboard = await getGuildsWithChannel('leaderboard');
  
  if (guildsWithLeaderboard.size === 0) {
    logger.debug('No guilds have leaderboard configured');
    return;
  }

  try {
    // Fetch all three leaderboard types
    const [wealthLeaderboard, reputationLeaderboard, generationLeaderboard] = await Promise.all([
      dynastyTraderAPI.getLeaderboard('wealth', 10),
      dynastyTraderAPI.getLeaderboard('reputation', 10),
      dynastyTraderAPI.getLeaderboard('generation', 10),
    ]);

    // Create combined leaderboard embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Dynasty)
      .setTitle('🏆 Dynasty Trader Leaderboards')
      .setDescription('Top dynasties across all servers')
      .setTimestamp()
      .setFooter({ text: 'Updates every 5 minutes' });

    // Add wealth leaderboard
    if (wealthLeaderboard.length > 0) {
      const wealthList = wealthLeaderboard.slice(0, 5).map((entry: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `${medal} **${entry.name}** - ${parseFloat(entry.wealth).toLocaleString()} gold`;
      }).join('\n');
      
      embed.addFields({
        name: '💰 Wealthiest Dynasties',
        value: wealthList || 'No dynasties yet',
        inline: false
      });
    }

    // Add reputation leaderboard
    if (reputationLeaderboard.length > 0) {
      const repList = reputationLeaderboard.slice(0, 5).map((entry: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `${medal} **${entry.name}** - ${entry.reputation} rep`;
      }).join('\n');
      
      embed.addFields({
        name: '⭐ Most Reputable',
        value: repList || 'No dynasties yet',
        inline: false
      });
    }

    // Add generation leaderboard
    if (generationLeaderboard.length > 0) {
      const genList = generationLeaderboard.slice(0, 5).map((entry: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `${medal} **${entry.name}** - Gen ${entry.highest_generation}`;
      }).join('\n');
      
      embed.addFields({
        name: '👥 Longest Lineages',
        value: genList || 'No dynasties yet',
        inline: false
      });
    }

    // Send to all configured channels
    for (const [guildId, channelId] of guildsWithLeaderboard) {
      try {
        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel) {
          logger.warn(`Leaderboard channel ${channelId} not found for guild ${guildId}`);
          continue;
        }

        // Try to update existing message or send new one
        const lastMessageId = lastLeaderboardMessages.get(guildId);
        
        if (lastMessageId) {
          try {
            const message = await channel.messages.fetch(lastMessageId);
            await message.edit({ embeds: [embed] });
            logger.debug(`Updated leaderboard message in guild ${guildId}`);
          } catch (error) {
            // Message not found or can't edit, send new one
            const newMessage = await channel.send({ embeds: [embed] });
            lastLeaderboardMessages.set(guildId, newMessage.id);
            logger.debug(`Sent new leaderboard message in guild ${guildId}`);
          }
        } else {
          // First time, send new message
          const newMessage = await channel.send({ embeds: [embed] });
          lastLeaderboardMessages.set(guildId, newMessage.id);
          logger.debug(`Sent initial leaderboard message in guild ${guildId}`);
        }
      } catch (error) {
        logger.error(`Failed to update leaderboard in guild ${guildId}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error fetching leaderboard data:', error);
  }
}

export function stopLeaderboardUpdater() {
  if (leaderboardUpdateInterval) {
    clearInterval(leaderboardUpdateInterval);
    leaderboardUpdateInterval = null;
    logger.info('Leaderboard updater stopped');
  }
}
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../types/index.js';
import { dynastyTraderAPI } from '../services/api.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// In production, this should be stored in a database
const oauthStates = new Map<string, { discordId: string; timestamp: number }>();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to Dynasty Trader'),

  async execute(interaction: CommandInteraction) {
    try {
      // Check if already linked
      try {
        const user = await dynastyTraderAPI.getUserByDiscordId(interaction.user.id);
        if (user) {
          const embed = createErrorEmbed('Your Discord account is already linked to Dynasty Trader!');
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
      } catch (error: any) {
        // 404 is expected if not linked
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      // Generate OAuth2 state
      const state = crypto.randomBytes(32).toString('hex');
      oauthStates.set(state, {
        discordId: interaction.user.id,
        timestamp: Date.now(),
      });

      // Clean up old states (older than 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      for (const [key, value] of oauthStates.entries()) {
        if (value.timestamp < tenMinutesAgo) {
          oauthStates.delete(key);
        }
      }

      // Build OAuth2 URL
      const baseUrl = process.env.DYNASTY_TRADER_WEB_URL || 'http://localhost:5173';
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: 'discord-bot',
        redirect_uri: process.env.OAUTH2_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
        state,
        scope: 'profile',
      });

      const authUrl = `${baseUrl}/auth/discord?${params.toString()}`;

      const embed = createSuccessEmbed(
        'Link Your Account',
        `Click the link below to connect your Discord account to Dynasty Trader:\n\n[🔗 Link Account](${authUrl})\n\nThis link will expire in 10 minutes.`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error in link command:', error);
      const embed = createErrorEmbed('An error occurred while generating the link. Please try again later.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;

// Export for use in OAuth callback handler
export { oauthStates };
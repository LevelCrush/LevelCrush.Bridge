import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/index.js';
import { createSuccessEmbed, createErrorEmbed, Colors } from '../utils/embeds.js';
import { dynastyTraderAPI } from '../services/api.js';
import { logger } from '../utils/logger.js';
import * as crypto from 'crypto';

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

      // Generate a secure state token
      const state = crypto.randomBytes(32).toString('hex');
      
      // Build the link URL
      const frontendUrl = process.env.DYNASTY_TRADER_FRONTEND_URL || 'http://localhost:3000';
      const params = new URLSearchParams({
        discord_id: interaction.user.id,
        discord_username: interaction.user.username,
        state: state
      });
      
      const linkUrl = `${frontendUrl}/discord-link?${params.toString()}`;

      // Create the embed with the direct link
      const embed = new EmbedBuilder()
        .setColor(Colors.Info)
        .setTitle('🔗 Link Your Discord Account')
        .setDescription('Click the button below to link your Discord account to Dynasty Trader!')
        .addFields(
          {
            name: '📱 Quick Link',
            value: `[Click here to link your account](${linkUrl})`,
            inline: false
          },
          {
            name: '📝 Your Discord Info',
            value: `**Username:** ${interaction.user.username}\n**ID:** \`${interaction.user.id}\``,
            inline: false
          }
        )
        .setFooter({ 
          text: 'This link will expire in 10 minutes' 
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error in link command:', error);
      const embed = createErrorEmbed('An error occurred while checking your link status. Please try again later.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
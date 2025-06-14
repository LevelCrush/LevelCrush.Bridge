import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../types/index.js';
import { dynastyTraderAPI } from '../services/api.js';
import { createDynastyEmbed, createLeaderboardEmbed, createErrorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('dynasty')
    .setDescription('View dynasty information')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View dynasty information')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Dynasty name to look up')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View dynasty leaderboards')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Leaderboard type')
            .setRequired(false)
            .addChoices(
              { name: 'Wealth', value: 'wealth' },
              { name: 'Reputation', value: 'reputation' },
              { name: 'Generation', value: 'generation' }
            )
        )
    ),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'info': {
          const dynastyName = interaction.options.getString('name');
          
          let dynasty;
          if (dynastyName) {
            // TODO: Implement dynasty search by name
            const embed = createErrorEmbed('Dynasty search by name is not yet implemented. Please link your account with `/link` to view your dynasty.');
            return interaction.editReply({ embeds: [embed] });
          } else {
            // Get user's own dynasty
            try {
              const user = await dynastyTraderAPI.getUserByDiscordId(interaction.user.id);
              dynasty = await dynastyTraderAPI.getDynastyByUserId(user.id);
            } catch (error: any) {
              if (error.response?.status === 404) {
                const embed = createErrorEmbed('You need to link your Discord account first. Use `/link` to get started.');
                return interaction.editReply({ embeds: [embed] });
              }
              throw error;
            }
          }

          if (!dynasty) {
            const embed = createErrorEmbed('Dynasty not found.');
            return interaction.editReply({ embeds: [embed] });
          }

          const embed = createDynastyEmbed(dynasty);
          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'leaderboard': {
          const type = (interaction.options.getString('type') || 'wealth') as 'wealth' | 'reputation' | 'generation';
          const leaderboard = await dynastyTraderAPI.getLeaderboard(type, 10);
          
          const embed = createLeaderboardEmbed(type, leaderboard);
          await interaction.editReply({ embeds: [embed] });
          break;
        }

        default:
          const embed = createErrorEmbed('Unknown subcommand');
          await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error in dynasty command:', error);
      const embed = createErrorEmbed('An error occurred while fetching dynasty data. Please try again later.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
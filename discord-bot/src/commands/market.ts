import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../types/index.js';
import { dynastyTraderAPI } from '../services/api.js';
import { createMarketEmbed, createErrorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Get market information')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Get market status for a region')
        .addStringOption(option =>
          option
            .setName('region')
            .setDescription('The region to check')
            .setRequired(false)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('regions')
        .setDescription('List all available market regions')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('events')
        .setDescription('View active market events')
    ),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'status': {
          const regionName = interaction.options.getString('region');
          const regions = await dynastyTraderAPI.getRegions();
          
          let region;
          if (regionName) {
            region = regions.find(r => 
              r.name.toLowerCase() === regionName.toLowerCase()
            );
            if (!region) {
              const embed = createErrorEmbed(`Region "${regionName}" not found. Use \`/market regions\` to see available regions.`);
              return interaction.editReply({ embeds: [embed] });
            }
          } else {
            // Default to Capital City
            region = regions.find(r => r.is_capital) || regions[0];
          }

          const stats = await dynastyTraderAPI.getMarketStats(region.id);
          const embed = createMarketEmbed(region, stats);
          
          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'regions': {
          const regions = await dynastyTraderAPI.getRegions();
          const regionList = regions.map(r => {
            const capital = r.is_capital ? ' 👑' : '';
            return `**${r.name}${capital}** - Safety: ${r.safety_level}%, Tax: ${(parseFloat(r.tax_rate) * 100).toFixed(1)}%`;
          }).join('\n');

          await interaction.editReply({
            content: `**🗺️ Available Market Regions**\n\n${regionList}`,
          });
          break;
        }

        case 'events': {
          const events = await dynastyTraderAPI.getMarketEvents();
          
          if (events.length === 0) {
            await interaction.editReply({
              content: '📊 No active market events at this time.',
            });
            break;
          }

          const eventList = events.slice(0, 5).map(event => {
            const modifier = event.price_modifier > 1 
              ? `📈 +${((event.price_modifier - 1) * 100).toFixed(0)}%`
              : `📉 -${((1 - event.price_modifier) * 100).toFixed(0)}%`;
            
            return `**${event.title}** ${modifier}\n${event.description}`;
          }).join('\n\n');

          await interaction.editReply({
            content: `**🎯 Active Market Events**\n\n${eventList}`,
          });
          break;
        }

        default:
          const embed = createErrorEmbed('Unknown subcommand');
          await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error in market command:', error);
      const embed = createErrorEmbed('An error occurred while fetching market data. Please try again later.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
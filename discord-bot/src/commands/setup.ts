import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types/index.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { getGuildConfig, setGuildConfig } from '../services/guildConfig.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure Dynasty Trader bot for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set up notification channels')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('The type of channel to configure')
            .setRequired(true)
            .addChoices(
              { name: 'Market Alerts', value: 'market_alerts' },
              { name: 'Death Announcements', value: 'death_announcements' },
              { name: 'Leaderboard Updates', value: 'leaderboard' }
            )
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to use for notifications')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current bot configuration')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset bot configuration for this server')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('The type of configuration to reset')
            .setRequired(false)
            .addChoices(
              { name: 'Market Alerts', value: 'market_alerts' },
              { name: 'Death Announcements', value: 'death_announcements' },
              { name: 'Leaderboard Updates', value: 'leaderboard' },
              { name: 'All Settings', value: 'all' }
            )
        )
    ),

  async execute(interaction: CommandInteraction) {
    // Only works in guilds
    if (!interaction.guild) {
      const embed = createErrorEmbed('This command can only be used in a server.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      const embed = createErrorEmbed('You need Administrator permissions to use this command.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'channel': {
          const channelType = interaction.options.getString('type', true);
          const channel = interaction.options.getChannel('channel', true);

          // Verify the bot can send messages in the channel
          if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
            const permissions = channel.permissionsFor(interaction.client.user!);
            if (!permissions?.has(['SendMessages', 'EmbedLinks'])) {
              const embed = createErrorEmbed(
                `I don't have permission to send messages in ${channel}. Please grant me "Send Messages" and "Embed Links" permissions.`
              );
              return interaction.reply({ embeds: [embed], ephemeral: true });
            }
          }

          // Save the configuration
          await setGuildConfig(interaction.guild.id, channelType, channel.id);

          const embed = createSuccessEmbed(
            'Channel Configured',
            `${getChannelTypeDisplay(channelType)} will now be posted in ${channel}.`
          );

          await interaction.reply({ embeds: [embed] });

          // Send a test message to the channel
          try {
            const testEmbed = createSuccessEmbed(
              'Channel Configured',
              `This channel will now receive ${getChannelTypeDisplay(channelType).toLowerCase()}.`
            );
            await (channel as any).send({ embeds: [testEmbed] });
          } catch (error) {
            logger.error('Failed to send test message:', error);
          }

          break;
        }

        case 'view': {
          const config = await getGuildConfig(interaction.guild.id);
          
          if (!config || (!config.market_alerts_channel && !config.death_announcements_channel && !config.leaderboard_channel)) {
            const embed = createErrorEmbed('No channels have been configured yet. Use `/setup channel` to get started.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          let description = '**Current Configuration:**\n\n';

          if (config.market_alerts_channel) {
            description += `📊 **Market Alerts:** <#${config.market_alerts_channel}>\n`;
          } else {
            description += '📊 **Market Alerts:** Not configured\n';
          }

          if (config.death_announcements_channel) {
            description += `⚰️ **Death Announcements:** <#${config.death_announcements_channel}>\n`;
          } else {
            description += '⚰️ **Death Announcements:** Not configured\n';
          }

          if (config.leaderboard_channel) {
            description += `🏆 **Leaderboard Updates:** <#${config.leaderboard_channel}>\n`;
          } else {
            description += '🏆 **Leaderboard Updates:** Not configured\n';
          }

          const embed = createSuccessEmbed('Bot Configuration', description);
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'reset': {
          const resetType = interaction.options.getString('type') || 'all';

          if (resetType === 'all') {
            await setGuildConfig(interaction.guild.id, 'all', null);
            const embed = createSuccessEmbed(
              'Configuration Reset',
              'All bot configuration has been reset for this server.'
            );
            await interaction.reply({ embeds: [embed] });
          } else {
            await setGuildConfig(interaction.guild.id, resetType, null);
            const embed = createSuccessEmbed(
              'Configuration Reset',
              `${getChannelTypeDisplay(resetType)} configuration has been reset.`
            );
            await interaction.reply({ embeds: [embed] });
          }
          break;
        }

        default:
          const embed = createErrorEmbed('Unknown subcommand');
          await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      logger.error('Error in setup command:', error);
      const embed = createErrorEmbed('An error occurred while updating configuration. Please try again later.');
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};

function getChannelTypeDisplay(type: string): string {
  switch (type) {
    case 'market_alerts':
      return 'Market Alerts';
    case 'death_announcements':
      return 'Death Announcements';
    case 'leaderboard':
      return 'Leaderboard Updates';
    default:
      return 'Unknown';
  }
}

export default command;
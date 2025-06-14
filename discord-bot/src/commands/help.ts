import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/index.js';
import { Colors } from '../utils/embeds.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with Dynasty Trader bot commands'),

  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Info)
      .setTitle('🤖 Dynasty Trader Bot Help')
      .setDescription('Welcome to Dynasty Trader - a roguelike economy game where death drives markets!')
      .addFields(
        {
          name: '🔧 Setup (Admin Only)',
          value: '`/setup channel` - Configure notification channels\n' +
                '`/setup view` - View current configuration\n' +
                '`/setup reset` - Reset bot configuration',
          inline: false
        },
        {
          name: '🔗 Account',
          value: '`/link` - Link your Discord to Dynasty Trader\n' +
                '`/ping` - Check bot responsiveness',
          inline: false
        },
        {
          name: '📊 Market',
          value: '`/market status [region]` - View market statistics\n' +
                '`/market regions` - List all trading regions\n' +
                '`/market events` - View active market events',
          inline: false
        },
        {
          name: '🏛️ Dynasty',
          value: '`/dynasty info` - View your dynasty info\n' +
                '`/dynasty leaderboard [type]` - View top dynasties',
          inline: false
        },
        {
          name: '👤 Character',
          value: '`/character info [name]` - View character details\n' +
                '`/character list` - List all your characters\n' +
                '`/character inventory` - View character inventory',
          inline: false
        },
        {
          name: '💰 Trading',
          value: '`/trade sell` - Create a market listing\n' +
                '`/trade buy` - Purchase from the market\n' +
                '`/trade cancel` - Cancel your listing\n' +
                '`/trade listings` - View your active listings',
          inline: false
        },
        {
          name: '📢 Automatic Notifications',
          value: '• **Market Alerts** - Major price/volume changes\n' +
                '• **Death Announcements** - Character deaths with market impact\n' +
                '• **Leaderboards** - Updated every 5 minutes\n\n' +
                '*Server admins must use `/setup channel` to enable these*',
          inline: false
        },
        {
          name: '🎮 Getting Started',
          value: '1. Play Dynasty Trader at https://dynastytrader.com\n' +
                '2. Use `/link` to connect your accounts\n' +
                '3. Start trading and building your dynasty!\n' +
                '4. (Admins) Use `/setup channel` to enable notifications',
          inline: false
        }
      )
      .setFooter({ text: 'Dynasty Trader - Build your trading empire across generations' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
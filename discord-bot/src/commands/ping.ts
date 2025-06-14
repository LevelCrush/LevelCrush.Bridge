import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../types/index.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is responsive'),

  async execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({ 
      content: 'Pinging...', 
      fetchReply: true 
    });

    if ('createdTimestamp' in sent) {
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(
        `🏓 Pong! Latency is ${latency}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms.`
      );
    }
  },
};

export default command;
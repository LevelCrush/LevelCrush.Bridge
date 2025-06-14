import { Interaction } from 'discord.js';
import { ExtendedClient } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embeds.js';

export default {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      logger.debug(`Executing command: ${interaction.commandName}`, {
        user: interaction.user.tag,
        guild: interaction.guild?.name,
      });

      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);

      const embed = createErrorEmbed('There was an error while executing this command!');
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
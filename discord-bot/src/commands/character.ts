import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../types/index.js';
import { dynastyTraderAPI } from '../services/api.js';
import { createCharacterEmbed, createErrorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('View character information')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View character information')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Character name (defaults to your active character)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your characters')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('View character inventory')
    ),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      // @ts-ignore - Discord.js types issue with subcommands
      const subcommand = interaction.options.getSubcommand();

      // Get user info
      let user;
      let dynasty;
      try {
        user = await dynastyTraderAPI.getUserByDiscordId(interaction.user.id);
        dynasty = await dynastyTraderAPI.getDynastyByUserId(user.id);
      } catch (error: any) {
        if (error.response?.status === 404) {
          const embed = createErrorEmbed('You need to link your Discord account first. Use `/link` to get started.');
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        throw error;
      }

      switch (subcommand) {
        case 'info': {
          // @ts-ignore - Discord.js types issue with subcommands
          const characterName = interaction.options.getString('name');
          const characters = await dynastyTraderAPI.getCharacters(dynasty.id);
          
          let character;
          if (characterName) {
            character = characters.find(c => 
              c.name.toLowerCase() === characterName.toLowerCase()
            );
            if (!character) {
              const embed = createErrorEmbed(`Character "${characterName}" not found in your dynasty.`);
              await interaction.editReply({ embeds: [embed] });
          return;
            }
          } else {
            // Get first alive character
            character = characters.find(c => c.is_alive);
            if (!character) {
              const embed = createErrorEmbed('You have no living characters. Create one in the game!');
              await interaction.editReply({ embeds: [embed] });
          return;
            }
          }

          // Get region info if character has location
          let region;
          if (character.location_id) {
            const regions = await dynastyTraderAPI.getRegions();
            region = regions.find(r => r.id === character.location_id);
          }

          const embed = createCharacterEmbed(character, region);
          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'list': {
          const characters = await dynastyTraderAPI.getCharacters(dynasty.id);
          
          if (characters.length === 0) {
            const embed = createErrorEmbed('You have no characters. Create one in the game!');
            await interaction.editReply({ embeds: [embed] });
          return;
          }

          const livingChars = characters.filter(c => c.is_alive);
          const deadChars = characters.filter(c => !c.is_alive);

          let message = `**${dynasty.name} Characters**\n\n`;

          if (livingChars.length > 0) {
            message += '**Living Characters:**\n';
            message += livingChars.map(c => `• ${c.name} (Gen ${c.generation})`).join('\n');
          }

          if (deadChars.length > 0) {
            if (livingChars.length > 0) message += '\n\n';
            message += '**Deceased Characters:**\n';
            message += deadChars.slice(0, 5).map(c => `• ${c.name} (Gen ${c.generation}) 💀`).join('\n');
            if (deadChars.length > 5) {
              message += `\n...and ${deadChars.length - 5} more`;
            }
          }

          await interaction.editReply({ content: message });
          break;
        }

        case 'inventory': {
          const characters = await dynastyTraderAPI.getCharacters(dynasty.id);
          const character = characters.find(c => c.is_alive);
          
          if (!character) {
            const embed = createErrorEmbed('You have no living characters. Create one in the game!');
            await interaction.editReply({ embeds: [embed] });
          return;
          }

          const inventory = await dynastyTraderAPI.getCharacterInventory(character.id);
          
          if (!inventory || inventory.items.length === 0) {
            await interaction.editReply({
              content: `**${character.name}'s Inventory**\n\n📦 No items in inventory.`
            });
            break;
          }

          const itemList = inventory.items.slice(0, 10).map((item: any) => {
            const value = parseFloat(item.acquired_price) * item.quantity;
            return `• **${item.item_name || 'Unknown Item'}** x${item.quantity} (${value.toFixed(0)} gold)`;
          }).join('\n');

          let message = `**${character.name}'s Inventory**\n\n${itemList}`;
          
          if (inventory.items.length > 10) {
            message += `\n...and ${inventory.items.length - 10} more items`;
          }

          message += `\n\n💰 **Total Value:** ${inventory.total_value.toLocaleString()} gold`;
          message += `\n📦 **Capacity:** ${inventory.used_capacity}/${inventory.max_capacity}`;

          await interaction.editReply({ content: message });
          break;
        }

        default:
          const embed = createErrorEmbed('Unknown subcommand');
          await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error in character command:', error);
      const embed = createErrorEmbed('An error occurred while fetching character data. Please try again later.');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
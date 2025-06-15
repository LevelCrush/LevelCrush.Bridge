import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types/index.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { Pool } from 'pg';
import { config } from '../config/config.js';

// Database connection for manual linking
let dbPool: Pool | null = null;

try {
  if (config.database.url) {
    dbPool = new Pool({
      connectionString: config.database.url,
    });
  }
} catch (error) {
  logger.warn('Database not available for admin-link command');
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('admin-link')
    .setDescription('(Admin) Manually link a Discord account to a Dynasty Trader user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The Discord user to link')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('email')
        .setDescription('The Dynasty Trader account email')
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    // Check if database is available
    if (!dbPool) {
      const embed = createErrorEmbed('Database connection not available. Cannot link accounts.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // @ts-ignore - Discord.js types issue
      const discordUser = interaction.options.getUser('user');
      // @ts-ignore - Discord.js types issue
      const email = interaction.options.getString('email');

      // Find the Dynasty Trader user by email
      const userResult = await dbPool.query(
        'SELECT id, email, discord_id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        const embed = createErrorEmbed(`No Dynasty Trader account found with email: ${email}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const user = userResult.rows[0];

      // Check if already linked
      if (user.discord_id) {
        if (user.discord_id === discordUser.id) {
          const embed = createErrorEmbed('This account is already linked to this Discord user.');
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        } else {
          const embed = createErrorEmbed(`This Dynasty Trader account is already linked to another Discord user (ID: ${user.discord_id}).`);
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
      }

      // Check if Discord ID is already linked to another account
      const existingLink = await dbPool.query(
        'SELECT email FROM users WHERE discord_id = $1',
        [discordUser.id]
      );

      if (existingLink.rows.length > 0) {
        const embed = createErrorEmbed(`This Discord user is already linked to another Dynasty Trader account (${existingLink.rows[0].email}).`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Link the accounts
      await dbPool.query(
        'UPDATE users SET discord_id = $1 WHERE id = $2',
        [discordUser.id, user.id]
      );

      const embed = createSuccessEmbed(
        'Account Linked Successfully',
        `Discord user ${discordUser.tag} (${discordUser.id}) has been linked to Dynasty Trader account ${email}.`
      );

      await interaction.reply({ embeds: [embed] });

      logger.info(`Admin ${interaction.user.tag} linked Discord user ${discordUser.id} to Dynasty Trader account ${email}`);
    } catch (error) {
      logger.error('Error in admin-link command:', error);
      const embed = createErrorEmbed('An error occurred while linking the account. Please check the logs.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
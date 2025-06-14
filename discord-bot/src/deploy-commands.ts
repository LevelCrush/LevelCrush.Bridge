import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    
    if (command.default && 'data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
      logger.info(`Loaded command: ${command.default.data.name}`);
    } else {
      logger.warn(`Command file ${file} is missing required exports`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy commands globally
    const data = await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commands },
    ) as any[];

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    logger.error('Error deploying commands:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands().then(() => {
    logger.info('Command deployment complete');
    process.exit(0);
  });
}

export { deployCommands };
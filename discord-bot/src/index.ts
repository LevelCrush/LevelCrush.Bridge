import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { ExtendedClient, Command } from './types/index.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { deployCommands } from './deploy-commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ExtendedClient;

// Initialize commands collection
client.commands = new Collection<string, Command>();

// Load commands
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    
    if (command.default && 'data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      logger.info(`Loaded command: ${command.default.data.name}`);
    } else {
      logger.warn(`Command file ${file} is missing required exports`);
    }
  }
}

// Load events
async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = await import(filePath);
    
    if (event.default && 'name' in event.default && 'execute' in event.default) {
      if (event.default.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args));
      } else {
        client.on(event.default.name, (...args) => event.default.execute(...args));
      }
      logger.info(`Loaded event: ${event.default.name}`);
    } else {
      logger.warn(`Event file ${file} is missing required exports`);
    }
  }
}

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  logger.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Start the bot
async function start() {
  try {
    logger.info('Starting Dynasty Trader Discord Bot...');
    
    // Deploy commands on startup in development mode
    if (process.env.NODE_ENV === 'development' || process.env.DEPLOY_COMMANDS_ON_START === 'true') {
      logger.info('Deploying slash commands...');
      try {
        await deployCommands();
        logger.info('Slash commands deployed successfully');
      } catch (error) {
        logger.error('Failed to deploy commands:', error);
        // Don't exit - commands might already be deployed
      }
    }
    
    await loadCommands();
    await loadEvents();
    
    await client.login(config.discord.token);
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

start();
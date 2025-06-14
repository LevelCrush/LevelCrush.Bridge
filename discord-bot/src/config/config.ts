import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    oauth2RedirectUri: process.env.OAUTH2_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
  },

  // Dynasty Trader API Configuration
  api: {
    baseUrl: process.env.DYNASTY_TRADER_API_URL || 'http://localhost:3113',
    apiKey: process.env.DYNASTY_TRADER_API_KEY,
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://timescale:timescale@localhost:5433/dynasty_trader',
  },

  // Channel Configuration
  channels: {
    marketAlerts: process.env.MARKET_ALERTS_CHANNEL_ID,
    deathAnnouncements: process.env.DEATH_ANNOUNCEMENTS_CHANNEL_ID,
    leaderboard: process.env.LEADERBOARD_CHANNEL_ID,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Game Configuration
  game: {
    marketUpdateInterval: 60000, // 1 minute
    deathCheckInterval: 30000, // 30 seconds
    leaderboardUpdateInterval: 300000, // 5 minutes
  },
};

// Validate required configuration
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please copy .env.example to .env and fill in the required values.');
  process.exit(1);
}
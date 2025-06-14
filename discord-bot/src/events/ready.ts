import { Client } from 'discord.js';
import { logger } from '../utils/logger.js';
import { startMarketWatcher } from '../services/marketWatcher.js';
import { startDeathWatcher } from '../services/deathWatcher.js';
import { startLeaderboardUpdater } from '../services/leaderboardUpdater.js';

export default {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    logger.info(`Bot is ready! Logged in as ${client.user?.tag}`);
    
    // Set bot status
    client.user?.setActivity('Dynasty Trader | /setup', { type: 3 }); // Type 3 = Watching

    // Start background services
    startMarketWatcher(client);
    startDeathWatcher(client);
    startLeaderboardUpdater(client);

    logger.info('Background services started');
  },
};
# Dynasty Trader Discord Bot

A Discord bot integration for Dynasty Trader - a roguelike economy game where death drives markets and players build multi-generational trading empires.

## Features

- **OAuth2 Integration**: Link Discord accounts with Dynasty Trader accounts
- **Market Alerts**: Real-time notifications for market events and price changes
- **Death Announcements**: Automatic notifications when characters die, showing market impact
- **Trading Commands**: Execute trades directly from Discord
- **Dynasty Leaderboards**: View top dynasties and their statistics
- **Character Info**: Check character stats, inventory, and location

## Setup

### Prerequisites

- Node.js 18+ and npm
- Dynasty Trader backend running
- Discord Developer Application

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/dynasty-trader.git
cd dynasty-trader/discord-bot
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up Discord Application
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to Bot section and create a bot
   - Copy the bot token to your .env file
   - Go to OAuth2 > URL Generator
   - Select scopes: bot, applications.commands
   - Select permissions: Send Messages, Embed Links, Read Message History
   - Use the generated URL to invite the bot to your server

5. Deploy slash commands
```bash
npm run deploy-commands
```

6. Start the bot
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Commands

### Setup Commands (Admin Only)
- `/setup channel <type> <channel>` - Configure notification channels
- `/setup view` - View current bot configuration
- `/setup reset [type]` - Reset bot configuration
- `/help` - Get help with bot commands

### Market Commands
- `/market status [region]` - Get current market status for a region
- `/market regions` - List all trading regions
- `/market events` - View active market events

### Character Commands
- `/character info [name]` - View character information
- `/character list` - List all your characters
- `/character inventory` - View character inventory

### Dynasty Commands
- `/dynasty info` - View your dynasty information
- `/dynasty leaderboard [type]` - Show top dynasties

### Account Commands
- `/link` - Link your Discord account to Dynasty Trader
- `/ping` - Check bot responsiveness

## Architecture

```
discord-bot/
├── src/
│   ├── commands/        # Slash command implementations
│   ├── events/          # Discord event handlers
│   ├── services/        # Business logic and API clients
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Bot entry point
├── config/              # Configuration files
└── tests/               # Test files
```

## Development

### Adding New Commands

1. Create a new file in `src/commands/`
2. Implement the command interface
3. Register the command in `src/deploy-commands.ts`
4. Add command logic

Example:
```typescript
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command'),
  
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Hello from Dynasty Trader!');
  }
};
```

### API Integration

The bot communicates with the Dynasty Trader backend API. All API calls should go through the service layer in `src/services/`.

### OAuth2 Flow

1. User runs `/link` command
2. Bot generates OAuth2 URL with state parameter
3. User authorizes on Dynasty Trader website
4. Dynasty Trader redirects back with auth code
5. Bot exchanges code for access token
6. Bot stores Discord ID <-> Dynasty Trader account mapping

## Server Configuration

Unlike global environment variables, notification channels are configured per-server using the `/setup` command:

1. **Market Alerts** - Notifies when market volumes change by 20%+
2. **Death Announcements** - Announces character deaths with market impact
3. **Leaderboard Updates** - Posts top dynasties every 5 minutes

Server admins can use:
- `/setup channel <type> <channel>` - Configure a notification channel
- `/setup view` - See current configuration
- `/setup reset` - Reset configuration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DISCORD_TOKEN | Bot token from Discord | Yes |
| DISCORD_CLIENT_ID | Application client ID | Yes |
| DYNASTY_TRADER_API_URL | Backend API URL | Yes |
| DATABASE_URL | PostgreSQL connection string | No* |
| OAUTH2_REDIRECT_URI | OAuth2 callback URL | Yes |
| LOG_LEVEL | Logging level (debug/info/warn/error) | No |

*Database is optional - bot will use in-memory storage if not available

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
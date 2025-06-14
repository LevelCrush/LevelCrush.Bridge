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

### Market Commands
- `/market status [region]` - Get current market status for a region
- `/market prices <item> [region]` - Check item prices across regions
- `/market alerts` - Manage price alerts
- `/market events` - View active market events

### Character Commands
- `/character info [name]` - View character information
- `/character inventory [name]` - List character inventory
- `/character location [name]` - Check character location
- `/character travel <destination>` - Travel to another region

### Trading Commands
- `/trade sell <item> <quantity> <price> [region]` - List item on market
- `/trade buy <listing_id> <quantity>` - Purchase from market
- `/trade history` - View recent transactions
- `/trade cancel <listing_id>` - Cancel your listing

### Dynasty Commands
- `/dynasty info [name]` - View dynasty information
- `/dynasty leaderboard [type]` - Show top dynasties
- `/dynasty members` - List dynasty members

### Account Commands
- `/link` - Link your Discord account to Dynasty Trader
- `/unlink` - Unlink your Discord account
- `/profile` - View your linked profile

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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DISCORD_TOKEN | Bot token from Discord | Yes |
| DISCORD_CLIENT_ID | Application client ID | Yes |
| DYNASTY_TRADER_API_URL | Backend API URL | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| OAUTH2_REDIRECT_URI | OAuth2 callback URL | Yes |
| LOG_LEVEL | Logging level (debug/info/warn/error) | No |

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
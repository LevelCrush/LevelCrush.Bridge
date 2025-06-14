# Dynasty Trader Discord Bot Integration Guide

## Overview

The Dynasty Trader Discord Bot provides seamless integration between Discord and the Dynasty Trader game, allowing players to:
- Link their Discord accounts to their Dynasty Trader accounts
- Receive real-time market alerts and death announcements
- Execute trades and check character status from Discord
- View dynasty leaderboards and compete with others

## Architecture

```
Discord Bot <-> Dynasty Trader API <-> PostgreSQL Database
     |              |                         |
     v              v                         v
Discord API    WebSocket Events        TimescaleDB
```

## Setup Instructions

### 1. Backend Setup

First, ensure the Dynasty Trader backend has Discord support:

```bash
# Run the migration to add Discord ID column
cd /path/to/dynasty-trader
cargo run --bin migrate_postgres

# Start the backend with Discord endpoints enabled
cargo run
```

### 2. Discord Application Setup

1. Go to https://discord.com/developers/applications
2. Click "New Application" and name it "Dynasty Trader"
3. Go to the "Bot" section
4. Click "Add Bot"
5. Under "Token", click "Copy" and save it securely
6. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (if you want to sync Discord roles)
   - Message Content Intent (if you want prefix commands)

### 3. Bot Configuration

```bash
cd discord-bot
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
DYNASTY_TRADER_API_URL=http://localhost:3113
DATABASE_URL=postgresql://timescale:timescale@localhost:5433/dynasty_trader
OAUTH2_REDIRECT_URI=http://localhost:3113/api/v2/auth/discord/callback
```

### 4. Deploy Commands

```bash
npm run deploy-commands
```

### 5. Start the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## OAuth2 Flow

### Account Linking Process

1. User runs `/link` command in Discord
2. Bot generates unique state token and stores with Discord ID
3. Bot sends OAuth2 URL to user (ephemeral message)
4. User clicks link and authenticates with Dynasty Trader
5. Dynasty Trader backend validates and redirects to callback
6. Bot receives callback and links accounts

### Security Considerations

- State tokens expire after 10 minutes
- All OAuth2 URLs are sent as ephemeral messages
- Discord IDs are unique constraints in database
- Access tokens are never stored by the bot

## Available Commands

### Admin Commands
- `/setup channel <type> <channel>` - Configure notification channels
- `/setup view` - View current server configuration
- `/setup reset [type]` - Reset configuration
- `/help` - Get comprehensive help

### Public Commands
- `/ping` - Check bot responsiveness
- `/market status [region]` - View market status
- `/market regions` - List all trading regions
- `/market events` - View active market events
- `/dynasty leaderboard [type]` - View top dynasties

### Authenticated Commands
- `/link` - Link your Discord account
- `/dynasty info` - View your dynasty information
- `/character info [name]` - View character details
- `/character list` - List all your characters
- `/character inventory` - View character inventory

## Background Services

### Market Watcher
- Monitors significant market changes
- Alerts on 20%+ volume changes
- Posts to configured channel
- Runs every 60 seconds

### Death Watcher
- Monitors character deaths
- Posts announcements with market impact
- Shows wealth and affected regions
- Runs every 30 seconds

## Channel Configuration

Channels are configured per-server using the `/setup` command:

```
/setup channel type:Market Alerts channel:#market-alerts
/setup channel type:Death Announcements channel:#announcements
/setup channel type:Leaderboard Updates channel:#leaderboard
```

To view configuration:
```
/setup view
```

To reset:
```
/setup reset type:All Settings
```

### Configuration Storage

- Configurations are stored in the PostgreSQL database when available
- Falls back to in-memory storage if database is not configured
- Each server can have different channels configured
- Bot must have "Send Messages" and "Embed Links" permissions

## Permissions

The bot requires these Discord permissions:
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands
- Connect (for future voice features)

## Troubleshooting

### Bot Not Responding
1. Check bot is online in Discord
2. Verify slash commands are deployed
3. Check bot has permissions in channel
4. Review logs for errors

### Linking Issues
1. Ensure backend is running
2. Check OAuth2 redirect URI matches
3. Verify database has discord_id column
4. Check user isn't already linked

### Market Data Not Updating
1. Verify WebSocket connection
2. Check API endpoints are accessible
3. Review channel permissions
4. Check channel IDs in config

## Development

### Adding New Commands

1. Create command file in `src/commands/`
2. Implement Command interface
3. Export as default
4. Run `npm run deploy-commands`

### Testing

```bash
# Type checking
npx tsc --noEmit

# Run with debug logging
LOG_LEVEL=debug npm run dev
```

### API Integration

All API calls go through `src/services/api.ts`. To add new endpoints:

1. Add types to `src/types/index.ts`
2. Add method to `DynastyTraderAPI` class
3. Use in commands with error handling

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build and start
npm run build
pm2 start dist/index.js --name dynasty-trader-bot

# Save PM2 config
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Environment Variables

Never commit `.env` files. Use:
- Docker secrets
- Kubernetes secrets
- Environment variable services
- CI/CD secret management

## Monitoring

### Health Checks

The bot logs its status every 5 minutes. Monitor for:
- WebSocket disconnections
- API request failures
- Command execution errors
- Memory usage

### Metrics to Track

- Command usage frequency
- Response times
- Error rates
- Active linked users
- Market alert frequency

## Future Features

### Planned
- Trading commands (`/trade sell`, `/trade buy`)
- Price alerts (`/alert create`)
- Character travel (`/character travel`)
- Market predictions
- Dynasty alliances

### Considering
- Voice channel integration
- Mini-games in Discord
- Automated trading bots
- Cross-server tournaments
- NFT integration
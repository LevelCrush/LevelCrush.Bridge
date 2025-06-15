# Dynasty Trader Discord Integration Guide

## Overview

Dynasty Trader features a fully integrated Discord bot that allows players to trade, monitor markets, and manage their dynasties directly from Discord. This guide covers both the player experience and technical implementation details.

## Player Features

### Getting Started

1. **Link Your Account**
   - Navigate to Settings in the Dynasty Trader web app
   - Click "Link Discord Account"
   - Authorize the Dynasty Trader bot
   - Your Discord avatar and username will appear when linked

2. **Join a Discord Server**
   - The bot must be invited to your Discord server by an admin
   - Bot requires permissions: Send Messages, Embed Links, Read Message History
   - Use `/help` to see all available commands

### Trading Commands

Execute market trades without leaving Discord:

- **Sell Items**: `/trade sell <item> <quantity> <price> [duration]`
  - Example: `/trade sell "Iron Ore" 50 100 7`
  - Lists 50 Iron Ore at 100 gold each for 7 days

- **Buy Items**: `/trade buy <listing_id> [quantity]`
  - Example: `/trade buy 12345 10`
  - Purchases 10 items from listing #12345

- **Cancel Listings**: `/trade cancel <listing_id>`
  - Cancels your active market listing

- **View Listings**: `/trade listings [character]`
  - Shows all your active market listings

### Market Information

Stay informed about market conditions:

- **Market Status**: `/market status [region]`
  - Shows current prices, volume, and trends
  - Defaults to your character's current location

- **Regional Info**: `/market regions`
  - Lists all trading regions with tax rates

- **Market Events**: `/market events`
  - Shows active events affecting prices

### Character Management

- **Character Info**: `/character info [name]`
  - View stats, location, and inventory
  - Defaults to your active character

- **Character List**: `/character list`
  - Shows all your living characters

- **Inventory**: `/character inventory`
  - Displays your character's items

### Dynasty Features

- **Dynasty Info**: `/dynasty info`
  - Shows wealth, reputation, and statistics

- **Leaderboards**: `/dynasty leaderboard [type]`
  - View top dynasties by wealth or reputation

## Server Administration

### Bot Setup

Server admins can configure where the bot posts notifications:

1. **Initial Setup**: `/setup channel <type> <channel>`
   - Types: `market_alerts`, `death_announcements`, `leaderboards`
   - Example: `/setup channel market_alerts #trading-alerts`

2. **View Configuration**: `/setup view`
   - Shows all configured channels

3. **Reset Configuration**: `/setup reset [type]`
   - Removes channel configuration

### Notification Types

- **Market Alerts**: Triggers when regional volume changes by 20%+
- **Death Announcements**: Posts when characters die, showing market impact
- **Leaderboard Updates**: Posts top 10 dynasties every 5 minutes

## Technical Implementation

### Architecture

```
Frontend (React) <-> Backend (Rust) <-> Discord Bot (Node.js)
                          |
                     PostgreSQL
```

### OAuth2 Flow

1. User clicks "Link Discord" in web app
2. Frontend redirects to Discord OAuth2 URL
3. User authorizes Dynasty Trader bot
4. Discord redirects back with auth code
5. Backend exchanges code for Discord user info
6. Link is stored in database

### Bot Services

- **Command Handler**: Processes slash commands
- **Market Watcher**: Monitors price/volume changes
- **Death Announcer**: Listens for character deaths
- **Leaderboard Service**: Posts dynasty rankings
- **API Client**: Communicates with Dynasty Trader backend

### Database Schema

```sql
-- Discord user links
ALTER TABLE users ADD COLUMN discord_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN discord_username VARCHAR(255);
ALTER TABLE users ADD COLUMN discord_avatar VARCHAR(255);

-- Server configurations
CREATE TABLE discord_server_configs (
    guild_id VARCHAR(255) PRIMARY KEY,
    market_alerts_channel_id VARCHAR(255),
    death_announcements_channel_id VARCHAR(255),
    leaderboards_channel_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Security Considerations

- OAuth2 state parameter prevents CSRF attacks
- Discord IDs are unique and immutable
- One Discord account per Dynasty Trader account
- Bot tokens stored securely in environment variables
- API calls authenticated with JWT tokens

## Deployment

### Bot Deployment

1. **Create Discord Application**
   - Visit https://discord.com/developers/applications
   - Create new application and bot
   - Copy bot token

2. **Environment Variables**
   ```bash
   DISCORD_TOKEN=your-bot-token
   DISCORD_CLIENT_ID=your-client-id
   DYNASTY_TRADER_API_URL=https://api.dynastytrader.com
   DATABASE_URL=postgresql://...
   OAUTH2_REDIRECT_URI=https://dynastytrader.com/settings
   ```

3. **Deploy Commands**
   ```bash
   npm run deploy-commands
   ```

4. **Start Bot**
   ```bash
   npm run build
   npm start
   ```

### Monitoring

- Bot logs all commands and errors
- Market watcher tracks alert frequency
- Death announcer logs all announcements
- PostgreSQL stores historical data

## Troubleshooting

### Common Issues

1. **"Not Linked" Error**
   - User needs to link account in web app first
   - Check Settings page for link status

2. **Missing Permissions**
   - Bot needs Send Messages, Embed Links permissions
   - Admin must configure channels with `/setup`

3. **Command Not Found**
   - Run `npm run deploy-commands` to register
   - Check bot has applications.commands scope

4. **Market Data Outdated**
   - WebSocket may have disconnected
   - Bot automatically reconnects

### Debug Commands

- `/ping` - Check bot responsiveness
- `/link` - Get link to connect account
- `/help` - Show all available commands

## Future Enhancements

- Voice channel market updates
- DM notifications for personal trades
- Scheduled market reports
- Custom alert thresholds
- Multi-language support
- Mobile app with Discord integration

## Support

For issues or questions:
- Check `/help` command first
- Visit Dynasty Trader Discord server
- Submit issues on GitHub
- Email support@dynastytrader.com
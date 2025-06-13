# Web-Only & Discord Architecture for Roguelike Economy

## Architecture Overview

The game runs entirely in web browsers with Discord as a companion platform for notifications, trading, and community features.

## Technology Stack (Updated)

### Backend (Unchanged)
- **Rust + Axum**: Perfect for real-time trading and WebSocket connections
- **PostgreSQL + TimescaleDB**: Time-series market data
- **Redis**: Session management and real-time data
- **NATS**: Event streaming between services

### Frontend (Web-Only)
- **React + TypeScript**: Complex trading UI
- **Vite**: Fast build tooling and HMR
- **PWA**: Progressive Web App for mobile/desktop experience
- **IndexedDB**: Client-side caching for offline capability
- **WebSockets**: Real-time market updates
- **WebRTC**: P2P trading connections

### Discord Integration
- **Discord.js**: Bot framework for Node.js
- **Rust Discord Bot**: Alternative using Serenity
- **OAuth2**: Discord login integration
- **Webhooks**: Market alerts and notifications
- **Slash Commands**: In-Discord trading

## Web Client Architecture

### Progressive Web App Features
```typescript
// Service Worker for offline functionality
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('dynasty-trader-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/trading',
        '/dynasty',
        '/market-data',
        '/assets/core-bundle.js'
      ]);
    })
  );
});

// Background sync for trades
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncPendingTrades());
  }
});
```

### Client State Management
```typescript
// Zustand store for complex state
interface GameState {
  currentCharacter: Character | null;
  dynasty: Dynasty;
  marketData: MarketData;
  pendingTrades: Trade[];
  ghostMode: boolean;
}

const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set) => ({
        currentCharacter: null,
        dynasty: loadDynasty(),
        marketData: {},
        pendingTrades: [],
        ghostMode: false,
        
        // Actions
        die: () => set((state) => ({
          ghostMode: true,
          currentCharacter: null
        })),
        
        inherit: (heir: Character) => set((state) => ({
          currentCharacter: heir,
          ghostMode: false,
          dynasty: updateDynasty(state.dynasty, heir)
        }))
      }),
      {
        name: 'dynasty-storage',
        storage: createJSONStorage(() => localStorage)
      }
    )
  )
);
```

### Real-Time Market Connection
```typescript
// WebSocket manager for market data
class MarketConnection {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  
  connect() {
    this.ws = new WebSocket('wss://api.dynastytrader.com/markets');
    
    this.ws.on('message', (data: MarketUpdate) => {
      if (data.type === 'DEATH_EVENT') {
        // Someone died! Their goods flooding market
        showDeathNotification(data.trader, data.goods);
        updateLocalPrices(data.priceImpact);
      }
    });
  }
  
  // Auto-reconnect with exponential backoff
  private handleDisconnect() {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => this.connect(), delay);
  }
}
```

## Discord Bot Architecture

### Core Bot Structure
```typescript
// Discord.js bot for economy game
import { Client, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

// Slash commands
const commands = [
  {
    name: 'market',
    description: 'Check current market prices',
    options: [{
      name: 'item',
      type: 'STRING',
      description: 'Item to check price for',
      autocomplete: true
    }]
  },
  {
    name: 'dynasty',
    description: 'View your dynasty status'
  },
  {
    name: 'trade',
    description: 'Initiate a trade with another player',
    options: [{
      name: 'player',
      type: 'USER',
      description: 'Player to trade with',
      required: true
    }]
  },
  {
    name: 'ghost',
    description: 'Use your ghost market influence (if dead)'
  }
];
```

### Discord Features

#### 1. Market Alerts
```typescript
// Price alert system
class MarketAlertService {
  async checkAlerts() {
    const alerts = await db.getPriceAlerts();
    
    for (const alert of alerts) {
      const currentPrice = await market.getPrice(alert.itemId);
      
      if (alert.condition === 'ABOVE' && currentPrice > alert.threshold) {
        await discord.sendDM(alert.userId, {
          embed: {
            title: '📈 Price Alert!',
            description: `${alert.itemName} is now ${currentPrice}g`,
            color: 0x00ff00
          }
        });
      }
    }
  }
}
```

#### 2. Death Notifications
```typescript
// Global death announcements
client.on('TRADER_DEATH', async (death: DeathEvent) => {
  const channel = client.channels.cache.get(DEATH_CHANNEL_ID);
  
  await channel.send({
    embeds: [{
      title: '💀 A Trader Has Fallen!',
      description: `${death.traderName} of the ${death.dynastyName} dynasty has died`,
      fields: [
        { name: 'Age', value: `${death.age} years`, inline: true },
        { name: 'Cause', value: death.cause, inline: true },
        { name: 'Goods Lost', value: death.inventory.slice(0, 5).join('\n') },
        { name: 'Market Impact', value: '🔻 Prices dropping!' }
      ],
      color: 0xff0000,
      timestamp: new Date()
    }]
  });
});
```

#### 3. Trading via Discord
```typescript
// Discord-based trading
class DiscordTradeManager {
  async initiateTrade(initiator: User, target: User) {
    // Create private thread for negotiation
    const thread = await channel.threads.create({
      name: `trade-${initiator.id}-${target.id}`,
      autoArchiveDuration: 60,
      type: 'GUILD_PRIVATE_THREAD'
    });
    
    // Add both users
    await thread.members.add(initiator.id);
    await thread.members.add(target.id);
    
    // Send trade interface
    await thread.send({
      content: 'Trade initiated! Use the buttons below:',
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              customId: 'add_item',
              label: 'Add Item',
              style: 'PRIMARY'
            },
            {
              type: 'BUTTON',
              customId: 'confirm_trade',
              label: 'Confirm',
              style: 'SUCCESS'
            },
            {
              type: 'BUTTON',
              customId: 'cancel_trade',
              label: 'Cancel',
              style: 'DANGER'
            }
          ]
        }
      ]
    });
  }
}
```

#### 4. Dynasty Management
```typescript
// Dynasty commands in Discord
client.on('interactionCreate', async (interaction) => {
  if (interaction.commandName === 'dynasty') {
    const dynasty = await api.getDynasty(interaction.user.id);
    
    await interaction.reply({
      embeds: [{
        title: `🏛️ ${dynasty.name} Dynasty`,
        fields: [
          { name: 'Generations', value: dynasty.generations.toString(), inline: true },
          { name: 'Total Wealth', value: `${dynasty.totalWealth}g`, inline: true },
          { name: 'Reputation', value: dynasty.reputation, inline: true },
          { name: 'Current Trader', value: dynasty.currentTrader?.name || '💀 DEAD' },
          { name: 'Trade Routes', value: dynasty.routes.join(', ') || 'None' },
          { name: 'Allies', value: dynasty.allies.join(', ') || 'None' },
          { name: 'Enemies', value: dynasty.enemies.join(', ') || 'None' }
        ],
        thumbnail: { url: dynasty.crestUrl }
      }]
    });
  }
});
```

## Web + Discord Integration Flow

### 1. Authentication Flow
```mermaid
User -> Web App: Visit site
Web App -> User: Show login options
User -> Discord OAuth: Login with Discord
Discord OAuth -> Web App: Return user data
Web App -> API: Create/update user
API -> Web App: JWT token
Web App -> User: Logged in!
```

### 2. Cross-Platform Trading
```mermaid
Player A (Web) -> API: Initiate trade
API -> Discord Bot: Notify Player B
Player B (Discord) -> Discord Bot: Accept trade
Discord Bot -> API: Create trade session
API -> Web App: Open trade interface
Both Players -> API: Confirm trade
API -> Both: Execute trade
```

### 3. Death Event Flow
```mermaid
Web Game -> API: Character dies
API -> Market Service: Update prices
API -> Discord Bot: Announce death
Discord Bot -> Channel: Post death message
API -> Web Clients: Push market updates
Ghost Player -> Discord: Use ghost command
Discord Bot -> API: Execute ghost action
```

## PWA Features for Desktop Experience

### 1. Install Prompts
```typescript
// Prompt users to install PWA
let deferredPrompt: BeforeInstallPromptEvent;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button after 3 trades
  if (getUserTradeCount() >= 3) {
    showInstallButton();
  }
});
```

### 2. Native Features
```typescript
// File system access for save games
async function exportDynasty() {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'dynasty-backup.json',
    types: [{
      description: 'Dynasty Files',
      accept: { 'application/json': ['.json'] }
    }]
  });
  
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(dynastyData));
  await writable.close();
}

// Notifications
function notifyMarketCrash(item: string) {
  new Notification('Market Crash! 📉', {
    body: `${item} prices are plummeting!`,
    icon: '/icons/crash.png',
    badge: '/icons/badge.png',
    tag: 'market-alert',
    requireInteraction: true
  });
}
```

### 3. Offline Capabilities
```typescript
// Offline trade queue
class OfflineTradeQueue {
  async addTrade(trade: PendingTrade) {
    const db = await openDB('trades', 1);
    await db.add('pending', trade);
    
    // Register background sync
    await registration.sync.register('sync-trades');
  }
  
  async syncTrades() {
    const db = await openDB('trades', 1);
    const pending = await db.getAll('pending');
    
    for (const trade of pending) {
      try {
        await api.executeTrade(trade);
        await db.delete('pending', trade.id);
      } catch (error) {
        console.error('Trade sync failed:', error);
      }
    }
  }
}
```

## Performance Optimizations

### 1. Code Splitting
```typescript
// Lazy load heavy features
const MarketCharts = lazy(() => import('./components/MarketCharts'));
const DynastyTree = lazy(() => import('./components/DynastyTree'));
const GhostMode = lazy(() => import('./components/GhostMode'));
```

### 2. WebAssembly for Performance
```rust
// Rust compiled to WASM for market calculations
#[wasm_bindgen]
pub fn calculate_market_impact(
    death_inventory: &[Item],
    current_prices: &[Price]
) -> Vec<PriceImpact> {
    // Complex market calculations in WASM
    market::calculate_death_impact(death_inventory, current_prices)
}
```

### 3. Service Worker Caching
```typescript
// Intelligent caching strategy
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/market/historical')) {
    // Cache historical data aggressively
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open('market-data').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

## Security Considerations

### 1. Anti-Cheat for Web
- Server-authoritative gameplay
- Rate limiting on all endpoints
- Cryptographic signatures on trades
- Time-window validation
- Behavioral analysis for bot detection

### 2. Discord Security
- OAuth2 scopes limited to necessary permissions
- Trade confirmations require web app verification
- No sensitive data in Discord messages
- Encrypted communication between bot and API

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   CloudFlare    │     │  Discord Bot    │
│   (CDN + WAF)   │     │   (Node.js)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Web Client    │     │   Discord API   │
│  (React PWA)    │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│          Load Balancer (nginx)          │
└────────┬───────────────┬────────────────┘
         │               │
         ▼               ▼
┌─────────────┐  ┌──────────────┐
│  API Server │  │  API Server  │
│(Rust + Axum)│  │(Rust + Axum) │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────────────────────┐
│   PostgreSQL + TimescaleDB   │
│         Redis Cluster        │
└──────────────────────────────┘
```

This architecture provides a robust, scalable solution that works entirely in web browsers while leveraging Discord for community features and notifications.
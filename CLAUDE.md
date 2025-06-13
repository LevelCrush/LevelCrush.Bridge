# Dynasty Trader (formerly Bridge) - Project Context

## Project Evolution

This project is evolving from "Bridge" (a multi-game inventory system) into **Dynasty Trader** - a revolutionary roguelike economy game where death drives markets and players build multi-generational trading empires.

## Current Status

**Phase**: Frontend Development Active! 🚀
**Backend**: Migration complete - PostgreSQL/TimescaleDB with all core systems
**Frontend**: React PWA live with authentication, dynasty management, character creation, and market trading
**Architecture**: Rust/Axum backend + React frontend + PostgreSQL/TimescaleDB
**Next Steps**: Polish UI, add real-time WebSocket updates, implement death mechanics in frontend

## Quick Start

```bash
# Backend setup
cp .env.dynasty .env
cargo run --bin migrate_postgres
cargo run --bin dynasty-trader

# Frontend setup (in another terminal)
cd frontend/dynasty-trader
npm install
npm run dev

# Visit http://localhost:5173 to play!
```

## Architecture Overview

### Current Stack (Bridge)
- **Backend**: Rust + Axum 0.7
- **Database**: MariaDB with SQLx
- **Auth**: Email/password with JWT
- **Features**: Inventory, trading, clans, marketplace

### Current Stack (Dynasty Trader)
- **Backend**: Rust + Axum 0.7 ✅
- **Database**: PostgreSQL + TimescaleDB ✅
- **Frontend**: React PWA with TypeScript ✅
- **Styling**: Tailwind CSS with custom dark theme ✅
- **State**: TanStack Query + Zustand ✅
- **Auth**: JWT with persistent sessions ✅
- **Real-time**: WebSockets (backend ready, frontend pending)
- **Discord**: Bot planned for next phase

## Core Game Concepts

### Dynasty System
- Each player controls a dynasty across generations
- Characters age and eventually die (permadeath)
- Inheritance passes wealth/reputation to heirs
- Death events affect market prices

### Market Mechanics
- Regional markets (no global auction house)
- Real-time price fluctuations
- Supply/demand driven by player actions
- Ghost markets for post-death influence

### Roguelike Elements
- Procedural market events
- Permadeath with inheritance
- Risk/reward on trade routes
- Character aging affects abilities

## Development Roadmap

### ✅ Phase 1: Database Migration (Complete)
- [x] Migrate from MariaDB to PostgreSQL
- [x] Add TimescaleDB for market data
- [x] Create character/dynasty tables
- [x] Implement aging system

### ✅ Phase 2: Core Mechanics (Complete)
- [x] Character lifecycle (birth → death)
- [x] Inheritance system
- [x] Death market impacts
- [x] Basic ghost mechanics

### ✅ Phase 3: Market Systems (Complete)
- [x] Regional market separation
- [x] Price history tracking
- [x] WebSocket backend support
- [x] Market event system

### ✅ Phase 4: Frontend (Complete)
- [x] React PWA setup
- [x] Authentication flow
- [x] Dynasty management
- [x] Character creation & dashboard
- [x] Market interface with regions and listings
- [x] Real-time WebSocket integration
- [x] Death event notifications (toast)
- [x] Market visualizations (price charts, volume charts)
- [x] Loading skeletons for better UX
- [x] Market item detail modal
- [x] Mobile-optimized UI
- [x] PWA manifest and service worker

### Phase 5: Discord Bot (Upcoming)
- [ ] OAuth2 integration
- [ ] Market alerts
- [ ] Death announcements
- [ ] Trading commands

## Key Files & Directories

```
bridge/                          # Project root
├── src/                        # Rust backend
│   ├── models/                 # Domain models
│   │   ├── character.rs       # Character lifecycle ✅
│   │   ├── dynasty.rs         # Dynasty system ✅
│   │   └── market.rs          # Market mechanics ✅
│   ├── services/              
│   │   ├── death_service.rs   # Death handling ✅
│   │   └── market_service.rs  # Regional markets ✅
│   └── api/
│       └── websocket.rs       # Real-time updates ✅
├── frontend/
│   └── dynasty-trader/        # React PWA ✅
│       ├── src/
│       │   ├── pages/         # Auth, Dashboard, Character, Market
│       │   ├── services/      # API client services
│       │   ├── types/         # TypeScript interfaces
│       │   └── stores/        # Zustand state management
│       └── package.json       # Dependencies
├── migrations/
│   ├── mariadb/              # Legacy Bridge migrations
│   └── postgres/             # Dynasty Trader migrations ✅
├── discord-bot/              # Discord integration (planned)
└── docs/
    └── game-design/          # Comprehensive game design
```

## API Documentation

### Dynasty Trader API v2 (Active)

#### Authentication
- `POST /api/v2/auth/register` - Create new account
- `POST /api/v2/auth/login` - Login with email/password
- `POST /api/v2/auth/refresh` - Refresh access token

#### Dynasty Management
- `POST /api/v2/dynasties` - Create dynasty
- `GET /api/v2/dynasties/me` - Get user's dynasty
- `GET /api/v2/dynasties/:id` - Get dynasty by ID
- `GET /api/v2/dynasties/:id/stats` - Get dynasty statistics

#### Character System
- `POST /api/v2/characters` - Create character
- `GET /api/v2/characters` - Get dynasty characters
- `GET /api/v2/characters/:id` - Get character details
- `GET /api/v2/characters/:id/stats` - Get character stats (includes wealth)
- `POST /api/v2/characters/:id/death` - Process character death

#### Market System
- `GET /api/v2/market/regions` - List all regions
- `GET /api/v2/market/regions/:id/listings` - Get listings for region
- `GET /api/v2/market/regions/:id/stats` - Get market statistics
- `POST /api/v2/market/listings` - Create new listing
- `POST /api/v2/market/purchase` - Purchase from listing
- `GET /api/v2/market/events` - Get active market events

#### WebSocket
- `ws://localhost:3113/ws/market` - Real-time market updates
  - Subscribe to channels: `market:{region_id}`, `deaths`, `events`

### Legacy Bridge API (v1)
Still functional but deprecated - will be removed in future versions.

## Database Schema (PostgreSQL)

### Core Tables
- **users**: Authentication and user accounts
- **dynasties**: Player dynasties with reputation and wealth tracking
- **characters**: Individual characters with full stats (health, stamina, charisma, intelligence, luck)
- **character_deaths**: Death records affecting markets

### Market Tables
- **regions**: 8 trading regions with safety/prosperity levels
- **items**: Tradeable goods with categories and rarity
- **market_listings**: Active trades in regional markets
- **market_prices**: TimescaleDB hypertable for price history
- **market_events**: Dynamic events affecting prices

### Seeded Data
- 8 regions: Capital City, Northern Mines, Eastern Port, etc.
- Each region has unique tax rates and characteristics
- Safety levels affect trade route danger
- Prosperity levels influence market activity

## Testing Strategy

### Unit Tests
- Character aging mechanics
- Death and inheritance
- Market price calculations
- Dynasty progression

### Integration Tests
- Full character lifecycle
- Market event propagation
- WebSocket connections
- Discord bot commands

### Load Tests
- 10,000 concurrent traders
- Real-time market updates
- Death event processing
- Database performance

## Security Considerations

### New Attack Vectors
- Market manipulation via coordinated deaths
- Dynasty reputation exploits
- Ghost market abuse
- Time-based attacks on aging

### Mitigations
- Rate limiting on all actions
- Server-authoritative aging
- Cryptographic trade signatures
- Anti-bot behavioral analysis

## Backwards Compatibility

During migration, maintain full compatibility:
1. All Bridge APIs continue working
2. Gradual data migration
3. Feature flags for new systems
4. Dual-mode operation period

## Contributing

### For Bridge Features
Follow existing patterns in `src/`

### For Dynasty Trader Features
1. Read game design docs in `docs/game-design/`
2. Follow new patterns in character/dynasty modules
3. Ensure backwards compatibility
4. Add comprehensive tests

## References

### Game Design Documentation
- [Project Overview](docs/game-design/PROJECT_OVERVIEW.md)
- [Complete Recommendations](docs/game-design/recommendations-hybrid.md)
- [Migration Plan](docs/game-design/synthesis/bridge-migration-plan.md)
- [Web & Discord Architecture](docs/game-design/synthesis/web-discord-architecture.md)

### Quick Links
- Original Bridge features remain in existing files
- New Dynasty Trader code goes in new modules
- Frontend development starts fresh in `frontend/`
- Discord bot is separate Node.js project

## Environment Variables

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://timescale:timescale@localhost:5433/dynasty_trader
JWT_SECRET=your-secret-key-here

# Optional
HOST=127.0.0.1          # Server host (default: 127.0.0.1)
PORT=3113               # Server port (default: 3113)
RUST_LOG=debug          # Logging level
AGING_TASK_INTERVAL_HOURS=1  # Character aging frequency
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3113  # Backend API URL
```

This project is transitioning from a multi-game inventory bridge to a groundbreaking roguelike economy game. The existing codebase provides an excellent foundation that we're building upon rather than replacing.

## Known Issues & Recent Fixes

### Fixed Issues ✅
- **Character wealth showing as NaN** - Fixed by aligning TypeScript interfaces with backend models
- **No regions available for trading** - Fixed by creating seed migration with 8 regions
- **Market stats showing NaN for average_transaction_value** - Fixed by updating MarketStats interface to match backend (removed non-existent field)
- **Double API path issue (/api/v2/api/v2/...)** - Fixed by removing /api/v2 prefix from service calls since ApiClient already includes it
- **Sellers showing as hashes** - Fixed by adding seller_character_name to market listings query
- **Character gold not displaying in purchase modal** - Fixed by using inheritance_received instead of wealth field
- **Purchase database constraint error** - Fixed by setting is_active=false instead of quantity=0 when all items purchased
- **Item names showing as hashes in purchase modal** - Fixed by using listing data instead of mock lookup
- **Characters without locations** - Fixed by defaulting new characters to Capital City and migrating existing characters

### Current Frontend Features
- JWT authentication with automatic token refresh
- Dynasty creation and management dashboard
- Character creation with randomized stats (health, stamina, charisma, intelligence, luck)
- Characters start with 500-1000 gold and begin in Capital City
- Character location display with map pin indicators
- Market browsing with 8 unique regions (Capital City, Northern Mines, etc.)
- Regional dropdown selection for easier navigation
- Item inventory management with sell functionality
- Transaction history with expandable details
- Real-time WebSocket updates for market changes
- Interactive price charts using Recharts
- Loading skeletons for smooth UX
- Death event toast notifications
- Market item detail modal with purchase flow
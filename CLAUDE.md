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

### 🚧 Phase 4: Frontend (In Progress)
- [x] React PWA setup
- [x] Authentication flow
- [x] Dynasty management
- [x] Character creation & dashboard
- [x] Market interface (basic)
- [ ] Real-time WebSocket integration
- [ ] Death animations & notifications
- [ ] Market visualizations (charts)
- [ ] Mobile-optimized UI

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

## API Evolution

### Existing Endpoints (Preserved)
All current Bridge endpoints remain functional during migration:
- `/api/v1/auth/*` - Authentication
- `/api/v1/users/*` - User management
- `/api/v1/inventory/*` - Inventory (adapting for characters)
- `/api/v1/trading/*` - Trading (enhancing for dynasties)
- `/api/v1/clans/*` - Clans (becoming dynasty alliances)

### New Endpoints (Dynasty Trader)
- `/api/v2/characters/*` - Character management
- `/api/v2/dynasties/*` - Dynasty operations
- `/api/v2/markets/*` - Regional market data
- `/api/v2/ghost/*` - Ghost market actions
- `/ws/market` - WebSocket market stream

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
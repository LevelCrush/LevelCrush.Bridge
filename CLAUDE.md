# Dynasty Trader (formerly Bridge) - Project Context

## Project Evolution

This project is evolving from "Bridge" (a multi-game inventory system) into **Dynasty Trader** - a revolutionary roguelike economy game where death drives markets and players build multi-generational trading empires.

## Current Status

**Phase**: Core Systems Implementation
**Completed**: 
- ✅ PostgreSQL + TimescaleDB setup
- ✅ Character lifecycle (birth, aging, death)
- ✅ Dynasty system with inheritance
- ✅ API v2 endpoints for Dynasty Trader
- ✅ Background tasks for aging and snapshots

**In Progress**:
- 🔄 Market mechanics with TimescaleDB
- 🔄 Death impact calculations
- 🔄 Testing and documentation

**Next Steps**: See [Migration Plan](docs/game-design/synthesis/bridge-migration-plan.md)

## Quick Start

```bash
# Current Bridge setup (still works)
cp .env.example .env
cargo run --bin migrate
cargo run --bin bridge

# Dynasty Trader mode (NEW!)
cp .env.dynasty.example .env.dynasty  # See .env.dynasty for TimescaleDB config
cargo run --bin migrate_postgres       # Run PostgreSQL migrations
cargo run --bin dynasty_trader         # Start Dynasty Trader server
```

## Architecture Overview

### Current Stack (Bridge)
- **Backend**: Rust + Axum 0.7
- **Database**: MariaDB with SQLx
- **Auth**: Email/password with JWT
- **Features**: Inventory, trading, clans, marketplace

### Target Stack (Dynasty Trader)
- **Backend**: Rust + Axum (unchanged)
- **Database**: PostgreSQL + TimescaleDB (for time-series market data)
- **Frontend**: React PWA (Progressive Web App)
- **Discord**: Bot for notifications and trading
- **Real-time**: WebSockets for live market data
- **Auth**: Discord OAuth2 + existing system

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

### Phase 1: Database Migration (Week 1) ✅
- [x] Migrate from MariaDB to PostgreSQL
- [x] Add TimescaleDB for market data  
- [x] Create character/dynasty tables
- [x] Implement aging system

### Phase 2: Core Mechanics (Week 2-3) ✅
- [x] Character lifecycle (birth → death)
- [x] Inheritance system
- [x] Death market impacts (partial)
- [ ] Basic ghost mechanics

### Phase 3: Market Systems (Week 4-5)
- [ ] Regional market separation
- [ ] Price history tracking
- [ ] WebSocket real-time updates
- [ ] Market event system

### Phase 4: Frontend (Week 6-8)
- [ ] React PWA setup
- [ ] Trading interface
- [ ] Dynasty management
- [ ] Market visualizations

### Phase 5: Discord Bot (Week 9)
- [ ] OAuth2 integration
- [ ] Market alerts
- [ ] Death announcements
- [ ] Trading commands

## Key Files & Directories

```
bridge/                          # Project root
├── src/                        # Rust backend
│   ├── models/                 # Domain models
│   │   ├── character.rs       # NEW: Character lifecycle
│   │   ├── dynasty.rs         # NEW: Dynasty system
│   │   └── market.rs          # NEW: Market mechanics
│   ├── services/              
│   │   ├── death_service.rs   # NEW: Death handling
│   │   └── market_service.rs  # NEW: Regional markets
│   └── api/
│       └── websocket.rs       # NEW: Real-time updates
├── frontend/                   # NEW: React PWA
├── discord-bot/               # NEW: Discord integration
└── docs/
    └── game-design/           # Comprehensive game design
        ├── economy/           # Economy game research
        ├── roguelike/         # Roguelike research
        └── synthesis/         # Hybrid design
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

## Database Schema Changes

### New Tables
```sql
-- Character system
CREATE TABLE characters (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    dynasty_id UUID REFERENCES dynasties(id),
    name VARCHAR(100),
    age INTEGER,
    health INTEGER,
    location_id UUID,
    died_at TIMESTAMPTZ,
    death_cause VARCHAR(255)
);

-- Dynasty system
CREATE TABLE dynasties (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(100),
    generation INTEGER,
    reputation INTEGER,
    total_wealth DECIMAL(20,2)
);

-- Market time-series data
CREATE TABLE market_prices (
    time TIMESTAMPTZ,
    region_id UUID,
    item_id UUID,
    price DECIMAL(10,2),
    volume INTEGER
);
```

### Modified Tables
- `user_inventory` → Add `character_id` column
- `clans` → Adapt for dynasty alliances
- `trades` → Add dynasty reputation effects

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

```bash
# Existing (Bridge)
DATABASE_URL=mysql://user:pass@localhost/bridge
JWT_SECRET=your-secret
PORT=3113

# New (Dynasty Trader)
DATABASE_URL=postgresql://user:pass@localhost/dynasty_trader
TIMESCALE_URL=postgresql://user:pass@localhost/dynasty_trader
REDIS_URL=redis://localhost:6379
DISCORD_CLIENT_ID=your-discord-app-id
DISCORD_CLIENT_SECRET=your-discord-secret
DISCORD_BOT_TOKEN=your-bot-token
```

This project is transitioning from a multi-game inventory bridge to a groundbreaking roguelike economy game. The existing codebase provides an excellent foundation that we're building upon rather than replacing.
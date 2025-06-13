# Dynasty Trader (formerly Bridge)

A revolutionary roguelike economy game where death drives markets and players build multi-generational trading empires.

**🚀 Frontend Development Active!** - React PWA is live with dynasty management, character creation, and market trading. Backend migration to PostgreSQL/TimescaleDB complete.

## Current Status

### Frontend (React PWA) - Live!
- **Authentication**: JWT-based login/register with persistent sessions
- **Dynasty Management**: Create and manage your trading empire
- **Character System**: Create characters, view stats, track wealth
- **Market Interface**: Browse regional markets, view listings, make purchases
- **Real-time Updates**: WebSocket integration for live market data
- **Data Visualization**: Interactive price charts with Recharts
- **Enhanced UX**: Loading skeletons, smooth animations, error handling
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Tailwind CSS with dark theme

### Backend Migration Complete
- **Database**: Migrated from MariaDB to PostgreSQL + TimescaleDB
- **API**: Dual API (v1 for legacy, v2 for Dynasty Trader)
- **Real-time**: WebSocket support for live market updates
- **Production Ready**: All core systems implemented and tested

## Implemented Features (Dynasty Trader)

### Core Game Loop
- **Generational Gameplay**: Control a dynasty across multiple character lifetimes
- **Permadeath System**: Characters age and die, affecting markets
- **Inheritance Mechanics**: Pass wealth and reputation to heirs
- **Ghost Markets**: Influence economy after death

### Economic Systems
- **Regional Markets**: No global auction house - travel and trade
- **Real-time Prices**: Supply and demand driven by player actions
- **Market Events**: Procedural economic conditions
- **Time-series Data**: Historical price tracking and analysis

### Roguelike Elements
- **Character Aging**: Each journey ages your trader
- **Risk/Reward Routes**: Dangerous paths offer better profits
- **Procedural Events**: Dynamic world conditions
- **Knowledge Progression**: Information as currency

### Technical Features
- **Progressive Web App**: Play in browser, install like native app
- **Discord Integration**: Bot for trading and notifications
- **Real-time Updates**: WebSocket market streams
- **Offline Support**: Continue planning while disconnected

## Getting Started

### Prerequisites

- Rust 1.70 or higher
- PostgreSQL 15+ with TimescaleDB extension
- Node.js 18+ and npm (for frontend)
- Docker (optional, for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dynasty-trader.git
cd dynasty-trader
```

2. Set up PostgreSQL with TimescaleDB:
```bash
# Using Docker (recommended)
docker run -d --name timescaledb -p 5433:5432 \
  -e POSTGRES_USER=timescale \
  -e POSTGRES_PASSWORD=timescale \
  -e POSTGRES_DB=dynasty_trader \
  timescale/timescaledb:latest-pg15
```

3. Configure environment:
```bash
cp .env.dynasty .env
# Edit .env with your database credentials if needed
```

4. Run database migrations:
```bash
cargo run --bin migrate_postgres
```

5. Start the backend:
```bash
cargo run --bin dynasty-trader
```

6. Start the frontend:
```bash
cd frontend/dynasty-trader
npm install
npm run dev
```

The API will be available at `http://localhost:3113`
The frontend will be available at `http://localhost:5173`

## Game Design Documentation

Comprehensive game design documentation is available in the `docs/game-design/` directory:

- **[Project Overview](docs/game-design/PROJECT_OVERVIEW.md)** - Complete vision and evolution
- **[Migration Plan](docs/game-design/synthesis/bridge-migration-plan.md)** - How we're transforming Bridge
- **[Core Mechanics](docs/game-design/economy/core-mechanics.md)** - Economy game fundamentals
- **[Roguelike Design](docs/game-design/roguelike/roguelike-mechanics.md)** - Permadeath and progression
- **[Synthesis](docs/game-design/synthesis/synthesis-roguelike-economy.md)** - How genres merge
- **[Architecture](docs/game-design/synthesis/web-discord-architecture.md)** - Technical implementation

## Development

```bash
cargo build              # Build the project
cargo run --bin bridge   # Run the application
cargo run --bin migrate  # Run database migrations
cargo run --bin test_db  # Test database connection
cargo check              # Quick compilation check
cargo fmt                # Format code
cargo clippy             # Lint the code
cargo test               # Run tests
cargo doc --open         # Generate documentation
```

## API Documentation

### Dynasty Trader API (v2)

#### Authentication
- Register: `POST /api/v2/auth/register`
- Login: `POST /api/v2/auth/login`
- Refresh: `POST /api/v2/auth/refresh`

#### Dynasty Management
- Create Dynasty: `POST /api/v2/dynasties`
- Get My Dynasty: `GET /api/v2/dynasties/me`
- Get Dynasty Stats: `GET /api/v2/dynasties/:id/stats`

#### Character Management  
- Create Character: `POST /api/v2/characters`
- Get Characters: `GET /api/v2/characters`
- Get Character Stats: `GET /api/v2/characters/:id/stats`

#### Market System
- Get Regions: `GET /api/v2/market/regions`
- Get Listings: `GET /api/v2/market/regions/:id/listings`
- Get Market Stats: `GET /api/v2/market/regions/:id/stats`
- Create Listing: `POST /api/v2/market/listings`
- Purchase: `POST /api/v2/market/purchase`

#### WebSocket
- Connect: `ws://localhost:3113/ws/market`
- Channels: `market:{region_id}`, `deaths`, `events`

All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Project Structure

```
src/
├── api/         # Route handlers
├── db/          # Database models and queries
├── auth/        # Authentication providers
├── models/      # Core domain models
├── services/    # Business logic
├── utils/       # Helper utilities
└── main.rs      # Application entrypoint
```

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

## Logging

The application logs to both console and rotating daily log files:
- Console: Pretty-printed logs for development
- File: Detailed logs saved to `./logs/bridge.log` with daily rotation
- Log files include: timestamps, thread info, file locations, and full context

To adjust log levels, set the `RUST_LOG` environment variable:
```bash
RUST_LOG=info cargo run --bin bridge  # Info level and above
RUST_LOG=bridge=debug,tower_http=info,sqlx=warn cargo run --bin bridge  # Custom per-module
```

## Database Schema

### Dynasty Trader Tables (PostgreSQL)
- **Core**: `users`, `dynasties`, `characters`
- **Market**: `regions`, `items`, `market_listings`, `market_prices` (TimescaleDB)
- **Economy**: `character_inventory`, `market_transactions`, `trade_routes`
- **Events**: `character_deaths`, `market_events`, `dynasty_events`
- **Social**: `dynasty_alliances`, `character_relationships`

### Legacy Bridge Tables (MariaDB - being phased out)
- User management, inventory, clans, trading, marketplace, messaging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run `cargo fmt` and `cargo clippy` before committing
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code passes all tests and linting checks before submitting.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
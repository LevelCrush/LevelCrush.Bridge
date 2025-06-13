# Dynasty Trader (formerly Bridge)

A revolutionary roguelike economy game where death drives markets and players build multi-generational trading empires. 

**🎮 Core Systems Complete!** - Backend implementation for Dynasty Trader is finished (Phase 1-3). Frontend development begins next.

## Current Features (Bridge)

- **User Management**: Email/password authentication
- **Inventory System**: Items with rarity, modifiers, and credit values
- **Trading System**: Direct player-to-player item exchanges
- **Social Graph**: Friends, clans, and clan federations
- **Marketplace**: Auction house for open trades
- **Messaging**: Direct messaging between users

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
- PostgreSQL 15+ with TimescaleDB extension (for Dynasty Trader)
- MariaDB/MySQL 5.7+ (for legacy Bridge mode)
- Docker (optional, for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bridge.git
cd bridge
```

2. Set up the database:
```bash
# Using Docker (recommended)
docker run -d --name bridge-db -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=example \
  -e MYSQL_DATABASE=bridge \
  mariadb:latest

# Or use your existing MariaDB/MySQL installation
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
# Default configuration uses root:example@localhost:3306/bridge
```

4. Run database migrations:
```bash
cargo run --bin migrate
```

5. Start the server:
```bash
cargo run --bin bridge
# Or use the convenience script:
./scripts/run.sh
```

The API will be available at `http://localhost:3113`

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

The API follows RESTful conventions. See `examples/api_requests.http` for example requests.

### Authentication
- Register: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`

All other endpoints require a JWT token in the Authorization header:
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

```bash
# Required
DATABASE_URL=mysql://root:example@localhost:3306/bridge

# Optional
HOST=127.0.0.1          # Server host (default: 127.0.0.1)
PORT=3113               # Server port (default: 3000)
RUST_LOG=debug          # Logging level
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

The project uses 19 tables to manage all features:
- User management: `users`, `user_sessions`, `user_games`
- Inventory: `inventory_items`, `user_inventory`, `item_modifiers`, etc.
- Social: `clans`, `clan_members`, `user_connections`
- Trading: `trades`, `trade_items`
- Marketplace: `marketplace_listings`, `auction_bids`
- Messaging: `messages`
- Configuration: `app_secrets`

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
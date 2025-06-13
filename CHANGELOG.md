# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Dynasty Trader

### Phase 3: Market Systems Complete (2025-01-13)

#### Added
- Regional market system with 8 unique regions
  - Each region has tax rates, safety levels, and prosperity ratings
  - Trade routes connect regions with distance and danger metrics
  - Isolated economies prevent global market manipulation
- Market mechanics with TimescaleDB integration
  - Real-time price tracking with time-series data
  - Market listings with expiration dates
  - Ghost listings from deceased characters
  - Continuous aggregates for hourly/daily statistics
- Death service and market impacts
  - Character deaths create market shocks based on wealth
  - Ghost markets allow posthumous trading
  - Item liquidation affects regional supply
  - 10% death tax on inheritance
- WebSocket support for real-time updates
  - Channel-based subscriptions (market:{region_id}, deaths, events)
  - Live price updates and market events
  - Death announcements across the game
  - Efficient broadcast system with Arc<RwLock>
- Market API endpoints
  - `/api/v2/market/listings` - Create and browse listings
  - `/api/v2/market/purchase` - Buy from listings
  - `/api/v2/market/regions` - Region information
  - `/api/v2/market/events` - Active market events
  - `/ws/market` - WebSocket connection

#### Technical Improvements
- Implemented DynastyTraderState for unified app state
- Added futures dependency for WebSocket support
- Created background tasks for market maintenance
- Safe SQLx migration system with checksums
- Comprehensive test suite with unit and integration tests

## [0.2.0] - Dynasty Trader Core (2025-01-13)

### Phase 2: Character Lifecycle (2025-01-06)

#### Added
- Complete character lifecycle system
  - Birth with randomized stats (health, stamina, charisma, intelligence, luck)
  - Aging mechanics that degrade health/stamina over time
  - Death from old age based on probabilistic model
  - Character stats affect trading bonuses
- Dynasty management system
  - Create and manage multi-generational trading empires
  - Reputation and legacy point tracking
  - Dynasty perks unlocked by achievements
  - Prestige calculation based on wealth, generation, and reputation
- Inheritance mechanics
  - Wealth passes to children on death
  - Dynasty treasury for childless characters
  - 80% base inheritance rate with reputation bonuses
- API v2 endpoints
  - `/api/v2/dynasties/*` - Dynasty management
  - `/api/v2/characters/*` - Character operations
  - `/api/v2/dynasties/leaderboard` - Global rankings
- Background tasks
  - Aging task runs every hour (configurable)
  - Dynasty wealth snapshots for historical tracking
  - Automatic death processing for old characters
- PostgreSQL-specific auth middleware
- Comprehensive error handling with proper HTTP status codes

#### Technical Improvements
- Added rust_decimal for precise financial calculations
- Created generic executor patterns for database operations
- Implemented proper transaction handling for complex operations
- Added TimescaleDB continuous aggregates for market data

### Phase 1: Database Migration (2025-01-06)

#### Added
- PostgreSQL + TimescaleDB support
  - Dual database configuration (MySQL for Bridge, PostgreSQL for Dynasty)
  - TimescaleDB hypertables for time-series market data
  - Continuous aggregates for hourly/daily price summaries
  - Data retention policies for historical data
- Database schema for Dynasty Trader
  - Characters with full lifecycle support
  - Dynasties with generational tracking
  - Regional markets with price history
  - Death events that impact markets
  - Trade routes between regions
  - Market events system
- Migration tooling
  - `migrate_postgres` binary for PostgreSQL migrations
  - Improved SQL parsing for complex statements
  - Support for PostgreSQL-specific features (dollar quoting, etc.)
- Comprehensive TimescaleDB documentation
  - Best practices and common patterns
  - Performance optimization tips
  - Troubleshooting guide

#### Changed
- Updated Cargo.toml to support both MySQL and PostgreSQL
- Added new binaries: `dynasty_trader`, `migrate_postgres`

#### Infrastructure
- `.env.dynasty` configuration for TimescaleDB connection
- Separate migration paths for MySQL and PostgreSQL
- Docker support for TimescaleDB on port 5433

## [0.1.0] - Bridge (Original)

### Added
- Initial project setup with Axum 0.7 web framework
- Database integration with SQLx 0.7 and MariaDB/MySQL
- Core domain models for users, inventory, clans, and trading
- Authentication system with email/password support
- JWT-based authentication with automatic secret generation
- Database migration system with automatic execution
- 19 database tables for complete feature support
- User registration and login endpoints
- Middleware for JWT authentication on protected routes
- Comprehensive error handling with consistent JSON responses
- Structured logging with tracing
- Daily rotating file logs in addition to console output
- Environment-based configuration
- Development utilities (test_db binary for connection testing)
- API request examples in HTTP format
- Startup script for easy development

### Technical Details
- Rust 2021 edition
- Tokio async runtime
- Rustls for TLS (avoiding OpenSSL dependencies)
- Foreign key constraint handling in migrations
- Automatic database charset configuration

### Security
- Secure password hashing with Argon2
- JWT tokens with 7-day expiration
- Database-stored secrets management
- CORS configuration for API endpoints
- Environment variable protection for database credentials

### To Do
- Full implementation of inventory endpoints
- Trading system logic
- Clan management features
- Marketplace auction system
- Message delivery system
- WebSocket support for real-time features
- Rate limiting
- API documentation generation
- Integration tests

## [0.1.0] - TBD

- Initial release pending full endpoint implementation
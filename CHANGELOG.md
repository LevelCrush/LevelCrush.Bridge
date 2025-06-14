# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Dynasty Trader

### Recent Improvements (2025-06-14)

#### Added
- **Character Travel System**
  - Implemented travel functionality allowing characters to move between regions
  - Added POST `/api/v2/characters/:id/travel` endpoint
  - Created TravelModal component with region comparison display
  - Shows current location, destination details, and region statistics
  - Characters cannot travel when dead (proper validation)

- **Market Category Filters**
  - Implemented working category filters in marketplace
  - Fixed category mismatch between frontend enum and database values
  - Categories now properly filter listings (Food, Raw Material, Equipment, Luxury, Textile)
  - Fixed "food" showing no results by updating frontend to match capitalized database values

- **Character State Persistence**
  - Added Zustand store for persisting selected character across pages
  - Marketplace now remembers selected character when navigating from character page
  - "Trade" button on character page correctly pre-selects character in marketplace
  - Character selection persists in localStorage for better UX

- **Marketplace Enhancements**
  - Added "Trading As" display showing selected character in marketplace
  - Auto-select first region when marketplace loads
  - Character dropdown now shows accurate gold values
  - Region selection converted to dropdown for space efficiency

#### Fixed
- **Aging System Balance**
  - Fixed overly aggressive aging causing characters to die too young
  - Adjusted aging formula to be more gradual and realistic
  - Characters now have reasonable lifespans allowing for meaningful gameplay
  - Health and stamina degradation now more balanced

- **Frontend Build Issues**
  - Fixed PWA service worker and manifest generation
  - Build output now includes proper icon files and manifest
  - Service worker correctly caches assets for offline support

### Bug Fixes and Improvements (2025-06-13)

#### Fixed
- **Marketplace Display Issues**
  - Fixed sellers showing as UUID hashes instead of character names
  - Added seller_character_name to market listings query by joining with characters table
  - Fixed character gold display in purchase modal to use inheritance_received instead of non-existent wealth field
  - Converted region selection from vertical button list to a dropdown for better space efficiency
  - Fixed item names showing as hashes in purchase confirmation modal

- **Purchase Transaction Error**
  - Fixed "market_listings_quantity_check" constraint violation when purchasing all items
  - Changed logic to set is_active=false instead of quantity=0 when listing is fully purchased
  - Database constraint requires quantity > 0, so we avoid setting it to 0

#### Added
- **Character Location System**
  - Added location display to Character Page showing current region
  - Added location indicators to Dashboard character list
  - Characters now start in Capital City by default
  - Added location_id support to character creation
  - Created migration to set default location for existing characters
  - Location shown with map pin icon in character lists
- **Character Display Issues**
  - Fixed characters not showing for user accounts due to aggressive aging system
  - Characters now start at age 18 instead of 0 to prevent immediate death
  - Updated `get_dynasty_characters` to return both living and dead characters
  - Added proper deceased character count display

- **Inventory System**
  - Fixed 404 error on inventory endpoint by implementing missing route
  - Added starting inventory for new characters (random items on creation)
  - Fixed inventory item names showing as "Item hash" by joining with items table
  - Added item details (name, description, category, rarity) to inventory response

- **Market Functionality**
  - Implemented "Sell on Market" functionality with modal interface
  - Fixed market listings showing "Item hash" instead of actual item names
  - Added item details to market listing responses
  - Fixed SQL type mismatch for item_rarity enum (cast to text)
  - Added profit/loss calculations for market sales

- **UI/UX Improvements**
  - Fixed button icons appearing on top of text instead of inline
  - Added proper flexbox layout to Trade and Create Character buttons
  - Fixed JavaScript error "sellingItem is not defined" in inventory component
  - Prevented event propagation on sell button clicks

- **Backend Fixes**
  - Fixed character stats endpoint 500 error
  - Corrected wealth calculation to multiply quantity × price instead of just summing quantities
  - Added proper Send trait handling for async operations with random values

#### Added
- **Character Inventory Management**
  - GET `/api/v2/characters/:id/inventory` endpoint
  - Starting inventory system with random item allocation
  - Support for viewing both living and deceased character inventories

- **Market Selling**
  - SellItemModal component with region selection and pricing
  - Market tax calculations and net profit display
  - Character-based inventory deduction on sales

- **Item Details Modal**
  - Created ItemDetailsModal component for detailed item information
  - Shows item rarity with star rating and colored background
  - Displays base price, weight, category, and quantity
  - Includes acquisition details and flavor text
  - Integrated into CharacterInventory and MarketPage components

- **Transaction History**
  - Created market_transactions table to track all purchases and sales
  - Added transaction recording to purchase_listing service method
  - Implemented GET `/api/v2/characters/:id/transactions` endpoint
  - Created TransactionHistory component with expandable details
  - Shows buy/sell side, prices, taxes, and net amounts
  - Integrated into CharacterPage below inventory

- **Character Starting Gold**
  - New characters now start with 500-1000 gold (randomized)
  - Updated existing characters to have starting gold (750 for living, 500 for dead)
  - Ensures all players can participate in market trading immediately

### Frontend Enhancements (2025-01-13 Evening)

#### Added
- **Mobile Optimization**
  - Responsive grid layouts with mobile-first breakpoints
  - Adjusted typography sizes for mobile screens
  - Touch-friendly tap targets and spacing
  - Mobile-optimized modal (slides up from bottom on mobile)
  - Sticky region selector on desktop
  - Responsive stats cards with 2-column mobile layout

- **Progressive Web App (PWA) Support**
  - Web app manifest with app metadata and icons
  - Service worker for offline functionality
  - Install prompt component with native app-like installation
  - Cache-first strategy for static assets
  - Network-first strategy for API calls with offline fallback
  - Background sync support for offline actions
  - Already configured in vite.config.ts with VitePWA plugin

### Frontend Fixes (2025-01-13 Evening)

#### Fixed
- **Market stats NaN issue** - Removed `average_transaction_value` field from TypeScript interface as it doesn't exist in backend
- **Double API path bug** - Fixed service calls adding `/api/v2` prefix when ApiClient already includes it
- **UI adjustments** - Changed market stats from 4-column to 3-column grid after removing average transaction field

#### Updated
- TypeScript `MarketStats` interface now matches backend exactly:
  - Added `region_name` field
  - Changed `most_traded_items` to `average_prices` (array of `ItemPriceInfo`)
  - Changed `price_trends` to `trending_items` (array of `TrendingItem`)
  - Removed non-existent `average_transaction_value` field

### Phase 4: Frontend Development (2025-01-13)

#### Added
- React PWA with TypeScript and Vite
  - Modern build tooling with hot module replacement
  - Progressive Web App capabilities for offline support
  - Responsive design with Tailwind CSS dark theme
- Authentication system
  - JWT-based login/register with persistent sessions
  - Protected routes with automatic redirects
  - Token refresh on app startup
  - Logout functionality with state cleanup
- Dynasty management UI
  - Create dynasty with name and motto
  - View dynasty statistics (wealth, reputation, generation)
  - Character count tracking (living vs deceased)
  - Dynasty overview dashboard
- Character system frontend
  - Create characters within dynasties
  - Character dashboard with stats display
  - Health, stamina, and other attributes visualization
  - Age calculation from birth_date
  - Wealth display with proper formatting
- Market trading interface
  - Browse 8 seeded regions with safety/prosperity levels
  - View market listings by region
  - Filter by category and price range
  - Market statistics display
  - Purchase functionality (pending backend integration)
  - Market item detail modal with purchase flow
- Real-time features
  - WebSocket integration for live updates
  - Market price change notifications
  - Death event toast notifications
  - Connection status indicator
  - Auto-reconnection with exponential backoff
- Data visualization
  - Price history charts using Recharts
  - Trading volume charts
  - 24-hour price change indicators
  - Interactive tooltips and responsive design
- Enhanced UX
  - Loading skeletons for all data-fetching components
  - Smooth animations and transitions
  - Error states and empty states
  - Optimistic UI updates
- State management
  - Zustand for auth state with persistence
  - TanStack Query for server state and caching
  - WebSocket context for real-time updates
- TypeScript interfaces
  - Complete type safety for all API responses
  - Aligned with backend Rust models
  - Proper handling of Decimal types as strings

#### Fixed
- Character wealth NaN display issue
- Empty regions table preventing market access
- TypeScript interface mismatches with backend
- Frontend expecting different field names than backend provides

#### Technical Improvements
- Modular service architecture for API calls
- Comprehensive error handling with toast notifications
- Lazy loading for better performance
- Custom hooks for common patterns
- Environment-based configuration
- Utility functions for className management
- Reusable loading skeleton components

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

## Frontend Roadmap

### Immediate Next Steps
- [x] WebSocket integration for real-time market updates
- [x] Character death notifications and UI updates
- [x] Market price charts with historical data
- [x] Mobile-optimized responsive design
- [x] PWA manifest and service worker
- [x] Offline capability with sync
- [x] Character inventory management
- [x] Character travel between regions
- [x] Market category filters
- [ ] Trade route visualization

### Future Enhancements
- [ ] Dynasty alliance system
- [ ] Achievement/perk display
- [ ] Market event detailed views
- [ ] Ghost character interactions
- [ ] Character relationships
- [ ] Caravan management
- [ ] Regional reputation system
- [ ] Dynasty perks and upgrades
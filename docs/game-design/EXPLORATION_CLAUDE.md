# Roguelike Economy Simulator - Project Context

## Project Overview
This is a research and design project for creating a revolutionary hybrid game that combines roguelike permadeath mechanics with persistent player-driven economies. The core innovation is a dynasty system where players control generations of traders within a living, breathing market that persists beyond individual character deaths.

## Key Design Principles
1. **Player Agency**: The economy must be shaped by player actions, not developer-controlled
2. **Meaningful Trade**: Every transaction should matter and create interesting decisions
3. **Emergent Gameplay**: Complex behaviors should arise from simple, well-designed rules
4. **Risk/Reward Balance**: Higher profits should require taking greater risks
5. **Information Asymmetry**: Knowledge and information should be valuable commodities
6. **Generational Persistence**: Death transitions to heir, not game over
7. **Living Markets**: Economy continues and evolves between character lives
8. **Dynasty Building**: Long-term goals span multiple character lifetimes

## Technical Stack (Recommended)
- **Backend**: Rust with Axum web framework
- **Frontend**: React with TypeScript (Progressive Web App)
- **Discord Bot**: Discord.js or Serenity (Rust)
- **Database**: PostgreSQL with TimescaleDB extension
- **Cache**: Redis
- **Message Queue**: NATS or Kafka
- **Real-time**: WebSockets for market data
- **Client Storage**: IndexedDB for offline capability

## Architecture Patterns
- Event-driven architecture with event sourcing
- Microservices for scalability
- CQRS for read/write optimization
- WebSockets for real-time updates

## Core Systems to Implement
1. **Trading Engine**: Secure player-to-player trading with multiple confirmation steps
2. **Market Data Service**: Real-time price tracking and historical data
3. **Dynasty System**: Character death, inheritance, and family progression
4. **Aging Mechanics**: Characters age with each journey, affecting abilities
5. **Regional Markets**: Separate markets by location to encourage travel/transport
6. **Death Events**: Market impacts when traders die carrying goods
7. **Ghost Markets**: Post-death influence on economy
8. **Reputation System**: Both personal and dynasty reputation tracking
9. **Procedural Market Events**: Dynamic economic conditions each "season"
10. **Contract System**: Agreements that can transcend death

## Economic Mechanics
- No global auction house - force local trading
- Multiple currencies including commodity money
- Natural resource scarcity through limited spawns
- Item sinks through durability and consumption
- Progressive specialization that rewards focus
- Transportation risk to create interesting trade routes

## Development Priorities
1. MVP: Basic trading interface and inventory system
2. Market data collection and visualization
3. Production and crafting systems
4. Regional market implementation
5. Social and reputation features
6. Advanced economic tools and analytics

## Testing Considerations
- Load test the trading engine for concurrent transactions
- Simulate economic scenarios to test balance
- Security audit for trade exploits
- Performance testing for real-time updates
- Usability testing for trading interface

## Monitoring Requirements
- Real-time economic metrics dashboard
- Player behavior analytics
- Market manipulation detection
- Performance monitoring
- Error tracking and alerting

## Success Metrics
- Active daily traders
- Transaction volume
- Market liquidity
- Price stability
- Player retention
- Economic diversity index

## References
### Economy Game Analysis
- `core-mechanics.md`: Fundamental game mechanics
- `trading-systems.md`: Player-to-player trading details  
- `market-dynamics.md`: Economic balance and cycles
- `case-studies.md`: Analysis of successful economy games

### Roguelike Analysis
- `roguelike-mechanics.md`: Core roguelike design principles
- `roguelike-case-studies.md`: Successful roguelike analysis
- `roguelike-progression.md`: Meta-progression systems
- `roguelike-economy-hybrids.md`: Existing hybrid games

### Synthesis Documents
- `synthesis-roguelike-economy.md`: Complete hybrid game design
- `innovative-mechanics.md`: Revolutionary new mechanics
- `technical-architecture.md`: Detailed technical implementation
- `recommendations.md`: Final recommendations for hybrid approach
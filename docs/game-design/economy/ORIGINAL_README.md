# Roguelike Economy Simulator - Where Death Drives Markets

A revolutionary game design that fuses roguelike permadeath with persistent player-driven economies. Trade, die, inherit, repeat - build a mercantile dynasty across generations.

## Vision

Create a game where:
- Death is not the end, but a market event
- Your economic empire spans generations
- Every life tells a unique trading story
- Markets persist while traders perish
- Risk and permadeath create meaningful tension

## Design Philosophy

### What Makes Great Economy Games

1. **Real Scarcity**: Resources that are genuinely limited
2. **Meaningful Choices**: Every trade decision matters
3. **Player Agency**: The economy responds to player actions
4. **Emergent Gameplay**: Unexpected strategies develop
5. **Social Interaction**: Trading creates relationships

### Core Principles

- **No Global Auction House**: Force local markets and travel
- **Specialization Rewards**: Masters outperform generalists  
- **Information Asymmetry**: Knowledge equals profit
- **Risk/Reward Balance**: Higher profits require danger
- **Economic Cycles**: Natural booms and busts

## The Hybrid Concept: Dynasty Trading

### Core Innovation
Merge roguelike permadeath with persistent economies:
- **Play as a Trader**: Each run is one merchant's lifetime
- **Build a Dynasty**: Your family business survives your death
- **Persistent Markets**: The economy continues between lives
- **Death Events**: Your demise affects market prices
- **Inheritance System**: Pass wealth and relationships to heirs
- **Generational Gameplay**: Long-term strategies across lives

### Why This Works
- **Meaningful Death**: Permadeath creates tension without losing everything
- **Economic Depth**: Complex markets worth mastering
- **Emergent Stories**: "My grandfather traded with yours..."
- **Social Persistence**: Relationships outlive individuals
- **Constant Discovery**: Procedural elements keep it fresh

## Documentation Structure

### Economy Game Research
- [`core-mechanics.md`](core-mechanics.md) - Fundamental game mechanics and systems
- [`trading-systems.md`](trading-systems.md) - Detailed player-to-player trading design
- [`market-dynamics.md`](market-dynamics.md) - Economic balance and market cycles
- [`case-studies.md`](case-studies.md) - Analysis of successful economy games

### Roguelike Research
- [`roguelike-mechanics.md`](roguelike-mechanics.md) - Core roguelike design principles
- [`roguelike-case-studies.md`](roguelike-case-studies.md) - Analysis of successful roguelikes
- [`roguelike-progression.md`](roguelike-progression.md) - Progression and meta-progression systems
- [`roguelike-economy-hybrids.md`](roguelike-economy-hybrids.md) - Existing hybrid games

### Synthesis & Innovation
- [`synthesis-roguelike-economy.md`](synthesis-roguelike-economy.md) - Merged design vision
- [`innovative-mechanics.md`](innovative-mechanics.md) - Never-before-seen mechanics
- [`technical-architecture.md`](technical-architecture.md) - Implementation details
- [`recommendations.md`](recommendations.md) - Updated recommendations for hybrid

## Quick Start Recommendations

### Technology Stack
- **Backend**: Rust + Axum (performance and reliability)
- **Frontend**: React + TypeScript (developer ecosystem)
- **Desktop**: Tauri (native performance, small size)
- **Database**: PostgreSQL + TimescaleDB (robust with time-series)
- **Real-time**: WebSockets via Axum
- **Cache**: Redis (proven and fast)

### MVP Features
1. Secure trading interface
2. Regional markets (no global AH)
3. Basic inventory management
4. Simple production system
5. Price history tracking
6. Player reputation

### Development Approach
1. Start with trading core - get it perfect
2. Add market data and analytics
3. Implement production/crafting
4. Create regional differentiation
5. Add social features
6. Polish and optimize

## Key Insights from Research

### Successful Patterns
- **EVE Online**: Information asymmetry drives gameplay
- **Albion Online**: Local markets create opportunities
- **Path of Exile**: Currency as consumables prevents hoarding
- **Escape from Tarkov**: Risk/reward perfectly balanced

### Common Pitfalls to Avoid
- Global auction houses kill local markets
- Infinite storage removes logistics gameplay
- No specialization makes everyone self-sufficient
- Poor UI makes trading frustrating
- Lack of item sinks causes deflation

## Architecture Highlights

### Event-Driven Design
```
Player Action → Event → Multiple Services → State Updates → Real-time Push
```

### Microservices
- Trade Service (transaction handling)
- Market Service (price tracking)
- Inventory Service (item management)
- Analytics Service (economic monitoring)

### Data Flow
- PostgreSQL for transactional data
- TimescaleDB for market history
- Redis for hot data caching
- Elasticsearch for complex queries

## Getting Started

1. Review [`recommendations.md`](recommendations.md) for quick overview
2. Study [`core-mechanics.md`](core-mechanics.md) for game design
3. Check [`technical-architecture.md`](technical-architecture.md) for implementation
4. Reference [`case-studies.md`](case-studies.md) for proven patterns

## Development Phases

### Phase 1: Foundation (Months 1-2)
- Core trading engine
- Basic inventory system
- User authentication
- Simple UI

### Phase 2: Markets (Months 3-4)
- Price tracking
- Market analytics
- Regional markets
- Trade routes

### Phase 3: Production (Months 5-6)
- Crafting system
- Resource gathering
- Specialization trees
- Supply chains

### Phase 4: Social (Months 7-8)
- Reputation system
- Player organizations
- Contracts
- Communication tools

### Phase 5: Polish (Months 9-12)
- Performance optimization
- Advanced analytics
- Mobile companion app
- Mod support

## Success Metrics

- **Engagement**: Daily active traders
- **Liquidity**: Items trading hands frequently
- **Stability**: Prices finding equilibrium
- **Diversity**: Multiple viable strategies
- **Retention**: Players staying long-term

## Next Steps

1. Validate core trading mechanics with prototype
2. Test technical architecture with load simulation
3. Design initial item/resource economy
4. Create detailed UI/UX mockups
5. Build MVP focusing on trading perfection

---

*This project explores the design space of player-driven economies. The goal is to create a game where economic interaction is genuinely fun, not just functional.*
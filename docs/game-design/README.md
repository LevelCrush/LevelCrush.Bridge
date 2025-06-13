# Dynasty Trader - Game Design Documentation

This directory contains comprehensive game design documentation for Dynasty Trader, a revolutionary roguelike economy game where death drives markets.

## Quick Navigation

### 📊 Understanding the Vision
- [Project Overview](PROJECT_OVERVIEW.md) - The complete journey from economy game to roguelike hybrid
- [Final Recommendations](recommendations-hybrid.md) - Actionable implementation guide

### 🏛️ Economy Game Research
- [Core Mechanics](economy/core-mechanics.md) - Supply/demand, trading fundamentals
- [Trading Systems](economy/trading-systems.md) - Player-to-player trading design
- [Market Dynamics](economy/market-dynamics.md) - Economic balance and cycles  
- [Case Studies](economy/case-studies.md) - EVE, Albion, and other successes

### ⚔️ Roguelike Research
- [Roguelike Mechanics](roguelike/roguelike-mechanics.md) - Permadeath, procedural generation
- [Case Studies](roguelike/roguelike-case-studies.md) - Hades, Risk of Rain 2, etc.
- [Progression Systems](roguelike/roguelike-progression.md) - Meta-progression analysis
- [Existing Hybrids](roguelike/roguelike-economy-hybrids.md) - Moonlighter, Recettear

### 🔮 The Synthesis
- [Merged Design](synthesis/synthesis-roguelike-economy.md) - How death drives markets
- [Innovative Mechanics](synthesis/innovative-mechanics.md) - Never-before-seen features
- [Web & Discord Architecture](synthesis/web-discord-architecture.md) - Technical implementation
- [Migration Plan](synthesis/bridge-migration-plan.md) - Transforming Bridge project

## Core Concept: Dynasty Trading

Players control generations of merchants in a persistent economy where:
- **Death is meaningful** - Your demise affects market prices
- **Dynasties persist** - Build wealth across generations
- **Markets live** - Economy continues between character lives
- **Every life matters** - Each run tells a unique story

## Key Innovations

### 1. Death Drives Markets
When a trader dies carrying goods, those items flood the market, creating opportunities for other players.

### 2. Ghost Markets
Even in death, players can influence the economy for 24 hours as a ghost trader.

### 3. Generational Gameplay
Your family dynasty continues after death, inheriting partial wealth and all relationships.

### 4. Living Economy
Markets have personality and memory, creating unique server experiences.

## Reading Order

For developers new to the project:

1. Start with [Project Overview](PROJECT_OVERVIEW.md)
2. Read [Core Mechanics](economy/core-mechanics.md) for economy basics
3. Understand [Roguelike Mechanics](roguelike/roguelike-mechanics.md)
4. See how they merge in [Synthesis](synthesis/synthesis-roguelike-economy.md)
5. Review [Migration Plan](synthesis/bridge-migration-plan.md) for implementation

## Design Pillars

1. **Player Agency** - Economy shaped by players, not developers
2. **Meaningful Death** - Permadeath creates tension without devastation
3. **Emergent Stories** - "My grandfather traded with yours..."
4. **Social Persistence** - Relationships outlive individuals
5. **Constant Discovery** - Procedural elements maintain freshness

## Technical Highlights

- **Backend**: Rust + Axum (leveraging existing Bridge code)
- **Frontend**: React PWA (runs in browser, installable)
- **Database**: PostgreSQL + TimescaleDB (time-series market data)
- **Discord**: Integrated bot for notifications and trading
- **Real-time**: WebSockets for live market updates

## The Journey

This project evolved from research into what makes great economy games, through analysis of roguelike design, into a revolutionary synthesis that creates something genuinely new in gaming.

The Dynasty Trading System isn't just combining two genres - it's transforming both into something greater.

---

*"Every trade echoes through generations. Every death opens opportunities. Every dynasty tells a legend."*
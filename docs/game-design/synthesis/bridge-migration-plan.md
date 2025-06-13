# Bridge Project Migration Plan

## Overview

Transform the existing Bridge project into the Dynasty Trading roguelike economy game. The Bridge project already has excellent foundations that align with our design.

## Current Bridge Assets to Leverage

### Already Have:
- ✅ Rust + Axum backend (perfect match)
- ✅ User authentication system
- ✅ Inventory with roguelike modifiers
- ✅ Trading system between players
- ✅ Marketplace/auction house
- ✅ Clan system (adapt for dynasties)
- ✅ Database structure for items/users

### Need to Add:
- ❌ Character aging and permadeath
- ❌ Dynasty/inheritance system
- ❌ Time-series market data (PostgreSQL → TimescaleDB)
- ❌ Regional markets
- ❌ Ghost market mechanics
- ❌ Discord bot integration
- ❌ React PWA frontend
- ❌ WebSocket real-time updates

## Phase 1: Database Migration (Week 1)

### 1.1 Migrate to PostgreSQL + TimescaleDB
```sql
-- Current: MariaDB
-- Target: PostgreSQL + TimescaleDB

-- New tables needed:
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dynasty_id UUID REFERENCES dynasties(id),
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL DEFAULT 18,
    health INTEGER NOT NULL DEFAULT 100,
    location_id UUID REFERENCES regions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    died_at TIMESTAMPTZ,
    death_cause VARCHAR(255)
);

CREATE TABLE dynasties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    generation INTEGER DEFAULT 1,
    total_wealth DECIMAL(20, 2) DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    founded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert existing tables
ALTER TABLE inventory_items RENAME TO items;
ALTER TABLE user_inventory ADD COLUMN character_id UUID REFERENCES characters(id);

-- Add TimescaleDB hypertables
CREATE TABLE market_prices (
    time TIMESTAMPTZ NOT NULL,
    region_id UUID NOT NULL,
    item_id UUID NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    volume INTEGER NOT NULL,
    PRIMARY KEY (time, region_id, item_id)
);

SELECT create_hypertable('market_prices', 'time');
```

### 1.2 Data Migration Script
```rust
// src/bin/migrate_to_postgres.rs
async fn migrate_data(maria_conn: &MariaDb, pg_conn: &PgPool) -> Result<()> {
    // Migrate users
    let users = maria_conn.fetch_all("SELECT * FROM users").await?;
    for user in users {
        // Create dynasty for existing users
        let dynasty_id = create_dynasty(&pg_conn, &user).await?;
        
        // Create first character
        let character_id = create_character(&pg_conn, &user, dynasty_id).await?;
        
        // Migrate inventory to character
        migrate_inventory(&maria_conn, &pg_conn, user.id, character_id).await?;
    }
    
    // Convert clans to dynasties/alliances
    migrate_clans_to_alliances(&maria_conn, &pg_conn).await?;
    
    Ok(())
}
```

## Phase 2: Core Game Mechanics (Week 2-3)

### 2.1 Character Lifecycle System
```rust
// src/models/character.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct Character {
    pub id: Uuid,
    pub dynasty_id: Uuid,
    pub name: String,
    pub age: i32,
    pub health: i32,
    pub location: Region,
    pub skills: CharacterSkills,
    pub inventory_capacity: i32,
}

impl Character {
    pub fn age_one_day(&mut self) -> Result<AgeEffect> {
        self.age += 1;
        
        match self.age {
            18..=25 => Ok(AgeEffect::Youth { speed_bonus: 1.2 }),
            26..=45 => Ok(AgeEffect::Prime { balanced: true }),
            46..=60 => Ok(AgeEffect::Experience { reputation_bonus: 1.5 }),
            61..=80 => Ok(AgeEffect::Elder { 
                speed_penalty: 0.7,
                reputation_bonus: 2.0 
            }),
            _ => Ok(AgeEffect::Death { 
                cause: DeathCause::OldAge 
            })
        }
    }
}
```

### 2.2 Death and Inheritance
```rust
// src/services/death_service.rs
pub async fn handle_character_death(
    db: &PgPool,
    character: &Character,
    cause: DeathCause,
) -> Result<DeathEvent> {
    let transaction = db.begin().await?;
    
    // 1. Mark character as dead
    sqlx::query!(
        "UPDATE characters SET died_at = NOW(), death_cause = $1 WHERE id = $2",
        cause.to_string(),
        character.id
    ).execute(&mut transaction).await?;
    
    // 2. Create market impact event
    let inventory = get_character_inventory(db, character.id).await?;
    let market_impact = calculate_death_market_impact(&inventory).await?;
    
    // 3. Apply market changes
    for impact in &market_impact {
        create_price_event(db, impact).await?;
    }
    
    // 4. Prepare inheritance
    let inheritance = prepare_inheritance(&character, &inventory).await?;
    
    // 5. Notify Discord
    discord_bot::announce_death(&character, &cause, &market_impact).await?;
    
    transaction.commit().await?;
    
    Ok(DeathEvent {
        character,
        cause,
        market_impact,
        inheritance,
        timestamp: Utc::now(),
    })
}
```

## Phase 3: Market Systems (Week 4-5)

### 3.1 Regional Markets
```rust
// src/models/region.rs
#[derive(Debug)]
pub struct Region {
    pub id: Uuid,
    pub name: String,
    pub coordinates: (f32, f32),
    pub biome: Biome,
    pub resources: Vec<ResourceType>,
    pub dangers: Vec<DangerType>,
}

// src/services/market_service.rs
pub async fn get_regional_prices(
    db: &PgPool,
    region_id: Uuid,
) -> Result<HashMap<Uuid, PriceData>> {
    // Use TimescaleDB continuous aggregates
    let prices = sqlx::query_as!(
        PriceData,
        r#"
        SELECT 
            item_id,
            AVG(price) as current_price,
            MAX(price) as day_high,
            MIN(price) as day_low,
            SUM(volume) as volume_24h
        FROM market_prices
        WHERE region_id = $1
            AND time >= NOW() - INTERVAL '24 hours'
        GROUP BY item_id
        "#,
        region_id
    ).fetch_all(db).await?;
    
    Ok(prices.into_iter().map(|p| (p.item_id, p)).collect())
}
```

### 3.2 Real-time WebSocket Updates
```rust
// src/api/websocket.rs
pub async fn market_websocket(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_market_socket(socket, state))
}

async fn handle_market_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    
    // Subscribe to market events
    let mut market_rx = state.market_events.subscribe();
    
    tokio::spawn(async move {
        while let Ok(event) = market_rx.recv().await {
            let msg = Message::Text(serde_json::to_string(&event).unwrap());
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });
}
```

## Phase 4: Frontend Development (Week 6-8)

### 4.1 React PWA Setup
```typescript
// New frontend structure
frontend/
├── src/
│   ├── components/
│   │   ├── Trading/
│   │   │   ├── TradeWindow.tsx
│   │   │   ├── MarketChart.tsx
│   │   │   └── PriceAlerts.tsx
│   │   ├── Dynasty/
│   │   │   ├── FamilyTree.tsx
│   │   │   ├── Inheritance.tsx
│   │   │   └── Legacy.tsx
│   │   ├── Character/
│   │   │   ├── CharacterSheet.tsx
│   │   │   ├── AgingTimer.tsx
│   │   │   └── DeathScreen.tsx
│   │   └── Ghost/
│   │       ├── GhostMode.tsx
│   │       └── SpectralTrading.tsx
│   ├── hooks/
│   │   ├── useMarketData.ts
│   │   ├── useDynasty.ts
│   │   └── useWebSocket.ts
│   ├── stores/
│   │   └── gameStore.ts
│   └── workers/
│       └── market.worker.ts
```

### 4.2 Progressive Web App Configuration
```json
// manifest.json
{
  "name": "Dynasty Trader: Roguelike Economy",
  "short_name": "Dynasty Trader",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#gold",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "finance"],
  "prefer_related_applications": false
}
```

## Phase 5: Discord Integration (Week 9)

### 5.1 Bot Structure
```typescript
// discord-bot/src/index.ts
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { registerCommands } from './commands';
import { MarketService } from './services/market';
import { DynastyService } from './services/dynasty';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

client.once(Events.ClientReady, async () => {
  await registerCommands(client);
  await MarketService.startPriceAlerts(client);
  await DynastyService.startDeathWatch(client);
});
```

### 5.2 Integration Points
1. OAuth2 login via Discord
2. Market price alerts
3. Death announcements
4. Trade notifications
5. Dynasty status commands
6. Ghost market actions

## Phase 6: Testing & Launch (Week 10-12)

### 6.1 Migration Checklist
- [ ] All user data migrated to PostgreSQL
- [ ] Character system fully implemented
- [ ] Death/inheritance working
- [ ] Regional markets active
- [ ] Real-time updates via WebSocket
- [ ] PWA installable and offline-capable
- [ ] Discord bot deployed
- [ ] Load testing completed
- [ ] Security audit passed

### 6.2 Gradual Rollout
1. **Alpha**: Internal testing with team
2. **Closed Beta**: Existing Bridge users get early access
3. **Open Beta**: Public with Discord community
4. **Launch**: Full release with marketing

## Backwards Compatibility

### Maintaining Bridge API
During transition, maintain compatibility:
```rust
// Keep old endpoints working
#[deprecated(note = "Use /api/v2/dynasties instead")]
pub async fn get_clan(Path(id): Path<Uuid>) -> Result<Json<Clan>> {
    // Map dynasty data to old clan format
    let dynasty = get_dynasty(id).await?;
    Ok(Json(dynasty_to_clan_format(dynasty)))
}
```

## File Organization

```
bridge/                          # Renamed to dynasty-trader/
├── backend/                     # Rust API (from src/)
├── frontend/                    # New React PWA
├── discord-bot/                 # New Discord bot
├── shared/                      # Shared types/constants
├── docs/
│   ├── game-design/            # Moved exploration docs here
│   └── api/
├── docker-compose.yml          # Add TimescaleDB
└── migrations/                 # PostgreSQL migrations
```

This migration plan transforms Bridge into Dynasty Trader while preserving existing functionality and user data.
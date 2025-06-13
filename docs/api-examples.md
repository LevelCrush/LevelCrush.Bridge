# Dynasty Trader API Examples

## Authentication

### Register
```bash
POST /api/v2/auth/register
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "securepassword123"
}
```

### Login
```bash
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "securepassword123"
}

# Response:
{
  "user": {
    "id": "uuid",
    "email": "trader@example.com"
  },
  "tokens": {
    "access_token": "jwt...",
    "refresh_token": "jwt...",
    "expires_in": 3600
  }
}
```

## Dynasty Management

### Create Dynasty
```bash
POST /api/v2/dynasties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "House Goldwater",
  "motto": "Gold flows like water"
}
```

### Get My Dynasty
```bash
GET /api/v2/dynasties/me
Authorization: Bearer <token>

# Response:
{
  "id": "uuid",
  "name": "House Goldwater",
  "motto": "Gold flows like water",
  "generation": 1,
  "reputation": 100,
  "total_wealth": "1000.00",
  "founded_at": "2025-01-13T..."
}
```

## Character Management

### Create Character
```bash
POST /api/v2/characters
Authorization: Bearer <token>
Content-Type: application/json

{
  "dynasty_id": "uuid",
  "name": "Marcus Goldwater"
}

# Response includes randomized stats:
{
  "character": {
    "id": "uuid",
    "dynasty_id": "uuid",
    "name": "Marcus Goldwater",
    "birth_date": "2025-01-13T...",
    "health": 85,
    "stamina": 72,
    "charisma": 68,
    "intelligence": 91,
    "luck": 45,
    "is_alive": true,
    "generation": 1
  }
}
```

## Market System

### Get Regions
```bash
GET /api/v2/market/regions
Authorization: Bearer <token>

# Response:
{
  "regions": [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Capital City",
      "description": "The bustling heart of the empire...",
      "tax_rate": "15.0",
      "safety_level": 90,
      "prosperity_level": 95
    },
    ...
  ]
}
```

### Get Market Stats
```bash
GET /api/v2/market/regions/{region_id}/stats
Authorization: Bearer <token>

# Response:
{
  "stats": {
    "region_id": "uuid",
    "region_name": "Capital City",
    "total_listings": 42,
    "total_volume_24h": "15420.50",
    "average_prices": [],
    "trending_items": []
  }
}
```

## WebSocket Connection

### Connect and Subscribe
```javascript
// Connect with auth token
const ws = new WebSocket('ws://localhost:3113/ws/market', [authToken]);

// Subscribe to market updates for a region
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'market:a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
}));

// Subscribe to death events
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'deaths'
}));

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch(message.type) {
    case 'market_update':
      // Handle market changes
      break;
    case 'character_death':
      // Show death notification
      break;
  }
};
```

## Response Formats

### Success Response
```json
{
  "data_field": "...",
  "another_field": "..."
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided"
  }
}
```

## Common Headers

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Rate Limiting

Currently no rate limiting is implemented, but this may change in the future.
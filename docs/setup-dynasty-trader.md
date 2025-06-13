# Dynasty Trader Setup Guide

## Prerequisites

1. PostgreSQL with TimescaleDB extension installed
2. Rust toolchain
3. Access to PostgreSQL instance

## Database Setup

Dynasty Trader uses PostgreSQL with TimescaleDB for time-series market data. The default configuration expects:

- Host: localhost
- Port: 5433 (TimescaleDB)
- Username: timescale
- Password: timescale
- Database: dynasty_trader

### 1. Create the Database

```bash
PGPASSWORD=timescale psql -h localhost -p 5433 -U timescale -d postgres -c "CREATE DATABASE dynasty_trader;"
```

### 2. Run Migrations

Run the migrations in order:

```bash
# Initial schema
PGPASSWORD=timescale psql -h localhost -p 5433 -U timescale -d dynasty_trader -f migrations/postgres/001_initial_dynasty_schema.sql

# TimescaleDB setup
PGPASSWORD=timescale psql -h localhost -p 5433 -U timescale -d dynasty_trader -f migrations/postgres/002_timescaledb_setup.sql
```

Note: You may see errors about compression policies - these can be safely ignored.

### 3. Configure Environment

Copy the Dynasty Trader environment file:

```bash
cp .env.dynasty.example .env.dynasty
```

Or create `.env.dynasty` with:

```env
# Dynasty Trader Environment Configuration

# Database - TimescaleDB
DATABASE_URL=postgresql://timescale:timescale@localhost:5433/dynasty_trader
DATABASE_MAX_CONNECTIONS=100

# Server
HOST=0.0.0.0
PORT=3113

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production

# Logging
RUST_LOG=debug,sqlx=warn
LOG_DIR=logs

# Game Configuration
AGING_TICK_INTERVAL=3600
MARKET_UPDATE_INTERVAL=60
DEATH_CHECK_INTERVAL=300
```

### 4. Run the Server

```bash
cargo run --bin dynasty_trader
```

The server will start on port 3113 with:
- API v2 endpoints at `/api/v2/`
- Background tasks for character aging
- Dynasty wealth snapshot tracking

## API Endpoints

### Dynasty Management
- `POST /api/v2/dynasties` - Create a new dynasty
- `GET /api/v2/dynasties/me` - Get your dynasty
- `GET /api/v2/dynasties/me/stats` - Get dynasty statistics
- `GET /api/v2/dynasties/:id` - Get public dynasty info
- `GET /api/v2/dynasties/leaderboard?metric=wealth&limit=10` - Get leaderboard

### Character Management
- `POST /api/v2/characters` - Create a new character
- `GET /api/v2/characters` - List your dynasty's characters
- `GET /api/v2/characters/:id` - Get character details
- `GET /api/v2/characters/:id/stats` - Get character statistics
- `POST /api/v2/characters/:id/death` - Process character death

## Troubleshooting

### Migration Errors

If you see SQL syntax errors when running the server, ensure:
1. The database exists
2. Migrations have been run manually
3. You're connecting to the correct PostgreSQL instance (not MySQL)

### Background Task Errors

The aging and wealth snapshot tasks run automatically. If you see errors like "relation does not exist", ensure migrations have been run.

### Connection Issues

Verify your PostgreSQL/TimescaleDB connection:
```bash
PGPASSWORD=timescale psql -h localhost -p 5433 -U timescale -d dynasty_trader -c "\dt"
```

This should show all the Dynasty Trader tables.

## Development Notes

- The server currently skips automatic SQLx migrations to avoid conflicts with the MySQL migrations in the main `migrations/` folder
- Background tasks run on configurable intervals (see `.env.dynasty`)
- All financial calculations use `rust_decimal` for precision
- Character aging happens every hour by default
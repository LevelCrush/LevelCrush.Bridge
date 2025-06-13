# Dynasty Trader Migration Guide

This guide explains how to properly run and manage database migrations for Dynasty Trader.

## Overview

Dynasty Trader uses PostgreSQL with TimescaleDB for time-series market data. The migration system is designed to be idempotent and safe to run multiple times.

## Migration Files

All migrations are located in `migrations/postgres/` and follow the naming convention:
```
YYYYMMDDHHMMSS_description.sql
```

Current migrations:
1. `20240101000001_initial_dynasty_schema.sql` - Core tables for dynasties, characters, and markets
2. `20240101000002_timescaledb_setup.sql` - TimescaleDB hypertables and continuous aggregates
3. `20240101000003_items_and_seed_data.sql` - Item definitions and region seed data
4. `20240101000004_death_events.sql` - Death tracking and statistics

## Running Migrations

### Method 1: Using the Migration Script (Recommended)

```bash
# From project root
./scripts/run_dynasty_migrations.sh
```

This script:
- Loads environment from `.env.dynasty`
- Tracks migration status in `_sqlx_migrations` table
- Provides detailed progress and error reporting
- Safely skips already-applied migrations

### Method 2: Using SQLx CLI

```bash
# Install SQLx CLI
cargo install sqlx-cli --no-default-features --features postgres

# Run migrations
sqlx migrate run --source migrations/postgres
```

### Method 3: Manual with psql

```bash
# Run individual migration
psql $DATABASE_URL -f migrations/postgres/20240101000001_initial_dynasty_schema.sql

# Run all migrations in order
for f in migrations/postgres/*.sql; do psql $DATABASE_URL -f "$f"; done
```

## Migration Safety Features

### Idempotency
All migrations use safety checks:
- `CREATE TABLE IF NOT EXISTS`
- `INSERT ... ON CONFLICT DO NOTHING`
- `DO $$ BEGIN ... END$$` blocks for conditional operations

### TimescaleDB Compatibility
TimescaleDB-specific features use conditional creation:
```sql
SELECT create_hypertable('table_name', 'time_column', if_not_exists => TRUE);
```

### Error Handling
The migration script uses:
- `set -e` to exit on any error
- `ON_ERROR_STOP=1` for psql commands
- Transaction wrapping for atomic operations

## Common Issues and Solutions

### Issue: "type already exists" errors
**Solution**: The migrations use conditional creation for custom types:
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_name') THEN
        CREATE TYPE type_name AS ENUM (...);
    END IF;
END$$;
```

### Issue: TimescaleDB not installed
**Solution**: Install TimescaleDB extension:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### Issue: Migration already applied but not tracked
**Solution**: Manually add to tracking table:
```sql
INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time)
VALUES (20240101000001, 'initial_dynasty_schema', true, decode('checksum_here', 'hex'), 1000);
```

## Rollback Strategy

While rollback migrations aren't provided, you can:

1. **Restore from backup** (recommended)
2. **Manual rollback** for specific changes:
```sql
-- Example: Remove a table
DROP TABLE IF EXISTS table_name CASCADE;

-- Example: Remove a column
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
```

## Best Practices

1. **Always backup before migrations**:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Test migrations on a copy first**:
```bash
# Create test database
createdb dynasty_trader_test
pg_restore -d dynasty_trader_test < production_backup.sql

# Run migrations on test
DATABASE_URL=postgresql://user:pass@localhost/dynasty_trader_test ./scripts/run_dynasty_migrations.sh
```

3. **Check migration status**:
```sql
SELECT version, description, installed_on, success 
FROM _sqlx_migrations 
ORDER BY version;
```

## Adding New Migrations

1. Create new file with timestamp:
```bash
touch migrations/postgres/$(date +%Y%m%d%H%M%S)_description.sql
```

2. Follow safety patterns:
```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS ...

-- Use conditional columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns ...) THEN
        ALTER TABLE ... ADD COLUMN ...;
    END IF;
END$$;

-- Use ON CONFLICT for inserts
INSERT INTO ... VALUES ... ON CONFLICT DO NOTHING;
```

3. Test thoroughly before committing

## Environment Setup

Required environment variables in `.env.dynasty`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dynasty_trader
```

Optional for development:
```bash
DATABASE_TEST_URL=postgresql://user:password@localhost:5432/dynasty_trader_test
```

## Continuous Integration

The GitHub Actions workflow automatically:
1. Creates a test database with TimescaleDB
2. Runs all migrations
3. Executes the test suite
4. Validates migration integrity

See `.github/workflows/dynasty-trader-tests.yml` for details.
#!/bin/bash

# Dynasty Trader Migration Script
# This script runs all PostgreSQL migrations for Dynasty Trader

set -e  # Exit on error

echo "🚀 Dynasty Trader Migration Script"
echo "=================================="

# Load environment variables
if [ -f .env.dynasty ]; then
    export $(cat .env.dynasty | grep -v '^#' | xargs)
    echo "✓ Loaded .env.dynasty"
else
    echo "❌ .env.dynasty file not found!"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.dynasty!"
    exit 1
fi

echo "📊 Database: $DATABASE_URL"
echo ""

# Function to run a migration file
run_migration() {
    local file=$1
    local name=$(basename $file)
    echo "Running migration: $name"
    
    # Use psql to run the migration
    psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1
    
    if [ $? -eq 0 ]; then
        echo "✓ $name completed successfully"
    else
        echo "❌ $name failed!"
        exit 1
    fi
    echo ""
}

# Create migrations table if it doesn't exist
echo "Creating migrations tracking table..."
psql "$DATABASE_URL" <<EOF
CREATE TABLE IF NOT EXISTS _sqlx_migrations (
    version BIGINT PRIMARY KEY,
    description TEXT NOT NULL,
    installed_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    checksum BYTEA NOT NULL,
    execution_time BIGINT NOT NULL
);
EOF

# Run each migration in order
for migration in migrations/postgres/2024*.sql; do
    if [ -f "$migration" ]; then
        # Extract version from filename (first 14 digits)
        version=$(basename "$migration" | grep -o '^[0-9]\{14\}')
        
        # Check if migration has already been run
        exists=$(psql "$DATABASE_URL" -t -c "SELECT 1 FROM _sqlx_migrations WHERE version = $version" 2>/dev/null || echo "0")
        
        if [ "$exists" = " 1" ]; then
            echo "⏭️  Skipping $migration (already applied)"
        else
            # Run the migration
            start_time=$(date +%s%N)
            run_migration "$migration"
            end_time=$(date +%s%N)
            execution_time=$(( ($end_time - $start_time) / 1000000 ))
            
            # Calculate checksum
            checksum=$(sha256sum "$migration" | cut -d' ' -f1)
            
            # Record the migration
            description=$(basename "$migration" .sql | cut -d'_' -f2-)
            psql "$DATABASE_URL" <<EOF
INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time)
VALUES ($version, '$description', true, decode('$checksum', 'hex'), $execution_time);
EOF
            echo "✓ Recorded migration $version in _sqlx_migrations"
        fi
    fi
done

echo ""
echo "🎉 All migrations completed successfully!"
echo ""

# Show current migration status
echo "Current migration status:"
psql "$DATABASE_URL" -c "SELECT version, description, installed_on FROM _sqlx_migrations ORDER BY version;"
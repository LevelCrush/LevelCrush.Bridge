#!/bin/bash

# Bridge startup script

echo "🚀 Starting Bridge API Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
    exit 1
fi

# Run database migrations
echo "📊 Running database migrations..."
cargo run --bin migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

# Start the server
echo "🎮 Starting Bridge server on http://localhost:3000"
cargo run

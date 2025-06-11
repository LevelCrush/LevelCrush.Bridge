# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) for working with the **Bridge** project.

## Project Overview

**Bridge** is a Rust-based RESTful API server designed to unify user interactions across multiple games. It acts as a centralized service for user inventory, trading, social networks, and reward systems.

## Quick Start

```bash
# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
cargo run --bin migrate

# Run the application
cargo run --bin bridge

# Format & lint before commit
cargo fmt && cargo clippy
```

## Server Configuration

- **Default Port**: 3113 (configurable in .env)
- **API Base URL**: http://localhost:3113/api/v1
- **Database**: MariaDB/MySQL on localhost:3306

## Development Commands

```bash
cargo build              # Build the project
cargo run --bin bridge   # Run the main application
cargo run --bin migrate  # Run database migrations
cargo run --bin test_db  # Test database connection
cargo check              # Quick compilation check
cargo fmt                # Format code
cargo clippy             # Lint the code
cargo test               # Run tests
cargo doc --open         # Generate documentation
```

## Available Binaries

- **bridge**: Main API server application
- **migrate**: Database migration runner
- **test_db**: Database connection tester

## Architecture & Key Components

### Tech Stack

- **Language**: Rust (Edition 2021)
- **Framework**: Axum 0.7 (REST API framework)
- **Database**: MariaDB/MySQL with SQLx
- **Auth**: Standard Email/Password (Argon2) and Discord OAuth
- **Secrets**: Stored in the database (only DB credentials live in `.env`)
- **Runtime**: Tokio (async runtime)

### Core Modules

- **User Management**
  - Login via email/password or Discord
  - Avatars, linked games, user profiles
  - Messaging between users

- **Inventory System**
  - Items with rarity, modifiers, and credit value
  - Modifiers are **roguelike** in nature, with effects randomly selected from a categorized perk pool
  - Inventory and rewards per user
  - Trading system for direct player-to-player item exchange

- **Social Graph**
  - Friends, clans, and traders
  - Clan federation and clan-based ranks
  - Clan-shared inventories

- **Marketplace**
  - Auction House for open trades
  - Clan auto-listing integration
  - Public vs Clan-locked traders

### Security

- Secrets and configuration (besides DB login) stored securely in the database
- .env file only contains database connection information

## File & Directory Guidelines

```
src/
├── api/         # Route handlers
├── db/          # Database models and queries
├── auth/        # Authentication providers
├── models/      # Core domain models (User, InventoryItem, Clan, etc.)
├── services/    # Business logic
├── utils/       # Helper utilities
main.rs          # Entrypoint
```

## Database Schema

The database uses the following main tables:
- `users` - User accounts and profiles
- `inventory_items` - Item definitions with base stats
- `user_inventory` - User-owned items with modifiers
- `item_modifiers` - Roguelike modifiers and perks
- `clans` - Clan information
- `clan_members` - Clan membership and ranks
- `trades` - Active trades between players
- `marketplace_listings` - Auction house listings
- `messages` - User-to-user messages
- `app_secrets` - Application configuration and secrets

## API Endpoints Structure

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password

### Protected Endpoints (Require JWT)
- `/api/v1/users/*` - User management
  - `GET /api/v1/users/me` - Get current user
  - `GET /api/v1/users/:id` - Get user by ID
- `/api/v1/inventory/*` - Inventory operations
  - `GET /api/v1/inventory` - Get user inventory
  - `GET /api/v1/inventory/items` - Get available items
- `/api/v1/trading/*` - Trading system
  - `GET /api/v1/trading` - Get user trades
  - `GET /api/v1/trading/active` - Get active trades
- `/api/v1/clans/*` - Clan management
  - `GET /api/v1/clans` - List clans
  - `GET /api/v1/clans/my` - Get user's clan
- `/api/v1/marketplace/*` - Auction house
  - `GET /api/v1/marketplace` - Get listings
  - `GET /api/v1/marketplace/my` - Get user's listings
- `/api/v1/messages/*` - Messaging system
  - `GET /api/v1/messages` - Get messages
  - `GET /api/v1/messages/unread` - Get unread count

## Contribution Checklist

- [ ] Code formatted with `cargo fmt`
- [ ] Passes `cargo clippy` with no major warnings
- [ ] No secrets in `.env` other than DB connection info
- [ ] Unit tests for each new feature
- [ ] Database migrations are clearly documented
- [ ] API endpoints follow RESTful conventions
- [ ] Error responses use consistent format

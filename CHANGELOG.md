# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Axum 0.7 web framework
- Database integration with SQLx 0.7 and MariaDB/MySQL
- Core domain models for users, inventory, clans, and trading
- Authentication system with email/password support
- JWT-based authentication with automatic secret generation
- Database migration system with automatic execution
- 19 database tables for complete feature support
- User registration and login endpoints
- Middleware for JWT authentication on protected routes
- Comprehensive error handling with consistent JSON responses
- Structured logging with tracing
- Environment-based configuration
- Development utilities (test_db binary for connection testing)
- API request examples in HTTP format
- Startup script for easy development

### Technical Details
- Rust 2021 edition
- Tokio async runtime
- Rustls for TLS (avoiding OpenSSL dependencies)
- Foreign key constraint handling in migrations
- Automatic database charset configuration

### Security
- Secure password hashing with Argon2
- JWT tokens with 7-day expiration
- Database-stored secrets management
- CORS configuration for API endpoints
- Environment variable protection for database credentials

### To Do
- Discord OAuth integration
- Full implementation of inventory endpoints
- Trading system logic
- Clan management features
- Marketplace auction system
- Message delivery system
- WebSocket support for real-time features
- Rate limiting
- API documentation generation
- Integration tests

## [0.1.0] - TBD

- Initial release pending full endpoint implementation
use sqlx::{MySqlPool, PgPool};
use std::sync::Arc;

// Original AppState for MySQL (Bridge)
pub struct AppState {
    pub db: MySqlPool,
    pub jwt_secret: String,
}

// New AppState for PostgreSQL (Dynasty Trader)
pub struct PgAppState {
    pub db: PgPool,
    pub jwt_secret: String,
}

// Type alias for clarity
pub type DynastyAppState = PgAppState;
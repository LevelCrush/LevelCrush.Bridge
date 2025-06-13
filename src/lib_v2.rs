pub mod api;
pub mod auth;
pub mod db;
pub mod models;
pub mod services;
pub mod utils;

use sqlx::{Database, Pool};

// Generic AppState that can work with any database
pub struct AppState<DB: Database> {
    pub db: Pool<DB>,
    pub jwt_secret: String,
}

// Type aliases for convenience
pub type MySqlAppState = AppState<sqlx::MySql>;
pub type PostgresAppState = AppState<sqlx::Postgres>;

pub use utils::AppError;
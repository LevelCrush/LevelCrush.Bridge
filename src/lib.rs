pub mod api;
pub mod auth;
pub mod db;
pub mod models;
pub mod services;
pub mod utils;

pub struct AppState {
    pub db: sqlx::MySqlPool,
    pub jwt_secret: String,
}

pub use utils::AppError;
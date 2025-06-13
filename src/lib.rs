pub mod api;
pub mod app_state;
pub mod app_state_v2;
pub mod auth;
pub mod db;
pub mod models;
pub mod services;
pub mod utils;
pub mod tasks;

pub struct AppState {
    pub db: sqlx::MySqlPool,
    pub jwt_secret: String,
}

pub use utils::AppError;
pub use app_state_v2::DynastyTraderState;
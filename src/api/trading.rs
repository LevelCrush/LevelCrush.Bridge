use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_trades))
        .route("/active", get(get_active_trades))
}

async fn get_trades() -> &'static str {
    "Get user trades endpoint"
}

async fn get_active_trades() -> &'static str {
    "Get active trades endpoint"
}

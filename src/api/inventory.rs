use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_inventory))
        .route("/items", get(get_items))
}

async fn get_inventory() -> &'static str {
    "Get user inventory endpoint"
}

async fn get_items() -> &'static str {
    "Get available items endpoint"
}

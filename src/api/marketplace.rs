use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_listings))
        .route("/my", get(get_my_listings))
}

async fn get_listings() -> &'static str {
    "Get marketplace listings endpoint"
}

async fn get_my_listings() -> &'static str {
    "Get user's listings endpoint"
}

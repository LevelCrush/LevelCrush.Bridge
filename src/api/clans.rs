use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_clans))
        .route("/my", get(get_my_clan))
}

async fn get_clans() -> &'static str {
    "Get clans endpoint"
}

async fn get_my_clan() -> &'static str {
    "Get user's clan endpoint"
}

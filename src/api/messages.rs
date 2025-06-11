use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_messages))
        .route("/unread", get(get_unread_count))
}

async fn get_messages() -> &'static str {
    "Get messages endpoint"
}

async fn get_unread_count() -> &'static str {
    "Get unread message count endpoint"
}

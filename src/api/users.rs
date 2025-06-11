use axum::{routing::get, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/me", get(get_current_user))
        .route("/:id", get(get_user))
}

async fn get_current_user() -> &'static str {
    "Get current user endpoint"
}

async fn get_user() -> &'static str {
    "Get user by ID endpoint"
}

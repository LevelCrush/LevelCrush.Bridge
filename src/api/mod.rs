mod auth;
mod clans;
mod inventory;
mod marketplace;
mod messages;
mod middleware;
mod trading;
mod users;

use axum::{middleware as axum_middleware, Router};
use std::sync::Arc;

use crate::AppState;

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        // Public routes
        .nest("/auth", auth::routes())
        // Protected routes
        .nest("/users", users::routes())
        .nest("/inventory", inventory::routes())
        .nest("/trading", trading::routes())
        .nest("/clans", clans::routes())
        .nest("/marketplace", marketplace::routes())
        .nest("/messages", messages::routes())
        // Add authentication middleware to protected routes
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::auth_middleware,
        ))
        .with_state(state)
}

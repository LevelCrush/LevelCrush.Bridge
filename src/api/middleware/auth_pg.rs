use axum::http::HeaderMap;
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;
use std::sync::Arc;

use crate::utils::{self};

/// PostgreSQL-specific auth middleware
pub async fn auth_middleware_pg(
    State(_pool): State<Arc<PgPool>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let headers = request.headers();

    // Skip auth for public routes
    if request.uri().path().starts_with("/api/v2/dynasties/leaderboard") 
        || request.uri().path().starts_with("/api/v2/dynasties/") && !request.uri().path().contains("/me") {
        return Ok(next.run(request).await);
    }

    // Extract token from Authorization header
    let token = extract_token(headers).ok_or(StatusCode::UNAUTHORIZED)?;

    // Get JWT secret from environment for now
    // TODO: Store in database or config
    let jwt_secret = std::env::var("JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Validate token
    let claims = utils::validate_jwt(&token, &jwt_secret).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

fn extract_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| {
            if value.starts_with("Bearer ") {
                Some(value[7..].to_string())
            } else {
                None
            }
        })
}
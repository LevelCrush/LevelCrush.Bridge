use axum::http::HeaderMap;
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::{utils, AppState};

#[derive(Clone)]
pub struct AuthUser {
    pub user_id: String,
}

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let headers = request.headers();

    // Skip auth for auth routes
    if request.uri().path().starts_with("/api/v1/auth") {
        return Ok(next.run(request).await);
    }

    // Extract token from Authorization header
    let token = extract_token(headers).ok_or(StatusCode::UNAUTHORIZED)?;

    // Validate token
    let claims =
        utils::validate_jwt(&token, &state.jwt_secret).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add user info to request extensions
    request.extensions_mut().insert(AuthUser {
        user_id: claims.sub,
    });

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

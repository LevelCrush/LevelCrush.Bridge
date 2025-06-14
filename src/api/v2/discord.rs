use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::utils::{AppError, Claims};

#[derive(Debug, Deserialize)]
pub struct LinkDiscordRequest {
    pub user_id: Uuid,
    pub discord_id: String,
}

#[derive(Debug, Serialize)]
pub struct LinkDiscordResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct DiscordCallbackQuery {
    pub code: String,
    pub state: String,
}

/// Link a Discord account to a Dynasty Trader user
pub async fn link_discord_account(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<LinkDiscordRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::BadRequest("Invalid user ID".to_string()))?;
    
    // Verify the user is linking their own account
    if user_id != payload.user_id {
        return Err(AppError::BadRequest("Unauthorized".to_string()));
    }

    // Check if Discord ID is already linked
    let existing = sqlx::query!(
        "SELECT id FROM users WHERE discord_id = $1",
        payload.discord_id
    )
    .fetch_optional(pool.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if let Some(existing_user) = existing {
        if existing_user.id != user_id {
            return Ok((
                StatusCode::BAD_REQUEST,
                Json(LinkDiscordResponse {
                    success: false,
                    message: "This Discord account is already linked to another user".to_string(),
                }),
            ));
        }
    }

    // Update user with Discord ID
    sqlx::query!(
        "UPDATE users SET discord_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        payload.discord_id,
        user_id
    )
    .execute(pool.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((
        StatusCode::OK,
        Json(LinkDiscordResponse {
            success: true,
            message: "Discord account linked successfully".to_string(),
        }),
    ))
}

/// Get user by Discord ID (for bot to verify linked accounts)
pub async fn get_user_by_discord_id(
    State(pool): State<Arc<PgPool>>,
    Path(discord_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    #[derive(Serialize)]
    struct UserResponse {
        id: Uuid,
        email: String,
        discord_id: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
    }

    let user = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, email, discord_id, created_at, updated_at
        FROM users
        WHERE discord_id = $1
        "#,
        discord_id
    )
    .fetch_optional(pool.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    match user {
        Some(user) => Ok((StatusCode::OK, Json(user))),
        None => Err(AppError::NotFound),
    }
}

/// Unlink Discord account
pub async fn unlink_discord_account(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::BadRequest("Invalid user ID".to_string()))?;

    sqlx::query!(
        "UPDATE users SET discord_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        user_id
    )
    .execute(pool.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((
        StatusCode::OK,
        Json(LinkDiscordResponse {
            success: true,
            message: "Discord account unlinked successfully".to_string(),
        }),
    ))
}

/// OAuth2 callback handler for Discord bot
pub async fn discord_oauth_callback(
    Query(params): Query<DiscordCallbackQuery>,
) -> Result<impl IntoResponse, AppError> {
    // In a real implementation, you would:
    // 1. Verify the state parameter matches what was sent
    // 2. Exchange the code for an access token
    // 3. Get the user info from Dynasty Trader API
    // 4. Send the result back to the Discord bot
    
    // For now, return a simple success page
    Ok((
        StatusCode::OK,
        r#"
        <html>
        <head>
            <title>Dynasty Trader - Discord Link</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #1a1a1a;
                    color: #ffffff;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background-color: #2a2a2a;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                }
                h1 { color: #b45fff; }
                p { margin: 1rem 0; }
                .success { color: #4ade80; }
                .error { color: #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Dynasty Trader</h1>
                <p class="success">✅ Discord account linked successfully!</p>
                <p>You can now close this window and return to Discord.</p>
            </div>
        </body>
        </html>
        "#,
    ))
}
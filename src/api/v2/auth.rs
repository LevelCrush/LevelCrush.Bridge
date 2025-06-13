use crate::models::User;
use crate::utils::{AppError, hash_password, verify_password, generate_tokens, Claims};
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    Extension,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub tokens: TokenResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

pub async fn register(
    State(pool): State<Arc<PgPool>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), AppError> {
    // Validate input
    if payload.email.is_empty() || payload.username.is_empty() || payload.password.len() < 8 {
        return Err(AppError::BadRequest("Invalid input".to_string()));
    }

    // Check if user already exists
    let existing_user = sqlx::query!(
        r#"
        SELECT id FROM users WHERE email = $1 OR username = $2
        "#,
        payload.email,
        payload.username
    )
    .fetch_optional(pool.as_ref())
    .await?;

    if existing_user.is_some() {
        return Err(AppError::BadRequest("User already exists".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&payload.password)?;

    // Create user
    let user_id = Uuid::new_v4();
    sqlx::query!(
        r#"
        INSERT INTO users (id, email, username, password_hash)
        VALUES ($1, $2, $3, $4)
        "#,
        user_id,
        payload.email,
        payload.username,
        password_hash
    )
    .execute(pool.as_ref())
    .await?;
    
    // Fetch the created user
    let user = sqlx::query!(
        r#"
        SELECT id, username, email, password_hash, discord_id, discord_username, discord_avatar,
               created_at, updated_at, last_login, is_active, email_verified, 
               verification_token, reset_token, reset_token_expires
        FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(pool.as_ref())
    .await?;
    
    let user = User {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        discord_id: user.discord_id,
        discord_username: user.discord_username,
        discord_avatar: user.discord_avatar,
        created_at: user.created_at.unwrap_or_else(Utc::now),
        updated_at: user.updated_at.unwrap_or_else(Utc::now),
        last_login: user.last_login,
        is_active: user.is_active.unwrap_or(true),
        email_verified: user.email_verified.unwrap_or(false),
        verification_token: user.verification_token,
        reset_token: user.reset_token,
        reset_token_expires: user.reset_token_expires,
    };

    // Generate tokens
    let (access_token, refresh_token, expires_in) = generate_tokens(user.id.to_string())?;

    // Store refresh token
    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')
        "#,
        user.id,
        refresh_token
    )
    .execute(pool.as_ref())
    .await?;

    let response = AuthResponse {
        user: user.into(),
        tokens: TokenResponse {
            access_token,
            refresh_token,
            expires_in,
        },
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn login(
    State(pool): State<Arc<PgPool>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Find user by email
    let user_row = sqlx::query!(
        r#"
        SELECT id, username, email, password_hash, discord_id, discord_username, discord_avatar,
               created_at, updated_at, last_login, is_active, email_verified, 
               verification_token, reset_token, reset_token_expires
        FROM users WHERE email = $1
        "#,
        payload.email
    )
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::Authentication("Invalid credentials".to_string()))?;
    
    let user = User {
        id: user_row.id,
        username: user_row.username,
        email: user_row.email,
        password_hash: user_row.password_hash,
        discord_id: user_row.discord_id,
        discord_username: user_row.discord_username,
        discord_avatar: user_row.discord_avatar,
        created_at: user_row.created_at.unwrap_or_else(Utc::now),
        updated_at: user_row.updated_at.unwrap_or_else(Utc::now),
        last_login: user_row.last_login,
        is_active: user_row.is_active.unwrap_or(true),
        email_verified: user_row.email_verified.unwrap_or(false),
        verification_token: user_row.verification_token,
        reset_token: user_row.reset_token,
        reset_token_expires: user_row.reset_token_expires,
    };

    // Verify password
    if !verify_password(&payload.password, &user.password_hash)? {
        return Err(AppError::Authentication("Invalid credentials".to_string()));
    }

    // Generate tokens
    let (access_token, refresh_token, expires_in) = generate_tokens(user.id.to_string())?;

    // Store refresh token
    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')
        "#,
        user.id,
        refresh_token
    )
    .execute(pool.as_ref())
    .await?;

    let response = AuthResponse {
        user: user.into(),
        tokens: TokenResponse {
            access_token,
            refresh_token,
            expires_in,
        },
    };

    Ok(Json(response))
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub async fn refresh_token(
    State(pool): State<Arc<PgPool>>,
    Json(payload): Json<RefreshRequest>,
) -> Result<Json<Value>, AppError> {
    // Verify refresh token exists and is valid
    let token_record = sqlx::query!(
        r#"
        SELECT user_id FROM refresh_tokens 
        WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND revoked_at IS NULL
        "#,
        payload.refresh_token
    )
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::Authentication("Invalid credentials".to_string()))?;

    // Revoke old refresh token
    sqlx::query!(
        r#"
        UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1
        "#,
        payload.refresh_token
    )
    .execute(pool.as_ref())
    .await?;

    // Generate new tokens
    let (access_token, refresh_token, expires_in) = generate_tokens(token_record.user_id.to_string())?;

    // Store new refresh token
    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')
        "#,
        token_record.user_id,
        refresh_token
    )
    .execute(pool.as_ref())
    .await?;

    Ok(Json(json!({
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in,
        }
    })))
}

pub async fn logout(
    State(pool): State<Arc<PgPool>>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, AppError> {
    // Revoke all refresh tokens for the user
    sqlx::query!(
        r#"
        UPDATE refresh_tokens 
        SET revoked_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND revoked_at IS NULL
        "#,
        claims.sub.parse::<Uuid>().map_err(|_| AppError::Authentication("Invalid user ID".to_string()))?
    )
    .execute(pool.as_ref())
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn verify_token() -> StatusCode {
    // If we get here, the auth middleware has already validated the token
    StatusCode::OK
}
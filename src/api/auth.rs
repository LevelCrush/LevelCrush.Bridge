use axum::{extract::State, routing::post, Json, Router};
use std::sync::Arc;

use crate::{
    models::{CreateUserRequest, LoginRequest, LoginResponse, User},
    utils::{self, errors::Result},
    AppState,
};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
}

async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<LoginResponse>> {
    // Validate request
    use validator::Validate;
    payload
        .validate()
        .map_err(|e| utils::AppError::Validation(e.to_string()))?;

    // Hash password
    let password_hash = utils::hash_password(&payload.password)?;

    // Create user
    let user = User::new(payload.email, payload.username, password_hash);

    // Save to database
    sqlx::query(
        "INSERT INTO users (id, email, username, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&user.id)
    .bind(&user.email)
    .bind(&user.username)
    .bind(&user.password_hash)
    .bind(&user.avatar_url)
    .execute(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("Duplicate entry") {
            utils::AppError::Conflict("User with this email or username already exists".to_string())
        } else {
            utils::AppError::Database(e)
        }
    })?;

    // Generate JWT
    let token = utils::generate_jwt(&user.id, &state.jwt_secret)?;

    Ok(Json(LoginResponse { user, token }))
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Find user by email
    let user: User = sqlx::query_as("SELECT * FROM users WHERE email = ? AND is_active = true")
        .bind(&payload.email)
        .fetch_one(&state.db)
        .await
        .map_err(|_| utils::AppError::Authentication("Invalid email or password".to_string()))?;

    // Verify password
    if !utils::verify_password(&payload.password, &user.password_hash)? {
        return Err(utils::AppError::Authentication(
            "Invalid email or password".to_string(),
        ));
    }

    // Update last login
    sqlx::query("UPDATE users SET last_login = NOW() WHERE id = ?")
        .bind(&user.id)
        .execute(&state.db)
        .await?;

    // Generate JWT
    let token = utils::generate_jwt(&user.id, &state.jwt_secret)?;

    Ok(Json(LoginResponse { user, token }))
}

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Conflict: {0}")]
    Conflict(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type) = match &self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "database_error"),
            AppError::Validation(_) => (StatusCode::BAD_REQUEST, "validation_error"),
            AppError::Authentication(_) => (StatusCode::UNAUTHORIZED, "authentication_error"),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "not_found"),
            AppError::Forbidden(_) => (StatusCode::FORBIDDEN, "forbidden"),
            AppError::BadRequest(_) => (StatusCode::BAD_REQUEST, "bad_request"),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "internal_error"),
            AppError::Conflict(_) => (StatusCode::CONFLICT, "conflict"),
        };

        let body = Json(ErrorResponse {
            error: error_type.to_string(),
            message: self.to_string(),
        });

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;

// Convenience functions
impl AppError {
    pub fn not_found(entity: &str) -> Self {
        AppError::NotFound(format!("{} not found", entity))
    }

    pub fn forbidden(reason: &str) -> Self {
        AppError::Forbidden(reason.to_string())
    }

    pub fn bad_request(reason: &str) -> Self {
        AppError::BadRequest(reason.to_string())
    }

    pub fn internal(reason: &str) -> Self {
        AppError::Internal(reason.to_string())
    }
}

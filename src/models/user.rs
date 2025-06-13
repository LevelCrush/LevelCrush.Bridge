use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub discord_id: Option<String>,
    pub discord_username: Option<String>,
    pub discord_avatar: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub email_verified: bool,
    pub verification_token: Option<String>,
    pub reset_token: Option<String>,
    pub reset_token_expires: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(length(min = 8))]
    pub password: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserSession {
    pub id: String,
    pub user_id: String,
    pub token_hash: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub last_used: DateTime<Utc>,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGame {
    pub id: i32,
    pub user_id: String,
    pub game_name: String,
    pub game_user_id: Option<String>,
    pub linked_at: DateTime<Utc>,
    pub last_synced: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConnectionType {
    Friend,
    Trader,
    Blocked,
}

impl From<String> for ConnectionType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "friend" => ConnectionType::Friend,
            "trader" => ConnectionType::Trader,
            "blocked" => ConnectionType::Blocked,
            _ => ConnectionType::Friend,
        }
    }
}

impl ToString for ConnectionType {
    fn to_string(&self) -> String {
        match self {
            ConnectionType::Friend => "friend".to_string(),
            ConnectionType::Trader => "trader".to_string(),
            ConnectionType::Blocked => "blocked".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserConnection {
    pub id: i32,
    pub user_id: String,
    pub connected_user_id: String,
    pub connection_type: ConnectionType,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn new(email: String, username: String, password_hash: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            email,
            username,
            password_hash,
            discord_id: None,
            discord_username: None,
            discord_avatar: None,
            created_at: now,
            updated_at: now,
            last_login: None,
            is_active: true,
            email_verified: false,
            verification_token: None,
            reset_token: None,
            reset_token_expires: None,
        }
    }
}

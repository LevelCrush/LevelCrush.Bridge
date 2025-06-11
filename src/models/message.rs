use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: String,
    pub sender_id: String,
    pub recipient_id: String,
    pub subject: Option<String>,
    pub content: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageWithUsers {
    pub message: Message,
    pub sender_username: String,
    pub sender_avatar: Option<String>,
    pub recipient_username: String,
    pub recipient_avatar: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateMessageRequest {
    pub recipient_id: String,
    #[validate(length(max = 255))]
    pub subject: Option<String>,
    #[validate(length(min = 1, max = 5000))]
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageFilter {
    pub unread_only: Option<bool>,
    pub sender_id: Option<String>,
    pub search_term: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkAsReadRequest {
    pub message_ids: Vec<String>,
}

impl Message {
    pub fn new(
        sender_id: String,
        recipient_id: String,
        subject: Option<String>,
        content: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            sender_id,
            recipient_id,
            subject,
            content,
            is_read: false,
            created_at: Utc::now(),
            read_at: None,
        }
    }

    pub fn mark_as_read(&mut self) {
        if !self.is_read {
            self.is_read = true;
            self.read_at = Some(Utc::now());
        }
    }
}

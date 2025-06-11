use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeStatus {
    Pending,
    Accepted,
    Rejected,
    Cancelled,
    Completed,
}

impl From<String> for TradeStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "pending" => TradeStatus::Pending,
            "accepted" => TradeStatus::Accepted,
            "rejected" => TradeStatus::Rejected,
            "cancelled" => TradeStatus::Cancelled,
            "completed" => TradeStatus::Completed,
            _ => TradeStatus::Pending,
        }
    }
}

impl ToString for TradeStatus {
    fn to_string(&self) -> String {
        match self {
            TradeStatus::Pending => "pending".to_string(),
            TradeStatus::Accepted => "accepted".to_string(),
            TradeStatus::Rejected => "rejected".to_string(),
            TradeStatus::Cancelled => "cancelled".to_string(),
            TradeStatus::Completed => "completed".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Trade {
    pub id: String,
    pub initiator_id: String,
    pub recipient_id: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TradeItem {
    pub id: i32,
    pub trade_id: String,
    pub user_item_id: String,
    pub offered_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeWithItems {
    pub trade: Trade,
    pub initiator_items: Vec<crate::models::UserInventoryWithDetails>,
    pub recipient_items: Vec<crate::models::UserInventoryWithDetails>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTradeRequest {
    pub recipient_id: String,
    pub offered_items: Vec<String>, // user_item_ids
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTradeRequest {
    pub offered_items: Vec<String>, // user_item_ids
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RespondToTradeRequest {
    pub action: TradeAction,
    pub counter_items: Option<Vec<String>>, // user_item_ids for counter-offer
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeAction {
    Accept,
    Reject,
    Counter,
}

impl Trade {
    pub fn new(initiator_id: String, recipient_id: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            initiator_id,
            recipient_id,
            status: TradeStatus::Pending.to_string(),
            created_at: now,
            updated_at: now,
            completed_at: None,
        }
    }

    pub fn can_be_modified(&self) -> bool {
        matches!(TradeStatus::from(self.status.clone()), TradeStatus::Pending)
    }

    pub fn can_be_accepted(&self) -> bool {
        matches!(TradeStatus::from(self.status.clone()), TradeStatus::Pending)
    }
}

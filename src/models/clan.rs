use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Clan {
    pub id: String,
    pub name: String,
    pub tag: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub federation_id: Option<String>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub max_members: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ClanRank {
    Leader,
    Officer,
    Member,
}

impl From<String> for ClanRank {
    fn from(s: String) -> Self {
        match s.as_str() {
            "Leader" => ClanRank::Leader,
            "Officer" => ClanRank::Officer,
            _ => ClanRank::Member,
        }
    }
}

impl ToString for ClanRank {
    fn to_string(&self) -> String {
        match self {
            ClanRank::Leader => "Leader".to_string(),
            ClanRank::Officer => "Officer".to_string(),
            ClanRank::Member => "Member".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ClanMember {
    pub id: i32,
    pub clan_id: String,
    pub user_id: String,
    pub rank: String,
    pub joined_at: DateTime<Utc>,
    pub contribution_points: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClanMemberWithUser {
    pub id: i32,
    pub clan_id: String,
    pub user_id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub rank: ClanRank,
    pub joined_at: DateTime<Utc>,
    pub contribution_points: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ClanInventory {
    pub id: String,
    pub clan_id: String,
    pub item_id: i32,
    pub deposited_by: String,
    pub deposited_at: DateTime<Utc>,
    pub min_rank_to_withdraw: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateClanRequest {
    #[validate(length(min = 3, max = 100))]
    pub name: String,
    #[validate(length(min = 2, max = 10))]
    pub tag: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub max_members: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateClanRequest {
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub max_members: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InviteMemberRequest {
    pub user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMemberRankRequest {
    pub user_id: String,
    pub rank: ClanRank,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepositItemRequest {
    pub user_item_id: String,
    pub min_rank_to_withdraw: Option<ClanRank>,
}

impl Clan {
    pub fn new(name: String, tag: String, created_by: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            tag,
            description: None,
            icon_url: None,
            federation_id: None,
            created_by,
            created_at: now,
            updated_at: now,
            is_active: true,
            max_members: 50,
        }
    }
}

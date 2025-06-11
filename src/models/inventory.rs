use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ItemRarity {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub weight: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ModifierCategory {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ItemModifier {
    pub id: i32,
    pub category_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub effect_type: String,
    pub effect_value: f64,
    pub tier: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InventoryItem {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub item_type: String,
    pub rarity_id: i32,
    pub base_credit_value: i32,
    pub max_modifiers: i32,
    pub icon_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserInventory {
    pub id: String,
    pub user_id: String,
    pub item_id: i32,
    pub acquired_at: DateTime<Utc>,
    pub is_tradeable: bool,
    pub is_equipped: bool,
    pub custom_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInventoryWithDetails {
    pub id: String,
    pub user_id: String,
    pub item: InventoryItem,
    pub rarity: ItemRarity,
    pub modifiers: Vec<AppliedModifier>,
    pub acquired_at: DateTime<Utc>,
    pub is_tradeable: bool,
    pub is_equipped: bool,
    pub custom_name: Option<String>,
    pub total_credit_value: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserItemModifier {
    pub id: i32,
    pub user_item_id: String,
    pub modifier_id: i32,
    pub modifier_tier: i32,
    pub applied_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppliedModifier {
    pub modifier: ItemModifier,
    pub tier: i32,
    pub applied_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateItemRequest {
    pub name: String,
    pub description: Option<String>,
    pub item_type: String,
    pub rarity_id: i32,
    pub base_credit_value: i32,
    pub max_modifiers: i32,
    pub icon_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrantItemRequest {
    pub user_id: String,
    pub item_id: i32,
    pub modifiers: Option<Vec<ModifierApplication>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModifierApplication {
    pub modifier_id: i32,
    pub tier: i32,
}

impl UserInventory {
    pub fn new(user_id: String, item_id: i32) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            item_id,
            acquired_at: Utc::now(),
            is_tradeable: true,
            is_equipped: false,
            custom_name: None,
        }
    }
}

impl UserInventoryWithDetails {
    pub fn calculate_credit_value(&self) -> i32 {
        let base_value = self.item.base_credit_value as f64;
        let modifier_multiplier = self
            .modifiers
            .iter()
            .filter(|m| m.modifier.effect_type == "credit_multiplier")
            .fold(1.0, |acc, m| acc * (1.0 + m.modifier.effect_value / 100.0));

        (base_value * modifier_multiplier) as i32
    }
}

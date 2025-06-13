use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Represents an item that can be traded
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Item {
    pub id: Uuid,
    pub name: String,
    pub category: String,
    pub base_price: Decimal,
    pub weight: i32,
    pub perishable: bool,
    pub rarity: MarketItemRarity,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "item_rarity", rename_all = "lowercase")]
pub enum MarketItemRarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

/// A market listing in a specific region
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketListing {
    pub id: Uuid,
    pub region_id: Uuid,
    pub item_id: Uuid,
    pub seller_character_id: Option<Uuid>,
    pub price: Decimal,
    pub quantity: i32,
    pub original_quantity: i32,
    pub listed_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub is_ghost_listing: bool,
    pub ghost_price_modifier: Decimal,
}

/// Historical price data for market analysis
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketPrice {
    pub time: DateTime<Utc>,
    pub region_id: Uuid,
    pub item_id: Uuid,
    pub avg_price: Decimal,
    pub min_price: Decimal,
    pub max_price: Decimal,
    pub volume: i32,
    pub volatility: Option<Decimal>,
}

/// A region where trading occurs
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Region {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub tax_rate: Decimal,
    pub safety_level: i32,
    pub prosperity_level: i32,
    pub created_at: DateTime<Utc>,
}

/// Trade route between regions
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TradeRoute {
    pub id: Uuid,
    pub from_region_id: Uuid,
    pub to_region_id: Uuid,
    pub distance: i32,
    pub danger_level: i32,
    pub toll_cost: Decimal,
    pub is_active: bool,
}

/// Market event that affects prices
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketEvent {
    pub id: Uuid,
    pub event_type: MarketEventType,
    pub severity: i32,
    pub affected_region_id: Option<Uuid>,
    pub affected_item_id: Option<Uuid>,
    pub description: Option<String>,
    pub started_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub price_modifier: Decimal,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "market_event_type", rename_all = "lowercase")]
pub enum MarketEventType {
    Shortage,
    Surplus,
    Disaster,
    Festival,
    War,
    Discovery,
    Embargo,
    TaxChange,
}

/// Request to create a market listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMarketListingRequest {
    pub character_id: Option<Uuid>,
    pub region_id: Uuid,
    pub item_id: Uuid,
    pub price: Decimal,
    pub quantity: i32,
    pub expires_in_hours: Option<i32>,
}

/// Request to purchase from a listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseRequest {
    pub listing_id: Uuid,
    pub quantity: i32,
}

/// Market statistics for a region
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketStats {
    pub region_id: Uuid,
    pub region_name: String,
    pub total_listings: i32,
    pub total_volume_24h: Decimal,
    pub average_prices: Vec<ItemPriceInfo>,
    pub trending_items: Vec<TrendingItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemPriceInfo {
    pub item_id: Uuid,
    pub item_name: String,
    pub avg_price: Decimal,
    pub price_change_24h: Decimal,
    pub volume_24h: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendingItem {
    pub item_id: Uuid,
    pub item_name: String,
    pub price_change_percentage: Decimal,
    pub volume_increase: i32,
}

impl MarketListing {
    /// Check if the listing has expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            expires_at < Utc::now()
        } else {
            false
        }
    }

    /// Calculate the effective price including ghost modifiers
    pub fn effective_price(&self) -> Decimal {
        if self.is_ghost_listing {
            self.price * self.ghost_price_modifier
        } else {
            self.price
        }
    }
}

impl MarketEvent {
    /// Check if the event is currently active
    pub fn is_currently_active(&self) -> bool {
        if !self.is_active {
            return false;
        }
        
        let now = Utc::now();
        if let Some(expires_at) = self.expires_at {
            now >= self.started_at && now < expires_at
        } else {
            now >= self.started_at
        }
    }

    /// Calculate price adjustment for an item in a region
    pub fn calculate_price_adjustment(&self, region_id: Uuid, item_id: Uuid) -> Decimal {
        // Check if this event affects the given region/item
        let affects_region = self.affected_region_id.map_or(true, |id| id == region_id);
        let affects_item = self.affected_item_id.map_or(true, |id| id == item_id);
        
        if affects_region && affects_item && self.is_currently_active() {
            self.price_modifier
        } else {
            Decimal::from(1)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;
    use std::str::FromStr;

    #[test]
    fn test_listing_expiration() {
        let mut listing = MarketListing {
            id: Uuid::new_v4(),
            region_id: Uuid::new_v4(),
            item_id: Uuid::new_v4(),
            seller_character_id: None,
            price: Decimal::from(100),
            quantity: 10,
            original_quantity: 10,
            listed_at: Utc::now(),
            expires_at: Some(Utc::now() - Duration::hours(1)),
            is_active: true,
            is_ghost_listing: false,
            ghost_price_modifier: Decimal::from(1),
        };
        
        assert!(listing.is_expired());
        
        listing.expires_at = Some(Utc::now() + Duration::hours(1));
        assert!(!listing.is_expired());
    }

    #[test]
    fn test_ghost_pricing() {
        let listing = MarketListing {
            id: Uuid::new_v4(),
            region_id: Uuid::new_v4(),
            item_id: Uuid::new_v4(),
            seller_character_id: None,
            price: Decimal::from(100),
            quantity: 10,
            original_quantity: 10,
            listed_at: Utc::now(),
            expires_at: None,
            is_active: true,
            is_ghost_listing: true,
            ghost_price_modifier: Decimal::from_str("1.5").unwrap(),
        };
        
        assert_eq!(listing.effective_price(), Decimal::from(150));
    }
}
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ListingType {
    Fixed,
    Auction,
}

impl From<String> for ListingType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "fixed" => ListingType::Fixed,
            "auction" => ListingType::Auction,
            _ => ListingType::Fixed,
        }
    }
}

impl ToString for ListingType {
    fn to_string(&self) -> String {
        match self {
            ListingType::Fixed => "fixed".to_string(),
            ListingType::Auction => "auction".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ListingVisibility {
    Public,
    ClanOnly,
}

impl From<String> for ListingVisibility {
    fn from(s: String) -> Self {
        match s.as_str() {
            "public" => ListingVisibility::Public,
            "clan_only" => ListingVisibility::ClanOnly,
            _ => ListingVisibility::Public,
        }
    }
}

impl ToString for ListingVisibility {
    fn to_string(&self) -> String {
        match self {
            ListingVisibility::Public => "public".to_string(),
            ListingVisibility::ClanOnly => "clan_only".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

impl From<String> for ListingStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "active" => ListingStatus::Active,
            "sold" => ListingStatus::Sold,
            "cancelled" => ListingStatus::Cancelled,
            "expired" => ListingStatus::Expired,
            _ => ListingStatus::Active,
        }
    }
}

impl ToString for ListingStatus {
    fn to_string(&self) -> String {
        match self {
            ListingStatus::Active => "active".to_string(),
            ListingStatus::Sold => "sold".to_string(),
            ListingStatus::Cancelled => "cancelled".to_string(),
            ListingStatus::Expired => "expired".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketplaceListing {
    pub id: String,
    pub seller_id: String,
    pub user_item_id: String,
    pub price: i32,
    pub listing_type: String,
    pub visibility: String,
    pub clan_id: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub sold_at: Option<DateTime<Utc>>,
    pub buyer_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceListingWithDetails {
    pub listing: MarketplaceListing,
    pub item: crate::models::UserInventoryWithDetails,
    pub seller_username: String,
    pub current_bid: Option<i32>,
    pub bid_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AuctionBid {
    pub id: i32,
    pub listing_id: String,
    pub bidder_id: String,
    pub bid_amount: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionBidWithUser {
    pub bid: AuctionBid,
    pub bidder_username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateListingRequest {
    pub user_item_id: String,
    #[validate(range(min = 1))]
    pub price: i32,
    pub listing_type: ListingType,
    pub visibility: ListingVisibility,
    pub clan_id: Option<String>,
    #[validate(range(min = 1, max = 30))]
    pub duration_days: Option<i32>, // defaults to 7 days
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct PlaceBidRequest {
    #[validate(range(min = 1))]
    pub bid_amount: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceFilter {
    pub item_type: Option<String>,
    pub rarity_id: Option<i32>,
    pub min_price: Option<i32>,
    pub max_price: Option<i32>,
    pub listing_type: Option<ListingType>,
    pub visibility: Option<ListingVisibility>,
    pub clan_id: Option<String>,
    pub search_term: Option<String>,
}

impl MarketplaceListing {
    pub fn new(
        seller_id: String,
        user_item_id: String,
        price: i32,
        listing_type: ListingType,
        visibility: ListingVisibility,
        clan_id: Option<String>,
        duration_days: i32,
    ) -> Self {
        let now = Utc::now();
        let expires_at = now + Duration::days(duration_days as i64);

        Self {
            id: Uuid::new_v4().to_string(),
            seller_id,
            user_item_id,
            price,
            listing_type: listing_type.to_string(),
            visibility: visibility.to_string(),
            clan_id,
            status: ListingStatus::Active.to_string(),
            created_at: now,
            expires_at,
            sold_at: None,
            buyer_id: None,
        }
    }

    pub fn is_active(&self) -> bool {
        ListingStatus::from(self.status.clone()) == ListingStatus::Active
            && self.expires_at > Utc::now()
    }

    pub fn can_be_purchased(&self) -> bool {
        self.is_active() && ListingType::from(self.listing_type.clone()) == ListingType::Fixed
    }

    pub fn can_be_bid_on(&self) -> bool {
        self.is_active() && ListingType::from(self.listing_type.clone()) == ListingType::Auction
    }
}

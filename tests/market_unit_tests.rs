use bridge::models::{MarketListing, MarketEvent, MarketEventType, MarketItemRarity, Item};
use chrono::{Utc, Duration};
use rust_decimal::Decimal;
use std::str::FromStr;
use uuid::Uuid;

#[test]
fn test_market_listing_expiration() {
    let mut listing = MarketListing {
        id: Uuid::new_v4(),
        region_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        seller_character_id: Some(Uuid::new_v4()),
        price: Decimal::from(100),
        quantity: 10,
        original_quantity: 10,
        listed_at: Utc::now(),
        expires_at: None,
        is_active: true,
        is_ghost_listing: false,
        ghost_price_modifier: Decimal::from(1),
    };
    
    // Test no expiration
    assert!(!listing.is_expired());
    
    // Test future expiration
    listing.expires_at = Some(Utc::now() + Duration::hours(1));
    assert!(!listing.is_expired());
    
    // Test past expiration
    listing.expires_at = Some(Utc::now() - Duration::hours(1));
    assert!(listing.is_expired());
}

#[test]
fn test_ghost_listing_pricing() {
    let base_price = Decimal::from(100);
    
    let normal_listing = MarketListing {
        id: Uuid::new_v4(),
        region_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        seller_character_id: Some(Uuid::new_v4()),
        price: base_price,
        quantity: 10,
        original_quantity: 10,
        listed_at: Utc::now(),
        expires_at: None,
        is_active: true,
        is_ghost_listing: false,
        ghost_price_modifier: Decimal::from(1),
    };
    
    let ghost_listing = MarketListing {
        is_ghost_listing: true,
        ghost_price_modifier: Decimal::from_str("1.5").unwrap(),
        ..normal_listing.clone()
    };
    
    assert_eq!(normal_listing.effective_price(), base_price);
    assert_eq!(ghost_listing.effective_price(), Decimal::from(150));
}

#[test]
fn test_market_event_activity() {
    let now = Utc::now();
    
    let mut event = MarketEvent {
        id: Uuid::new_v4(),
        event_type: MarketEventType::Shortage,
        severity: 3,
        affected_region_id: Some(Uuid::new_v4()),
        affected_item_id: Some(Uuid::new_v4()),
        description: Some("Test shortage".to_string()),
        started_at: now - Duration::hours(1),
        expires_at: Some(now + Duration::hours(1)),
        price_modifier: Decimal::from_str("1.5").unwrap(),
        is_active: true,
    };
    
    // Test active event
    assert!(event.is_currently_active());
    
    // Test inactive flag
    event.is_active = false;
    assert!(!event.is_currently_active());
    
    // Test expired event
    event.is_active = true;
    event.expires_at = Some(now - Duration::minutes(1));
    assert!(!event.is_currently_active());
    
    // Test future event
    event.started_at = now + Duration::hours(1);
    event.expires_at = Some(now + Duration::hours(2));
    assert!(!event.is_currently_active());
}

#[test]
fn test_market_event_price_adjustment() {
    let region_id = Uuid::new_v4();
    let item_id = Uuid::new_v4();
    
    let event = MarketEvent {
        id: Uuid::new_v4(),
        event_type: MarketEventType::Surplus,
        severity: 2,
        affected_region_id: Some(region_id),
        affected_item_id: Some(item_id),
        description: Some("Surplus of goods".to_string()),
        started_at: Utc::now() - Duration::hours(1),
        expires_at: Some(Utc::now() + Duration::hours(1)),
        price_modifier: Decimal::from_str("0.8").unwrap(),
        is_active: true,
    };
    
    // Test affected region and item
    assert_eq!(
        event.calculate_price_adjustment(region_id, item_id),
        Decimal::from_str("0.8").unwrap()
    );
    
    // Test different region
    assert_eq!(
        event.calculate_price_adjustment(Uuid::new_v4(), item_id),
        Decimal::from(1)
    );
    
    // Test different item
    assert_eq!(
        event.calculate_price_adjustment(region_id, Uuid::new_v4()),
        Decimal::from(1)
    );
    
    // Test global event (no specific region/item)
    let global_event = MarketEvent {
        affected_region_id: None,
        affected_item_id: None,
        ..event
    };
    
    assert_eq!(
        global_event.calculate_price_adjustment(Uuid::new_v4(), Uuid::new_v4()),
        Decimal::from_str("0.8").unwrap()
    );
}

#[test]
fn test_item_rarity_enum() {
    // Test that the enum values work correctly
    let _common = MarketItemRarity::Common;
    let _uncommon = MarketItemRarity::Uncommon;
    let _rare = MarketItemRarity::Rare;
    let _epic = MarketItemRarity::Epic;
    let _legendary = MarketItemRarity::Legendary;
    
    // Test serialization
    let item = Item {
        id: Uuid::new_v4(),
        name: "Test Item".to_string(),
        category: "Test".to_string(),
        base_price: Decimal::from(100),
        weight: 10,
        perishable: false,
        rarity: MarketItemRarity::Rare,
        description: Some("A test item".to_string()),
    };
    
    let json = serde_json::to_string(&item).unwrap();
    assert!(json.contains("\"rarity\":\"Rare\""));
    
    let deserialized: Item = serde_json::from_str(&json).unwrap();
    assert!(matches!(deserialized.rarity, MarketItemRarity::Rare));
}

#[test]
fn test_decimal_operations() {
    let price = Decimal::from(100);
    let tax_rate = Decimal::from_str("0.1").unwrap(); // 10%
    let quantity = Decimal::from(5);
    
    let subtotal = price * quantity;
    assert_eq!(subtotal, Decimal::from(500));
    
    let tax = subtotal * tax_rate;
    assert_eq!(tax, Decimal::from(50));
    
    let total = subtotal + tax;
    assert_eq!(total, Decimal::from(550));
}
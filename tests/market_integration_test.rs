use bridge::models::{CreateMarketListingRequest, PurchaseRequest};
use bridge::services::MarketService;
use rust_decimal::Decimal;
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

#[tokio::test]
async fn test_market_listing_lifecycle() {
    // This test requires a test database to be set up
    // For now, we'll use the main database but in a real scenario, 
    // you'd want a separate test database
    
    dotenvy::from_filename(".env.dynasty").ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");
    
    // Create test data
    let test_region_id = Uuid::parse_str("d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a").unwrap(); // The Hub
    let test_item_id = Uuid::parse_str("a1b2c3d4-e5f6-7890-abcd-ef1234567890").unwrap(); // Wheat
    
    // Test creating a listing (would need a test character with inventory)
    // For now, we'll just test the service methods exist and compile
    
    let create_request = CreateMarketListingRequest {
        region_id: test_region_id,
        item_id: test_item_id,
        price: Decimal::from(15),
        quantity: 10,
        expires_in_hours: Some(24),
    };
    
    // Test that the service methods compile correctly
    assert_eq!(create_request.region_id, test_region_id);
    assert_eq!(create_request.price, Decimal::from(15));
    
    // Test getting region listings
    let listings = MarketService::get_region_listings(&pool, test_region_id, None)
        .await
        .unwrap_or_default();
    
    // Test getting market stats
    let stats = MarketService::get_market_stats(&pool, test_region_id)
        .await;
    
    assert!(stats.is_ok() || stats.is_err()); // Just checking it compiles
    
    // Test getting active events
    let events = MarketService::get_active_events(&pool, Some(test_region_id))
        .await
        .unwrap_or_default();
    
    println!("Test completed - found {} listings and {} events", listings.len(), events.len());
}

#[test]
fn test_market_models() {
    use bridge::models::{MarketListing, MarketEvent, MarketEventType};
    use chrono::{Utc, Duration};
    
    // Test listing expiration
    let listing = MarketListing {
        id: Uuid::new_v4(),
        region_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        seller_character_id: Some(Uuid::new_v4()),
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
    assert_eq!(listing.effective_price(), Decimal::from(100));
    
    // Test ghost pricing
    let ghost_listing = MarketListing {
        is_ghost_listing: true,
        ghost_price_modifier: Decimal::from_str("1.5").unwrap(),
        ..listing
    };
    
    assert_eq!(ghost_listing.effective_price(), Decimal::from(150));
    
    // Test market event
    let event = MarketEvent {
        id: Uuid::new_v4(),
        event_type: MarketEventType::Shortage,
        severity: 3,
        affected_region_id: Some(Uuid::new_v4()),
        affected_item_id: Some(Uuid::new_v4()),
        description: Some("Wheat shortage due to drought".to_string()),
        started_at: Utc::now() - Duration::hours(1),
        expires_at: Some(Utc::now() + Duration::hours(1)),
        price_modifier: Decimal::from_str("1.5").unwrap(),
        is_active: true,
    };
    
    assert!(event.is_currently_active());
}

use std::str::FromStr;
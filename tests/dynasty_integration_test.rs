use bridge::{DynastyTraderState, models::*, services::*};
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::Utc;

/// Test helper to create a test database pool
async fn create_test_pool() -> sqlx::PgPool {
    dotenvy::from_filename(".env.dynasty").ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database")
}

/// Test helper to create a test user and dynasty
async fn create_test_dynasty(pool: &sqlx::PgPool) -> (Uuid, Dynasty) {
    let user_id = Uuid::new_v4();
    
    // Create test user (simplified - normally would go through auth)
    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash, created_at) 
         VALUES ($1, $2, $3, $4, NOW())"
    )
    .bind(user_id)
    .bind(format!("testuser_{}", user_id))
    .bind(format!("test_{}@example.com", user_id))
    .bind("hashed_password")
    .execute(pool)
    .await
    .unwrap();
    
    // Create dynasty
    let dynasty = DynastyService::create_dynasty(
        pool,
        user_id,
        format!("Test Dynasty {}", user_id),
        Some("A test dynasty".to_string())
    ).await.unwrap();
    
    (user_id, dynasty)
}

#[tokio::test]
async fn test_dynasty_creation_and_character_lifecycle() {
    let pool = create_test_pool().await;
    let (user_id, dynasty) = create_test_dynasty(&pool).await;
    
    // Test dynasty was created correctly
    assert_eq!(dynasty.generation, 1);
    assert_eq!(dynasty.total_characters, 0);
    assert_eq!(dynasty.treasury, Decimal::from(0));
    
    // Create a character
    let character = CharacterService::create_character(
        &pool,
        dynasty.id,
        "Test Character".to_string(),
        None
    ).await.unwrap();
    
    // Verify character properties
    assert_eq!(character.dynasty_id, dynasty.id);
    assert_eq!(character.generation, 1);
    assert!(character.is_alive);
    assert!(character.health > 0);
    
    // Get dynasty stats - should show 1 character
    let stats = DynastyService::get_dynasty_stats(&pool, dynasty.id).await.unwrap();
    assert_eq!(stats.total_characters, 1);
    assert_eq!(stats.living_characters, 1);
    
    // Clean up
    sqlx::query("DELETE FROM characters WHERE id = $1")
        .bind(character.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM dynasties WHERE id = $1")
        .bind(dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(&pool)
        .await
        .unwrap();
}

#[tokio::test]
async fn test_character_aging_system() {
    let pool = create_test_pool().await;
    let (_user_id, dynasty) = create_test_dynasty(&pool).await;
    
    // Create a character
    let character = CharacterService::create_character(
        &pool,
        dynasty.id,
        "Aging Test".to_string(),
        None
    ).await.unwrap();
    
    // Manually set birth date to make character older
    sqlx::query(
        "UPDATE characters SET birth_date = $1 WHERE id = $2"
    )
    .bind(Utc::now() - chrono::Duration::days(365 * 25)) // 25 years old
    .bind(character.id)
    .execute(&pool)
    .await
    .unwrap();
    
    // Age the character
    let aged = CharacterService::age_character(&pool, character.id).await.unwrap();
    
    // Check aging effects
    assert!(aged.health < character.health); // Health should decrease
    assert!(aged.stamina < character.stamina); // Stamina should decrease
    
    // Clean up
    sqlx::query("DELETE FROM characters WHERE dynasty_id = $1")
        .bind(dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM dynasties WHERE id = $1")
        .bind(dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
}

#[tokio::test]
async fn test_market_listing_and_purchase() {
    let pool = create_test_pool().await;
    
    // Create two dynasties (buyer and seller)
    let (_seller_user, seller_dynasty) = create_test_dynasty(&pool).await;
    let (_buyer_user, buyer_dynasty) = create_test_dynasty(&pool).await;
    
    // Create characters
    let seller_char = CharacterService::create_character(
        &pool,
        seller_dynasty.id,
        "Seller".to_string(),
        None
    ).await.unwrap();
    
    let buyer_char = CharacterService::create_character(
        &pool,
        buyer_dynasty.id,
        "Buyer".to_string(),
        None
    ).await.unwrap();
    
    // Give seller some items
    let item_id = Uuid::parse_str("a1b2c3d4-e5f6-7890-abcd-ef1234567890").unwrap(); // Wheat
    sqlx::query(
        "INSERT INTO character_inventory (character_id, item_id, quantity) VALUES ($1, $2, $3)"
    )
    .bind(seller_char.id)
    .bind(item_id)
    .bind(100)
    .execute(&pool)
    .await
    .unwrap();
    
    // Give buyer some money
    sqlx::query(
        "UPDATE characters SET inheritance_received = $1 WHERE id = $2"
    )
    .bind(Decimal::from(1000))
    .bind(buyer_char.id)
    .execute(&pool)
    .await
    .unwrap();
    
    // Create a market listing
    let region_id = Uuid::parse_str("d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a").unwrap(); // The Hub
    let listing_request = CreateMarketListingRequest {
        region_id,
        item_id,
        price: Decimal::from(10),
        quantity: 50,
        expires_in_hours: Some(24),
    };
    
    let listing = MarketService::create_listing(
        &pool,
        seller_char.id,
        listing_request
    ).await.unwrap();
    
    assert_eq!(listing.quantity, 50);
    assert_eq!(listing.price, Decimal::from(10));
    
    // Purchase from the listing
    let purchase_request = PurchaseRequest {
        listing_id: listing.id,
        quantity: 20,
    };
    
    MarketService::purchase_from_listing(
        &pool,
        buyer_char.id,
        purchase_request
    ).await.unwrap();
    
    // Verify the purchase
    let buyer_inventory: (i32,) = sqlx::query_as(
        "SELECT quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2"
    )
    .bind(buyer_char.id)
    .bind(item_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    
    assert_eq!(buyer_inventory.0, 20);
    
    // Clean up
    sqlx::query("DELETE FROM market_listings WHERE seller_character_id IN ($1, $2)")
        .bind(seller_char.id)
        .bind(buyer_char.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM character_inventory WHERE character_id IN ($1, $2)")
        .bind(seller_char.id)
        .bind(buyer_char.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM characters WHERE dynasty_id IN ($1, $2)")
        .bind(seller_dynasty.id)
        .bind(buyer_dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM dynasties WHERE id IN ($1, $2)")
        .bind(seller_dynasty.id)
        .bind(buyer_dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
}

#[tokio::test]
async fn test_character_death_and_inheritance() {
    let pool = create_test_pool().await;
    let (_user_id, dynasty) = create_test_dynasty(&pool).await;
    
    // Create a wealthy character
    let character = CharacterService::create_character(
        &pool,
        dynasty.id,
        "Wealthy Merchant".to_string(),
        None
    ).await.unwrap();
    
    // Give character wealth
    let wealth = Decimal::from(10000);
    sqlx::query(
        "UPDATE characters SET inheritance_received = $1 WHERE id = $2"
    )
    .bind(wealth)
    .bind(character.id)
    .execute(&pool)
    .await
    .unwrap();
    
    // Process character death
    let death_event = DeathService::process_character_death(
        &pool,
        character.id,
        "Test Death".to_string()
    ).await.unwrap();
    
    assert_eq!(death_event.character_wealth, wealth);
    assert_eq!(death_event.dynasty_id, dynasty.id);
    
    // Check that character is marked as dead
    let dead_char: (bool,) = sqlx::query_as(
        "SELECT is_alive FROM characters WHERE id = $1"
    )
    .bind(character.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    
    assert!(!dead_char.0);
    
    // Check dynasty treasury increased (minus 10% death tax)
    let dynasty_after: Dynasty = sqlx::query_as(
        "SELECT * FROM dynasties WHERE id = $1"
    )
    .bind(dynasty.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    
    let expected_inheritance = wealth * Decimal::from_str("0.9").unwrap();
    assert_eq!(dynasty_after.treasury, expected_inheritance);
    assert_eq!(dynasty_after.total_deaths, 1);
    
    // Clean up
    sqlx::query("DELETE FROM death_events WHERE character_id = $1")
        .bind(character.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM characters WHERE id = $1")
        .bind(character.id)
        .execute(&pool)
        .await
        .unwrap();
    
    sqlx::query("DELETE FROM dynasties WHERE id = $1")
        .bind(dynasty.id)
        .execute(&pool)
        .await
        .unwrap();
}

use std::str::FromStr;
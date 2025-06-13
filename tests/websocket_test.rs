use bridge::api::websocket::{WsMessage, MarketUpdateData, MarketEventData};
use chrono::Utc;
use rust_decimal::Decimal;
use uuid::Uuid;

#[test]
fn test_websocket_message_serialization() {
    // Test Subscribe message
    let subscribe = WsMessage::Subscribe {
        channel: "market:d4f3a1e5-6b7c-4d8e-9f0a-1b2c3d4e5f6a".to_string(),
    };
    
    let json = serde_json::to_string(&subscribe).unwrap();
    assert!(json.contains("\"type\":\"Subscribe\""));
    assert!(json.contains("\"channel\":\"market:"));
    
    // Test MarketUpdate message
    let market_update = WsMessage::MarketUpdate {
        region_id: Uuid::new_v4(),
        data: MarketUpdateData {
            listings_added: 5,
            listings_removed: 2,
            total_active: 150,
            timestamp: Utc::now(),
        },
    };
    
    let json = serde_json::to_string(&market_update).unwrap();
    assert!(json.contains("\"type\":\"MarketUpdate\""));
    assert!(json.contains("\"listings_added\":5"));
    
    // Test PriceUpdate message
    let price_update = WsMessage::PriceUpdate {
        region_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        price: Decimal::from(125),
    };
    
    let json = serde_json::to_string(&price_update).unwrap();
    assert!(json.contains("\"type\":\"PriceUpdate\""));
    assert!(json.contains("\"price\":\"125\""));
    
    // Test DeathAnnouncement message
    let death = WsMessage::DeathAnnouncement {
        character_name: "John Trader".to_string(),
        dynasty_name: "House of Trade".to_string(),
        wealth_impact: "Major".to_string(),
    };
    
    let json = serde_json::to_string(&death).unwrap();
    assert!(json.contains("\"type\":\"DeathAnnouncement\""));
    assert!(json.contains("\"character_name\":\"John Trader\""));
    
    // Test MarketEvent message
    let event = WsMessage::MarketEvent {
        event: MarketEventData {
            event_type: "Shortage".to_string(),
            severity: 4,
            affected_region: Some("The Hub".to_string()),
            affected_item: Some("Wheat".to_string()),
            description: "Severe wheat shortage".to_string(),
            price_modifier: Decimal::from_str("1.5").unwrap(),
        },
    };
    
    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("\"type\":\"MarketEvent\""));
    assert!(json.contains("\"severity\":4"));
}

#[test]
fn test_websocket_message_deserialization() {
    // Test deserializing Subscribe
    let json = r#"{"type":"Subscribe","channel":"deaths"}"#;
    let msg: WsMessage = serde_json::from_str(json).unwrap();
    
    match msg {
        WsMessage::Subscribe { channel } => {
            assert_eq!(channel, "deaths");
        }
        _ => panic!("Wrong message type"),
    }
    
    // Test deserializing Ping
    let json = r#"{"type":"Ping"}"#;
    let msg: WsMessage = serde_json::from_str(json).unwrap();
    
    assert!(matches!(msg, WsMessage::Ping));
    
    // Test deserializing Unsubscribe
    let json = r#"{"type":"Unsubscribe","channel":"events"}"#;
    let msg: WsMessage = serde_json::from_str(json).unwrap();
    
    match msg {
        WsMessage::Unsubscribe { channel } => {
            assert_eq!(channel, "events");
        }
        _ => panic!("Wrong message type"),
    }
}

#[test]
fn test_channel_naming_conventions() {
    let region_id = Uuid::new_v4();
    
    // Market channel format
    let market_channel = format!("market:{}", region_id);
    assert!(market_channel.starts_with("market:"));
    assert_eq!(market_channel.len(), 43); // "market:" (7) + UUID (36)
    
    // Standard channels
    let death_channel = "deaths";
    let event_channel = "events";
    
    assert_eq!(death_channel, "deaths");
    assert_eq!(event_channel, "events");
}

use std::str::FromStr;
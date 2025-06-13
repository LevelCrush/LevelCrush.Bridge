use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use crate::DynastyTraderState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    // Client -> Server
    Subscribe { channel: String },
    Unsubscribe { channel: String },
    Ping,
    
    // Server -> Client
    MarketUpdate { region_id: Uuid, data: MarketUpdateData },
    PriceUpdate { region_id: Uuid, item_id: Uuid, price: rust_decimal::Decimal },
    DeathAnnouncement { character_name: String, dynasty_name: String, wealth_impact: String },
    MarketEvent { event: MarketEventData },
    Pong,
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketUpdateData {
    pub listings_added: i32,
    pub listings_removed: i32,
    pub total_active: i32,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketEventData {
    pub event_type: String,
    pub severity: i32,
    pub affected_region: Option<String>,
    pub affected_item: Option<String>,
    pub description: String,
    pub price_modifier: rust_decimal::Decimal,
}

/// Global broadcast channel for market updates
pub type MarketBroadcaster = broadcast::Sender<WsMessage>;

/// Handle WebSocket upgrade request
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<DynastyTraderState>>,
) -> Response {
    ws.on_upgrade(move |socket| websocket_connection(socket, state))
}

/// Handle an individual WebSocket connection
async fn websocket_connection(
    ws: WebSocket,
    state: Arc<DynastyTraderState>,
) {
    let (mut sender, mut receiver) = ws.split();
    let mut rx = state.broadcaster.subscribe();
    
    // Client state - use Arc<RwLock> for shared access
    let subscribed_channels = Arc::new(RwLock::new(Vec::<String>::new()));
    
    // Spawn task to forward broadcast messages to this client
    let channels_clone = subscribed_channels.clone();
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            // Filter messages based on subscriptions
            let channels = channels_clone.read().await;
            let should_send = match &msg {
                WsMessage::MarketUpdate { region_id, .. } => {
                    channels.contains(&format!("market:{}", region_id))
                }
                WsMessage::PriceUpdate { region_id, .. } => {
                    channels.contains(&format!("market:{}", region_id))
                }
                WsMessage::DeathAnnouncement { .. } => {
                    channels.contains(&"deaths".to_string())
                }
                WsMessage::MarketEvent { .. } => {
                    channels.contains(&"events".to_string())
                }
                _ => false,
            };
            drop(channels); // Release the read lock
            
            if should_send {
                if sender
                    .send(Message::Text(serde_json::to_string(&msg).unwrap()))
                    .await
                    .is_err()
                {
                    break;
                }
            }
        }
    });
    
    // Handle incoming messages from client
    let channels_clone = subscribed_channels.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                        handle_client_message(ws_msg, &channels_clone).await;
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });
    
    // Wait for either task to complete
    tokio::select! {
        _ = &mut send_task => {
            recv_task.abort();
        }
        _ = &mut recv_task => {
            send_task.abort();
        }
    }
}

/// Handle messages from WebSocket clients
async fn handle_client_message(
    msg: WsMessage,
    subscribed_channels: &Arc<RwLock<Vec<String>>>,
) {
    match msg {
        WsMessage::Subscribe { channel } => {
            let mut channels = subscribed_channels.write().await;
            if !channels.contains(&channel) {
                channels.push(channel.clone());
                tracing::info!("Client subscribed to channel: {}", channel);
            }
        }
        WsMessage::Unsubscribe { channel } => {
            let mut channels = subscribed_channels.write().await;
            channels.retain(|c| c != &channel);
            tracing::info!("Client unsubscribed from channel: {}", channel);
        }
        WsMessage::Ping => {
            // Pong is handled separately
        }
        _ => {
            tracing::warn!("Unexpected client message type");
        }
    }
}

/// Send a market update to all connected clients
pub async fn broadcast_market_update(
    broadcaster: &MarketBroadcaster,
    region_id: Uuid,
    listings_added: i32,
    listings_removed: i32,
    total_active: i32,
) {
    let update = WsMessage::MarketUpdate {
        region_id,
        data: MarketUpdateData {
            listings_added,
            listings_removed,
            total_active,
            timestamp: chrono::Utc::now(),
        },
    };
    
    let _ = broadcaster.send(update);
}

/// Send a price update to all connected clients
pub async fn broadcast_price_update(
    broadcaster: &MarketBroadcaster,
    region_id: Uuid,
    item_id: Uuid,
    price: rust_decimal::Decimal,
) {
    let update = WsMessage::PriceUpdate {
        region_id,
        item_id,
        price,
    };
    
    let _ = broadcaster.send(update);
}

/// Send a death announcement to all connected clients
pub async fn broadcast_death_announcement(
    broadcaster: &MarketBroadcaster,
    character_name: String,
    dynasty_name: String,
    wealth_impact: String,
) {
    let announcement = WsMessage::DeathAnnouncement {
        character_name,
        dynasty_name,
        wealth_impact,
    };
    
    let _ = broadcaster.send(announcement);
}

/// Send a market event notification to all connected clients
pub async fn broadcast_market_event(
    broadcaster: &MarketBroadcaster,
    event_type: String,
    severity: i32,
    affected_region: Option<String>,
    affected_item: Option<String>,
    description: String,
    price_modifier: rust_decimal::Decimal,
) {
    let event = WsMessage::MarketEvent {
        event: MarketEventData {
            event_type,
            severity,
            affected_region,
            affected_item,
            description,
            price_modifier,
        },
    };
    
    let _ = broadcaster.send(event);
}
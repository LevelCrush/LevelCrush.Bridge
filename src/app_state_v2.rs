use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::broadcast;
use crate::api::websocket::WsMessage;

/// Application state for Dynasty Trader (v2 API)
#[derive(Clone)]
pub struct DynastyTraderState {
    pub pool: Arc<PgPool>,
    pub broadcaster: Arc<broadcast::Sender<WsMessage>>,
}

impl DynastyTraderState {
    pub fn new(pool: PgPool) -> Self {
        let (tx, _rx) = broadcast::channel::<WsMessage>(100);
        
        Self {
            pool: Arc::new(pool),
            broadcaster: Arc::new(tx),
        }
    }
}
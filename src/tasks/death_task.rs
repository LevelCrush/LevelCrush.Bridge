use crate::services::DeathService;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{interval, Duration};

pub struct DeathTask {
    pool: Arc<PgPool>,
    interval_seconds: u64,
}

impl DeathTask {
    pub fn new(pool: Arc<PgPool>, interval_seconds: u64) -> Self {
        Self {
            pool,
            interval_seconds,
        }
    }

    pub async fn start(self) {
        let mut interval = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            match DeathService::check_natural_deaths(&self.pool).await {
                Ok(death_events) => {
                    if !death_events.is_empty() {
                        tracing::info!(
                            "Death check completed: {} characters died",
                            death_events.len()
                        );
                        
                        for event in &death_events {
                            tracing::info!(
                                "Character {} died of {} (wealth: {}, location: {})",
                                event.character_id,
                                event.death_cause,
                                event.wealth_at_death,
                                event.location_id
                            );
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to check for natural deaths: {:?}", e);
                }
            }
        }
    }
}
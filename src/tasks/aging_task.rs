use crate::services::CharacterService;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use uuid::Uuid;

/// Background task that handles character aging
pub struct AgingTask {
    pool: Arc<PgPool>,
    interval_seconds: u64,
}

impl AgingTask {
    pub fn new(pool: Arc<PgPool>, interval_seconds: u64) -> Self {
        Self {
            pool,
            interval_seconds,
        }
    }

    /// Start the aging task
    pub async fn start(self) {
        let mut interval = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            tracing::info!("Running aging task...");
            
            match CharacterService::apply_aging_to_all_characters(&self.pool).await {
                Ok(affected) => {
                    tracing::info!("Aging task completed. {} characters affected.", affected);
                }
                Err(e) => {
                    tracing::error!("Aging task failed: {}", e);
                }
            }
        }
    }
}

/// Background task that records dynasty wealth snapshots
pub struct WealthSnapshotTask {
    pool: Arc<PgPool>,
    interval_seconds: u64,
}

impl WealthSnapshotTask {
    pub fn new(pool: Arc<PgPool>, interval_seconds: u64) -> Self {
        Self {
            pool,
            interval_seconds,
        }
    }

    /// Start the wealth snapshot task
    pub async fn start(self) {
        use crate::services::DynastyService;
        
        let mut interval = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            tracing::info!("Recording dynasty wealth snapshots...");
            
            // Get all active dynasties
            match sqlx::query_as::<_, (Uuid,)>("SELECT id FROM dynasties WHERE is_active = true")
                .fetch_all(&*self.pool)
                .await
            {
                Ok(dynasties) => {
                    let mut success_count = 0;
                    
                    for (dynasty_id,) in dynasties {
                        if let Ok(_) = DynastyService::record_wealth_snapshot(&self.pool, dynasty_id).await {
                            success_count += 1;
                        }
                    }
                    
                    tracing::info!("Wealth snapshot task completed. {} dynasties recorded.", success_count);
                }
                Err(e) => {
                    tracing::error!("Failed to fetch dynasties for wealth snapshot: {}", e);
                }
            }
        }
    }
}
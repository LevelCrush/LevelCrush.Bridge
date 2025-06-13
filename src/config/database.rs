use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub connection_timeout: Duration,
}

impl DatabaseConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let url = dotenvy::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");
        
        let max_connections = dotenvy::var("DATABASE_MAX_CONNECTIONS")
            .unwrap_or_else(|_| "100".to_string())
            .parse()
            .expect("Invalid DATABASE_MAX_CONNECTIONS");

        Ok(Self {
            url,
            max_connections,
            connection_timeout: Duration::from_secs(30),
        })
    }

    pub async fn create_pool(&self) -> anyhow::Result<Pool<Postgres>> {
        let pool = PgPoolOptions::new()
            .max_connections(self.max_connections)
            .acquire_timeout(self.connection_timeout)
            .connect(&self.url)
            .await?;

        Ok(pool)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_config_from_env() {
        // Set test environment variables
        std::env::set_var("DATABASE_URL", "postgresql://test:test@localhost/test");
        std::env::set_var("DATABASE_MAX_CONNECTIONS", "50");

        let config = DatabaseConfig::from_env().unwrap();
        assert_eq!(config.url, "postgresql://test:test@localhost/test");
        assert_eq!(config.max_connections, 50);
    }
}
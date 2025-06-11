use base64::{engine::general_purpose, Engine as _};
use rand::Rng;
use sqlx::MySqlPool;

pub async fn get_or_create_secret(pool: &MySqlPool, key_name: &str) -> Result<String, sqlx::Error> {
    // Try to get existing secret
    let result: Result<(String,), sqlx::Error> =
        sqlx::query_as("SELECT value FROM app_secrets WHERE key_name = ?")
            .bind(key_name)
            .fetch_one(pool)
            .await;

    match result {
        Ok((value,)) => Ok(value),
        Err(sqlx::Error::RowNotFound) => {
            // Generate new secret
            let secret = generate_secret();

            // Insert into database
            sqlx::query("INSERT INTO app_secrets (key_name, value, description) VALUES (?, ?, ?)")
                .bind(key_name)
                .bind(&secret)
                .bind(format!("Auto-generated secret for {}", key_name))
                .execute(pool)
                .await?;

            tracing::info!("Generated new secret for {}", key_name);
            Ok(secret)
        }
        Err(e) => Err(e),
    }
}

fn generate_secret() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    general_purpose::STANDARD.encode(&bytes)
}

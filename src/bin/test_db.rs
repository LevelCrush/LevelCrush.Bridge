use sqlx::mysql::MySqlPoolOptions;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env file");
    
    println!("Connecting to database...");
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;
    
    println!("Connected successfully!");
    
    // Count tables
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()"
    )
    .fetch_one(&pool)
    .await?;
    
    println!("Number of tables in database: {}", count.0);
    
    // List all tables
    let tables: Vec<(String,)> = sqlx::query_as("SHOW TABLES")
        .fetch_all(&pool)
        .await?;
    
    println!("\nTables in database:");
    for (table,) in &tables {
        println!("  - {}", table);
    }
    
    // Check if app_secrets exists
    let app_secrets_exists: Vec<(String,)> = sqlx::query_as(
        "SELECT table_name FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'app_secrets'"
    )
    .fetch_all(&pool)
    .await?;
    
    if app_secrets_exists.is_empty() {
        println!("\n⚠️  app_secrets table does NOT exist!");
    } else {
        println!("\n✓ app_secrets table exists");
    }
    
    Ok(())
}
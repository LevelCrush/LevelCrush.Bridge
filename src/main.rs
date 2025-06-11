use bridge::{api, utils, AppState};

use axum::{
    http::{header, Method},
    Router,
};
use sqlx::mysql::MySqlPoolOptions;
use std::{env, net::SocketAddr, sync::Arc};
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize logging with file rotation
    let _guard = utils::init_logging()?;

    // Get configuration from environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());

    // Create database connection pool
    tracing::info!("Connecting to database...");
    let db_pool = MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    // Get JWT secret from database or generate one
    let jwt_secret = utils::secrets::get_or_create_secret(&db_pool, "jwt_secret").await?;

    // Create application state
    let app_state = Arc::new(AppState {
        db: db_pool,
        jwt_secret,
    });

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Build the application router
    let app = Router::new().nest("/api/v1", api::routes(app_state)).layer(
        ServiceBuilder::new()
            .layer(TraceLayer::new_for_http())
            .layer(cors),
    );

    // Create the server address
    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
    tracing::info!("Server listening on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

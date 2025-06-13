use bridge::{api, utils, AppState};

use axum::{
    http::{header, Method},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::{env, net::SocketAddr, sync::Arc};
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables - using .env.dynasty for Dynasty Trader
    dotenvy::from_filename(".env.dynasty").ok();

    // Initialize logging with file rotation
    let _guard = utils::init_logging()?;

    // Get configuration from environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env.dynasty file");
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3113".to_string());

    // Create PostgreSQL connection pool with TimescaleDB
    tracing::info!("Connecting to TimescaleDB database...");
    let db_pool = PgPoolOptions::new()
        .max_connections(100)
        .connect(&database_url)
        .await?;

    // Run any pending migrations
    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await?;

    // Get JWT secret from environment (for now)
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");

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
    let app = Router::new()
        .nest("/api/v1", api::routes(app_state.clone()))
        // Future: Add v2 routes for Dynasty Trader specific features
        // .nest("/api/v2", dynasty_api::routes(app_state))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(cors),
        );

    // Create the server address
    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
    tracing::info!("Dynasty Trader server listening on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
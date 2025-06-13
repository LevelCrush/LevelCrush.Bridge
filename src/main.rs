use bridge::{
    api::{self, websocket::websocket_handler}, 
    DynastyTraderState,
    tasks::{AgingTask, WealthSnapshotTask, MarketExpirationTask, MarketPriceSnapshotTask, DeathTask}, 
    utils
};

use axum::{
    http::{header, Method},
    Router,
    routing::get,
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
    // Load environment variables
    dotenvy::from_filename(".env.dynasty").ok();

    // Initialize logging with file rotation
    let _guard = utils::init_logging()?;

    // Get configuration from environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3113".to_string());

    // Create PostgreSQL connection pool with TimescaleDB
    tracing::info!("Connecting to PostgreSQL database...");
    let db_pool = PgPoolOptions::new()
        .max_connections(100)
        .connect(&database_url)
        .await?;

    tracing::info!("Database connected successfully");

    // Create application state
    let app_state = Arc::new(DynastyTraderState::new(db_pool.clone()));

    // Start background tasks
    let aging_interval = env::var("AGING_TICK_INTERVAL")
        .unwrap_or_else(|_| "3600".to_string())
        .parse::<u64>()
        .unwrap_or(3600);

    let snapshot_interval = 3600; // 1 hour for wealth snapshots

    // Spawn aging task
    let aging_task = AgingTask::new(Arc::new(db_pool.clone()), aging_interval);
    tokio::spawn(aging_task.start());

    // Spawn wealth snapshot task
    let wealth_task = WealthSnapshotTask::new(Arc::new(db_pool.clone()), snapshot_interval);
    tokio::spawn(wealth_task.start());

    // Spawn market tasks
    let market_expiration_task = MarketExpirationTask::new(Arc::new(db_pool.clone()), 300); // Every 5 minutes
    tokio::spawn(market_expiration_task.start());

    let market_price_task = MarketPriceSnapshotTask::new(Arc::new(db_pool.clone()), 300); // Every 5 minutes
    tokio::spawn(market_price_task.start());

    // Spawn death check task
    let death_task = DeathTask::new(Arc::new(db_pool.clone()), 1800); // Every 30 minutes
    tokio::spawn(death_task.start());

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Build the application router
    let app = Router::new()
        // Dynasty Trader API routes
        .nest("/api/v2", api::v2::routes(Arc::new(db_pool.clone())))
        // WebSocket endpoint
        .route("/ws/market", get(websocket_handler))
        .with_state(app_state.clone())
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
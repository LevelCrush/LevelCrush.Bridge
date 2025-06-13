use bridge::{
    api, 
    app_state::PgAppState, 
    tasks::{AgingTask, WealthSnapshotTask, MarketExpirationTask, MarketPriceSnapshotTask, DeathTask}, 
    utils
};

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

    // Skip automatic migrations for now
    // TODO: Set up proper SQLx migrations with timestamps
    tracing::info!("Skipping automatic migrations - run migrate_postgres manually");

    // Get JWT secret from environment (for now)
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    // Create application state
    let _app_state = Arc::new(PgAppState {
        db: db_pool.clone(),
        jwt_secret,
    });

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
        // Keep v1 routes for backward compatibility
        // Note: v1 routes expect MySQL, so they won't work properly with PostgreSQL
        // .nest("/api/v1", api::routes(app_state.clone()))
        // Add v2 routes for Dynasty Trader
        .nest("/api/v2", api::v2::routes(Arc::new(db_pool.clone())))
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
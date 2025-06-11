use std::io;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize the logging system with console and file outputs
/// Returns a WorkerGuard that must be kept alive for the duration of the program
pub fn init_logging() -> Result<WorkerGuard, Box<dyn std::error::Error>> {
    // Create logs directory if it doesn't exist
    std::fs::create_dir_all("logs")?;

    // Set up file appender with daily rotation
    let file_appender = tracing_appender::rolling::daily("logs", "bridge.log");
    let (non_blocking_appender, guard) = tracing_appender::non_blocking(file_appender);

    // Create environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("bridge=debug,tower_http=debug,sqlx=warn"));

    // Console layer with pretty formatting
    let console_layer = fmt::layer()
        .with_target(false)
        .with_thread_ids(false)
        .with_thread_names(false)
        .pretty()
        .with_writer(io::stdout);

    // File layer with full details (no JSON format in base tracing-subscriber)
    let file_layer = fmt::layer()
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_ansi(false)
        .with_writer(non_blocking_appender);

    // Initialize the subscriber with both layers
    tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer)
        .with(file_layer)
        .init();

    tracing::info!(
        "Logging initialized - console output and daily rotating file logs in ./logs/bridge.log"
    );

    Ok(guard)
}


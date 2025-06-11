use bridge::utils;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenvy::dotenv().ok();
    
    // Initialize logging
    let _guard = utils::init_logging()?;
    
    // Test different log levels
    tracing::trace!("This is a TRACE message - most detailed");
    tracing::debug!("This is a DEBUG message");
    tracing::info!("This is an INFO message");
    tracing::warn!("This is a WARNING message");
    tracing::error!("This is an ERROR message");
    
    // Test structured logging
    tracing::info!(
        user_id = "12345",
        action = "login",
        ip_address = "192.168.1.1",
        "User login attempt"
    );
    
    // Test logging with spans
    let span = tracing::info_span!("process_request", request_id = "abc-123");
    let _enter = span.enter();
    
    tracing::info!("Processing user request");
    tracing::debug!("Validating input parameters");
    tracing::info!("Request completed successfully");
    
    drop(_enter);
    
    // Give async logger time to flush
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    println!("\n✓ Logging test completed!");
    println!("Check ./logs/bridge.log for the file output");
    
    Ok(())
}
use sqlx::mysql::MySqlPoolOptions;
use std::env;
use std::fs;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");

    println!("Connecting to database...");
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Running migrations...");

    // Get a connection from the pool
    let mut conn = pool.acquire().await?;

    // Disable foreign key checks
    sqlx::query("SET FOREIGN_KEY_CHECKS = 0")
        .execute(&mut *conn)
        .await?;

    let migrations_dir = Path::new("migrations");
    let mut entries: Vec<_> = fs::read_dir(migrations_dir)?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext == "sql")
                .unwrap_or(false)
        })
        .collect();

    entries.sort_by_key(|entry| entry.path());

    for entry in entries {
        let path = entry.path();
        let filename = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown");

        println!("Running migration: {}", filename);

        let sql = fs::read_to_string(&path)?;

        // Parse SQL statements properly
        let mut statements = Vec::new();
        let mut current_statement = String::new();
        let mut in_string = false;
        let mut string_delimiter = ' ';
        
        for line in sql.lines() {
            let trimmed = line.trim();
            
            // Skip comment-only lines
            if trimmed.starts_with("--") || trimmed.is_empty() {
                continue;
            }
            
            // Track string literals to avoid splitting on semicolons inside strings
            for ch in line.chars() {
                if !in_string && (ch == '\'' || ch == '"') {
                    in_string = true;
                    string_delimiter = ch;
                } else if in_string && ch == string_delimiter {
                    in_string = false;
                }
                
                current_statement.push(ch);
                
                if ch == ';' && !in_string {
                    let stmt = current_statement.trim().to_string();
                    if !stmt.is_empty() {
                        statements.push(stmt);
                    }
                    current_statement.clear();
                }
            }
            current_statement.push('\n');
        }
        
        // Add any remaining statement
        let remaining = current_statement.trim();
        if !remaining.is_empty() && !remaining.starts_with("--") {
            statements.push(remaining.to_string());
        }

        let total_statements = statements.len();
        println!("  Found {} statements to execute", total_statements);

        let mut table_count = 0;
        let mut success_count = 0;
        
        for (i, statement) in statements.iter().enumerate() {
            // Create a preview of the statement
            let first_line = statement.lines().next().unwrap_or("");
            let preview = if first_line.len() > 80 {
                format!("{}...", &first_line[..80])
            } else {
                first_line.to_string()
            };
            
            println!("  [{}/{}] Executing: {}", i + 1, total_statements, preview);

            match sqlx::query(statement).execute(&mut *conn).await {
                Ok(result) => {
                    success_count += 1;
                    if statement.to_uppercase().contains("CREATE TABLE") {
                        table_count += 1;
                        println!("    ✓ Created table");
                    } else if statement.to_uppercase().starts_with("INSERT") {
                        println!("    ✓ Inserted {} rows", result.rows_affected());
                    } else if statement.to_uppercase().starts_with("DROP") {
                        println!("    ✓ Dropped table");
                    } else {
                        println!("    ✓ Success");
                    }
                },
                Err(e) => {
                    eprintln!("    ✗ Error: {}", e);
                    eprintln!("    Statement: {}", statement);
                    
                    // Re-enable foreign key checks before exiting
                    sqlx::query("SET FOREIGN_KEY_CHECKS = 1")
                        .execute(&mut *conn)
                        .await
                        .ok();
                    
                    return Err(format!("Migration {} failed at statement {}: {}", filename, i + 1, e).into());
                }
            }
        }

        println!("✓ Migration {} completed: {}/{} statements successful, {} tables created", 
                 filename, success_count, total_statements, table_count);
    }

    // Re-enable foreign key checks
    sqlx::query("SET FOREIGN_KEY_CHECKS = 1")
        .execute(&mut *conn)
        .await?;

    // Verify tables were created
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()"
    )
    .fetch_one(&pool)
    .await?;
    
    println!("\nTotal tables in database: {}", count.0);
    
    if count.0 == 0 {
        eprintln!("⚠️  WARNING: No tables were created!");
    }

    println!("All migrations completed successfully!");

    Ok(())
}
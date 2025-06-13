use sqlx::postgres::PgPoolOptions;
use std::env;
use std::fs;
use std::path::Path;

fn split_sql_statements(sql: &str) -> Vec<String> {
    let mut statements = Vec::new();
    let mut current = String::new();
    let mut in_string = false;
    let mut in_dollar_quote = false;
    let mut dollar_tag = String::new();
    let mut string_char = ' ';
    
    let chars: Vec<char> = sql.chars().collect();
    let mut i = 0;
    
    while i < chars.len() {
        let ch = chars[i];
        
        // Handle dollar quoting (PostgreSQL specific)
        if !in_string && ch == '$' {
            let start = i;
            let mut tag = String::from("$");
            i += 1;
            
            // Collect the tag
            while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_') {
                tag.push(chars[i]);
                i += 1;
            }
            
            if i < chars.len() && chars[i] == '$' {
                tag.push('$');
                i += 1;
                
                if in_dollar_quote && tag == dollar_tag {
                    in_dollar_quote = false;
                    dollar_tag.clear();
                } else if !in_dollar_quote {
                    in_dollar_quote = true;
                    dollar_tag = tag.clone();
                }
                
                current.push_str(&sql[start..i]);
                continue;
            } else {
                // Not a dollar quote, rewind
                i = start;
            }
        }
        
        // Handle regular string quotes
        if !in_dollar_quote {
            if !in_string && (ch == '\'' || ch == '"') {
                in_string = true;
                string_char = ch;
            } else if in_string && ch == string_char {
                // Check for escaped quotes
                if i + 1 < chars.len() && chars[i + 1] == string_char {
                    current.push(ch);
                    current.push(chars[i + 1]);
                    i += 2;
                    continue;
                }
                in_string = false;
            }
        }
        
        current.push(ch);
        
        // Check for statement end
        if ch == ';' && !in_string && !in_dollar_quote {
            let stmt = current.trim().to_string();
            if !stmt.is_empty() && !stmt.starts_with("--") {
                statements.push(stmt);
            }
            current.clear();
        }
        
        i += 1;
    }
    
    // Add any remaining statement
    let remaining = current.trim();
    if !remaining.is_empty() && !remaining.starts_with("--") {
        statements.push(remaining.to_string());
    }
    
    statements
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::from_filename(".env.dynasty").ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env.dynasty file");

    println!("Connecting to PostgreSQL/TimescaleDB database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Running PostgreSQL migrations...");

    let migrations_dir = Path::new("migrations/postgres");
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
        let statements = split_sql_statements(&sql);

        let total_statements = statements.len();
        println!("  Found {} statements to execute", total_statements);

        let mut transaction = pool.begin().await?;

        for (i, statement) in statements.iter().enumerate() {
            // Create a preview of the statement
            let first_line = statement.lines().next().unwrap_or("");
            let preview = if first_line.len() > 80 {
                format!("{}...", &first_line[..80])
            } else {
                first_line.to_string()
            };
            
            println!("  [{}/{}] Executing: {}", i + 1, total_statements, preview);

            match sqlx::query(statement).execute(&mut *transaction).await {
                Ok(_) => {
                    if statement.to_uppercase().contains("CREATE TABLE") {
                        println!("    ✓ Created table");
                    } else if statement.to_uppercase().contains("CREATE INDEX") {
                        println!("    ✓ Created index");
                    } else if statement.to_uppercase().contains("CREATE EXTENSION") {
                        println!("    ✓ Created extension");
                    } else if statement.to_uppercase().contains("CREATE FUNCTION") {
                        println!("    ✓ Created function");
                    } else if statement.to_uppercase().contains("CREATE TRIGGER") {
                        println!("    ✓ Created trigger");
                    } else if statement.to_uppercase().contains("CREATE MATERIALIZED VIEW") {
                        println!("    ✓ Created materialized view");
                    } else if statement.to_uppercase().contains("CREATE VIEW") {
                        println!("    ✓ Created view");
                    } else if statement.to_uppercase().contains("SELECT") {
                        println!("    ✓ Query executed");
                    } else {
                        println!("    ✓ Success");
                    }
                }
                Err(e) => {
                    transaction.rollback().await?;
                    eprintln!("    ✗ Error: {}", e);
                    eprintln!("    Statement: {}", statement);
                    return Err(format!("Migration {} failed at statement {}: {}", filename, i + 1, e).into());
                }
            }
        }

        transaction.commit().await?;
        println!("✓ Migration {} completed successfully", filename);
    }

    // Verify tables and hypertables
    let table_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_type = 'BASE TABLE'"
    )
    .fetch_one(&pool)
    .await?;
    
    println!("\nTotal tables in database: {}", table_count.0);

    // Check TimescaleDB hypertables
    let hypertable_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM timescaledb_information.hypertables"
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0,));
    
    println!("TimescaleDB hypertables: {}", hypertable_count.0);

    println!("\nAll migrations completed successfully!");

    Ok(())
}
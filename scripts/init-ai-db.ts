import Database from 'better-sqlite3';
import * as path from 'path';

// Initialize AI tables directly without going through db.server
async function initializeAIChat() {
  try {
    // Open the existing database directly
    const dbPath = path.join(process.cwd(), 'specky.db');
    const db = new Database(dbPath);
    
    console.log('Using existing database at:', dbPath);
    
    // Create AI tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_documents (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        metadata TEXT,
        tenant_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ AI documents table created');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ AI sessions table created');
    
    // Initialize vector database
    const sqliteVec = require('sqlite-vec');
    sqliteVec.load(db);
    
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS ai_vectors USING vec0(
        embedding FLOAT[1536]
      );
      
      CREATE TABLE IF NOT EXISTS ai_vectors_metadata (
        rowid INTEGER PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        FOREIGN KEY (rowid) REFERENCES ai_vectors(rowid)
      );
    `);
    console.log('✓ Vector database initialized');
    
    console.log('\nAI Chat database initialization complete!');
    
    db.close();
  } catch (error) {
    console.error('Failed to initialize AI database:', error);
    process.exit(1);
  }
}

initializeAIChat();
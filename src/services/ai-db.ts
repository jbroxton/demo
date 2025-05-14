import { getDb } from './db.server';

export function initializeAITables() {
  // Use the main database connection
  const db = getDb();
  
  // AI documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_documents (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      metadata TEXT,
      tenant_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Don't close the shared database connection
}

export function initializeVectorDatabase() {
  // Use the main database connection
  const db = getDb();
  const sqliteVec = require('sqlite-vec');
  sqliteVec.load(db);
  
  // Vector table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ai_vectors USING vec0(
      embedding FLOAT[1536]
    );
    
    CREATE TABLE IF NOT EXISTS ai_vectors_metadata (
      rowid INTEGER PRIMARY KEY,
      document_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      FOREIGN KEY (rowid) REFERENCES ai_vectors(rowid),
      FOREIGN KEY (document_id) REFERENCES ai_documents(id)
    );
  `);
  // Don't close the shared database connection
}
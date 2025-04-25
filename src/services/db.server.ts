// IMPORTANT: This file should only be imported from server components or API routes
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

// Initialize the SQLite database
export function getDb() {
  // Only initialize the database once
  if (!db) {
    db = new Database(path.join(process.cwd(), 'specky.db'));
    initDatabase();
  }
  return db;
}

// Create only the products table
function initDatabase() {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);
  
  // Create storage table for Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS products_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
} 
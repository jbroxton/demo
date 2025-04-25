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

// Initialize database with all required tables
function initDatabase() {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);
  
  // Create storage table for Products Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS products_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Interfaces table
  db.exec(`
    CREATE TABLE IF NOT EXISTS interfaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      productId TEXT,
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);
  
  // Create storage table for Interfaces Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS interfaces_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Features table
  db.exec(`
    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      priority TEXT NOT NULL,
      description TEXT,
      interfaceId TEXT,
      FOREIGN KEY (interfaceId) REFERENCES interfaces(id)
    );
  `);
  
  // Create storage table for Features Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS features_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  
  // Releases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      releaseDate TEXT NOT NULL,
      priority TEXT NOT NULL,
      featureId TEXT,
      FOREIGN KEY (featureId) REFERENCES features(id)
    );
  `);
  
  // Create storage table for Releases Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS releases_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
} 
import { getDb } from './db.server';

// Run database migrations to ensure schema is up to date
export function runMigrations() {
  const db = getDb();
  
  try {
    // Check if the releases table needs to be updated (missing tenantId)
    const tableInfo = db.prepare("PRAGMA table_info(releases)").all() as any[];
    const hasTenantId = tableInfo.some(column => column.name === 'tenantId');
    
    if (!hasTenantId) {
      console.log('Running migration: Adding tenantId column to releases table');
      
      // Start a transaction for the migration
      db.exec('BEGIN TRANSACTION;');
      
      // Add tenantId column to releases table
      db.exec("ALTER TABLE releases ADD COLUMN tenantId TEXT DEFAULT 'org1';");
      
      // Add foreign key constraint
      db.exec('CREATE TABLE releases_new (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, releaseDate TEXT NOT NULL, priority TEXT NOT NULL, featureId TEXT, tenantId TEXT NOT NULL, FOREIGN KEY (featureId) REFERENCES features(id), FOREIGN KEY (tenantId) REFERENCES tenants(id));');
      
      // Copy data from old table to new table
      db.exec("INSERT INTO releases_new SELECT id, name, description, releaseDate, priority, featureId, 'org1' FROM releases;");
      
      // Drop old table
      db.exec('DROP TABLE releases;');
      
      // Rename new table to original name
      db.exec('ALTER TABLE releases_new RENAME TO releases;');
      
      // Recreate the index
      db.exec('CREATE INDEX idx_releases_featureId ON releases(featureId);');
      
      // Commit the transaction
      db.exec('COMMIT;');
      
      console.log('Migration completed successfully');
    } else {
      console.log('No migrations needed for releases table');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error running migrations:', error);
    
    // Roll back transaction if there was an error
    try {
      db.exec('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
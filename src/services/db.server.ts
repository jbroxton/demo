// IMPORTANT: This file should only be imported from server components or API routes
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;
let migrationsRun = false;

// Initialize the SQLite database
export function getDb() {
  // Only initialize the database once
  if (!db) {
    db = new Database(path.join(process.cwd(), 'specky.db'));
    initDatabase();
    
    // Run migrations after basic initialization
    if (!migrationsRun) {
      runDatabaseMigrations();
      migrationsRun = true;
    }
  }
  return db;
}

// Run database migrations to ensure schema is up to date
function runDatabaseMigrations() {
  try {
    // Check if the releases table needs to be updated (missing tenantId)
    const tableInfo = db.prepare("PRAGMA table_info(releases)").all() as any[];
    const hasTenantId = tableInfo.some(column => column.name === 'tenantId');
    
    if (!hasTenantId) {
      console.log('Running migration: Adding tenantId column to releases table');
      
      // Start a transaction for the migration
      db.exec('BEGIN TRANSACTION;');
      
      try {
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
      } catch (error) {
        // Roll back transaction if there was an error
        db.exec('ROLLBACK;');
        console.error('Error during migration, rolled back:', error);
        throw error;
      }
    } else {
      console.log('No migrations needed for releases table');
    }
  } catch (error) {
    console.error('Error checking for migrations:', error);
  }
}

// Initialize database with all required tables
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      passwordHash TEXT NOT NULL
    );
  `);

  // Tenants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );
  `);

  // User-Tenant associations
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tenants (
      userId TEXT NOT NULL,
      tenantId TEXT NOT NULL,
      PRIMARY KEY (userId, tenantId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);

  // Products table with tenant
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      tenantId TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);

  // Interfaces table
  db.exec(`
    CREATE TABLE IF NOT EXISTS interfaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      productId TEXT,
      tenantId TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
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
      tenantId TEXT NOT NULL,
      FOREIGN KEY (interfaceId) REFERENCES interfaces(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
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
      tenantId TEXT NOT NULL,
      FOREIGN KEY (featureId) REFERENCES features(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);
  
  // Create index for improving query performance when filtering releases by featureId
  db.exec(`CREATE INDEX IF NOT EXISTS idx_releases_featureId ON releases(featureId);`);
  
  // Requirements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT,
      description TEXT,
      priority TEXT,
      featureId TEXT NOT NULL,
      releaseId TEXT,
      cuj TEXT,
      acceptanceCriteria TEXT,
      tenantId TEXT NOT NULL,
      FOREIGN KEY (featureId) REFERENCES features(id),
      FOREIGN KEY (releaseId) REFERENCES releases(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);
  
  // Create indexes for improving query performance for requirements
  db.exec(`CREATE INDEX IF NOT EXISTS idx_requirements_featureId ON requirements(featureId);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_requirements_releaseId ON requirements(releaseId);`);

  // Attachments table for storing references to external resources
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      thumbnail_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      metadata TEXT,
      tenant_id TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );
  `);

  // Create index for improving query performance when filtering attachments by entity
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_id, entity_type);`);

  // Tabs table for persisting application state
  db.exec(`
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      itemId TEXT NOT NULL,
      userId TEXT NOT NULL,
      tenantId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);

  // Active tab tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS active_tabs (
      userId TEXT PRIMARY KEY,
      tabId TEXT NOT NULL,
      tenantId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (tabId) REFERENCES tabs(id),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);
  
  // Grid settings table for storing AG-Grid UI preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS grid_settings (
      userId TEXT,
      gridId TEXT,
      columnState TEXT,
      filterState TEXT,
      sortState TEXT,
      lastUpdated TEXT,
      tenantId TEXT NOT NULL,
      PRIMARY KEY (userId, gridId, tenantId),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
  `);

  // Insert demo tenants if they don't exist
  insertDemoTenants();
  
  // Insert demo users if they don't exist
  insertDemoUsers();
}

// Insert demo tenants
function insertDemoTenants() {
  const tenants = [
    { id: 'org1', name: 'Organization 1', slug: 'org1' },
    { id: 'org2', name: 'Organization 2', slug: 'org2' }
  ];
  
  const stmt = db.prepare('INSERT OR IGNORE INTO tenants (id, name, slug) VALUES (?, ?, ?)');
  
  tenants.forEach(tenant => {
    stmt.run(tenant.id, tenant.name, tenant.slug);
  });
}

// Insert demo users
function insertDemoUsers() {
  const users = [
    { 
      id: 'pm1', 
      email: 'pm1@demo.com', 
      name: 'Justin', 
      role: 'pm', 
      passwordHash: 'password', // In a real app, this would be properly hashed
      tenants: ['org1']
    },
    { 
      id: 'pm2', 
      email: 'pm2@demo.com', 
      name: 'Sarah', 
      role: 'pm', 
      passwordHash: 'password',
      tenants: ['org2'] 
    },
    { 
      id: 'admin', 
      email: 'admin@example.com', 
      name: 'Admin User', 
      role: 'admin', 
      passwordHash: 'password',
      tenants: ['org1', 'org2']
    }
  ];
  
  const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, email, name, role, passwordHash) VALUES (?, ?, ?, ?, ?)');
  const userTenantStmt = db.prepare('INSERT OR IGNORE INTO user_tenants (userId, tenantId) VALUES (?, ?)');
  
  users.forEach(user => {
    userStmt.run(user.id, user.email, user.name, user.role, user.passwordHash);
    
    user.tenants.forEach(tenantId => {
      userTenantStmt.run(user.id, tenantId);
    });
  });
} 
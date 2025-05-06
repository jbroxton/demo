const Database = require('better-sqlite3');
const path = require('path');
const { nanoid } = require('nanoid');

console.log('Starting approval system fix script...');

// Connect to the database
const dbPath = path.join(process.cwd(), 'specky.db');
console.log(`Opening database at: ${dbPath}`);
const db = new Database(dbPath);

// Run the fix as a transaction
try {
  console.log('Beginning transaction...');
  db.exec('BEGIN TRANSACTION');

  // Force recreate the approval_stages table
  console.log('Dropping and recreating approval_stages table...');
  db.exec('DROP TABLE IF EXISTS approval_stages');
  db.exec(`
    CREATE TABLE approval_stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      order_num INTEGER NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Force recreate the approval_statuses table
  console.log('Dropping and recreating approval_statuses table...');
  db.exec('DROP TABLE IF EXISTS approval_statuses');
  db.exec(`
    CREATE TABLE approval_statuses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Force recreate the entity_approvals table
  console.log('Dropping and recreating entity_approvals table...');
  db.exec('DROP TABLE IF EXISTS entity_approvals');
  db.exec(`
    CREATE TABLE entity_approvals (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      stage_id TEXT NOT NULL,
      status_id TEXT NOT NULL,
      approver TEXT,
      comments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES approval_stages(id),
      FOREIGN KEY (status_id) REFERENCES approval_statuses(id)
    )
  `);

  // Create index for entity_approvals
  console.log('Creating index for entity_approvals...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entity_approvals_entity
    ON entity_approvals(entity_id, entity_type)
  `);

  // Insert default stages
  console.log('Inserting default approval stages...');
  const now = new Date().toISOString();

  // Main stages
  const mainStages = [
    { name: 'Product Definition', description: 'Initial product requirements and scope', type: 'main', order_num: 10 },
    { name: 'UX Design', description: 'User experience design and wireframes', type: 'main', order_num: 20 },
    { name: 'Research', description: 'User research, data analysis, and validation', type: 'main', order_num: 30 },
    { name: 'Engineering', description: 'Technical implementation and development', type: 'main', order_num: 40 },
    { name: 'QA', description: 'Quality assurance and testing', type: 'main', order_num: 50 }
  ];

  // Launch phases
  const launchStages = [
    { name: 'Internal Testing', description: 'Testing with internal users', type: 'launch', order_num: 10 },
    { name: 'Limited Release', description: 'Limited availability to select users', type: 'launch', order_num: 20 },
    { name: 'Partial Launch', description: 'Availability to specific market segments', type: 'launch', order_num: 30 },
    { name: 'Full Launch', description: 'Complete availability to all users', type: 'launch', order_num: 40 }
  ];

  // Prepare statement for stages
  const stageStmt = db.prepare(`
    INSERT INTO approval_stages 
    (id, name, description, order_num, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert all stages
  [...mainStages, ...launchStages].forEach(stage => {
    const id = `stage-${nanoid(8)}`;
    console.log(`Inserting stage: ${stage.name} (${id})`);
    stageStmt.run(
      id,
      stage.name,
      stage.description,
      stage.order_num,
      stage.type,
      now,
      now
    );
  });

  // Insert default statuses
  console.log('Inserting default approval statuses...');
  const defaultStatuses = [
    { name: 'Not Started', color: '#6c757d', description: 'Work has not yet begun' },
    { name: 'In Progress', color: '#007bff', description: 'Work is currently underway' },
    { name: 'Pending Approval', color: '#ffc107', description: 'Waiting for approval' },
    { name: 'Approved', color: '#28a745', description: 'Formally approved' },
    { name: 'Completed', color: '#20c997', description: 'Work is finished' },
    { name: 'Rejected', color: '#dc3545', description: 'Approval was denied' },
    { name: 'Blocked', color: '#fd7e14', description: 'Progress is blocked' },
    { name: 'Not Needed', color: '#6c757d', description: 'This stage is not required' }
  ];

  // Prepare statement for statuses
  const statusStmt = db.prepare(`
    INSERT INTO approval_statuses 
    (id, name, color, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert all statuses
  defaultStatuses.forEach(status => {
    const id = `status-${nanoid(8)}`;
    console.log(`Inserting status: ${status.name} (${id})`);
    statusStmt.run(
      id,
      status.name,
      status.color,
      status.description,
      now,
      now
    );
  });

  // Verify tables have data
  const stagesCount = db.prepare('SELECT COUNT(*) as count FROM approval_stages').get();
  const statusesCount = db.prepare('SELECT COUNT(*) as count FROM approval_statuses').get();

  console.log(`Verification: ${stagesCount.count} stages and ${statusesCount.count} statuses inserted`);

  // Commit the transaction
  console.log('Committing transaction...');
  db.exec('COMMIT');
  console.log('Fix complete!');

  // Check users and auth tables are intact
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const tenantsCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get();
  const userTenantsCount = db.prepare('SELECT COUNT(*) as count FROM user_tenants').get();
  
  console.log('Auth tables verification:');
  console.log(`- Users: ${usersCount.count}`);
  console.log(`- Tenants: ${tenantsCount.count}`);
  console.log(`- User-Tenant mappings: ${userTenantsCount.count}`);

} catch (error) {
  // Roll back the transaction if there was an error
  console.error('Error in fix script, rolling back:', error);
  db.exec('ROLLBACK');
} finally {
  // Close the database connection
  db.close();
}
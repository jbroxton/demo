/**
 * Cleanup script to remove ALL test stages from the approval_stages table
 * and handle related entity_approvals rows properly
 */

const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const db = new Database(path.join(__dirname, 'specky.db'));

console.log('Cleaning up ALL test stages...');

// Begin a transaction
db.prepare('BEGIN TRANSACTION').run();

try {
  // Find all test stages (stages with name "Test Stage" or IDs starting with "test-")
  const testStages = db.prepare(`
    SELECT id, name 
    FROM approval_stages 
    WHERE name = 'Test Stage' OR id LIKE 'test-%'
  `).all();
  
  console.log(`Found ${testStages.length} test stages to delete:`, testStages);
  
  // Process all test stages
  for (const stage of testStages) {
    console.log(`Processing test stage ${stage.id}...`);
    
    // Find entity approvals using this stage
    const approvals = db.prepare(`
      SELECT id, entity_id, entity_type, status_id
      FROM entity_approvals
      WHERE stage_id = ?
    `).all(stage.id);
    
    console.log(`Found ${approvals.length} entity approvals using stage ${stage.id}`);
    
    if (approvals.length > 0) {
      // Delete all approvals for this test stage
      console.log(`Deleting ${approvals.length} entity approvals that use stage ${stage.id}`);
      
      const deleteApprovalsStmt = db.prepare(`
        DELETE FROM entity_approvals
        WHERE stage_id = ?
      `);
      
      const result = deleteApprovalsStmt.run(stage.id);
      console.log(`Deleted ${result.changes} entity approvals`);
    }
    
    // Now delete the test stage
    console.log(`Deleting test stage: ${stage.id}`);
    const result = db.prepare(`
      DELETE FROM approval_stages 
      WHERE id = ?
    `).run(stage.id);
    
    console.log(`Deleted stage ${stage.id}: ${result.changes > 0 ? 'Success' : 'Failed'}`);
  }
  
  // Make sure the remaining stages are in good order
  const remainingStages = db.prepare(`
    SELECT id, name, description, order_num as "order", type
    FROM approval_stages
    ORDER BY type, order_num
  `).all();
  
  console.log('Remaining approval stages:');
  console.log(JSON.stringify(remainingStages, null, 2));
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  
  console.log('Cleanup completed successfully! All test stages have been removed.');
} catch (error) {
  // Rollback the transaction on error
  db.prepare('ROLLBACK').run();
  console.error('Error during cleanup:', error);
} finally {
  // Close the database connection
  db.close();
}
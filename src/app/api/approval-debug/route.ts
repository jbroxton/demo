import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/services/db.server';
import { createApprovalStagesTable } from '@/services/approval-stages-db';
import { createApprovalStatusesTable } from '@/services/approval-statuses-db';

// Get db instance
const db = getDb();

/**
 * Debug endpoint to check the database status for the approval system
 */
export async function GET(req: NextRequest) {
  try {
    // Check database health
    console.log('Checking database health...');
    const dbHealth = await checkDatabaseHealth();
    
    // Create tables if they don't exist
    console.log('Creating tables if needed...');
    const stagesTable = await createApprovalStagesTable();
    const statusesTable = await createApprovalStatusesTable();
    
    // Check table details
    console.log('Getting table details...');
    const tableDetails = await getTableDetails();
    
    // DISABLED: Direct test to insert a test stage - causes duplicate test stages
    // console.log('Attempting direct test insert...');
    // const testInsert = await testDirectInsert();
    const testInsert = { disabled: "Test stage creation disabled to prevent duplicates" };
    
    // Return all diagnostic info
    return NextResponse.json({
      success: true,
      dbHealth,
      tables: {
        stages: stagesTable,
        statuses: statusesTable
      },
      tableDetails,
      testInsert
    });
    
  } catch (error) {
    console.error('Error in approval debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Check overall database health
 */
async function checkDatabaseHealth() {
  try {
    // Simple query to check if db is working
    const result = db.prepare('SELECT 1 as test').get();
    
    // Try to get the list of tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();
    
    return {
      success: true,
      connectionTest: result,
      tables: tables
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Get details about approval tables
 */
async function getTableDetails() {
  try {
    // Get info about approval_stages table
    const stagesInfo = db.prepare(`
      PRAGMA table_info(approval_stages)
    `).all();
    
    // Get info about approval_statuses table
    const statusesInfo = db.prepare(`
      PRAGMA table_info(approval_statuses)
    `).all();
    
    // Count records in each table
    const stagesCount = db.prepare(`
      SELECT COUNT(*) as count FROM approval_stages
    `).get();
    
    const statusesCount = db.prepare(`
      SELECT COUNT(*) as count FROM approval_statuses
    `).get();
    
    return {
      success: true,
      stages: {
        schema: stagesInfo,
        count: stagesCount
      },
      statuses: {
        schema: statusesInfo,
        count: statusesCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Test a direct insert into approval_stages table
 */
async function testDirectInsert() {
  try {
    const now = new Date().toISOString();
    const id = `test-${Date.now()}`;
    
    // Direct test insert with fixed values
    const result = db.prepare(`
      INSERT INTO approval_stages 
      (id, name, description, order_num, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      'Test Stage', 
      'A test stage created by debug endpoint', 
      999, 
      'main',
      now,
      now
    );
    
    // Try to retrieve the test record
    const record = db.prepare(`
      SELECT * FROM approval_stages WHERE id = ?
    `).get(id);
    
    return {
      success: true,
      insertResult: result,
      retrievedRecord: record
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}
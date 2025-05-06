import { getDb } from './db.server';
import { ApprovalStatus } from '@/types/models';
import { nanoid } from 'nanoid';

// Get db instance
const db = getDb();

/**
 * Create approval statuses table if it doesn't exist
 */
export async function createApprovalStatusesTable() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS approval_statuses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

/**
 * Get all approval statuses
 */
export async function getApprovalStatuses(): Promise<ApprovalStatus[]> {
  try {
    await createApprovalStatusesTable();
    
    console.log('Fetching approval statuses from database...');
    
    // Use prepare/all pattern which is more reliable
    const query = db.prepare(`
      SELECT 
        id, 
        name, 
        color, 
        description,
        created_at,
        updated_at 
      FROM approval_statuses 
      ORDER BY name
    `);
    
    const statuses = query.all() as ApprovalStatus[];
    
    console.log(`Retrieved ${statuses?.length || 0} statuses from database`);
    
    if (statuses.length === 0) {
      console.log('No statuses found. Please use the fix-approvals.js script to initialize the database.');
    }
    
    return statuses || [];
  } catch (error) {
    console.error('Error retrieving approval statuses:', error);
    return [];
  }
}

/**
 * Get approval status by ID
 */
export async function getApprovalStatusById(id: string): Promise<ApprovalStatus | null> {
  try {
    await createApprovalStatusesTable();
    
    console.log(`Fetching approval status with ID: ${id}`);
    
    // Use prepare pattern which is more reliable
    const query = db.prepare(`
      SELECT 
        id, 
        name, 
        color, 
        description,
        created_at,
        updated_at 
      FROM approval_statuses 
      WHERE id = ?
    `);
    
    const status = query.get(id) as ApprovalStatus;
    
    if (!status) {
      console.log(`No status found with ID: ${id}`);
    }
    
    return status || null;
  } catch (error) {
    console.error(`Error retrieving approval status with ID: ${id}`, error);
    return null;
  }
}

/**
 * Create a new approval status
 */
export async function createApprovalStatus(statusData: Partial<ApprovalStatus>): Promise<ApprovalStatus> {
  await createApprovalStatusesTable();
  
  const now = new Date().toISOString();
  const id = statusData.id || nanoid();
  
  db.prepare(`
    INSERT INTO approval_statuses (
      id, 
      name, 
      color, 
      description,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    statusData.name || '',
    statusData.color || '#cccccc',
    statusData.description || '',
    now,
    now
  );
  
  const newStatus = await getApprovalStatusById(id);
  return newStatus as ApprovalStatus;
}

/**
 * Update approval status
 */
export async function updateApprovalStatus(id: string, statusData: Partial<ApprovalStatus>): Promise<ApprovalStatus | null> {
  await createApprovalStatusesTable();
  
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE approval_statuses 
    SET 
      name = ?,
      color = ?,
      description = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    statusData.name,
    statusData.color,
    statusData.description,
    now,
    id
  );
  
  return getApprovalStatusById(id);
}

/**
 * Delete approval status
 */
export async function deleteApprovalStatus(id: string): Promise<boolean> {
  await createApprovalStatusesTable();
  
  const result = db.prepare(`
    DELETE FROM approval_statuses 
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

/**
 * Initialize default approval statuses
 */
export async function initializeDefaultApprovalStatuses(): Promise<any> {
  try {
    console.log('Creating approval statuses table...');
    await createApprovalStatusesTable();
    
    // Check if statuses already exist
    console.log('Checking for existing statuses...');
    const existingStatuses = await getApprovalStatuses();
    console.log(`Found ${existingStatuses.length} existing statuses`);
    
    if (existingStatuses.length > 0) {
      console.log('Statuses already exist, skipping initialization');
      return { success: true, message: 'Statuses already exist' }; // Don't recreate if already exist
    }
    
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
    
    console.log(`Creating ${defaultStatuses.length} default statuses...`);
    
    // Create all statuses in a transaction
    console.log('Beginning transaction...');
    db.exec('BEGIN TRANSACTION');
    
    const createdStatuses = [];
    try {
      for (const status of defaultStatuses) {
        console.log(`Creating status: ${status.name}`);
        const newStatus = await createApprovalStatus(status as Partial<ApprovalStatus>);
        createdStatuses.push(newStatus);
      }
      
      console.log('Committing transaction...');
      db.exec('COMMIT');
      console.log('Default statuses created successfully');
      
      return { 
        success: true, 
        message: `Created ${createdStatuses.length} statuses`, 
        statuses: createdStatuses 
      };
    } catch (error) {
      console.error('Error in status creation, rolling back...', error);
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error initializing default approval statuses:', error);
    return { 
      success: false, 
      error: JSON.stringify(error) 
    };
  }
}
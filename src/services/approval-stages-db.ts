import { getDb } from './db.server';
import { ApprovalStage } from '@/types/models';
import { nanoid } from 'nanoid';

// Get db instance
const db = getDb();

/**
 * Create approval stages table if it doesn't exist
 */
export async function createApprovalStagesTable() {
  try {
    console.log('Creating or verifying approval_stages table...');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS approval_stages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        order_num INTEGER NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // Check if the table was created successfully
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='approval_stages'
    `).get();
    
    if (tableCheck) {
      console.log('approval_stages table exists or was created successfully');
    } else {
      console.error('Failed to create approval_stages table');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating approval_stages table:', error);
    return { success: false, error };
  }
}

/**
 * Get all approval stages
 */
export async function getApprovalStages(): Promise<ApprovalStage[]> {
  try {
    await createApprovalStagesTable();
    
    console.log('Fetching approval stages from database...');
    
    // First, check if table exists and has rows
    const check = db.prepare(`
      SELECT COUNT(*) as count FROM approval_stages
    `).get();
    
    console.log('Stage count check:', check);
    
    // Direct check with a simpler query first to debug
    try {
      const simple = db.prepare(`SELECT id, name, description, order_num, type, created_at, updated_at FROM approval_stages LIMIT 5`).all();
      console.log('Simple direct check returned:', simple.length, 'records');
    } catch (err) {
      console.error('Simple query failed:', err);
    }
    
    // Use prepare/all pattern which is more reliable
    const query = db.prepare(`
      SELECT 
        id, 
        name, 
        description, 
        order_num as order_value, 
        type,
        created_at,
        updated_at 
      FROM approval_stages 
      ORDER BY type, order_num
    `);
    
    // Map the results to the expected format with order property
    const rawStages = query.all();
    const stages = rawStages.map((stage: any) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      order: stage.order_value, // Map order_num to order
      type: stage.type,
      created_at: stage.created_at,
      updated_at: stage.updated_at
    })) as ApprovalStage[];
    
    console.log(`Retrieved ${stages?.length || 0} stages from database:`, stages);
    
    // Don't try to automatically initialize - we've already done this with our fix script
    if (stages.length === 0) {
      console.log('No stages found. Please use the fix-approvals.js script to initialize the database.');
    }
    
    return stages || [];
  } catch (error) {
    console.error('Error retrieving approval stages:', error);
    return [];
  }
}

/**
 * Get approval stage by ID
 */
export async function getApprovalStageById(id: string): Promise<ApprovalStage | null> {
  try {
    await createApprovalStagesTable();
    
    console.log(`Fetching approval stage with ID: ${id}`);
    
    // Use prepare pattern which is more reliable
    const query = db.prepare(`
      SELECT 
        id, 
        name, 
        description, 
        order_num as order_value, 
        type,
        created_at,
        updated_at 
      FROM approval_stages 
      WHERE id = ?
    `);
    
    const stage = query.get(id) as ApprovalStage;
    
    if (!stage) {
      console.log(`No stage found with ID: ${id}`);
    }
    
    return stage || null;
  } catch (error) {
    console.error(`Error retrieving approval stage with ID: ${id}`, error);
    return null;
  }
}

/**
 * Create a new approval stage
 */
export async function createApprovalStage(stageData: Partial<ApprovalStage>): Promise<ApprovalStage> {
  await createApprovalStagesTable();
  
  const now = new Date().toISOString();
  const id = stageData.id || nanoid();
  
  console.log('Creating new approval stage with data:', stageData);
  
  db.prepare(`
    INSERT INTO approval_stages (
      id, 
      name, 
      description, 
      order_num, 
      type,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    stageData.name || '',
    stageData.description || '',
    stageData.order || 0,
    stageData.type || 'main',
    now,
    now
  );
  
  const newStage = await getApprovalStageById(id);
  console.log('Created new approval stage:', newStage);
  return newStage as ApprovalStage;
}

/**
 * Update approval stage
 */
export async function updateApprovalStage(id: string, stageData: Partial<ApprovalStage>): Promise<ApprovalStage | null> {
  await createApprovalStagesTable();
  
  const now = new Date().toISOString();
  
  console.log('Updating approval stage with ID:', id, 'and data:', stageData);
  
  db.prepare(`
    UPDATE approval_stages 
    SET 
      name = ?,
      description = ?,
      order_num = ?,
      type = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    stageData.name,
    stageData.description,
    stageData.order,
    stageData.type,
    now,
    id
  );
  
  const updatedStage = await getApprovalStageById(id);
  console.log('Updated approval stage:', updatedStage);
  return updatedStage;
}

/**
 * Delete approval stage
 */
export async function deleteApprovalStage(id: string): Promise<boolean> {
  await createApprovalStagesTable();
  
  const result = db.prepare(`
    DELETE FROM approval_stages 
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

/**
 * Initialize default approval stages
 */
export async function initializeDefaultApprovalStages(): Promise<any> {
  try {
    console.log('Creating approval stages table...');
    await createApprovalStagesTable();
    
    // Check if stages already exist
    console.log('Checking for existing stages...');
    const existingStages = await getApprovalStages();
    console.log(`Found ${existingStages.length} existing stages`);
    
    if (existingStages.length > 0) {
      console.log('Stages already exist, skipping initialization');
      return { success: true, message: 'Stages already exist' }; // Don't recreate if already exist
    }
    
    // Main stages
    const mainStages = [
      { name: 'Product Definition', description: 'Initial product requirements and scope', type: 'main', order: 10 },
      { name: 'UX Design', description: 'User experience design and wireframes', type: 'main', order: 20 },
      { name: 'Research', description: 'User research, data analysis, and validation', type: 'main', order: 30 },
      { name: 'Engineering', description: 'Technical implementation and development', type: 'main', order: 40 },
      { name: 'QA', description: 'Quality assurance and testing', type: 'main', order: 50 }
    ];
    
    // Launch phases
    const launchStages = [
      { name: 'Internal Testing', description: 'Testing with internal users', type: 'launch', order: 10 },
      { name: 'Limited Release', description: 'Limited availability to select users', type: 'launch', order: 20 },
      { name: 'Partial Launch', description: 'Availability to specific market segments', type: 'launch', order: 30 },
      { name: 'Full Launch', description: 'Complete availability to all users', type: 'launch', order: 40 }
    ];
    
    console.log(`Creating ${mainStages.length + launchStages.length} default stages...`);
    
    // Create all stages in a transaction
    console.log('Beginning transaction...');
    db.exec('BEGIN TRANSACTION');
    
    try {
      for (const stage of [...mainStages, ...launchStages]) {
        console.log(`Creating stage: ${stage.name} with order ${stage.order}`);
        await createApprovalStage({
          name: stage.name,
          description: stage.description,
          type: stage.type as 'main' | 'launch',
          order: stage.order
        });
      }
      
      console.log('Committing transaction...');
      db.exec('COMMIT');
      console.log('Default stages created successfully');
      
      // Refetch all stages after creation
      const createdStages = await getApprovalStages();
      console.log(`Verified ${createdStages.length} stages were created`);
      
      return { 
        success: true, 
        message: `Created ${createdStages.length} stages`,
        stages: createdStages
      };
    } catch (error) {
      console.error('Error in stage creation, rolling back...', error);
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error initializing default approval stages:', error);
    return { 
      success: false, 
      error: JSON.stringify(error) 
    };
  }
}
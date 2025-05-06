import { getDb } from './db.server';
import { EntityApproval } from '@/types/models';
import { nanoid } from 'nanoid';
import { createApprovalStagesTable } from './approval-stages-db';
import { createApprovalStatusesTable } from './approval-statuses-db';

// Get db instance
const db = getDb();

/**
 * Create entity approvals table if it doesn't exist
 */
export async function createEntityApprovalsTable() {
  // Ensure dependent tables exist
  await createApprovalStagesTable();
  await createApprovalStatusesTable();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS entity_approvals (
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
  
  // Create index for faster lookups
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entity_approvals_entity
    ON entity_approvals(entity_id, entity_type)
  `);
}

/**
 * Get approvals by entity
 */
export async function getApprovalsByEntity(
  entityId: string, 
  entityType: 'feature' | 'release'
): Promise<EntityApproval[]> {
  try {
    await createEntityApprovalsTable();
    
    console.log(`Fetching approvals for ${entityType} with ID: ${entityId}`);
    
    // Use prepare pattern which is more reliable
    const query = db.prepare(`
      SELECT 
        id, 
        entity_id, 
        entity_type, 
        stage_id, 
        status_id, 
        approver, 
        comments,
        created_at,
        updated_at 
      FROM entity_approvals 
      WHERE entity_id = ? AND entity_type = ?
    `);
    
    const approvals = query.all(entityId, entityType) as EntityApproval[];
    
    console.log(`Retrieved ${approvals?.length || 0} approvals`);
    
    return approvals || [];
  } catch (error) {
    console.error(`Error retrieving approvals for ${entityType} with ID: ${entityId}`, error);
    return [];
  }
}

/**
 * Get approval by ID
 */
export async function getApprovalById(id: string): Promise<EntityApproval | null> {
  await createEntityApprovalsTable();
  
  const approval = db.prepare(`
    SELECT 
      id, 
      entity_id, 
      entity_type, 
      stage_id, 
      status_id, 
      approver, 
      comments,
      created_at,
      updated_at 
    FROM entity_approvals 
    WHERE id = ?
  `).get(id) as EntityApproval | undefined;
  
  return approval || null;
}

/**
 * Create or update entity approval
 * If an approval already exists for the entity/stage combination, it will be updated
 */
export async function createOrUpdateEntityApproval(
  approvalData: Partial<EntityApproval>
): Promise<EntityApproval> {
  await createEntityApprovalsTable();
  
  if (!approvalData.entity_id || !approvalData.entity_type || !approvalData.stage_id || !approvalData.status_id) {
    throw new Error('Missing required approval data');
  }
  
  const now = new Date().toISOString();
  
  // Check if approval already exists for this entity/stage
  const existingApproval = db.prepare(`
    SELECT id FROM entity_approvals 
    WHERE entity_id = ? AND entity_type = ? AND stage_id = ?
  `).get(approvalData.entity_id, approvalData.entity_type, approvalData.stage_id) as EntityApproval | undefined;
  
  if (existingApproval) {
    // Update existing approval
    await db.prepare(`
      UPDATE entity_approvals 
      SET 
        status_id = ?,
        approver = ?,
        comments = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      approvalData.status_id,
      approvalData.approver || null,
      approvalData.comments || null,
      now,
      existingApproval.id
    );
    
    return getApprovalById(existingApproval.id) as Promise<EntityApproval>;
  } else {
    // Create new approval
    const id = approvalData.id || nanoid();
    
    await db.prepare(`
      INSERT INTO entity_approvals (
        id, 
        entity_id, 
        entity_type, 
        stage_id, 
        status_id, 
        approver, 
        comments,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      approvalData.entity_id,
      approvalData.entity_type,
      approvalData.stage_id,
      approvalData.status_id,
      approvalData.approver || null,
      approvalData.comments || null,
      now,
      now
    );
    
    return getApprovalById(id) as Promise<EntityApproval>;
  }
}

/**
 * Delete entity approval
 */
export async function deleteEntityApproval(id: string): Promise<boolean> {
  await createEntityApprovalsTable();
  
  const result = db.prepare(`
    DELETE FROM entity_approvals 
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

/**
 * Delete all approvals for an entity
 */
export async function deleteEntityApprovals(
  entityId: string, 
  entityType: 'feature' | 'release'
): Promise<boolean> {
  await createEntityApprovalsTable();
  
  const result = db.prepare(`
    DELETE FROM entity_approvals 
    WHERE entity_id = ? AND entity_type = ?
  `).run(entityId, entityType);
  
  return result.changes > 0;
}

/**
 * Initialize default approvals for a new entity
 * This creates a default approval record for each stage with "Not Started" status
 */
export async function initializeEntityApprovals(
  entityId: string, 
  entityType: 'feature' | 'release'
): Promise<EntityApproval[]> {
  await createEntityApprovalsTable();
  
  // Get all stages
  const stages = db.prepare(`
    SELECT id FROM approval_stages ORDER BY type, order_num
  `).all() as {id: string}[];
  
  // Get "Not Started" status
  const notStartedStatus = db.prepare(`
    SELECT id FROM approval_statuses WHERE name = 'Not Started' LIMIT 1
  `).get() as {id: string};
  
  if (!notStartedStatus) {
    throw new Error('Default "Not Started" status not found');
  }
  
  // Create approvals in a transaction
  db.exec('BEGIN TRANSACTION');
  try {
    for (const stage of stages) {
      await createOrUpdateEntityApproval({
        entity_id: entityId,
        entity_type: entityType,
        stage_id: stage.id,
        status_id: notStartedStatus.id
      });
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Error initializing entity approvals:', error);
    throw error;
  }
  
  return getApprovalsByEntity(entityId, entityType);
}
import { getDb } from './db.server';
import { EntityApproval } from '@/types/models';
import { nanoid } from 'nanoid';
import { createApprovalStagesTable } from './approval-stages-db';
import { createApprovalStatusesTable } from './approval-statuses-db';

// Get db instance
const db = getDb();

// Roadmap status constants
export const ROADMAP_STATUS = {
  NOT_PLANNED: 'not_planned',
  BACKLOG: 'backlog',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

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
      roadmap_status TEXT,
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

  // Check if roadmap_status column exists, add it if not
  try {
    const columnCheck = db.prepare(`
      SELECT roadmap_status FROM entity_approvals LIMIT 1
    `);

    try {
      columnCheck.get();
    } catch (error) {
      // If an error occurs, the column doesn't exist - add it
      console.log('Adding roadmap_status column to entity_approvals table');
      await db.exec(`
        ALTER TABLE entity_approvals ADD COLUMN roadmap_status TEXT
      `);
    }
  } catch (error) {
    console.error('Error checking for roadmap_status column:', error);
  }
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
        roadmap_status,
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
      roadmap_status,
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
        roadmap_status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      approvalData.status_id,
      approvalData.approver || null,
      approvalData.comments || null,
      approvalData.roadmap_status || null,
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
        roadmap_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      approvalData.entity_id,
      approvalData.entity_type,
      approvalData.stage_id,
      approvalData.status_id,
      approvalData.approver || null,
      approvalData.comments || null,
      approvalData.roadmap_status || null,
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

  // Default roadmap status based on entity type - use undefined instead of null
  const defaultRoadmapStatus = entityType === 'feature' ? ROADMAP_STATUS.BACKLOG : undefined;

  // Create approvals in a transaction
  db.exec('BEGIN TRANSACTION');
  try {
    for (const stage of stages) {
      await createOrUpdateEntityApproval({
        entity_id: entityId,
        entity_type: entityType,
        stage_id: stage.id,
        status_id: notStartedStatus.id,
        roadmap_status: defaultRoadmapStatus
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

/**
 * Initialize roadmap status for all features
 * This sets a default roadmap status for all features that don't have one yet
 */
export async function initializeAllFeatureRoadmapStatuses(
  defaultStatus: string = ROADMAP_STATUS.BACKLOG
): Promise<boolean> {
  try {
    await createEntityApprovalsTable();

    console.log(`Initializing roadmap status for all features to: ${defaultStatus}`);

    // Update all feature approvals that don't have a roadmap status yet
    const result = db.prepare(`
      UPDATE entity_approvals
      SET roadmap_status = ?
      WHERE entity_type = 'feature' AND (roadmap_status IS NULL OR roadmap_status = '')
    `).run(defaultStatus);

    console.log(`Updated ${result.changes} feature approvals with default roadmap status`);
    return result.changes > 0;
  } catch (error) {
    console.error('Error initializing feature roadmap statuses:', error);
    return false;
  }
}

/**
 * Update an approval with a specific roadmap status
 */
export async function updateApprovalWithRoadmapStatus(
  approvalId: string,
  roadmapStatus: string
): Promise<EntityApproval | null> {
  try {
    await createEntityApprovalsTable();

    console.log(`Updating approval ${approvalId} with roadmap status: ${roadmapStatus}`);

    const now = new Date().toISOString();

    // Update the approval
    await db.prepare(`
      UPDATE entity_approvals
      SET roadmap_status = ?, updated_at = ?
      WHERE id = ?
    `).run(roadmapStatus, now, approvalId);

    // Return the updated approval
    return getApprovalById(approvalId);
  } catch (error) {
    console.error(`Error updating roadmap status for approval ${approvalId}:`, error);
    return null;
  }
}

/**
 * Update all approvals for an entity with a specific roadmap status
 */
export async function bulkUpdateApprovalsWithRoadmapStatus(
  entityId: string,
  entityType: 'feature' | 'release',
  roadmapStatus: string
): Promise<EntityApproval[]> {
  try {
    await createEntityApprovalsTable();

    console.log(`Updating all approvals for ${entityType} ${entityId} with roadmap status: ${roadmapStatus}`);

    const now = new Date().toISOString();

    // Update all approvals for this entity
    await db.prepare(`
      UPDATE entity_approvals
      SET roadmap_status = ?, updated_at = ?
      WHERE entity_id = ? AND entity_type = ?
    `).run(roadmapStatus, now, entityId, entityType);

    // Return the updated approvals
    return getApprovalsByEntity(entityId, entityType);
  } catch (error) {
    console.error(`Error bulk updating roadmap status for ${entityType} ${entityId}:`, error);
    return [];
  }
}

/**
 * Delete roadmap status from an approval
 */
export async function deleteApprovalWithRoadmapStatus(
  approvalId: string
): Promise<EntityApproval | null> {
  try {
    await createEntityApprovalsTable();

    console.log(`Removing roadmap status from approval ${approvalId}`);

    const now = new Date().toISOString();

    // Update the approval to remove roadmap status
    await db.prepare(`
      UPDATE entity_approvals
      SET roadmap_status = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, approvalId);

    // Return the updated approval
    return getApprovalById(approvalId);
  } catch (error) {
    console.error(`Error removing roadmap status for approval ${approvalId}:`, error);
    return null;
  }
}
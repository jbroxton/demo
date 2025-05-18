import { supabase } from './supabase';
import { EntityApproval } from '@/types/models';

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
 * Get approvals by entity
 */
export async function getApprovalsByEntity(
  entityId: string,
  entityType: 'feature' | 'release',
  tenantId: string = 'org1'
): Promise<EntityApproval[]> {
  try {
    console.log(`Fetching approvals for ${entityType} with ID: ${entityId} for tenant: ${tenantId}`);

    const { data, error } = await supabase
      .from('entity_approvals')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (error) {
      console.error(`Error retrieving approvals for ${entityType} with ID: ${entityId}`, error);
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} approvals`);

    return data || [];
  } catch (error) {
    console.error(`Error retrieving approvals for ${entityType} with ID: ${entityId}`, error);
    return [];
  }
}

/**
 * Get approval by ID
 */
export async function getApprovalById(id: string, tenantId: string = 'org1'): Promise<EntityApproval | null> {
  try {
    console.log(`Fetching approval with ID: ${id} for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('entity_approvals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error retrieving approval with ID: ${id}`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error retrieving approval with ID: ${id}`, error);
    return null;
  }
}

/**
 * Create or update entity approval
 * If an approval already exists for the entity/stage combination, it will be updated
 */
export async function createOrUpdateEntityApproval(
  approvalData: Partial<EntityApproval>,
  tenantId: string = 'org1'
): Promise<EntityApproval | null> {
  try {
    if (!approvalData.entity_id || !approvalData.entity_type || !approvalData.stage_id || !approvalData.status_id) {
      throw new Error('Missing required approval data');
    }

    // Check if approval already exists for this entity/stage
    const { data: existingApproval, error: checkError } = await supabase
      .from('entity_approvals')
      .select('id')
      .eq('entity_id', approvalData.entity_id)
      .eq('entity_type', approvalData.entity_type)
      .eq('stage_id', approvalData.stage_id)
      .single();

    if (existingApproval && !checkError) {
      // Update existing approval
      const updateData: any = {
        status_id: approvalData.status_id,
        approver: approvalData.approver || null,
        comments: approvalData.comments || null,
        updated_at: new Date().toISOString()
      };
      
      if (approvalData.roadmap_status !== undefined) {
        updateData.roadmap_status = approvalData.roadmap_status;
      }
      
      const { data, error } = await supabase
        .from('entity_approvals')
        .update(updateData)
        .eq('id', existingApproval.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating approval:', error);
        return null;
      }

      return data;
    } else {
      // Create new approval
      const insertData: any = {
        entity_id: approvalData.entity_id,
        entity_type: approvalData.entity_type,
        stage_id: approvalData.stage_id,
        status_id: approvalData.status_id,
        approver: approvalData.approver || null,
        comments: approvalData.comments || null
      };
      
      if (approvalData.roadmap_status !== undefined) {
        insertData.roadmap_status = approvalData.roadmap_status;
      }
      
      const { data, error } = await supabase
        .from('entity_approvals')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating approval:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Error in createOrUpdateEntityApproval:', error);
    return null;
  }
}

/**
 * Delete entity approval
 */
export async function deleteEntityApproval(id: string, tenantId: string = 'org1'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('entity_approvals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting approval:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting approval:', error);
    return false;
  }
}

/**
 * Delete all approvals for an entity
 */
export async function deleteEntityApprovals(
  entityId: string, 
  entityType: 'feature' | 'release',
  tenantId: string = 'org1'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('entity_approvals')
      .delete()
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (error) {
      console.error('Error deleting entity approvals:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting entity approvals:', error);
    return false;
  }
}

/**
 * Initialize default approvals for a new entity
 * This creates a default approval record for each stage with "Not Started" status
 */
export async function initializeEntityApprovals(
  entityId: string,
  entityType: 'feature' | 'release',
  tenantId: string = 'org1'
): Promise<EntityApproval[]> {
  try {
    // Get all stages
    const { data: stages, error: stagesError } = await supabase
      .from('approval_stages')
      .select('id')
      .order('type')
      .order('order_num');

    if (stagesError || !stages) {
      console.error('Error fetching approval stages:', stagesError);
      return [];
    }

    // Get "Not Started" status
    const { data: notStartedStatus, error: statusError } = await supabase
      .from('approval_statuses')
      .select('id')
      .eq('name', 'Not Started')
      .single();

    if (statusError || !notStartedStatus) {
      throw new Error('Default "Not Started" status not found');
    }

    // Default roadmap status based on entity type
    const defaultRoadmapStatus = entityType === 'feature' ? ROADMAP_STATUS.BACKLOG : null;

    // Create approvals for each stage
    const promises = stages.map(stage => {
      const approvalData: Partial<EntityApproval> = {
        entity_id: entityId,
        entity_type: entityType,
        stage_id: stage.id,
        status_id: notStartedStatus.id
      };
      
      if (defaultRoadmapStatus) {
        approvalData.roadmap_status = defaultRoadmapStatus;
      }
      
      return createOrUpdateEntityApproval(approvalData, tenantId);
    }
    );

    await Promise.all(promises);

    return getApprovalsByEntity(entityId, entityType, tenantId);
  } catch (error) {
    console.error('Error initializing entity approvals:', error);
    return [];
  }
}

/**
 * Initialize roadmap status for all features
 * This sets a default roadmap status for all features that don't have one yet
 */
export async function initializeAllFeatureRoadmapStatuses(
  defaultStatus: string = ROADMAP_STATUS.BACKLOG,
  tenantId: string = 'org1'
): Promise<boolean> {
  try {
    console.log(`Initializing roadmap status for all features to: ${defaultStatus} for tenant: ${tenantId}`);

    // Update all feature approvals that don't have a roadmap status yet
    const { error } = await supabase
      .from('entity_approvals')
      .update({ roadmap_status: defaultStatus })
      .eq('entity_type', 'feature')
      .or('roadmap_status.is.null,roadmap_status.eq.');

    if (error) {
      console.error('Error initializing feature roadmap statuses:', error);
      return false;
    }

    return true;
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
  roadmapStatus: string,
  tenantId: string = 'org1'
): Promise<EntityApproval | null> {
  try {
    console.log(`Updating approval ${approvalId} with roadmap status: ${roadmapStatus} for tenant: ${tenantId}`);

    const { data, error } = await supabase
      .from('entity_approvals')
      .update({
        roadmap_status: roadmapStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating roadmap status for approval ${approvalId}:`, error);
      return null;
    }

    return data;
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
  roadmapStatus: string,
  tenantId: string = 'org1'
): Promise<EntityApproval[]> {
  try {
    console.log(`Updating all approvals for ${entityType} ${entityId} with roadmap status: ${roadmapStatus} for tenant: ${tenantId}`);

    const { error } = await supabase
      .from('entity_approvals')
      .update({
        roadmap_status: roadmapStatus,
        updated_at: new Date().toISOString()
      })
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (error) {
      console.error(`Error bulk updating roadmap status for ${entityType} ${entityId}:`, error);
      return [];
    }

    // Return the updated approvals
    return getApprovalsByEntity(entityId, entityType, tenantId);
  } catch (error) {
    console.error(`Error bulk updating roadmap status for ${entityType} ${entityId}:`, error);
    return [];
  }
}

/**
 * Delete roadmap status from an approval
 */
export async function deleteApprovalWithRoadmapStatus(
  approvalId: string,
  tenantId: string = 'org1'
): Promise<EntityApproval | null> {
  try {
    console.log(`Removing roadmap status from approval ${approvalId} for tenant: ${tenantId}`);

    const { data, error } = await supabase
      .from('entity_approvals')
      .update({
        roadmap_status: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error(`Error removing roadmap status for approval ${approvalId}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error removing roadmap status for approval ${approvalId}:`, error);
    return null;
  }
}
import {
  getApprovalById,
  getApprovalsByEntity,
  initializeEntityApprovals,
  createOrUpdateEntityApproval,
  deleteEntityApproval,
  deleteEntityApprovals
} from '@/services/entity-approvals-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  // Get approval by ID
  if (id) {
    const approval = await getApprovalById(id, tenantId);
    
    if (!approval) {
      return apiResponse.error('Approval not found', 404);
    }
    
    return apiResponse.success(approval);
  }

  // Get approvals by entity
  if (entityType && entityId) {
    const approvals = await getApprovalsByEntity(entityId, entityType as 'feature' | 'release', tenantId);
    return apiResponse.success(approvals);
  }

  return apiResponse.error('Either approval ID or entity type and ID are required', 400);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  // Initialize approvals for entity
  if (body.initialize) {
    const validationError = validateRequired(body, ['entityType', 'entityId']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }

    const approvals = await initializeEntityApprovals(body.entityId, body.entityType, tenantId);
    return apiResponse.success(approvals, 201);
  }

  // Create or update approval
  const validationError = validateRequired(body, ['entityType', 'entityId']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const approval = await createOrUpdateEntityApproval(body, tenantId);

  if (!approval) {
    return apiResponse.error('Failed to create/update approval', 500);
  }

  return apiResponse.success(approval, 201);
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  // Delete single approval by ID
  if (id) {
    const result = await deleteEntityApproval(id, tenantId);
    
    if (!result) {
      return apiResponse.error('Failed to delete approval', 500);
    }
    
    return apiResponse.success({ success: true });
  }

  // Delete all approvals for entity
  if (entityType && entityId) {
    const result = await deleteEntityApprovals(entityId, entityType as 'feature' | 'release', tenantId);
    
    if (!result) {
      return apiResponse.error('Failed to delete approvals', 500);
    }
    
    return apiResponse.success({ success: true });
  }

  return apiResponse.error('Either approval ID or entity type and ID are required', 400);
});
import {
  getApprovalStageById,
  getApprovalStages,
  createApprovalStage,
  updateApprovalStage,
  deleteApprovalStage
} from '@/services/approval-stages';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');

  if (id) {
    const stage = await getApprovalStageById(id, tenantId);
    
    if (!stage) {
      return apiResponse.error('Approval stage not found', 404);
    }
    
    return apiResponse.success(stage);
  }

  // Get all approval stages
  const stages = await getApprovalStages(tenantId);
  return apiResponse.success(stages);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name', 'order']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const stage = await createApprovalStage({
    name: body.name,
    description: body.description,
    order: body.order,
    type: body.type
  }, tenantId);

  if (!stage) {
    return apiResponse.error('Failed to create approval stage', 500);
  }

  return apiResponse.success(stage, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.order !== undefined) updateData.order = body.order;
  if (body.type !== undefined) updateData.type = body.type;

  const stage = await updateApprovalStage(body.id, updateData, tenantId);

  if (!stage) {
    return apiResponse.error('Failed to update approval stage', 500);
  }

  return apiResponse.success(stage);
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Approval stage ID is required', 400);
  }
  
  const result = await deleteApprovalStage(id, tenantId);
  
  if (!result) {
    return apiResponse.error('Failed to delete approval stage', 500);
  }
  
  return apiResponse.success({ success: true });
});
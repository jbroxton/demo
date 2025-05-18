import { NextRequest } from 'next/server';
import {
  getApprovalStatusById,
  getApprovalStatuses,
  createApprovalStatus,
  updateApprovalStatus,
  deleteApprovalStatus
} from '@/services/approval-statuses';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');

  if (id) {
    const status = await getApprovalStatusById(id, tenantId);
    
    if (!status) {
      return apiResponse.error('Approval status not found', 404);
    }
    
    return apiResponse.success(status);
  }

  // Get all approval statuses
  const statuses = await getApprovalStatuses(tenantId);
  return apiResponse.success(statuses);
});

// POST handler - create new approval status
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const status = await createApprovalStatus(body, tenantId);

  if (!status) {
    return apiResponse.error('Failed to create approval status', 500);
  }

  return apiResponse.success(status, 201);
});

// PATCH handler - update approval status
export const PATCH = authenticatedHandler(async (request, { tenantId, searchParams, body }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Status ID is required', 400);
  }
  
  if (!body || typeof body !== 'object') {
    return apiResponse.error('Invalid request body', 400);
  }
  
  const status = await updateApprovalStatus(id, body, tenantId);
  
  if (!status) {
    return apiResponse.error('Failed to update approval status', 500);
  }
  
  return apiResponse.success(status);
});

// DELETE handler - delete approval status
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Status ID is required', 400);
  }
  
  const result = await deleteApprovalStatus(id, tenantId);
  
  if (!result) {
    return apiResponse.error('Failed to delete approval status', 500);
  }
  
  return apiResponse.success({ success: true });
});
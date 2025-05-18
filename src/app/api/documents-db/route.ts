import { NextRequest } from 'next/server';
import {
  getDocumentFromDb,
  getDocumentsFromDb,
  createDocumentInDb,
  updateDocumentInDb,
  deleteDocumentFromDb
} from '@/services/documents-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');

  // Get document by ID
  if (id) {
    const result = await getDocumentFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Document not found', 404);
    }
    
    return apiResponse.success(result.data);
  }

  // Get documents for entity
  if (entityId && entityType) {
    const result = await getDocumentsFromDb(entityId, entityType, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch documents', 500);
    }
    
    return apiResponse.success(result.data);
  }

  return apiResponse.error('Either document ID or entity ID and type are required', 400);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['title', 'entityId', 'entityType']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const result = await createDocumentInDb({
    title: body.title,
    content: body.content || '',
    featureId: body.entityType === 'feature' ? body.entityId : undefined,
    releaseId: body.entityType === 'release' ? body.entityId : undefined,
    requirementId: body.entityType === 'requirement' ? body.entityId : undefined,
    tenantId
  }, tenantId);

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create document', 500);
  }

  return apiResponse.success(result.data, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const result = await updateDocumentInDb(body.id, {
    title: body.title,
    content: body.content
  }, tenantId);

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to update document', 500);
  }

  return apiResponse.success({ success: true, data: result.data });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Document ID is required', 400);
  }
  
  const result = await deleteDocumentFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete document', 500);
  }
  
  return apiResponse.success({ success: true });
});
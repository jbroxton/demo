import { NextRequest } from 'next/server';
import {
  getAttachmentByIdFromDb,
  getAttachmentsForEntityFromDb,
  createAttachmentInDb,
  updateAttachmentInDb,
  deleteAttachmentFromDb
} from '@/services/attachments-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';
import { EntityType } from '@/types/models';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');

  // Get attachment by ID
  if (id) {
    const result = await getAttachmentByIdFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Attachment not found', 404);
    }
    
    return apiResponse.success(result.data);
  }

  // Get attachments for entity
  if (entityId && entityType) {
    const result = await getAttachmentsForEntityFromDb(entityId, entityType as EntityType, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch attachments', 500);
    }
    
    return apiResponse.success(result.data);
  }

  return apiResponse.error('Either attachment ID or entity ID and type are required', 400);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['title', 'url', 'entityId', 'entityType']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const result = await createAttachmentInDb({
    title: body.title,
    url: body.url,
    thumbnailUrl: body.thumbnailUrl,
    entityId: body.entityId,
    entityType: body.entityType
  }, tenantId);

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create attachment', 500);
  }

  return apiResponse.success(result.data, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const result = await updateAttachmentInDb(
    body.id,
    {
      title: body.title,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl
    },
    tenantId
  );

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to update attachment', 500);
  }

  return apiResponse.success(result.data);
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Attachment ID is required', 400);
  }
  
  const result = await deleteAttachmentFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete attachment', 500);
  }
  
  return apiResponse.success({ success: true });
});
import { NextRequest } from 'next/server';
import { 
  getReleasesFromDb, 
  getReleaseByIdFromDb, 
  createReleaseInDb, 
  updateReleaseNameInDb,
  updateReleaseDescriptionInDb,
  updateReleaseDateInDb,
  deleteReleaseFromDb,
  markReleaseAsSavedInDb
} from '@/services/releases-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const withFeatures = searchParams.get('withFeatures') === 'true';
  
  // Get release by ID
  if (id) {
    const result = await getReleaseByIdFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Release not found', 404);
    }
    
    // Note: Feature fetching functionality would need to be implemented
    // in the releases-db service if needed
    
    return apiResponse.success(result.data);
  }
  
  // Get all releases
  const result = await getReleasesFromDb(tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch releases', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createReleaseInDb({
    name: body.name,
    description: body.description || '',
    releaseDate: body.releaseDate,
    priority: body.priority,
    featureId: body.featureId,
    isSaved: false,  // New releases start as unsaved
    savedAt: null
  }, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create release', 500);
  }
  
  return apiResponse.success(result.data, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  // Handle marking as saved
  if (body.markAsSaved === true) {
    const result = await markReleaseAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark release as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }
  
  // Update name if provided
  if (body.name !== undefined) {
    const result = await updateReleaseNameInDb(body.id, body.name, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update release name', 500);
    }
  }
  
  // Update description if provided
  if (body.description !== undefined) {
    const result = await updateReleaseDescriptionInDb(body.id, body.description, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update release description', 500);
    }
  }
  
  // Update release date if provided
  if (body.releaseDate !== undefined) {
    const result = await updateReleaseDateInDb(body.id, body.releaseDate, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update release date', 500);
    }
  }
  
  // Note: Release notes updating would need to be implemented
  // in the releases-db service if needed
  
  return apiResponse.success({ success: true, id: body.id });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Release ID is required', 400);
  }
  
  const result = await deleteReleaseFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete release', 500);
  }
  
  return apiResponse.success({ success: true });
});
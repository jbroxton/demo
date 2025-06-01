import { 
  getFeaturesFromDb, 
  getFeatureByIdFromDb,
  getFeaturesByInterfaceId,
  createFeatureInDb, 
  updateFeatureNameInDb,
  updateFeatureDescriptionInDb,
  updateFeaturePriorityInDb,
  updateFeatureWithReleaseInDb,
  deleteFeatureFromDb,
  markFeatureAsSavedInDb
} from '@/services/features-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const interfaceId = searchParams.get('interfaceId');
  
  // Get feature by ID
  if (id) {
    const result = await getFeatureByIdFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Feature not found', 404);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get features by interface ID
  if (interfaceId) {
    const result = await getFeaturesByInterfaceId(interfaceId, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch features', 500);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get all features
  const result = await getFeaturesFromDb(tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch features', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name', 'interfaceId']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createFeatureInDb({
    name: body.name,
    description: body.description || '',
    priority: body.priority || 'Med',
    interfaceId: body.interfaceId,
    isSaved: false,  // New features start as unsaved
    savedAt: null
  }, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create feature', 500);
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
    const result = await markFeatureAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark feature as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }
  
  // Update name if provided
  if (body.name !== undefined) {
    const result = await updateFeatureNameInDb(body.id, body.name, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update feature name', 500);
    }
  }
  
  // Update description if provided
  if (body.description !== undefined) {
    const result = await updateFeatureDescriptionInDb(body.id, body.description, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update feature description', 500);
    }
  }
  
  // Update priority if provided
  if (body.priority !== undefined) {
    const result = await updateFeaturePriorityInDb(body.id, body.priority, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update feature priority', 500);
    }
  }
  
  // Update with release if provided
  if (body.releaseId !== undefined) {
    const result = await updateFeatureWithReleaseInDb(body.id, body.releaseId);
    
    if (!result.success) {
      return apiResponse.error('Failed to update feature with release', 500);
    }
  }
  
  return apiResponse.success({ success: true, id: body.id });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Feature ID is required', 400);
  }
  
  const result = await deleteFeatureFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete feature', 500);
  }
  
  return apiResponse.success({ success: true });
});
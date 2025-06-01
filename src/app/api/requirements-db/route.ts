import { 
  getRequirementsFromDb,
  getRequirementByIdFromDb, 
  getRequirementsByFeatureId,
  getRequirementsByReleaseId,
  createRequirementInDb, 
  updateRequirementNameInDb,
  updateRequirementDescriptionInDb,
  updateRequirementOwnerInDb,
  updateRequirementPriorityInDb,
  updateRequirementReleaseInDb,
  updateRequirementCujInDb,
  updateRequirementAcceptanceCriteriaInDb,
  deleteRequirementFromDb,
  markRequirementAsSavedInDb
} from '@/services/requirements-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const featureId = searchParams.get('featureId');
  const releaseId = searchParams.get('releaseId');
  
  // Get requirement by ID
  if (id) {
    const result = await getRequirementByIdFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Requirement not found', 404);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get requirements by feature ID
  if (featureId) {
    const result = await getRequirementsByFeatureId(featureId, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch requirements', 500);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get requirements by release ID
  if (releaseId) {
    const result = await getRequirementsByReleaseId(releaseId, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch requirements', 500);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get all requirements
  const result = await getRequirementsFromDb(tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch requirements', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name', 'featureId']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createRequirementInDb({
    name: body.name,
    description: body.description || '',
    featureId: body.featureId,
    priority: body.priority || 'Med',
    releaseId: body.releaseId,
    owner: body.owner,
    cuj: body.cuj,
    acceptanceCriteria: body.acceptanceCriteria,
    isSaved: false,  // New requirements start as unsaved
    savedAt: null
  }, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create requirement', 500);
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
    const result = await markRequirementAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark requirement as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }
  
  // Update title if provided
  if (body.title !== undefined) {
    const result = await updateRequirementNameInDb(body.id, body.title, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement title', 500);
    }
  }
  
  // Update description if provided
  if (body.description !== undefined) {
    const result = await updateRequirementDescriptionInDb(body.id, body.description, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement description', 500);
    }
  }
  
  // Update owner if provided
  if (body.owner !== undefined) {
    const result = await updateRequirementOwnerInDb(body.id, body.owner, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement owner', 500);
    }
  }
  
  // Update priority if provided
  if (body.priority !== undefined) {
    const result = await updateRequirementPriorityInDb(body.id, body.priority, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement priority', 500);
    }
  }
  
  // Update release if provided
  if (body.releaseId !== undefined) {
    const result = await updateRequirementReleaseInDb(body.id, body.releaseId, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement release', 500);
    }
  }
  
  // Update CUJ if provided
  if (body.cuj !== undefined) {
    const result = await updateRequirementCujInDb(body.id, body.cuj, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement CUJ', 500);
    }
  }
  
  // Update acceptance criteria if provided
  if (body.acceptanceCriteria !== undefined) {
    const result = await updateRequirementAcceptanceCriteriaInDb(body.id, body.acceptanceCriteria, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update requirement acceptance criteria', 500);
    }
  }
  
  return apiResponse.success({ success: true, id: body.id });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Requirement ID is required', 400);
  }
  
  const result = await deleteRequirementFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete requirement', 500);
  }
  
  return apiResponse.success({ success: true });
});
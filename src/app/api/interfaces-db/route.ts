import { 
  getInterfacesFromDb, 
  getInterfaceByIdFromDb,
  getInterfacesByProductIdFromDb, 
  createInterfaceInDb, 
  updateInterfaceNameInDb,
  updateInterfaceDescriptionInDb,
  deleteInterfaceFromDb,
  markInterfaceAsSavedInDb
} from '@/services/interfaces-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  const productId = searchParams.get('productId');
  
  // Get interface by ID
  if (id) {
    const result = await getInterfaceByIdFromDb(id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Interface not found', 404);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get interfaces by product ID
  if (productId) {
    const result = await getInterfacesByProductIdFromDb(productId, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to fetch interfaces', 500);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get all interfaces
  const result = await getInterfacesFromDb(tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch interfaces', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name', 'productId']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createInterfaceInDb({
    name: body.name,
    description: body.description || '',
    productId: body.productId,
    isSaved: false,  // New interfaces start as unsaved
    savedAt: null
  }, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create interface', 500);
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
    const result = await markInterfaceAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark interface as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }
  
  // Update name if provided
  if (body.name !== undefined) {
    const result = await updateInterfaceNameInDb(body.id, body.name, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update interface name', 500);
    }
  }
  
  // Update description if provided
  if (body.description !== undefined) {
    const result = await updateInterfaceDescriptionInDb(body.id, body.description, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update interface description', 500);
    }
  }
  
  return apiResponse.success({ success: true, id: body.id });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Interface ID is required', 400);
  }
  
  const result = await deleteInterfaceFromDb(id, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete interface', 500);
  }
  
  return apiResponse.success({ success: true });
});
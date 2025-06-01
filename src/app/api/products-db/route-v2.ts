import { 
  getProductsFromDb, 
  getProductByIdFromDb, 
  createProductInDb, 
  updateProductNameInDb,
  updateProductDescriptionInDb,
  deleteProductFromDb
} from '@/services/products-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler - much cleaner!
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (id) {
    const result = await getProductByIdFromDb(id, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Product not found', 404);
    }
    return apiResponse.success(result.data);
  }
  
  // Get all products
  const result = await getProductsFromDb(tenantId);
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch products', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['name']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createProductInDb({
    name: body.name,
    description: body.description || ''
  }, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to create product', 500);
  }
  
  return apiResponse.success(result.data, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }
  
  if (body.name !== undefined) {
    const result = await updateProductNameInDb(body.id, body.name, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update product name', 500);
    }
  }
  
  if (body.description !== undefined) {
    const result = await updateProductDescriptionInDb(body.id, body.description, tenantId);
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update product description', 500);
    }
  }
  
  return apiResponse.success({ success: true, id: body.id });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Product ID is required', 400);
  }
  
  const result = await deleteProductFromDb(id, tenantId);
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete product', 500);
  }
  
  return apiResponse.success({ success: true });
});
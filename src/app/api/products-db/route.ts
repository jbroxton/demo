import { NextRequest } from 'next/server';
import { 
  getProductsFromDb, 
  getProductByIdFromDb, 
  createProductInDb, 
  updateProductNameInDb,
  updateProductDescriptionInDb,
  deleteProductFromDb,
  markProductAsSavedInDb
} from '@/services/products-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  console.log('GET /api/products-db - id:', id, 'tenantId:', tenantId);
  
  // Get product by ID
  if (id) {
    console.log('GET /api/products-db - fetching single product by ID');
    const result = await getProductByIdFromDb(id, tenantId);
    
    console.log('GET /api/products-db - single product result:', result);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Product not found', 404);
    }
    
    return apiResponse.success(result.data);
  }
  
  // Get all products
  console.log('GET /api/products-db - fetching all products');
  const result = await getProductsFromDb(tenantId);
  
  console.log('GET /api/products-db - all products result:', result);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch products', 500);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, userId, body }) => {
  console.log('POST /api/products-db - Starting request');
  console.log('POST /api/products-db - userId:', userId);
  console.log('POST /api/products-db - tenantId:', tenantId);
  console.log('POST /api/products-db - body:', JSON.stringify(body, null, 2));
  
  const validationError = validateRequired(body, ['name']);
  if (validationError) {
    console.error('POST /api/products-db - validation error:', validationError);
    return apiResponse.error(validationError, 400);
  }
  
  const result = await createProductInDb({
    name: body.name,
    description: body.description || '',
    isSaved: body.isSaved || false,
    savedAt: body.savedAt || null
  }, tenantId);
  
  console.log('POST /api/products-db - result:', result);
  
  if (!result.success) {
    console.error('Product creation failed:', result.error);
    return apiResponse.error(result.error || 'Failed to create product', 500);
  }
  
  if (!result.data) {
    console.error('No product data returned despite success');
    return apiResponse.error('Product created but no data returned', 500);
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
    const result = await markProductAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark product as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }
  
  // Update name if provided
  if (body.name !== undefined) {
    const result = await updateProductNameInDb(body.id, body.name, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to update product name', 500);
    }
  }
  
  // Update description if provided
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
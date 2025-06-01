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
  const featureId = searchParams.get('featureId');
  const releaseId = searchParams.get('releaseId');

  // Get document by ID
  if (id) {
    console.log(`API: Getting document by ID ${id} for tenant ${tenantId}`);
    
    // Validate tenant ID is provided by auth context
    if (!tenantId) {
      console.error('No tenant ID provided in auth context');
      return apiResponse.error('Authentication required', 401);
    }
    
    const result = await getDocumentFromDb(id, tenantId as string);
    
    if (!result.success) {
      // Provide appropriate status code based on error type
      const statusCode = result.error?.includes('Access denied') ? 403 : 404;
      return apiResponse.error(result.error || 'Document not found', statusCode);
    }
    
    return apiResponse.success(result.data);
  }

  // Get documents for entity
  if (featureId || releaseId) {
    console.log(`API: Getting documents for feature ${featureId || 'none'} or release ${releaseId || 'none'} in tenant ${tenantId}`);
    
    // Validate tenant ID is provided by auth context
    if (!tenantId) {
      console.error('No tenant ID provided in auth context');
      return apiResponse.error('Authentication required', 401);
    }
    
    // Add extra debugging for feature-related document queries
    if (featureId) {
      console.log(`API: Searching for documents with feature_id = ${featureId}`);
    }
    
    // TypeScript needs assurance that params are of the correct type
    // Convert null to undefined for optional parameters
    const result = await getDocumentsFromDb(
      tenantId as string, 
      featureId || undefined, 
      releaseId || undefined
    );
    
    if (!result.success) {
      const statusCode = result.error?.includes('Tenant ID') ? 401 : 500;
      return apiResponse.error(result.error || 'Failed to fetch documents', statusCode);
    }
    
    console.log(`API: Found ${result.data?.length || 0} document(s) for feature ID ${featureId || 'none'}`);
    if (result.data && result.data.length > 0) {
      console.log(`API: First document ID: ${result.data[0].id}, title: "${result.data[0].title}"`);
    }
    
    return apiResponse.success(result.data);
  }

  return apiResponse.error('Either document ID or featureId/releaseId is required', 400);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  console.log('API: Creating document with body:', body);
  
  // Validate tenant ID is provided by auth context
  if (!tenantId) {
    console.error('No tenant ID provided in auth context');
    return apiResponse.error('Authentication required', 401);
  }
  
  const validationError = validateRequired(body, ['title']);
  if (validationError) {
    console.error('Validation error in document creation:', validationError);
    return apiResponse.error(validationError, 400);
  }

  // At least one ID must be provided
  if (!body.featureId && !body.releaseId && !body.requirementId) {
    console.error('Missing entity ID for document creation');
    return apiResponse.error('At least one of featureId, releaseId, or requirementId is required', 400);
  }

  const result = await createDocumentInDb({
    title: body.title,
    content: body.content || '',
    featureId: body.featureId,
    releaseId: body.releaseId,
    requirementId: body.requirementId
    // tenantId is provided separately, not as part of the document object
  }, tenantId as string);

  if (!result.success) {
    console.error('Failed to create document:', result.error);
    return apiResponse.error(result.error || 'Failed to create document', 500);
  }

  return apiResponse.success(result.data, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  console.log(`API: Updating document ${body?.id} for tenant ${tenantId}`);
  
  // Validate tenant ID is provided by auth context
  if (!tenantId) {
    console.error('No tenant ID provided in auth context');
    return apiResponse.error('Authentication required', 401);
  }
  
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    console.error('Validation error in document update:', validationError);
    return apiResponse.error(validationError, 400);
  }

  // Add more detailed logging for debugging purposes
  console.log(`Updating document ${body.id} with:`, {
    title: body.title?.substring(0, 20) + (body.title?.length > 20 ? '...' : ''), 
    contentType: typeof body.content,
    contentLength: typeof body.content === 'string' ? body.content.length : JSON.stringify(body.content).length,
    contentPreview: typeof body.content === 'string' 
      ? body.content.substring(0, 100) + (body.content.length > 100 ? '...' : '')
      : JSON.stringify(body.content).substring(0, 100) + (JSON.stringify(body.content).length > 100 ? '...' : '')
  });
  
  // Extract only the fields we want to update to avoid unexpected changes
  const updates = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.content !== undefined ? { content: body.content } : {})
  };
  
  console.log(`Final updates object:`, updates);
  
  const result = await updateDocumentInDb(body.id, updates, tenantId as string);

  if (!result.success) {
    console.error(`Failed to update document ${body.id}:`, result.error);
    
    // Return appropriate status code based on error
    const statusCode = 
      result.error?.includes('not found') ? 404 :
      result.error?.includes('Access denied') ? 403 : 500;
      
    return apiResponse.error(result.error || 'Failed to update document', statusCode);
  }

  return apiResponse.success({ success: true, data: result.data });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');
  
  if (!id) {
    return apiResponse.error('Document ID is required', 400);
  }
  
  const result = await deleteDocumentFromDb(id, tenantId as string);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete document', 500);
  }
  
  return apiResponse.success({ success: true });
});
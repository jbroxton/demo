// API route for pages CRUD operations
// Follows existing patterns in the codebase

import { NextRequest } from 'next/server';
import { createPage, getPages, updatePage, deletePage, getPageById } from '@/services/pages-db';
import { PageType, AnyPropertyValue } from '@/types/models/Page';
import { Block } from '@/types/models/Block';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';
import { validateParentChild } from '@/utils/page-parenting-rules';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  console.log('GET /api/pages-db - tenantId:', tenantId);
  
  // Extract query parameters
  const type = searchParams.get('type') as PageType | undefined;
  const parentId = searchParams.get('parent_id');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

  const result = await getPages({
    tenantId,
    type,
    parentId: parentId === 'null' ? null : parentId,
    limit,
    offset,
  });

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to get pages', 400);
  }

  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, userId, body }) => {
  console.log('POST /api/pages-db - tenantId:', tenantId, 'userId:', userId);
  
  // Validate required fields
  const validationError = validateRequired(body, ['type', 'title']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  const { type, title } = body;

  // Validate page type
  const validTypes: PageType[] = ['product', 'project', 'feature', 'release', 'roadmap'];
  if (!validTypes.includes(type)) {
    return apiResponse.error(`Invalid page type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  // Validate parent-child relationship if parent is provided
  if (body.parent_id) {
    // Get parent page to check its type
    const parentResult = await getPageById(body.parent_id, tenantId);
    if (!parentResult.success) {
      return apiResponse.error('Parent page not found', 400);
    }

    const parentType = parentResult.data.type;
    const validation = validateParentChild(parentType, type as PageType);
    if (!validation.isValid) {
      return apiResponse.error(validation.error || 'Invalid parent-child relationship', 400);
    }
  } else {
    // Validate if this page type can be top-level
    const validation = validateParentChild(null, type as PageType);
    if (!validation.isValid) {
      return apiResponse.error(validation.error || 'This page type requires a parent', 400);
    }
  }

  const pageData = {
    type: type as PageType,
    title,
    tenant_id: tenantId,
    parent_id: body.parent_id || undefined,
    properties: body.properties as Record<string, AnyPropertyValue> || {},
    blocks: body.blocks as Block[] || [],
    created_by: userId,
  };

  try {
    console.log('=== PAGES API DEBUG ===');
    console.log('Request body received:', JSON.stringify(body, null, 2));
    console.log('Validation passed');
    console.log('Creating page with data:', JSON.stringify(pageData, null, 2));
    
    const result = await createPage(pageData);
    console.log('Create page result:', result);

    if (!result.success) {
      console.error('Create page failed:', result.error);
      return apiResponse.error(result.error || 'Failed to create page', 400);
    }

    console.log('Page created successfully:', result.data);
    return apiResponse.success(result.data, 201);
  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

// PATCH handler for updating pages
export const PATCH = authenticatedHandler(async (request, { tenantId, userId, searchParams, body }) => {
  console.log('PATCH /api/pages-db - tenantId:', tenantId, 'userId:', userId);
  
  const pageId = searchParams.get('id');
  if (!pageId) {
    return apiResponse.error('Page ID is required', 400);
  }
  
  // Build update object from allowed fields
  const updateData: any = {};
  
  if (body.title !== undefined) {
    updateData.title = body.title;
  }
  
  if (body.type !== undefined) {
    updateData.type = body.type;
  }
  
  if (body.parent_id !== undefined) {
    updateData.parent_id = body.parent_id;
  }
  
  if (body.properties !== undefined) {
    updateData.properties = body.properties as Record<string, AnyPropertyValue>;
  }
  
  if (body.blocks !== undefined) {
    updateData.blocks = body.blocks as Block[];
  }
  
  updateData.last_edited_by = userId;

  const result = await updatePage(pageId, updateData, tenantId);

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to update page', 400);
  }

  return apiResponse.success(result.data);
});

// DELETE handler for deleting pages
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  console.log('DELETE /api/pages-db - tenantId:', tenantId);
  
  const pageId = searchParams.get('id');
  if (!pageId) {
    return apiResponse.error('Page ID is required', 400);
  }

  const result = await deletePage(pageId, tenantId);

  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to delete page', 400);
  }

  return apiResponse.success({ deleted: true });
});
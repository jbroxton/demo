import { NextRequest } from 'next/server';
import {
  getTabsFromDb,
  activateTabInDb,
  updateTabTitleForItemInDb,
  updateTabInDb,
  createTabInDb,
  deleteTabFromDb,
  updateNewTabToSavedItemInDb
} from '@/services/tabs-db';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, userId, searchParams }) => {
  const result = await getTabsFromDb(tenantId, userId);
  
  if (!result.success) {
    return apiResponse.error(result.error!);
  }
  
  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, userId, body }) => {
  // Handle different operations
  if (body.operation === 'activate') {
    console.log('API activate tab - body:', JSON.stringify(body));
    console.log('API activate tab - tenantId:', tenantId);
    console.log('API activate tab - userId:', userId);
    
    const validationError = validateRequired(body, ['tabId']);
    if (validationError) {
      console.error('API activate tab - validation error:', validationError);
      return apiResponse.error(validationError, 400);
    }
    
    console.log('API activate tab - calling activateTabInDb');
    const result = await activateTabInDb(body.tabId, tenantId, userId);
    console.log('API activate tab - result:', result);

    if (!result.success) {
      console.error('API activate tab - error:', result.error);
      return apiResponse.error(result.error!, 400);
    }

    console.log('API activate tab - success')
    return apiResponse.success({ tabId: body.tabId });
  }
  else if (body.operation === 'updateTitle') {
    const validationError = validateRequired(body, ['itemId', 'type', 'title']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }
    
    const result = await updateTabTitleForItemInDb(body.itemId, body.type, body.title, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error!, 400);
    }
    
    return apiResponse.success({ success: true });
  }
  else if (body.operation === 'updateTab') {
    const validationError = validateRequired(body, ['tabId', 'newTabProps']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }
    
    const result = await updateTabInDb(body.tabId, body.newTabProps, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error!, 400);
    }
    
    return apiResponse.success({ success: true });
  }
  else if (body.operation === 'updateNewTabToSavedItem') {
    const validationError = validateRequired(body, ['temporaryTabId', 'newItemId', 'newItemName', 'type']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }
    
    const result = await updateNewTabToSavedItemInDb(
      body.temporaryTabId,
      body.newItemId,
      body.newItemName,
      body.type,
      tenantId,
      userId
    );
    
    if (!result.success) {
      return apiResponse.error(result.error!, 400);
    }
    
    return apiResponse.success(result.data);
  }
  else {
    // Default create tab operation when no operation is specified
    const validationError = validateRequired(body, ['title', 'itemId', 'type']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }

    const result = await createTabInDb({
      itemId: body.itemId,
      type: body.type,
      title: body.title,
      hasChanges: false  // New tabs start with no unsaved changes
    }, tenantId, userId);

    if (!result.success) {
      return apiResponse.error(result.error!, 400);
    }

    return apiResponse.success(result.data);
  }
});


// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, userId, searchParams }) => {
  const tabId = searchParams.get('id');
  
  console.log('DELETE tab - tabId:', tabId, 'tenantId:', tenantId, 'userId:', userId);
  
  if (!tabId) {
    return apiResponse.error('Tab ID is required', 400);
  }
  
  const result = await deleteTabFromDb(tabId, tenantId, userId);
  
  if (!result.success) {
    return apiResponse.error(result.error!, 400);
  }
  
  return apiResponse.success({ success: true, newActiveTabId: result.data?.newActiveTabId });
});
import { NextRequest, NextResponse } from 'next/server';
import { 
  getTabsFromDb, 
  createTabInDb, 
  deleteTabFromDb, 
  activateTabInDb,
  updateTabTitleForItemInDb,
  updateTabInDb,
  updateNewTabToSavedItemInDb
} from '@/services/tabs-db';

/**
 * GET handler for fetching tabs
 */
export async function GET() {
  try {
    const result = await getTabsFromDb();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in tabs-db GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new tab or performing other tab operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different operations
    if (body.operation === 'activate') {
      const result = await activateTabInDb(body.tabId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true });
    } 
    else if (body.operation === 'updateTitle') {
      const result = await updateTabTitleForItemInDb(body.itemId, body.type, body.title);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    else if (body.operation === 'updateTab') {
      const result = await updateTabInDb(body.tabId, body.newTabProps);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    else if (body.operation === 'updateNewTabToSavedItem') {
      const result = await updateNewTabToSavedItemInDb(
        body.temporaryTabId, 
        body.newItemId,
        body.newItemName,
        body.type
      );
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    else {
      // Default operation: create a new tab
      const result = await createTabInDb({
        title: body.title,
        type: body.type,
        itemId: body.itemId
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json(result.data);
    }
  } catch (error) {
    console.error('Error in tabs-db POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for closing/deleting a tab
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tabId = url.searchParams.get('id');
    
    if (!tabId) {
      return NextResponse.json(
        { error: 'Tab ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteTabFromDb(tabId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in tabs-db DELETE:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
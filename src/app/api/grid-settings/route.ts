import { NextRequest, NextResponse } from 'next/server';
import { saveGridState, loadGridState, deleteGridState } from '@/services/grid-settings';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'; // Fallback for testing
    const gridId = request.nextUrl.searchParams.get('gridId');
    
    if (!gridId) {
      return NextResponse.json(
        { error: 'Missing gridId parameter' },
        { status: 400 }
      );
    }
    
    const gridState = await loadGridState(userId, gridId);
    
    if (!gridState) {
      return NextResponse.json(
        { message: 'No settings found for this grid' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gridState);
  } catch (error) {
    console.error('Error loading grid settings:', error);
    return NextResponse.json(
      { error: 'Failed to load grid settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'; // Fallback for testing
    const body = await request.json();
    
    if (!body.gridId || !body.state) {
      return NextResponse.json(
        { error: 'Missing required fields: gridId and state' },
        { status: 400 }
      );
    }
    
    const { gridId, state } = body;
    
    const result = await saveGridState(userId, gridId, state);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving grid settings:', error);
    return NextResponse.json(
      { error: 'Failed to save grid settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'; // Fallback for testing
    const gridId = request.nextUrl.searchParams.get('gridId');
    
    if (!gridId) {
      return NextResponse.json(
        { error: 'Missing gridId parameter' },
        { status: 400 }
      );
    }
    
    const result = await deleteGridState(userId, gridId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting grid settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete grid settings' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { 
  getInterfacesFromDb, 
  getInterfaceByIdFromDb, 
  getInterfacesByProductIdFromDb,
  createInterfaceInDb, 
  updateInterfaceNameInDb,
  updateInterfaceDescriptionInDb,
  deleteInterfaceFromDb
} from '@/services/interfaces-db';

// GET handler for fetching interfaces
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');
    
    // If an ID is provided, get a specific interface
    if (id) {
      const result = await getInterfaceByIdFromDb(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // If a productId is provided, get interfaces for that product
    if (productId) {
      const result = await getInterfacesByProductIdFromDb(productId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get all interfaces
    const result = await getInterfacesFromDb();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler for creating interfaces
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.productId) {
      return NextResponse.json(
        { error: 'Interface name and productId are required' },
        { status: 400 }
      );
    }
    
    const result = await createInterfaceInDb({
      name: body.name,
      description: body.description || '',
      productId: body.productId
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating interfaces
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Interface ID is required' },
        { status: 400 }
      );
    }
    
    // Update name if provided
    if (body.name !== undefined) {
      const nameResult = await updateInterfaceNameInDb(body.id, body.name);
      
      if (!nameResult.success) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update description if provided
    if (body.description !== undefined) {
      const descResult = await updateInterfaceDescriptionInDb(body.id, body.description);
      
      if (!descResult.success) {
        return NextResponse.json(
          { error: descResult.error },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error handling PATCH request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting interfaces
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Interface ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteInterfaceFromDb(id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
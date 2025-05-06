import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductsFromDb, 
  getProductByIdFromDb, 
  createProductInDb, 
  updateProductNameInDb,
  updateProductDescriptionInDb,
  deleteProductFromDb
} from '@/services/products-db';

// GET handler for fetching products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // If an ID is provided, get a specific product
    if (id) {
      const result = await getProductByIdFromDb(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get all products
    const result = await getProductsFromDb();
    
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

// POST handler for creating products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }
    
    const result = await createProductInDb({
      name: body.name,
      description: body.description || '',
      interfaces: body.interfaces || []
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

// PATCH handler for updating products
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Update name if provided
    if (body.name !== undefined) {
      const nameResult = await updateProductNameInDb(body.id, body.name);
      
      if (!nameResult.success) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update description if provided
    if (body.description !== undefined) {
      const descResult = await updateProductDescriptionInDb(body.id, body.description);
      
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

// DELETE handler for deleting products
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteProductFromDb(id);
    
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
import { NextRequest, NextResponse } from 'next/server';
import { 
  getFeaturesFromDb, 
  getFeatureByIdFromDb,
  getFeaturesByInterfaceId,
  createFeatureInDb, 
  updateFeatureNameInDb,
  updateFeatureDescriptionInDb,
  updateFeaturePriorityInDb,
  updateFeatureWithReleaseInDb,
  deleteFeatureFromDb
} from '@/services/features-db';

// GET handler for fetching features
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const interfaceId = searchParams.get('interfaceId');
    
    // If an ID is provided, get a specific feature
    if (id) {
      const result = await getFeatureByIdFromDb(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // If interfaceId is provided, get features for that interface
    if (interfaceId) {
      const result = await getFeaturesByInterfaceId(interfaceId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get all features
    const result = await getFeaturesFromDb();
    
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

// POST handler for creating features
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }
    
    if (!body.interfaceId) {
      return NextResponse.json(
        { error: 'Interface ID is required' },
        { status: 400 }
      );
    }
    
    const result = await createFeatureInDb({
      name: body.name,
      description: body.description || '',
      priority: body.priority || 'Med',
      interfaceId: body.interfaceId
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

// PATCH handler for updating features
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }
    
    // Update name if provided
    if (body.name !== undefined) {
      const nameResult = await updateFeatureNameInDb(body.id, body.name);
      
      if (!nameResult.success) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update description if provided
    if (body.description !== undefined) {
      const descResult = await updateFeatureDescriptionInDb(body.id, body.description);
      
      if (!descResult.success) {
        return NextResponse.json(
          { error: descResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update priority if provided
    if (body.priority !== undefined) {
      const priorityResult = await updateFeaturePriorityInDb(body.id, body.priority);
      
      if (!priorityResult.success) {
        return NextResponse.json(
          { error: priorityResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update with release if provided
    if (body.releaseId !== undefined) {
      const releaseResult = await updateFeatureWithReleaseInDb(body.id, body.releaseId);
      
      if (!releaseResult.success) {
        return NextResponse.json(
          { error: "Failed to update feature with release" },
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

// DELETE handler for deleting features
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteFeatureFromDb(id);
    
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
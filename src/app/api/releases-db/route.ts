import { NextRequest, NextResponse } from 'next/server';
import { 
  getReleasesFromDb, 
  getReleaseByIdFromDb,
  getReleasesByFeatureId,
  createReleaseInDb, 
  updateReleaseNameInDb,
  updateReleaseDescriptionInDb,
  updateReleaseDateInDb,
  updateReleasePriorityInDb,
  deleteReleaseFromDb
} from '@/services/releases-db';

// GET handler for fetching releases
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const featureId = searchParams.get('featureId');
    
    // Get user session to get the tenant
    const session = await import('next-auth/next').then(mod => mod.getServerSession());
    const tenantId = session?.user?.currentTenant || searchParams.get('tenantId') || 'org1';
    
    // If an ID is provided, get a specific release
    if (id) {
      const result = await getReleaseByIdFromDb(id, tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // If featureId is provided, get releases for that feature
    if (featureId) {
      const result = await getReleasesByFeatureId(featureId, tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get all releases
    const result = await getReleasesFromDb(tenantId);
    
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

// POST handler for creating releases
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Release name is required' },
        { status: 400 }
      );
    }
    
    if (!body.featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.releaseDate) {
      return NextResponse.json(
        { error: 'Release date is required' },
        { status: 400 }
      );
    }
    
    // Get user session - use auth.js to get the current session
    // This is a server component so we can use getServerSession directly
    const session = await import('next-auth/next').then(mod => mod.getServerSession());
    
    // Get the user's current tenant from the session, or use the provided tenantId or org1 as fallback
    const tenantId = session?.user?.currentTenant || body.tenantId || 'org1';
    
    const result = await createReleaseInDb({
      name: body.name,
      description: body.description || '',
      releaseDate: body.releaseDate,
      priority: body.priority || 'Med',
      featureId: body.featureId,
      tenantId: tenantId
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

// PATCH handler for updating releases
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }
    
    // Get user session to get the tenant
    const session = await import('next-auth/next').then(mod => mod.getServerSession());
    const tenantId = session?.user?.currentTenant || body.tenantId || 'org1';
    
    // Update name if provided
    if (body.name !== undefined) {
      const nameResult = await updateReleaseNameInDb(body.id, body.name, tenantId);
      
      if (!nameResult.success) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update description if provided
    if (body.description !== undefined) {
      const descResult = await updateReleaseDescriptionInDb(body.id, body.description, tenantId);
      
      if (!descResult.success) {
        return NextResponse.json(
          { error: descResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update releaseDate if provided
    if (body.releaseDate !== undefined) {
      const dateResult = await updateReleaseDateInDb(body.id, body.releaseDate, tenantId);
      
      if (!dateResult.success) {
        return NextResponse.json(
          { error: dateResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update priority if provided
    if (body.priority !== undefined) {
      const priorityResult = await updateReleasePriorityInDb(body.id, body.priority, tenantId);
      
      if (!priorityResult.success) {
        return NextResponse.json(
          { error: priorityResult.error },
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

// DELETE handler for deleting releases
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }
    
    // Get user session to get the tenant
    const session = await import('next-auth/next').then(mod => mod.getServerSession());
    const tenantId = session?.user?.currentTenant || 'org1';
    
    const result = await deleteReleaseFromDb(id, tenantId);
    
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
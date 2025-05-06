import { NextRequest, NextResponse } from 'next/server';
import { 
  getRequirementsFromDb, 
  getRequirementByIdFromDb,
  getRequirementsByFeatureId,
  getRequirementsByReleaseId,
  createRequirementInDb, 
  updateRequirementNameInDb,
  updateRequirementDescriptionInDb,
  updateRequirementOwnerInDb,
  updateRequirementPriorityInDb,
  updateRequirementReleaseInDb,
  updateRequirementCujInDb,
  updateRequirementAcceptanceCriteriaInDb,
  deleteRequirementFromDb
} from '@/services/requirements-db';

// GET handler for fetching requirements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const featureId = searchParams.get('featureId');
    const releaseId = searchParams.get('releaseId');
    
    // If an ID is provided, get a specific requirement
    if (id) {
      const result = await getRequirementByIdFromDb(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // If featureId is provided, get requirements for that feature
    if (featureId) {
      const result = await getRequirementsByFeatureId(featureId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // If releaseId is provided, get requirements for that release
    if (releaseId) {
      const result = await getRequirementsByReleaseId(releaseId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get all requirements
    const result = await getRequirementsFromDb();
    
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

// POST handler for creating requirements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Requirement name is required' },
        { status: 400 }
      );
    }
    
    if (!body.featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }
    
    const result = await createRequirementInDb({
      name: body.name,
      featureId: body.featureId,
      releaseId: body.releaseId || null,
      owner: body.owner || null,
      description: body.description || null,
      priority: body.priority || null,
      cuj: body.cuj || null,
      acceptanceCriteria: body.acceptanceCriteria || null
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

// PATCH handler for updating requirements
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Requirement ID is required' },
        { status: 400 }
      );
    }
    
    // Update name if provided
    if (body.name !== undefined) {
      const nameResult = await updateRequirementNameInDb(body.id, body.name);
      
      if (!nameResult.success) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update description if provided
    if (body.description !== undefined) {
      const descResult = await updateRequirementDescriptionInDb(body.id, body.description);
      
      if (!descResult.success) {
        return NextResponse.json(
          { error: descResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update owner if provided
    if (body.owner !== undefined) {
      const ownerResult = await updateRequirementOwnerInDb(body.id, body.owner);
      
      if (!ownerResult.success) {
        return NextResponse.json(
          { error: ownerResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update priority if provided
    if (body.priority !== undefined) {
      const priorityResult = await updateRequirementPriorityInDb(body.id, body.priority);
      
      if (!priorityResult.success) {
        return NextResponse.json(
          { error: priorityResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update release if provided
    if (body.releaseId !== undefined) {
      const releaseResult = await updateRequirementReleaseInDb(body.id, body.releaseId);
      
      if (!releaseResult.success) {
        return NextResponse.json(
          { error: releaseResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update CUJ if provided
    if (body.cuj !== undefined) {
      const cujResult = await updateRequirementCujInDb(body.id, body.cuj);
      
      if (!cujResult.success) {
        return NextResponse.json(
          { error: cujResult.error },
          { status: 500 }
        );
      }
    }
    
    // Update acceptance criteria if provided
    if (body.acceptanceCriteria !== undefined) {
      const acResult = await updateRequirementAcceptanceCriteriaInDb(body.id, body.acceptanceCriteria);
      
      if (!acResult.success) {
        return NextResponse.json(
          { error: acResult.error },
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

// DELETE handler for deleting requirements
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Requirement ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteRequirementFromDb(id);
    
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
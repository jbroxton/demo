import { NextRequest, NextResponse } from 'next/server';
import { 
  getApprovalsByEntity, 
  getApprovalById, 
  createOrUpdateEntityApproval, 
  deleteEntityApproval,
  deleteEntityApprovals,
  initializeEntityApprovals
} from '@/services/entity-approvals-db';

export async function GET(req: NextRequest) {
  try {
    // Extract parameters from query
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');
    
    if (id) {
      // Get a specific approval by ID
      const approval = await getApprovalById(id);
      
      if (!approval) {
        return NextResponse.json(
          { error: 'Approval not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(approval);
    } else if (entityId && (entityType === 'feature' || entityType === 'release')) {
      // Get all approvals for an entity
      const approvals = await getApprovalsByEntity(entityId, entityType);
      return NextResponse.json(approvals);
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle initialization request
    if (body.action === 'initialize' && body.entityId && (body.entityType === 'feature' || body.entityType === 'release')) {
      const approvals = await initializeEntityApprovals(body.entityId, body.entityType);
      return NextResponse.json(approvals);
    }
    
    // Create/update an approval
    if (!body.entity_id || !body.entity_type || !body.stage_id || !body.status_id) {
      return NextResponse.json(
        { error: 'Missing required approval data' },
        { status: 400 }
      );
    }
    
    const approval = await createOrUpdateEntityApproval(body);
    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating approval:', error);
    return NextResponse.json(
      { error: 'Failed to create/update approval' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');
    
    if (id) {
      // Delete a specific approval
      const success = await deleteEntityApproval(id);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Approval not found or could not be deleted' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    } else if (entityId && (entityType === 'feature' || entityType === 'release')) {
      // Delete all approvals for an entity
      const success = await deleteEntityApprovals(entityId, entityType);
      return NextResponse.json({ success });
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting approval(s):', error);
    return NextResponse.json(
      { error: 'Failed to delete approval(s)' },
      { status: 500 }
    );
  }
}
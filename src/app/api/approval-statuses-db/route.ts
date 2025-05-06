import { NextRequest, NextResponse } from 'next/server';
import { 
  getApprovalStatuses, 
  getApprovalStatusById, 
  createApprovalStatus, 
  updateApprovalStatus, 
  deleteApprovalStatus,
  initializeDefaultApprovalStatuses
} from '@/services/approval-statuses-db';

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/approval-statuses-db received');
    
    // Extract status ID from query params if available
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      console.log(`Getting status with ID: ${id}`);
      // Get a specific status by ID
      const status = await getApprovalStatusById(id);
      
      if (!status) {
        console.log(`Status with ID ${id} not found`);
        return NextResponse.json(
          { error: 'Approval status not found' },
          { status: 404 }
        );
      }
      
      console.log(`Returning status with ID ${id}:`, status);
      return NextResponse.json(status);
    } else {
      console.log('Getting all statuses');
      // Get all statuses
      const statuses = await getApprovalStatuses();
      console.log(`Returning ${statuses.length} statuses`);
      return NextResponse.json(statuses);
    }
  } catch (error) {
    console.error('Error fetching approval statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval statuses', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle initialization request
    if (body.action === 'initialize') {
      await initializeDefaultApprovalStatuses();
      const statuses = await getApprovalStatuses();
      return NextResponse.json(statuses);
    }
    
    // Create a new status
    const newStatus = await createApprovalStatus(body);
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error('Error creating approval status:', error);
    return NextResponse.json(
      { error: 'Failed to create approval status' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }
    
    const updatedStatus = await updateApprovalStatus(body.id, body);
    
    if (!updatedStatus) {
      return NextResponse.json(
        { error: 'Approval status not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating approval status:', error);
    return NextResponse.json(
      { error: 'Failed to update approval status' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteApprovalStatus(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Approval status not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting approval status:', error);
    return NextResponse.json(
      { error: 'Failed to delete approval status' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { 
  getApprovalStages, 
  getApprovalStageById, 
  createApprovalStage, 
  updateApprovalStage, 
  deleteApprovalStage,
  initializeDefaultApprovalStages
} from '@/services/approval-stages-db';

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/approval-stages-db received');
    
    // Extract stage ID from query params if available
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      console.log(`Getting stage with ID: ${id}`);
      // Get a specific stage by ID
      const stage = await getApprovalStageById(id);
      
      if (!stage) {
        console.log(`Stage with ID ${id} not found`);
        return NextResponse.json(
          { error: 'Approval stage not found' },
          { status: 404 }
        );
      }
      
      console.log(`Returning stage with ID ${id}:`, stage);
      return NextResponse.json(stage);
    } else {
      console.log('Getting all stages');
      // Get all stages
      const stages = await getApprovalStages();
      console.log(`Returning ${stages.length} stages`);
      return NextResponse.json(stages);
    }
  } catch (error) {
    console.error('Error fetching approval stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval stages', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle initialization request
    if (body.action === 'initialize') {
      await initializeDefaultApprovalStages();
      const stages = await getApprovalStages();
      return NextResponse.json(stages);
    }
    
    // Create a new stage
    const newStage = await createApprovalStage(body);
    return NextResponse.json(newStage, { status: 201 });
  } catch (error) {
    console.error('Error creating approval stage:', error);
    return NextResponse.json(
      { error: 'Failed to create approval stage' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }
    
    const updatedStage = await updateApprovalStage(body.id, body);
    
    if (!updatedStage) {
      return NextResponse.json(
        { error: 'Approval stage not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedStage);
  } catch (error) {
    console.error('Error updating approval stage:', error);
    return NextResponse.json(
      { error: 'Failed to update approval stage' },
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
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteApprovalStage(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Approval stage not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting approval stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete approval stage' },
      { status: 500 }
    );
  }
}
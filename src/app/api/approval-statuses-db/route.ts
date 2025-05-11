import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { 
  getApprovalStatuses, 
  getApprovalStatusById, 
  createApprovalStatus, 
  updateApprovalStatus, 
  deleteApprovalStatus,
  initializeDefaultApprovalStatuses
} from '@/services/approval-statuses-db';
import {
  updateApprovalWithRoadmapStatus,
  createOrUpdateEntityApproval,
  deleteApprovalWithRoadmapStatus,
  bulkUpdateApprovalsWithRoadmapStatus,
  getApprovalById
} from '@/services/entity-approvals-db';
import { z } from 'zod';

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
    const session = await getServerSession();
    const userId = session?.user?.id || 'anonymous';
    const body = await req.json();
    
    // Handle initialization request
    if (body.action === 'initialize') {
      await initializeDefaultApprovalStatuses();
      const statuses = await getApprovalStatuses();
      return NextResponse.json(statuses);
    }
    
    // Check if this is creating an approval with roadmap status
    if (body.entity_id && body.entity_type && body.stage_id && body.status_id) {
      // Validate input
      const schema = z.object({
        entity_id: z.string().min(1, "Entity ID is required"),
        entity_type: z.enum(["feature", "release"], {
          errorMap: () => ({ message: "Entity type must be 'feature' or 'release'" })
        }),
        stage_id: z.string().min(1, "Stage ID is required"),
        status_id: z.string().min(1, "Status ID is required"),
        roadmap_status: z.string().optional()
      });

      const result = schema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error.format() },
          { status: 400 }
        );
      }

      // Create approval with roadmap status update
      const createResult = await createOrUpdateEntityApproval({
        ...result.data,
        // entity_type is now validated as 'feature' | 'release'
        approver: userId // Use approver field instead of created_by
      });
      
      return NextResponse.json({ id: createResult.id }, { status: 201 });
    }
    
    // Default: Create a new status
    const newStatus = await createApprovalStatus(body);
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/approval-statuses-db:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id || 'anonymous';
    const body = await req.json();
    
    // Check if this is a bulk update operation
    if (body.bulk === true && Array.isArray(body.updates)) {
      // Validate bulk parameter and updates array
      const bulkSchema = z.object({
        bulk: z.literal(true),
        updates: z.array(
          z.object({
            approvalId: z.string().min(1, "Approval ID is required"),
            statusId: z.string().min(1, "Status ID is required")
          })
        ).min(1, "At least one update is required")
      });
      
      const result = bulkSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.format() },
          { status: 400 }
        );
      }
      
      // Process each update
      const updates = [];
      let totalUpdates = 0;
      
      try {
        for (const update of body.updates) {
          const approval = await getApprovalById(update.approvalId);
          
          if (approval) {
            // Update the approval with new status
            await createOrUpdateEntityApproval({
              ...approval,
              status_id: update.statusId,
              approver: userId // Use approver field instead of updated_by
            });
            
            // Optionally update roadmap status if provided
            if (update.roadmapStatus) {
              await updateApprovalWithRoadmapStatus(
                update.approvalId,
                update.roadmapStatus
              );
            }
            
            updates.push({
              approvalId: update.approvalId,
              success: true
            });
            
            totalUpdates++;
          } else {
            updates.push({
              approvalId: update.approvalId,
              success: false,
              error: 'Approval not found'
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          updatedCount: totalUpdates,
          updates
        });
      } catch (error) {
        console.error('Error processing bulk updates:', error);
        return NextResponse.json(
          { error: 'Failed to process bulk updates' },
          { status: 500 }
        );
      }
    }
    
    // Handle single approval update
    if (body.approvalId && body.statusId) {
      const schema = z.object({
        approvalId: z.string().min(1, "Approval ID is required"),
        statusId: z.string().min(1, "Status ID is required"),
        roadmapStatus: z.string().optional()
      });
      
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.format() },
          { status: 400 }
        );
      }
      
      // Get the approval
      const approval = await getApprovalById(body.approvalId);
      
      if (!approval) {
        return NextResponse.json(
          { error: 'Approval not found' },
          { status: 404 }
        );
      }
      
      // Update the approval
      await createOrUpdateEntityApproval({
        ...approval,
        status_id: body.statusId,
        approver: userId // Use approver field instead of updated_by
      });
      
      // Optionally update roadmap status
      if (body.roadmapStatus) {
        await updateApprovalWithRoadmapStatus(
          body.approvalId,
          body.roadmapStatus
        );
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Handle regular status updates
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
    console.error('Error in PUT /api/approval-statuses-db:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const approvalId = url.searchParams.get('approvalId');
    
    // Handle deletion of approval roadmap status
    if (approvalId) {
      // Delete roadmap status from approval
      const result = await deleteApprovalWithRoadmapStatus(approvalId);
      
      if (!result) {
        return NextResponse.json(
          { error: "Approval not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Handle regular status deletion
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
    console.error('Error in DELETE /api/approval-statuses-db:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
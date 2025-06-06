/**
 * @file Agent Confirmations API Route
 * @description Handles agent action confirmations and user responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncHandler } from '@/utils/api-async-handler';
import { apiResponse } from '@/utils/api-response';
import { agentActionsService } from '@/services/agent-actions-db';
import { z } from 'zod';

/**
 * Validation schemas
 */
const createConfirmationSchema = z.object({
  actionId: z.string().uuid(),
  dialogType: z.enum(['simple', 'detailed', 'bulk']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  details: z.any().optional(),
  expiresInMinutes: z.number().min(1).max(60).default(30)
});

const updateConfirmationSchema = z.object({
  confirmationId: z.string().uuid(),
  response: z.enum(['confirmed', 'rejected', 'cancelled']),
  responseDetails: z.any().optional()
});

const getConfirmationsSchema = z.object({
  actionId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

/**
 * GET - Retrieve confirmations for the current user
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }

    // === QUERY PARSING ===
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const queryParams = {
      actionId: searchParams.get('actionId') || undefined,
      status: searchParams.get('status') || undefined,
      limit: limitParam ? parseInt(limitParam, 10) : 50,
      offset: offsetParam ? parseInt(offsetParam, 10) : 0
    };
    
    // Ensure parsed numbers are valid
    if (isNaN(queryParams.limit)) queryParams.limit = 50;
    if (isNaN(queryParams.offset)) queryParams.offset = 0;

    // Validate query parameters
    const validation = getConfirmationsSchema.safeParse(queryParams);
    if (!validation.success) {
      console.error('[Agent Confirmations] Validation error:', validation.error);
      console.error('[Agent Confirmations] Query params:', queryParams);
      return apiResponse.error(`Invalid query parameters: ${validation.error.message}`, 400);
    }

    const { actionId, status, limit, offset } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Confirmations] GET request for user: ${userId}, tenant: ${tenantId}`);

    // === GET CONFIRMATIONS ===
    if (actionId) {
      // Get specific action and its confirmations
      const actionResult = await agentActionsService.getAgentAction(actionId);
      if (!actionResult.success) {
        return apiResponse.error(
          typeof actionResult.error === 'string' ? actionResult.error : 'Action not found', 
          404
        );
      }

      // Verify action belongs to user/tenant
      if (!actionResult.data || actionResult.data.userId !== userId || actionResult.data.tenantId !== tenantId) {
        return apiResponse.error('Action not found', 404);
      }

      // For now, return action info (confirmations would be joined in a real implementation)
      return NextResponse.json({
        action: actionResult.data,
        confirmations: [] // TODO: Implement confirmation lookup
      });
    } else {
      // Get all pending confirmations for user
      const actionsResult = await agentActionsService.getAgentActions(
        userId,
        tenantId,
        {
          status: 'pending',
          limit,
          offset
        }
      );

      if (!actionsResult.success) {
        return apiResponse.error(
          (actionsResult.error && typeof actionsResult.error === 'object' && 'userMessage' in actionsResult.error) 
            ? String(actionsResult.error.userMessage) 
            : 'Failed to get actions', 
          500
        );
      }

      // Filter actions that require confirmation
      const pendingConfirmations = (actionsResult.data || [])
        .filter(action => action.requiresConfirmation && action.status === 'pending')
        .map(action => ({
          id: action.id,
          functionName: action.functionName,
          functionParameters: action.functionParameters,
          createdAt: action.createdAt,
          entityType: action.entityType,
          operationType: action.operationType
        }));

      return NextResponse.json({
        confirmations: pendingConfirmations,
        total: pendingConfirmations.length
      });
    }

  } catch (error) {
    console.error('[Agent Confirmations] GET error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * POST - Create a new confirmation dialog
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }

    // === REQUEST PARSING ===
    const body = await request.json();
    
    // Validate request body
    const validation = createConfirmationSchema.safeParse(body);
    if (!validation.success) {
      return apiResponse.error('Invalid request data', 400);
    }

    const { actionId, dialogType, title, message, details, expiresInMinutes } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Confirmations] POST request for action: ${actionId}, user: ${userId}`);

    // === VERIFY ACTION OWNERSHIP ===
    const actionResult = await agentActionsService.getAgentAction(actionId);
    if (!actionResult.success) {
      return apiResponse.error('Action not found', 404);
    }

    // Verify action belongs to user/tenant
    if (!actionResult.data || actionResult.data.userId !== userId || actionResult.data.tenantId !== tenantId) {
      return apiResponse.error('Action not found', 404);
    }

    // === CREATE CONFIRMATION ===
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const confirmationResult = await agentActionsService.createConfirmation(actionId, {
      dialogType,
      title,
      message,
      details,
      expiresAt: expiresAt.toISOString()
    });

    if (!confirmationResult.success) {
      return apiResponse.error(
        (confirmationResult.error && typeof confirmationResult.error === 'object' && 'userMessage' in confirmationResult.error) 
          ? String(confirmationResult.error.userMessage) 
          : 'Failed to create confirmation', 
        500
      );
    }

    // === UPDATE ACTION STATUS ===
    await agentActionsService.updateAgentAction(actionId, {
      status: 'pending',
      confirmationReceivedAt: new Date().toISOString()
    });

    console.log(`[Agent Confirmations] Created confirmation: ${confirmationResult.data?.id}`);

    return NextResponse.json({
      confirmation: confirmationResult.data,
      action: actionResult.data
    }, { status: 201 });

  } catch (error) {
    console.error('[Agent Confirmations] POST error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * PATCH - Update confirmation with user response
 */
export const PATCH = asyncHandler(async (request: NextRequest) => {
  try {
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }

    // === REQUEST PARSING ===
    const body = await request.json();
    
    // Validate request body
    const validation = updateConfirmationSchema.safeParse(body);
    if (!validation.success) {
      return apiResponse.error('Invalid request data', 400);
    }

    const { confirmationId, response, responseDetails } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Confirmations] PATCH request for confirmation: ${confirmationId}, response: ${response}`);

    // === UPDATE CONFIRMATION ===
    const confirmationResult = await agentActionsService.updateConfirmation(
      confirmationId,
      response,
      responseDetails
    );

    if (!confirmationResult.success) {
      return apiResponse.error(
        (confirmationResult.error && typeof confirmationResult.error === 'object' && 'userMessage' in confirmationResult.error) 
          ? String(confirmationResult.error.userMessage) 
          : 'Failed to create confirmation', 
        500
      );
    }

    // === UPDATE ASSOCIATED ACTION ===
    const confirmation = confirmationResult.data;
    if (!confirmation) {
      return apiResponse.error('Failed to create confirmation', 500);
    }
    
    const actionUpdates: any = {
      confirmationReceivedAt: new Date().toISOString(),
      confirmedByUserId: userId
    };

    if (response === 'confirmed') {
      actionUpdates.status = 'confirmed';
    } else if (response === 'rejected') {
      actionUpdates.status = 'rejected';
    } else {
      actionUpdates.status = 'cancelled';
    }

    const actionUpdateResult = await agentActionsService.updateAgentAction(
      (confirmation as any).agentActionId || (confirmation as any).actionId,
      actionUpdates
    );

    if (!actionUpdateResult.success) {
      console.error('[Agent Confirmations] Failed to update action:', actionUpdateResult.error);
      // Continue anyway, confirmation was updated
    }

    console.log(`[Agent Confirmations] Updated confirmation: ${confirmationId} with response: ${response}`);

    return NextResponse.json({
      confirmation: confirmationResult.data,
      action: actionUpdateResult.success ? actionUpdateResult.data : null
    });

  } catch (error) {
    console.error('[Agent Confirmations] PATCH error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * DELETE - Cancel/expire confirmations
 */
export const DELETE = asyncHandler(async (request: NextRequest) => {
  try {
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }

    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Confirmations] DELETE (cleanup) request for user: ${userId}`);

    // === CLEANUP EXPIRED CONFIRMATIONS ===
    const cleanupResult = await agentActionsService.cleanupExpiredConfirmations();

    if (!cleanupResult.success) {
      return apiResponse.error(
        (cleanupResult.error && typeof cleanupResult.error === 'object' && 'userMessage' in cleanupResult.error) 
          ? String(cleanupResult.error.userMessage) 
          : 'Failed to cleanup confirmations', 
        500
      );
    }

    console.log(`[Agent Confirmations] Cleaned up ${cleanupResult.data} expired confirmations`);

    return NextResponse.json({
      message: 'Expired confirmations cleaned up',
      cleanedUp: cleanupResult.data
    });

  } catch (error) {
    console.error('[Agent Confirmations] DELETE error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});
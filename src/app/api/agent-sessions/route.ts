/**
 * @file Agent Sessions API Route
 * @description Manages agent chat sessions and mode switching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncHandler } from '@/utils/api-async-handler';
import { apiResponse } from '@/utils/api-response';
import { agentActionsService } from '@/services/agent-actions-db';
import { z } from 'zod';
import type { AgentMode } from '@/types/models/ai-chat';

/**
 * Validation schemas
 */
const createSessionSchema = z.object({
  mode: z.enum(['agent', 'ask']).default('agent'),
  sessionId: z.string().optional()
});

const updateSessionSchema = z.object({
  sessionId: z.string().min(1),
  mode: z.enum(['agent', 'ask']).optional(),
  endSession: z.boolean().optional()
});

const getSessionsSchema = z.object({
  active: z.boolean().optional(),
  mode: z.enum(['agent', 'ask']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

/**
 * GET - Retrieve agent sessions for the current user
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
    const queryParams = {
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      mode: searchParams.get('mode') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Validate query parameters
    const validation = getSessionsSchema.safeParse(queryParams);
    if (!validation.success) {
      return apiResponse.error("Invalid query parameters", 400);
    }

    const { active, mode, limit, offset } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Sessions] GET request for user: ${userId}, tenant: ${tenantId}`);

    // === GET USER'S ACTIONS TO DERIVE SESSION INFO ===
    // Since we don't have a direct session query yet, get recent actions
    const actionsResult = await agentActionsService.getAgentActions(
      userId,
      tenantId,
      { limit: 100 } // Get more to analyze sessions
    );

    if (!actionsResult.success) {
      return apiResponse.error("Failed to get data", 500);
    }

    // === GROUP ACTIONS BY SESSION ===
    const sessionMap = new Map();
    
    (actionsResult.data || []).forEach(action => {
      if (!action.sessionId) return;
      
      if (!sessionMap.has(action.sessionId)) {
        sessionMap.set(action.sessionId, {
          sessionId: action.sessionId,
          userId: action.userId,
          tenantId: action.tenantId,
          mode: 'agent', // Default, would come from session table in real implementation
          startedAt: action.createdAt,
          lastActivityAt: action.createdAt,
          endedAt: null,
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          pendingActions: 0,
          actions: []
        });
      }
      
      const sessionData = sessionMap.get(action.sessionId);
      sessionData.actions.push(action);
      sessionData.totalActions++;
      sessionData.lastActivityAt = action.updatedAt > sessionData.lastActivityAt 
        ? action.updatedAt 
        : sessionData.lastActivityAt;
      
      if (action.status === 'completed') sessionData.successfulActions++;
      else if (action.status === 'failed') sessionData.failedActions++;
      else if (['pending', 'confirmed'].includes(action.status)) sessionData.pendingActions++;
    });

    // === CONVERT TO ARRAY AND FILTER ===
    let sessions = Array.from(sessionMap.values());

    // Apply filters
    if (active !== undefined) {
      if (active) {
        // Active sessions have pending actions or recent activity
        const recentThreshold = new Date();
        recentThreshold.setHours(recentThreshold.getHours() - 24); // 24 hours
        
        sessions = sessions.filter(s => 
          s.pendingActions > 0 || 
          new Date(s.lastActivityAt) > recentThreshold
        );
      } else {
        // Inactive sessions
        sessions = sessions.filter(s => s.endedAt !== null);
      }
    }

    if (mode) {
      sessions = sessions.filter(s => s.mode === mode);
    }

    // === PAGINATION ===
    const total = sessions.length;
    sessions = sessions
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
      .slice(offset, offset + limit)
      .map(s => {
        // Remove actions array from response to keep it clean
        const { actions, ...sessionWithoutActions } = s;
        return sessionWithoutActions;
      });

    return NextResponse.json({
      sessions,
      total,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('[Agent Sessions] GET error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * POST - Create or initialize a new agent session
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
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      return apiResponse.error("Invalid query parameters", 400);
    }

    const { mode, sessionId } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    // === GENERATE SESSION ID IF NOT PROVIDED ===
    const finalSessionId = sessionId || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[Agent Sessions] POST request - creating session: ${finalSessionId}, mode: ${mode}, user: ${userId}`);

    // === CREATE/UPDATE SESSION ===
    const sessionResult = await agentActionsService.upsertSession(
      finalSessionId,
      userId,
      tenantId,
      mode as AgentMode
    );

    if (!sessionResult.success) {
      return apiResponse.error("Failed to get data", 500);
    }

    console.log(`[Agent Sessions] Created session: ${finalSessionId}`);

    return NextResponse.json({
      session: sessionResult.data,
      message: 'Session created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[Agent Sessions] POST error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * PATCH - Update an existing agent session
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
    const validation = updateSessionSchema.safeParse(body);
    if (!validation.success) {
      return apiResponse.error("Invalid query parameters", 400);
    }

    const { sessionId, mode, endSession } = validation.data;
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Sessions] PATCH request for session: ${sessionId}, user: ${userId}`);

    if (endSession) {
      // === END SESSION ===
      // For now, we'll just update any pending actions to cancelled
      const actionsResult = await agentActionsService.getAgentActions(
        userId,
        tenantId,
        { sessionId, status: 'pending' }
      );

      if (actionsResult.success) {
        // Cancel pending actions
        for (const action of (actionsResult.data || [])) {
          await agentActionsService.updateAgentAction(action.id, {
            status: 'cancelled',
            completedAt: new Date().toISOString()
          });
        }
      }

      return NextResponse.json({
        message: 'Session ended successfully',
        sessionId,
        cancelledActions: actionsResult.success ? (actionsResult.data?.length || 0) : 0
      });

    } else if (mode) {
      // === UPDATE SESSION MODE ===
      const sessionResult = await agentActionsService.upsertSession(
        sessionId,
        userId,
        tenantId,
        mode as AgentMode
      );

      if (!sessionResult.success) {
        return apiResponse.error("Failed to get data", 500);
      }

      console.log(`[Agent Sessions] Updated session mode: ${sessionId} to ${mode}`);

      return NextResponse.json({
        session: sessionResult.data,
        message: 'Session updated successfully'
      });
    } else {
      return apiResponse.error('No valid update operation specified', 400);
    }

  } catch (error) {
    console.error('[Agent Sessions] PATCH error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});

/**
 * DELETE - End/cleanup agent sessions
 */
export const DELETE = asyncHandler(async (request: NextRequest) => {
  try {
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const cleanupOld = searchParams.get('cleanupOld') === 'true';
    
    const userId = session.user.id;
    
    // Get user's tenant ID from session
    const tenantId = (session as any).currentTenant;
    if (!tenantId) {
      return apiResponse.error('Tenant ID not found in session', 400);
    }

    console.log(`[Agent Sessions] DELETE request for user: ${userId}`);

    if (sessionId) {
      // === DELETE SPECIFIC SESSION ===
      // Cancel all pending actions for this session
      const actionsResult = await agentActionsService.getAgentActions(
        userId,
        tenantId,
        { sessionId }
      );

      let cancelledCount = 0;
      if (actionsResult.success) {
        for (const action of (actionsResult.data || [])) {
          if (['pending', 'confirmed'].includes(action.status)) {
            await agentActionsService.updateAgentAction(action.id, {
              status: 'cancelled',
              completedAt: new Date().toISOString()
            });
            cancelledCount++;
          }
        }
      }

      return NextResponse.json({
        message: 'Session deleted successfully',
        sessionId,
        cancelledActions: cancelledCount
      });

    } else if (cleanupOld) {
      // === CLEANUP OLD SESSIONS ===
      // Cancel actions from sessions older than 7 days with no activity
      const oldThreshold = new Date();
      oldThreshold.setDate(oldThreshold.getDate() - 7);

      const actionsResult = await agentActionsService.getAgentActions(
        userId,
        tenantId,
        { limit: 1000 } // Get all to check dates
      );

      let cleanedSessions = 0;
      let cancelledActions = 0;

      if (actionsResult.success) {
        const sessionMap = new Map();
        
        // Group by session and find old ones
        (actionsResult.data || []).forEach(action => {
          if (!action.sessionId) return;
          
          if (!sessionMap.has(action.sessionId)) {
            sessionMap.set(action.sessionId, {
              lastActivity: action.updatedAt,
              actions: []
            });
          }
          
          const sessionData = sessionMap.get(action.sessionId);
          sessionData.actions.push(action);
          if (action.updatedAt > sessionData.lastActivity) {
            sessionData.lastActivity = action.updatedAt;
          }
        });

        // Process old sessions
        for (const [sessionId, sessionData] of sessionMap.entries()) {
          if (new Date(sessionData.lastActivity) < oldThreshold) {
            cleanedSessions++;
            
            for (const action of sessionData.actions) {
              if (['pending', 'confirmed'].includes(action.status)) {
                await agentActionsService.updateAgentAction(action.id, {
                  status: 'cancelled',
                  completedAt: new Date().toISOString()
                });
                cancelledActions++;
              }
            }
          }
        }
      }

      return NextResponse.json({
        message: 'Old sessions cleaned up',
        cleanedSessions,
        cancelledActions
      });

    } else {
      return apiResponse.error('Must specify sessionId or cleanupOld=true', 400);
    }

  } catch (error) {
    console.error('[Agent Sessions] DELETE error:', error);
    return apiResponse.error('Internal server error', 500);
  }
});
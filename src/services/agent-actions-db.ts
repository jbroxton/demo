import { supabase } from './supabase';
import type { 
  AgentAction,
  AgentConfirmation,
  AgentSession,
  AgentOperationResult,
  CreateAgentActionParams,
  UpdateAgentActionParams,
  AgentActionStatus
} from '@/types/models/ai-chat';
import { createAgentError, AgentErrorType, AgentErrorSeverity } from '@/lib/agent-error-handling';

/**
 * Service layer for agent action database operations
 */
export class AgentActionsService {
  private supabase = supabase;

  /**
   * Create a new agent action record
   */
  async createAgentAction(params: CreateAgentActionParams): Promise<AgentOperationResult<AgentAction>> {
    try {
      const { data, error } = await this.supabase
        .from('agent_actions')
        .insert({
          tenant_id: params.tenantId,
          user_id: params.userId,
          session_id: params.sessionId,
          operation_type: params.operationType,
          entity_type: params.entityType,
          entity_id: params.entityId,
          function_name: params.functionName,
          function_parameters: params.functionParameters,
          openai_function_call_id: params.openAiFunctionCallId,
          status: params.status || 'pending',
          requires_confirmation: params.requiresConfirmation ?? true,
          ip_address: params.ipAddress,
          user_agent: params.userAgent
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to create agent action',
            { supabaseError: error },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToAgentAction(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error creating agent action',
          { originalError: error },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Update an existing agent action
   */
  async updateAgentAction(
    actionId: string, 
    updates: UpdateAgentActionParams
  ): Promise<AgentOperationResult<AgentAction>> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.entityId !== undefined) updateData.entity_id = updates.entityId;
      if (updates.confirmationRequestedAt !== undefined) {
        updateData.confirmation_requested_at = updates.confirmationRequestedAt;
      }
      if (updates.confirmationReceivedAt !== undefined) {
        updateData.confirmation_received_at = updates.confirmationReceivedAt;
      }
      if (updates.confirmedByUserId !== undefined) {
        updateData.confirmed_by_user_id = updates.confirmedByUserId;
      }
      if (updates.resultData !== undefined) updateData.result_data = updates.resultData;
      if (updates.errorData !== undefined) updateData.error_data = updates.errorData;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

      const { data, error } = await this.supabase
        .from('agent_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to update agent action',
            { supabaseError: error, actionId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToAgentAction(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error updating agent action',
          { originalError: error, actionId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Get agent action by ID
   */
  async getAgentAction(actionId: string): Promise<AgentOperationResult<AgentAction>> {
    try {
      const { data, error } = await this.supabase
        .from('agent_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: createAgentError(
              AgentErrorType.BUSINESS_LOGIC,
              'Agent action not found',
              { actionId },
              AgentErrorSeverity.MEDIUM
            )
          };
        }

        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to retrieve agent action',
            { supabaseError: error, actionId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToAgentAction(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error retrieving agent action',
          { originalError: error, actionId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Get agent actions for a user/tenant
   */
  async getAgentActions(
    userId: string,
    tenantId: string,
    filters?: {
      sessionId?: string;
      status?: AgentActionStatus;
      entityType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentOperationResult<AgentAction[]>> {
    try {
      let query = this.supabase
        .from('agent_actions')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to retrieve agent actions',
            { supabaseError: error, userId, tenantId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: data.map(row => this.mapDbToAgentAction(row))
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error retrieving agent actions',
          { originalError: error, userId, tenantId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Get pending actions for a user
   */
  async getPendingActions(
    userId: string,
    tenantId: string
  ): Promise<AgentOperationResult<AgentAction[]>> {
    return this.getAgentActions(userId, tenantId, { 
      status: 'pending',
      limit: 100 
    });
  }

  /**
   * Create confirmation dialog for an action
   */
  async createConfirmation(
    actionId: string,
    confirmationData: {
      dialogType: string;
      title: string;
      message: string;
      details?: any;
      expiresAt?: string;
    }
  ): Promise<AgentOperationResult<AgentConfirmation>> {
    try {
      const { data, error } = await this.supabase
        .from('agent_confirmations')
        .insert({
          agent_action_id: actionId,
          dialog_type: confirmationData.dialogType,
          title: confirmationData.title,
          message: confirmationData.message,
          details: confirmationData.details,
          expires_at: confirmationData.expiresAt
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to create confirmation dialog',
            { supabaseError: error, actionId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToConfirmation(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error creating confirmation',
          { originalError: error, actionId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Update confirmation with user response
   */
  async updateConfirmation(
    confirmationId: string,
    response: 'confirmed' | 'rejected' | 'cancelled',
    responseDetails?: any
  ): Promise<AgentOperationResult<AgentConfirmation>> {
    try {
      const { data, error } = await this.supabase
        .from('agent_confirmations')
        .update({
          user_response: response,
          response_timestamp: new Date().toISOString(),
          response_details: responseDetails
        })
        .eq('id', confirmationId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to update confirmation',
            { supabaseError: error, confirmationId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToConfirmation(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error updating confirmation',
          { originalError: error, confirmationId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Create or update agent session
   */
  async upsertSession(
    sessionId: string,
    userId: string,
    tenantId: string,
    mode: 'agent' | 'ask' = 'agent'
  ): Promise<AgentOperationResult<AgentSession>> {
    try {
      const { data, error } = await this.supabase
        .from('agent_sessions')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          tenant_id: tenantId,
          mode,
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to upsert agent session',
            { supabaseError: error, sessionId },
            AgentErrorSeverity.HIGH
          )
        };
      }

      return {
        success: true,
        data: this.mapDbToSession(data)
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error upserting session',
          { originalError: error, sessionId },
          AgentErrorSeverity.HIGH
        )
      };
    }
  }

  /**
   * Clean up expired confirmations
   */
  async cleanupExpiredConfirmations(): Promise<AgentOperationResult<number>> {
    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_expired_confirmations');

      if (error) {
        return {
          success: false,
          error: createAgentError(
            AgentErrorType.SYSTEM,
            'Failed to cleanup expired confirmations',
            { supabaseError: error },
            AgentErrorSeverity.MEDIUM
          )
        };
      }

      return {
        success: true,
        data: data || 0
      };
    } catch (error) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.SYSTEM,
          'Unexpected error cleaning up confirmations',
          { originalError: error },
          AgentErrorSeverity.MEDIUM
        )
      };
    }
  }

  /**
   * Map database row to AgentAction type
   */
  private mapDbToAgentAction(row: any): AgentAction {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      sessionId: row.session_id,
      operationType: row.operation_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      functionName: row.function_name,
      functionParameters: row.function_parameters,
      openAiFunctionCallId: row.openai_function_call_id,
      status: row.status,
      requiresConfirmation: row.requires_confirmation,
      confirmationRequestedAt: row.confirmation_requested_at,
      confirmationReceivedAt: row.confirmation_received_at,
      confirmedByUserId: row.confirmed_by_user_id,
      resultData: row.result_data,
      errorData: row.error_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  }

  /**
   * Map database row to AgentConfirmation type
   */
  private mapDbToConfirmation(row: any): AgentConfirmation {
    return {
      id: row.id,
      agentActionId: row.agent_action_id,
      dialogType: row.dialog_type,
      title: row.title,
      message: row.message,
      details: row.details,
      userResponse: row.user_response,
      responseTimestamp: row.response_timestamp,
      responseDetails: row.response_details,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  /**
   * Map database row to AgentSession type
   */
  private mapDbToSession(row: any): AgentSession {
    return {
      id: row.id,
      sessionId: row.session_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      mode: row.mode,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      endedAt: row.ended_at,
      totalActions: row.total_actions,
      successfulActions: row.successful_actions,
      failedActions: row.failed_actions,
      pendingActions: row.pending_actions
    };
  }
}

/**
 * Default service instance
 */
export const agentActionsService = new AgentActionsService();
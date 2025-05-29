"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { AgentConfirmation, AgentAction } from '@/types/models/ai-chat';

interface CreateConfirmationParams {
  actionId: string;
  dialogType: 'simple' | 'detailed' | 'bulk';
  title: string;
  message: string;
  details?: any;
  expiresInMinutes?: number;
}

interface UpdateConfirmationParams {
  confirmationId: string;
  response: 'confirmed' | 'rejected' | 'cancelled';
  responseDetails?: any;
}

interface GetConfirmationsParams {
  actionId?: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  limit?: number;
  offset?: number;
}

interface ConfirmationsResponse {
  confirmations: Array<{
    id: string;
    functionName: string;
    functionParameters: any;
    createdAt: string;
    entityType: string;
    operationType: string;
  }>;
  total: number;
}

interface ActionConfirmationResponse {
  action: AgentAction;
  confirmations: AgentConfirmation[];
}

interface CreateConfirmationResponse {
  confirmation: AgentConfirmation;
  action: AgentAction;
}

interface UpdateConfirmationResponse {
  confirmation: AgentConfirmation;
  action: AgentAction | null;
}

/**
 * API functions for agent confirmations
 */
const confirmationApi = {
  async getConfirmations(params: GetConfirmationsParams = {}): Promise<ConfirmationsResponse | ActionConfirmationResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.actionId) searchParams.set('actionId', params.actionId);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    
    const response = await fetch(`/api/agent-confirmations?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch confirmations: ${response.statusText}`);
    }
    
    return response.json();
  },

  async createConfirmation(params: CreateConfirmationParams): Promise<CreateConfirmationResponse> {
    const response = await fetch('/api/agent-confirmations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create confirmation: ${response.statusText}`);
    }
    
    return response.json();
  },

  async updateConfirmation(params: UpdateConfirmationParams): Promise<UpdateConfirmationResponse> {
    const response = await fetch('/api/agent-confirmations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update confirmation: ${response.statusText}`);
    }
    
    return response.json();
  },

  async cleanupExpiredConfirmations(): Promise<{ message: string; cleanedUp: number }> {
    const response = await fetch('/api/agent-confirmations', {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup confirmations: ${response.statusText}`);
    }
    
    return response.json();
  }
};

/**
 * Hook for managing agent confirmations
 */
export function useAgentConfirmations(params: GetConfirmationsParams = {}) {
  const queryClient = useQueryClient();
  
  // Query key for confirmations
  const queryKey = ['agent-confirmations', params];
  
  // Main query for confirmations
  const confirmationsQuery = useQuery({
    queryKey,
    queryFn: () => confirmationApi.getConfirmations(params),
    staleTime: 10 * 1000, // 10 seconds (confirmations need frequent updates)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for pending confirmations
    refetchIntervalInBackground: false,
    enabled: true
  });

  // Create confirmation mutation
  const createConfirmationMutation = useMutation({
    mutationFn: confirmationApi.createConfirmation,
    onSuccess: () => {
      // Invalidate and refetch confirmations
      queryClient.invalidateQueries({ queryKey: ['agent-confirmations'] });
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to create confirmation:', error);
    }
  });

  // Update confirmation mutation
  const updateConfirmationMutation = useMutation({
    mutationFn: confirmationApi.updateConfirmation,
    onSuccess: () => {
      // Invalidate and refetch confirmations and sessions
      queryClient.invalidateQueries({ queryKey: ['agent-confirmations'] });
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to update confirmation:', error);
    }
  });

  // Cleanup confirmations mutation
  const cleanupConfirmationsMutation = useMutation({
    mutationFn: confirmationApi.cleanupExpiredConfirmations,
    onSuccess: () => {
      // Invalidate and refetch confirmations
      queryClient.invalidateQueries({ queryKey: ['agent-confirmations'] });
    },
    onError: (error) => {
      console.error('Failed to cleanup confirmations:', error);
    }
  });

  // Wrapper functions for easier usage
  const createConfirmation = useCallback(async (params: CreateConfirmationParams) => {
    return createConfirmationMutation.mutateAsync(params);
  }, [createConfirmationMutation]);

  const confirmAction = useCallback(async (confirmationId: string, responseDetails?: any) => {
    return updateConfirmationMutation.mutateAsync({
      confirmationId,
      response: 'confirmed',
      responseDetails
    });
  }, [updateConfirmationMutation]);

  const rejectAction = useCallback(async (confirmationId: string, responseDetails?: any) => {
    return updateConfirmationMutation.mutateAsync({
      confirmationId,
      response: 'rejected',
      responseDetails
    });
  }, [updateConfirmationMutation]);

  const cancelAction = useCallback(async (confirmationId: string, responseDetails?: any) => {
    return updateConfirmationMutation.mutateAsync({
      confirmationId,
      response: 'cancelled',
      responseDetails
    });
  }, [updateConfirmationMutation]);

  const cleanupExpiredConfirmations = useCallback(async () => {
    return cleanupConfirmationsMutation.mutateAsync();
  }, [cleanupConfirmationsMutation]);

  // Helper to respond to confirmation
  const respondToConfirmation = useCallback(async (
    confirmationId: string, 
    response: 'confirmed' | 'rejected' | 'cancelled',
    responseDetails?: any
  ) => {
    return updateConfirmationMutation.mutateAsync({
      confirmationId,
      response,
      responseDetails
    });
  }, [updateConfirmationMutation]);

  // Extract data based on response type
  const isActionSpecific = !!params.actionId;
  const data = confirmationsQuery.data;
  
  const confirmations = isActionSpecific 
    ? (data as ActionConfirmationResponse)?.confirmations || []
    : (data as ConfirmationsResponse)?.confirmations || [];
    
  const action = isActionSpecific 
    ? (data as ActionConfirmationResponse)?.action || null
    : null;
    
  const total = isActionSpecific 
    ? confirmations.length
    : (data as ConfirmationsResponse)?.total || 0;

  return {
    // Data
    confirmations,
    action,
    total,
    
    // Loading states
    isLoading: confirmationsQuery.isLoading,
    isError: confirmationsQuery.isError,
    error: confirmationsQuery.error,
    isRefetching: confirmationsQuery.isRefetching,
    
    // Mutation states
    isCreating: createConfirmationMutation.isPending,
    isUpdating: updateConfirmationMutation.isPending,
    isCleaning: cleanupConfirmationsMutation.isPending,
    
    // Actions
    createConfirmation,
    confirmAction,
    rejectAction,
    cancelAction,
    respondToConfirmation,
    cleanupExpiredConfirmations,
    
    // Utilities
    refetch: confirmationsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['agent-confirmations'] })
  };
}

/**
 * Hook for pending confirmations only
 */
export function usePendingConfirmations() {
  return useAgentConfirmations({ status: 'pending', limit: 50 });
}

/**
 * Hook for confirmations of a specific action
 */
export function useActionConfirmations(actionId: string) {
  return useAgentConfirmations({ actionId });
}

/**
 * Hook for confirmation statistics
 */
export function useConfirmationStats() {
  const queryClient = useQueryClient();
  
  const statsQuery = useQuery({
    queryKey: ['agent-confirmation-stats'],
    queryFn: async () => {
      // Get all recent confirmations to calculate stats
      const response = await confirmationApi.getConfirmations({ limit: 100 });
      const confirmations = (response as ConfirmationsResponse).confirmations;
      
      const stats = {
        total: confirmations.length,
        pending: confirmations.filter((c: any) => !c.userResponse).length,
        confirmed: confirmations.filter((c: any) => c.userResponse === 'confirmed').length,
        rejected: confirmations.filter((c: any) => c.userResponse === 'rejected').length,
        cancelled: confirmations.filter((c: any) => c.userResponse === 'cancelled').length
      };
      
      return stats;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refetch every minute
  });

  return {
    stats: statsQuery.data || { total: 0, pending: 0, confirmed: 0, rejected: 0, cancelled: 0 },
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch
  };
}
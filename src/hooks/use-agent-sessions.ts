"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { AgentSession, AgentMode, AgentOperationResult } from '@/types/models/ai-chat';

interface CreateSessionParams {
  mode?: AgentMode;
  sessionId?: string;
}

interface UpdateSessionParams {
  sessionId: string;
  mode?: AgentMode;
  endSession?: boolean;
}

interface GetSessionsParams {
  active?: boolean;
  mode?: AgentMode;
  limit?: number;
  offset?: number;
}

interface SessionsResponse {
  sessions: AgentSession[];
  total: number;
  hasMore: boolean;
}

/**
 * API functions for agent sessions
 */
const sessionApi = {
  async getSessions(params: GetSessionsParams = {}): Promise<SessionsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.active !== undefined) searchParams.set('active', params.active.toString());
    if (params.mode) searchParams.set('mode', params.mode);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    
    const response = await fetch(`/api/agent-sessions?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    
    return response.json();
  },

  async createSession(params: CreateSessionParams): Promise<{ session: AgentSession; message: string }> {
    const response = await fetch('/api/agent-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    
    return response.json();
  },

  async updateSession(params: UpdateSessionParams): Promise<{ session?: AgentSession; message: string }> {
    const response = await fetch('/api/agent-sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.statusText}`);
    }
    
    return response.json();
  },

  async deleteSession(sessionId: string): Promise<{ message: string; cancelledActions: number }> {
    const response = await fetch(`/api/agent-sessions?sessionId=${sessionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
    
    return response.json();
  },

  async cleanupOldSessions(): Promise<{ message: string; cleanedSessions: number; cancelledActions: number }> {
    const response = await fetch('/api/agent-sessions?cleanupOld=true', {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup sessions: ${response.statusText}`);
    }
    
    return response.json();
  }
};

/**
 * Hook for managing agent sessions
 */
export function useAgentSessions(params: GetSessionsParams = {}) {
  const queryClient = useQueryClient();
  
  // Query key for sessions
  const queryKey = ['agent-sessions', params];
  
  // Main query for sessions
  const sessionsQuery = useQuery({
    queryKey,
    queryFn: () => sessionApi.getSessions(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for active sessions
    refetchIntervalInBackground: false
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: sessionApi.createSession,
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
    }
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: sessionApi.updateSession,
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to update session:', error);
    }
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: sessionApi.deleteSession,
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);
    }
  });

  // Cleanup old sessions mutation
  const cleanupSessionsMutation = useMutation({
    mutationFn: sessionApi.cleanupOldSessions,
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to cleanup sessions:', error);
    }
  });

  // Wrapper functions for easier usage
  const createSession = useCallback(async (params: CreateSessionParams = {}) => {
    return createSessionMutation.mutateAsync(params);
  }, [createSessionMutation]);

  const updateSessionMode = useCallback(async (sessionId: string, mode: AgentMode) => {
    return updateSessionMutation.mutateAsync({ sessionId, mode });
  }, [updateSessionMutation]);

  const endSession = useCallback(async (sessionId: string) => {
    return updateSessionMutation.mutateAsync({ sessionId, endSession: true });
  }, [updateSessionMutation]);

  const deleteSession = useCallback(async (sessionId: string) => {
    return deleteSessionMutation.mutateAsync(sessionId);
  }, [deleteSessionMutation]);

  const cleanupOldSessions = useCallback(async () => {
    return cleanupSessionsMutation.mutateAsync();
  }, [cleanupSessionsMutation]);

  return {
    // Data
    sessions: sessionsQuery.data?.sessions || [],
    total: sessionsQuery.data?.total || 0,
    hasMore: sessionsQuery.data?.hasMore || false,
    
    // Loading states
    isLoading: sessionsQuery.isLoading,
    isError: sessionsQuery.isError,
    error: sessionsQuery.error,
    isRefetching: sessionsQuery.isRefetching,
    
    // Mutation states
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
    isCleaning: cleanupSessionsMutation.isPending,
    
    // Actions
    createSession,
    updateSessionMode,
    endSession,
    deleteSession,
    cleanupOldSessions,
    
    // Utilities
    refetch: sessionsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['agent-sessions'] })
  };
}

/**
 * Hook for a specific agent session
 */
export function useAgentSession(sessionId?: string) {
  const queryClient = useQueryClient();
  
  const { sessions, isLoading, error } = useAgentSessions({ active: true });
  
  // Find the specific session
  const session = sessionId ? sessions.find(s => s.sessionId === sessionId) : null;
  
  // Create session for this specific ID
  const createThisSession = useCallback(async (mode: AgentMode = 'agent') => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const response = await sessionApi.createSession({ sessionId, mode });
    
    // Invalidate sessions to get updated data
    queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    
    return response;
  }, [sessionId, queryClient]);

  // Update this session's mode
  const updateMode = useCallback(async (mode: AgentMode) => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const response = await sessionApi.updateSession({ sessionId, mode });
    
    // Invalidate sessions to get updated data
    queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    
    return response;
  }, [sessionId, queryClient]);

  // End this session
  const endThisSession = useCallback(async () => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const response = await sessionApi.updateSession({ sessionId, endSession: true });
    
    // Invalidate sessions to get updated data
    queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
    
    return response;
  }, [sessionId, queryClient]);

  return {
    session,
    sessionId,
    isLoading,
    error,
    createThisSession,
    updateMode,
    endThisSession,
    exists: !!session
  };
}

/**
 * Hook for active agent sessions only
 */
export function useActiveSessions() {
  return useAgentSessions({ active: true, limit: 10 });
}

/**
 * Hook for recent agent sessions
 */
export function useRecentSessions(limit: number = 20) {
  return useAgentSessions({ limit });
}
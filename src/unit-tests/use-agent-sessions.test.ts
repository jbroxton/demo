import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAgentSessions, useAgentSession, useActiveSessions, useRecentSessions } from '../hooks/use-agent-sessions';
import type { AgentSession } from '@/types/models/ai-chat';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock response data
const mockSessionsResponse = {
  sessions: [
    {
      id: 'session-1',
      sessionId: 'agent-123',
      tenantId: 'tenant-123',
      userId: 'user-123',
      mode: 'agent',
      startedAt: '2024-01-01T10:00:00Z',
      lastActivityAt: '2024-01-01T10:30:00Z',
      endedAt: null,
      totalActions: 5,
      successfulActions: 4,
      failedActions: 1,
      pendingActions: 0
    },
    {
      id: 'session-2',
      sessionId: 'ask-456',
      tenantId: 'tenant-123',
      userId: 'user-123',
      mode: 'ask',
      startedAt: '2024-01-01T09:00:00Z',
      lastActivityAt: '2024-01-01T09:15:00Z',
      endedAt: '2024-01-01T09:15:00Z',
      totalActions: 2,
      successfulActions: 2,
      failedActions: 0,
      pendingActions: 0
    }
  ],
  total: 2,
  hasMore: false
};

const mockCreateResponse = {
  session: mockSessionsResponse.sessions[0],
  message: 'Session created successfully'
};

const mockUpdateResponse = {
  session: mockSessionsResponse.sessions[0],
  message: 'Session updated successfully'
};

const mockDeleteResponse = {
  message: 'Session deleted successfully',
  cancelledActions: 2
};

const mockCleanupResponse = {
  message: 'Old sessions cleaned up',
  cleanedSessions: 3,
  cancelledActions: 5
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAgentSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Query Functionality', () => {
    it('should fetch sessions successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionsResponse
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessions).toEqual(mockSessionsResponse.sessions);
      expect(result.current.total).toBe(2);
      expect(result.current.hasMore).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?');
    });

    it('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionsResponse
      });

      const { result } = renderHook(
        () => useAgentSessions({ 
          active: true, 
          mode: 'agent', 
          limit: 10, 
          offset: 5 
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/agent-sessions?active=true&mode=agent&limit=10&offset=5'
      );
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.sessions).toEqual([]);
    });
  });

  describe('Create Session', () => {
    it('should create session successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock successful create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.createSession({ mode: 'agent' });

      expect(response).toEqual(mockCreateResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'agent' })
      });
    });

    it('should handle create session errors', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock failed create
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.createSession({ mode: 'agent' })).rejects.toThrow('Failed to create session: Bad Request');
    });
  });

  describe('Update Session Mode', () => {
    it('should update session mode successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock successful update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateResponse
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.updateSessionMode('session-123', 'ask');

      expect(response).toEqual(mockUpdateResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123', mode: 'ask' })
      });
    });
  });

  describe('End Session', () => {
    it('should end session successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock successful end session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Session ended', sessionId: 'session-123', cancelledActions: 0 })
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.endSession('session-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123', endSession: true })
      });
    });
  });

  describe('Delete Session', () => {
    it('should delete session successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock successful delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeleteResponse
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.deleteSession('session-123');

      expect(response).toEqual(mockDeleteResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?sessionId=session-123', {
        method: 'DELETE'
      });
    });
  });

  describe('Cleanup Old Sessions', () => {
    it('should cleanup old sessions successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      // Mock successful cleanup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCleanupResponse
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.cleanupOldSessions();

      expect(response).toEqual(mockCleanupResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?cleanupOld=true', {
        method: 'DELETE'
      });
    });
  });

  describe('Loading States', () => {
    it('should track mutation loading states correctly', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [], total: 0, hasMore: false })
      });

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isCleaning).toBe(false);
    });
  });
});

describe('useAgentSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should find specific session by ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionsResponse
    });

    const { result } = renderHook(() => useAgentSession('agent-123'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSessionsResponse.sessions[0]);
    expect(result.current.sessionId).toBe('agent-123');
    expect(result.current.exists).toBe(true);
  });

  it('should return null when session not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [], total: 0, hasMore: false })
    });

    const { result } = renderHook(() => useAgentSession('nonexistent'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBe(null);
    expect(result.current.exists).toBe(false);
  });

  it('should create session for specific ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [], total: 0, hasMore: false })
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCreateResponse
    });

    const { result } = renderHook(() => useAgentSession('new-session'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createThisSession('agent');

    expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'new-session', mode: 'agent' })
    });
  });

  it('should throw error when sessionId is missing for operations', async () => {
    const { result } = renderHook(() => useAgentSession(undefined), {
      wrapper: createWrapper()
    });

    await expect(result.current.createThisSession('agent')).rejects.toThrow('Session ID is required');
    await expect(result.current.updateMode('ask')).rejects.toThrow('Session ID is required');
    await expect(result.current.endThisSession()).rejects.toThrow('Session ID is required');
  });
});

describe('useActiveSessions', () => {
  it('should call useAgentSessions with active filter', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [], total: 0, hasMore: false })
    });

    const { result } = renderHook(() => useActiveSessions(), {
      wrapper: createWrapper()
    });

    // Should be called with active: true and limit: 10
    expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?active=true&limit=10');
  });
});

describe('useRecentSessions', () => {
  it('should call useAgentSessions with limit', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [], total: 0, hasMore: false })
    });

    const { result } = renderHook(() => useRecentSessions(5), {
      wrapper: createWrapper()
    });

    // Should be called with limit: 5
    expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?limit=5');
  });

  it('should use default limit of 20', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [], total: 0, hasMore: false })
    });

    const { result } = renderHook(() => useRecentSessions(), {
      wrapper: createWrapper()
    });

    // Should be called with default limit: 20
    expect(mockFetch).toHaveBeenCalledWith('/api/agent-sessions?limit=20');
  });
});
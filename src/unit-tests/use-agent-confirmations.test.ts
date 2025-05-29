import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAgentConfirmations, usePendingConfirmations, useActionConfirmations, useConfirmationStats } from '../hooks/use-agent-confirmations';
import type { AgentConfirmation, AgentAction } from '@/types/models/ai-chat';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock response data
const mockConfirmationsResponse = {
  confirmations: [
    {
      id: 'action-1',
      functionName: 'createProduct',
      functionParameters: { name: 'Test Product' },
      createdAt: '2024-01-01T10:00:00Z',
      entityType: 'product',
      operationType: 'create'
    },
    {
      id: 'action-2',
      functionName: 'deleteFeature',
      functionParameters: { id: 'feature-123' },
      createdAt: '2024-01-01T09:00:00Z',
      entityType: 'feature',
      operationType: 'delete'
    }
  ],
  total: 2
};

const mockActionConfirmationResponse = {
  action: {
    id: 'action-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    sessionId: 'session-123',
    operationType: 'create',
    entityType: 'product',
    entityId: null,
    functionName: 'createProduct',
    functionParameters: { name: 'Test Product' },
    openAiFunctionCallId: 'call-123',
    status: 'pending',
    requiresConfirmation: true,
    confirmationRequestedAt: '2024-01-01T10:00:00Z',
    confirmationReceivedAt: null,
    confirmedByUserId: null,
    resultData: null,
    errorData: null,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    completedAt: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  },
  confirmations: [
    {
      id: 'conf-123',
      agentActionId: 'action-123',
      dialogType: 'detailed',
      title: 'Confirm Product Creation',
      message: 'Are you sure you want to create this product?',
      details: null,
      userResponse: null,
      responseTimestamp: null,
      responseDetails: null,
      createdAt: '2024-01-01T10:00:00Z',
      expiresAt: '2024-01-01T11:00:00Z'
    }
  ]
};

const mockCreateConfirmationResponse = {
  confirmation: mockActionConfirmationResponse.confirmations[0],
  action: mockActionConfirmationResponse.action
};

const mockUpdateConfirmationResponse = {
  confirmation: {
    ...mockActionConfirmationResponse.confirmations[0],
    userResponse: 'confirmed',
    responseTimestamp: '2024-01-01T10:05:00Z'
  },
  action: {
    ...mockActionConfirmationResponse.action,
    status: 'confirmed'
  }
};

const mockCleanupResponse = {
  message: 'Expired confirmations cleaned up',
  cleanedUp: 3
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

describe('useAgentConfirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Query Functionality', () => {
    it('should fetch confirmations successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfirmationsResponse
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.confirmations).toEqual(mockConfirmationsResponse.confirmations);
      expect(result.current.total).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations?');
    });

    it('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfirmationsResponse
      });

      const { result } = renderHook(
        () => useAgentConfirmations({ 
          status: 'pending', 
          limit: 10, 
          offset: 5 
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/agent-confirmations?status=pending&limit=10&offset=5'
      );
    });

    it('should fetch action-specific confirmations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActionConfirmationResponse
      });

      const { result } = renderHook(
        () => useAgentConfirmations({ actionId: 'action-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.confirmations).toEqual(mockActionConfirmationResponse.confirmations);
      expect(result.current.action).toEqual(mockActionConfirmationResponse.action);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations?actionId=action-123');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.confirmations).toEqual([]);
    });
  });

  describe('Create Confirmation', () => {
    it('should create confirmation successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateConfirmationResponse
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.createConfirmation({
        actionId: 'action-123',
        dialogType: 'detailed',
        title: 'Confirm Action',
        message: 'Are you sure?'
      });

      expect(response).toEqual(mockCreateConfirmationResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: 'action-123',
          dialogType: 'detailed',
          title: 'Confirm Action',
          message: 'Are you sure?'
        })
      });
    });

    it('should handle create confirmation errors', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock failed create
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.createConfirmation({
        actionId: 'action-123',
        dialogType: 'simple',
        title: 'Test',
        message: 'Test message'
      })).rejects.toThrow('Failed to create confirmation: Bad Request');
    });
  });

  describe('Confirm Actions', () => {
    it('should confirm action successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful confirm
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateConfirmationResponse
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.confirmAction('conf-123', { note: 'Looks good' });

      expect(response).toEqual(mockUpdateConfirmationResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationId: 'conf-123',
          response: 'confirmed',
          responseDetails: { note: 'Looks good' }
        })
      });
    });

    it('should reject action successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful reject
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockUpdateConfirmationResponse,
          confirmation: {
            ...mockUpdateConfirmationResponse.confirmation,
            userResponse: 'rejected'
          }
        })
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.rejectAction('conf-123', { reason: 'Not ready' });

      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationId: 'conf-123',
          response: 'rejected',
          responseDetails: { reason: 'Not ready' }
        })
      });
    });

    it('should cancel action successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful cancel
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockUpdateConfirmationResponse,
          confirmation: {
            ...mockUpdateConfirmationResponse.confirmation,
            userResponse: 'cancelled'
          }
        })
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.cancelAction('conf-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationId: 'conf-123',
          response: 'cancelled',
          responseDetails: undefined
        })
      });
    });
  });

  describe('Respond to Confirmation', () => {
    it('should respond to confirmation with any response type', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateConfirmationResponse
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.respondToConfirmation('conf-123', 'confirmed', { note: 'Custom response' });

      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationId: 'conf-123',
          response: 'confirmed',
          responseDetails: { note: 'Custom response' }
        })
      });
    });
  });

  describe('Cleanup Expired Confirmations', () => {
    it('should cleanup expired confirmations successfully', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      // Mock successful cleanup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCleanupResponse
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.cleanupExpiredConfirmations();

      expect(response).toEqual(mockCleanupResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations', {
        method: 'DELETE'
      });
    });
  });

  describe('Loading States', () => {
    it('should track mutation loading states correctly', async () => {
      // Mock successful fetch for initial query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ confirmations: [], total: 0 })
      });

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isCleaning).toBe(false);
    });
  });
});

describe('usePendingConfirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should call useAgentConfirmations with pending status filter', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ confirmations: [], total: 0 })
    });

    const { result } = renderHook(() => usePendingConfirmations(), {
      wrapper: createWrapper()
    });

    // Should be called with status: 'pending' and limit: 50
    expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations?status=pending&limit=50');
  });
});

describe('useActionConfirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should call useAgentConfirmations with actionId filter', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActionConfirmationResponse
    });

    const { result } = renderHook(() => useActionConfirmations('action-123'), {
      wrapper: createWrapper()
    });

    // Should be called with actionId: 'action-123'
    expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations?actionId=action-123');
  });
});

describe('useConfirmationStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should calculate stats from confirmations data', async () => {
    const mockConfirmationsWithStats = {
      confirmations: [
        {
          id: 'action-1',
          functionName: 'createProduct',
          functionParameters: { name: 'Test Product' },
          createdAt: '2024-01-01T10:00:00Z',
          entityType: 'product',
          operationType: 'create',
          userResponse: 'confirmed'
        },
        {
          id: 'action-2',
          functionName: 'deleteFeature',
          functionParameters: { id: 'feature-123' },
          createdAt: '2024-01-01T09:00:00Z',
          entityType: 'feature',
          operationType: 'delete',
          userResponse: 'rejected'
        },
        {
          id: 'action-3',
          functionName: 'updateProduct',
          functionParameters: { id: 'product-456' },
          createdAt: '2024-01-01T08:00:00Z',
          entityType: 'product',
          operationType: 'update'
          // No userResponse - pending
        }
      ],
      total: 3
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfirmationsWithStats
    });

    const { result } = renderHook(() => useConfirmationStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      total: 3,
      pending: 1,
      confirmed: 1,
      rejected: 1,
      cancelled: 0
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/agent-confirmations?limit=100');
  });

  it('should return default stats when no data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ confirmations: [], total: 0 })
    });

    const { result } = renderHook(() => useConfirmationStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0
    });
  });

  it('should handle stats calculation errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useConfirmationStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.stats).toEqual({
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0
    });
  });
});
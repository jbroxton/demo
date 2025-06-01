import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenantSettings } from '@/hooks/use-tenant-settings';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth hook
jest.mock('@/hooks/use-auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        cacheTime: 0, // Disable caching for testing
        staleTime: 0, // Always refetch in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock response helpers
const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
});

describe('useTenantSettings Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock - authenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', tenantId: '456' },
    } as any);
  });

  describe('Settings Query', () => {
    it('should fetch tenant settings when authenticated', async () => {
      const mockSettings = {
        settings: {
          speqq_instructions: '# Test Company',
          theme: 'dark',
        },
        exists: true,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockSettings) as any
      );

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Initial state
      expect(result.current.isLoadingSettings).toBe(true);
      expect(result.current.settings).toBeUndefined();

      // Wait for query to resolve
      await waitFor(() => {
        expect(result.current.isLoadingSettings).toBe(false);
      });

      expect(result.current.settings).toEqual(mockSettings.settings);
      expect(result.current.settingsExists).toBe(true);
      expect(result.current.lastUpdated).toBe(mockSettings.updated_at);
      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should not fetch when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Should not trigger fetch
      expect(result.current.isLoadingSettings).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle settings fetch error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Unauthorized'))
        .mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingSettings).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.settingsError).toBeDefined();
      expect(result.current.settings).toBeUndefined();
    });
  });

  describe('Speqq Instructions Query', () => {
    it('should fetch Speqq instructions separately', async () => {
      const mockSpeqq = {
        speqq_instructions: '# Test Speqq Instructions',
      };

      // Mock both API calls
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any) // settings call
        .mockResolvedValueOnce(createMockResponse(mockSpeqq) as any); // speqq call

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoadingSpeqq).toBe(false);
      });

      expect(result.current.speqqInstructions).toBe(mockSpeqq.speqq_instructions);
      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings?speqq_only=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Update Settings Mutation', () => {
    it('should update full settings', async () => {
      const mockUpdateResponse = {
        success: true,
        settings: {
          speqq_instructions: '# Updated Company',
          theme: 'light',
        },
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock initial fetch and update call
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any)
        .mockResolvedValueOnce(createMockResponse(mockUpdateResponse) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform update
      await act(async () => {
        await result.current.updateSettings({
          settings: {
            speqq_instructions: '# Updated Company',
            theme: 'light',
          },
        });
      });

      // Check that the update call was made (ignoring the position due to React Query's internal calls)
      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            speqq_instructions: '# Updated Company',
            theme: 'light',
          },
        }),
      });

      // Check cache was updated
      expect(result.current.settings).toEqual(mockUpdateResponse.settings);
    });

    it('should update only Speqq instructions', async () => {
      const mockUpdateResponse = {
        success: true,
        settings: {
          speqq_instructions: '# Updated Speqq Only',
          theme: 'dark', // preserved
        },
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any)
        .mockResolvedValueOnce(createMockResponse(mockUpdateResponse) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update only Speqq instructions
      await act(async () => {
        await result.current.updateSpeqq('# Updated Speqq Only');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speqq_instructions: '# Updated Speqq Only',
        }),
      });

      expect(result.current.speqqInstructions).toBe('# Updated Speqq Only');
    });

    it('should handle update errors', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any)
        .mockResolvedValueOnce(createMockResponse({ error: 'Update failed' }, false, 400) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt update that will fail
      await act(async () => {
        try {
          await result.current.updateSettings({ settings: { test: 'fail' } });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.updateError).toBeDefined();
    });
  });

  describe('Optimistic Updates', () => {
    it('should perform optimistic update for Speqq instructions', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: 'Original' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(result.current.speqqInstructions).toBe('Original');
      });

      // Perform optimistic update
      act(() => {
        result.current.updateSpeqqOptimistic('Optimistic Update');
      });

      // Should immediately reflect the change
      await waitFor(() => {
        expect(result.current.speqqInstructions).toBe('Optimistic Update');
      });
    });
  });

  describe('Auto-save Functionality', () => {
    it('should perform auto-save without cache invalidation', async () => {
      const mockAutoSaveResponse = {
        success: true,
        settings: {
          speqq_instructions: '# Auto-saved',
        },
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any)
        .mockResolvedValueOnce(createMockResponse(mockAutoSaveResponse) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform auto-save
      await act(async () => {
        await result.current.autoSave({
          speqq_instructions: '# Auto-saved',
        });
      });

      expect(result.current.isAutoSaving).toBe(false);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/tenant-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speqq_instructions: '# Auto-saved',
        }),
      });
    });
  });

  describe('Helper Functions', () => {
    it('should provide effective settings with defaults', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const effectiveSettings = result.current.getEffectiveSettings();
      expect(effectiveSettings.speqq_instructions).toContain('# Speqq Configuration');
    });

    it('should provide effective Speqq instructions', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: 'Custom Instructions' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const effectiveSpeqq = result.current.getEffectiveSpeqqInstructions();
      expect(effectiveSpeqq).toBe('Custom Instructions');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache invalidation functions', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // These should be callable without errors
      expect(typeof result.current.invalidateSettings).toBe('function');
      expect(typeof result.current.invalidateSpeqq).toBe('function');
      expect(typeof result.current.invalidateAll).toBe('function');
      expect(typeof result.current.refetchAll).toBe('function');
    });
  });

  describe('Loading and Error States', () => {
    it('should properly track loading states', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isLoadingSettings).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise!(createMockResponse({ settings: {}, exists: false }));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should track mutation loading states', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially not updating
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isUpdatingSettings).toBe(false);
      expect(result.current.isAutoSaving).toBe(false);
    });
  });
});
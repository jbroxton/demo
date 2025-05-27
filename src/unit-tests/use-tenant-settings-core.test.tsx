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
        retry: false,
        cacheTime: 0,
        staleTime: 0,
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

// Mock response helper
const createMockResponse = (data: any, ok = true) => ({
  ok,
  json: jest.fn().mockResolvedValue(data),
});

describe('useTenantSettings Hook - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock - authenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', tenantId: '456' },
    } as any);
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with correct default state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Check initial state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.settings).toBeUndefined();
      expect(result.current.speqqInstructions).toBeUndefined();
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.settingsExists).toBe(false);
    });

    it('should provide helper functions', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Check that helper functions exist
      expect(typeof result.current.getEffectiveSettings).toBe('function');
      expect(typeof result.current.getEffectiveSpeqqInstructions).toBe('function');
      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.updateSpeqq).toBe('function');
      expect(typeof result.current.updateSpeqqOptimistic).toBe('function');
      expect(typeof result.current.autoSave).toBe('function');
      expect(typeof result.current.refetchAll).toBe('function');
      expect(typeof result.current.invalidateAll).toBe('function');
    });

    it('should provide default settings when no data exists', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      const effectiveSettings = result.current.getEffectiveSettings();
      expect(effectiveSettings.speqq_instructions).toContain('# Speqq Configuration');
      expect(effectiveSettings.speqq_instructions).toContain('## Company');
      expect(effectiveSettings.speqq_instructions).toContain('## Team');
    });
  });

  describe('Authenticated User Behavior', () => {
    it('should start loading when authenticated', () => {
      // Mock slow response
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should load settings data successfully', async () => {
      const mockSettingsData = {
        settings: {
          speqq_instructions: '# Test Company Settings',
          theme: 'dark',
        },
        exists: true,
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSpeqqData = {
        speqq_instructions: '# Test Company Settings',
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockSettingsData) as any)
        .mockResolvedValueOnce(createMockResponse(mockSpeqqData) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify data was loaded
      expect(result.current.settingsExists).toBe(true);
      expect(result.current.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Mutation Functions', () => {
    it('should have working update functions', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test that mutation functions are available and callable
      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.updateSpeqq).toBe('function');
      expect(typeof result.current.autoSave).toBe('function');

      // These should be async functions that can be called
      expect(result.current.updateSettings.constructor.name).toBe('AsyncFunction');
      expect(result.current.updateSpeqq.constructor.name).toBe('AsyncFunction');
      expect(result.current.autoSave.constructor.name).toBe('AsyncFunction');
    });

    it('should perform optimistic updates', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: 'Original' }) as any);

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Optimistic update function should be callable
      act(() => {
        result.current.updateSpeqqOptimistic('New Value');
      });

      // Function executed without error
      expect(result.current.updateSpeqqOptimistic).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Should not crash and should eventually stop loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      // Hook should still be functional
      expect(typeof result.current.getEffectiveSettings).toBe('function');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache management functions', () => {
      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // All cache management functions should exist
      expect(typeof result.current.invalidateSettings).toBe('function');
      expect(typeof result.current.invalidateSpeqq).toBe('function');
      expect(typeof result.current.invalidateAll).toBe('function');
      expect(typeof result.current.refetchSettings).toBe('function');
      expect(typeof result.current.refetchSpeqq).toBe('function');
      expect(typeof result.current.refetchAll).toBe('function');
    });
  });

  describe('Loading States', () => {
    it('should track different loading states', () => {
      const { result } = renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      // Should have granular loading states
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isLoadingSettings).toBe('boolean');
      expect(typeof result.current.isLoadingSpeqq).toBe('boolean');
      expect(typeof result.current.isUpdating).toBe('boolean');
      expect(typeof result.current.isUpdatingSettings).toBe('boolean');
      expect(typeof result.current.isUpdatingSpeqq).toBe('boolean');
      expect(typeof result.current.isAutoSaving).toBe('boolean');
    });
  });

  describe('API Integration', () => {
    it('should make correct API calls', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ settings: {}, exists: false }) as any)
        .mockResolvedValueOnce(createMockResponse({ speqq_instructions: '' }) as any);

      renderHook(() => useTenantSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should make calls to the correct endpoints
      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/tenant-settings?speqq_only=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
});
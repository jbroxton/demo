import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

// Types for the hook
export interface TenantSettingsResponse {
  settings: Record<string, any>;
  exists: boolean;
  updated_at?: string;
}

export interface SpeqqInstructionsResponse {
  speqq_instructions: string;
}

export interface UpdateSettingsRequest {
  settings?: Record<string, any>;
  speqq_instructions?: string;
}

export interface UpdateSettingsResponse {
  success: boolean;
  settings: Record<string, any>;
  updated_at: string;
}

// API functions
async function fetchTenantSettings(): Promise<TenantSettingsResponse> {
  const response = await fetch('/api/tenant-settings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tenant settings');
  }

  return response.json();
}

async function fetchSpeqqInstructions(): Promise<SpeqqInstructionsResponse> {
  const response = await fetch('/api/tenant-settings?speqq_only=true', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Speqq instructions');
  }

  return response.json();
}

async function updateTenantSettings(data: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
  const response = await fetch('/api/tenant-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tenant settings');
  }

  return response.json();
}

// React Query keys
const TENANT_SETTINGS_KEYS = {
  all: ['tenant-settings'] as const,
  settings: () => [...TENANT_SETTINGS_KEYS.all, 'settings'] as const,
  speqq: () => [...TENANT_SETTINGS_KEYS.all, 'speqq'] as const,
};

/**
 * Hook for managing tenant settings with React Query
 */
export function useTenantSettings() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Main settings query
  const settingsQuery = useQuery({
    queryKey: TENANT_SETTINGS_KEYS.settings(),
    queryFn: fetchTenantSettings,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Speqq instructions query
  const speqqQuery = useQuery({
    queryKey: TENANT_SETTINGS_KEYS.speqq(),
    queryFn: fetchSpeqqInstructions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Update full settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (data) => {
      // Update the settings cache
      queryClient.setQueryData(TENANT_SETTINGS_KEYS.settings(), {
        settings: data.settings,
        exists: true,
        updated_at: data.updated_at,
      });

      // If speqq_instructions was updated, update that cache too
      if (data.settings.speqq_instructions) {
        queryClient.setQueryData(TENANT_SETTINGS_KEYS.speqq(), {
          speqq_instructions: data.settings.speqq_instructions,
        });
      }

      // Invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to update tenant settings:', error);
    },
  });

  // Update only Speqq instructions mutation
  const updateSpeqqMutation = useMutation({
    mutationFn: (speqq_instructions: string) => 
      updateTenantSettings({ speqq_instructions }),
    onSuccess: (data) => {
      // Update both caches
      queryClient.setQueryData(TENANT_SETTINGS_KEYS.speqq(), {
        speqq_instructions: data.settings.speqq_instructions,
      });
      
      queryClient.setQueryData(TENANT_SETTINGS_KEYS.settings(), {
        settings: data.settings,
        exists: true,
        updated_at: data.updated_at,
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to update Speqq instructions:', error);
    },
  });

  // Optimistic update for Speqq instructions (for real-time editing)
  const updateSpeqqOptimistic = (newInstructions: string) => {
    queryClient.setQueryData(TENANT_SETTINGS_KEYS.speqq(), {
      speqq_instructions: newInstructions,
    });
  };

  // Auto-save mutation with debouncing support
  const autoSaveMutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (data) => {
      // Silently update cache without invalidation (to avoid refetch during typing)
      queryClient.setQueryData(TENANT_SETTINGS_KEYS.settings(), {
        settings: data.settings,
        exists: true,
        updated_at: data.updated_at,
      });

      if (data.settings.speqq_instructions) {
        queryClient.setQueryData(TENANT_SETTINGS_KEYS.speqq(), {
          speqq_instructions: data.settings.speqq_instructions,
        });
      }
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
  });

  // Helper function to get default template if no settings exist
  const getEffectiveSettings = () => {
    if (settingsQuery.data?.exists) {
      return settingsQuery.data.settings;
    }
    // Return empty settings - the actual default template will be loaded from file
    return {
      speqq_instructions: null,
    };
  };

  // Helper function to get effective Speqq instructions
  const getEffectiveSpeqqInstructions = () => {
    // The speqq query will return either user's custom instructions or default template from file
    return speqqQuery.data?.speqq_instructions || '';
  };

  return {
    // Query data
    settings: settingsQuery.data?.settings,
    settingsExists: settingsQuery.data?.exists ?? false,
    speqqInstructions: speqqQuery.data?.speqq_instructions,
    lastUpdated: settingsQuery.data?.updated_at,

    // Loading states
    isLoadingSettings: settingsQuery.isLoading,
    isLoadingSpeqq: speqqQuery.isLoading,
    isLoading: settingsQuery.isLoading || speqqQuery.isLoading,

    // Error states
    settingsError: settingsQuery.error,
    speqqError: speqqQuery.error,
    error: settingsQuery.error || speqqQuery.error,

    // Mutation states
    isUpdatingSettings: updateSettingsMutation.isPending,
    isUpdatingSpeqq: updateSpeqqMutation.isPending,
    isAutoSaving: autoSaveMutation.isPending,
    isUpdating: updateSettingsMutation.isPending || updateSpeqqMutation.isPending,

    // Mutation errors
    updateError: updateSettingsMutation.error || updateSpeqqMutation.error,

    // Helper functions
    getEffectiveSettings,
    getEffectiveSpeqqInstructions,

    // Actions
    updateSettings: updateSettingsMutation.mutateAsync,
    updateSpeqq: updateSpeqqMutation.mutateAsync,
    updateSpeqqOptimistic,
    autoSave: autoSaveMutation.mutateAsync,

    // Cache management
    refetchSettings: settingsQuery.refetch,
    refetchSpeqq: speqqQuery.refetch,
    refetchAll: () => {
      settingsQuery.refetch();
      speqqQuery.refetch();
    },

    // Query invalidation
    invalidateSettings: () => queryClient.invalidateQueries({ 
      queryKey: TENANT_SETTINGS_KEYS.settings() 
    }),
    invalidateSpeqq: () => queryClient.invalidateQueries({ 
      queryKey: TENANT_SETTINGS_KEYS.speqq() 
    }),
    invalidateAll: () => queryClient.invalidateQueries({ 
      queryKey: TENANT_SETTINGS_KEYS.all 
    }),
  };
}
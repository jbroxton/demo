'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Roadmap, Feature } from '@/types/models'
import { api } from '@/utils/api-client'

// Query key for roadmaps
const ROADMAPS_QUERY_KEY = 'roadmaps'
const ROADMAP_FEATURES_KEY = 'roadmap-features'

/**
 * Hook for working with roadmaps and roadmap features using React Query
 */
export function useRoadmapsQuery() {
  const queryClient = useQueryClient()

  // Get all roadmaps
  const {
    data: roadmaps = [],
    isLoading,
    error,
    refetch
  } = useQuery<Roadmap[]>({
    queryKey: [ROADMAPS_QUERY_KEY],
    queryFn: async () => {
      try {
        return await api.get('/api/roadmaps-db')
      } catch (error) {
        console.error('Error fetching roadmaps:', error)
        // Provide a more user-friendly error message
        if (error instanceof Error) {
          throw new Error(`Failed to load roadmaps: ${error.message}`)
        } else {
          throw new Error('Failed to load roadmaps. Please try again later.')
        }
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  })

  // Get roadmap by ID
  const getRoadmapById = (roadmapId: string) => {
    if (!roadmaps || !Array.isArray(roadmaps)) {
      return undefined
    }
    return roadmaps.find(roadmap => roadmap.id === roadmapId)
  }

  // Direct fetch function for roadmap features
  const fetchRoadmapFeatures = async (roadmapId: string, status?: string): Promise<Feature[]> => {
    try {
      const params: Record<string, string> = {
        roadmapId,
        includeFeatures: 'true'
      }
      if (status) {
        params.status = status
      }

      console.log('Fetching roadmap features with params:', params);

      const data = await api.get('/api/roadmaps-db', params);
      // Validate that data is an array
      if (!Array.isArray(data)) {
        console.error('Invalid roadmap features data format:', data);
        return [];
      }
      
      console.log(`Received ${data.length} features for roadmap ${roadmapId}`);
      return data;
    } catch (error) {
      console.error('Error fetching roadmap features:', error);
      // Return empty array instead of throwing to prevent UI errors
      // But log the detailed error for debugging
      if (error instanceof Error) {
        console.error(`  Error details: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        try {
          console.error(`  Error details: ${JSON.stringify(error, null, 2)}`);
        } catch (jsonError) {
          console.error(`  Error details: Unable to stringify error object`);
        }
      }
      return [];
    }
  }

  // React Query hook for roadmap features - use this at component level
  const getRoadmapFeaturesQuery = (roadmapId: string, status?: string) => {
    const query = useQuery<Feature[]>({
      queryKey: [ROADMAP_FEATURES_KEY, roadmapId, status],
      queryFn: () => fetchRoadmapFeatures(roadmapId, status),
      retry: 2, // Retry failed requests up to 2 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
      // Return empty array instead of undefined on error to prevent UI errors
      initialData: [],
      // Set timeout to avoid long hanging requests
      gcTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 30 * 1000, // 30 seconds
      // Handle errors more gracefully
      onError: (error) => {
        console.error('Error in roadmap features query:', error);
        // You could trigger a toast notification here if needed
      }
    });

    // Additional error logging for debugging
    if (query.error) {
      console.error('Error in roadmap features query:', query.error);
    }

    return query;
  }

  // Add feature to roadmap mutation
  const addFeatureToRoadmapMutation = useMutation({
    mutationFn: async ({ featureId, roadmapId }: { featureId: string; roadmapId: string }) => {
      const response = await fetch('/api/roadmaps-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: featureId,
          action: 'add',
          roadmapId
        }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      return { featureId, roadmapId }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [ROADMAP_FEATURES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })

  // Remove feature from roadmap mutation
  const removeFeatureFromRoadmapMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const response = await fetch('/api/roadmaps-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: featureId,
          action: 'remove'
        }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      return featureId
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [ROADMAP_FEATURES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })

  // Create roadmap mutation
  const addRoadmapMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; is_default?: boolean }): Promise<Roadmap> => {
      try {
        // Ensure we're sending the right data format
        const apiData = {
          name: data.name,
          description: data.description || '',
          is_default: typeof data.is_default === 'boolean' ? data.is_default : false
        };

        console.log('Sending API data:', JSON.stringify(apiData));

        const response = await fetch('/api/roadmaps-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error response:', errorData);
          throw new Error(`API responded with status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error in addRoadmapMutation:', error);
        throw error;
      }
    },
    onSuccess: (newRoadmap) => {
      // Update cache with the new roadmap
      queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
        return [...oldData, newRoadmap];
      });
    },
  });

  // Define a type for updating roadmaps
  type RoadmapUpdateParams = {
    id: string;
    name?: string;
    description?: string;
    is_default?: boolean;
  };

  // A type that ensures is_default is a number
  type RoadmapUpdateResult = {
    id: string;
    name?: string;
    description?: string;
    is_default?: number; // This ensures is_default is always a number
  };

  // Update roadmap mutation
  const updateRoadmapMutation = useMutation<
    RoadmapUpdateResult, // Return type
    Error,              // Error type
    RoadmapUpdateParams // Params type
  >({
    mutationFn: async ({ id, ...updateData }) => {
      // Convert boolean is_default to number (0 or 1) for API if present
      const apiData = {
        ...updateData,
        // Only include is_default if it's defined in the update data
        ...(updateData.is_default !== undefined ? { is_default: updateData.is_default ? 1 : 0 } : {})
      };

      const response = await fetch('/api/roadmaps-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...apiData }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      // Create a properly typed result object
      const result: RoadmapUpdateResult = { id };

      // Copy properties, ensuring is_default is a number
      if (updateData.name !== undefined) {
        result.name = updateData.name;
      }

      if (updateData.description !== undefined) {
        result.description = updateData.description;
      }

      if (updateData.is_default !== undefined) {
        result.is_default = updateData.is_default ? 1 : 0;
      }

      return result;
    },
    onSuccess: (data) => {
      // Update cache with the updated roadmap
      queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
        return oldData.map(roadmap =>
          roadmap.id === data.id
            ? { ...roadmap, ...data }
            : roadmap
        );
      });
    },
  });

  // Delete roadmap mutation
  const deleteRoadmapMutation = useMutation({
    mutationFn: async (roadmapId: string) => {
      const response = await fetch(`/api/roadmaps-db?id=${roadmapId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return roadmapId;
    },
    onSuccess: (roadmapId) => {
      // Remove the deleted roadmap from cache
      queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
        return oldData.filter(roadmap => roadmap.id !== roadmapId);
      });
    },
  });

  return {
    // State
    roadmaps,
    isLoading,
    error,

    // Roadmap retrieval methods
    getRoadmapById,
    getRoadmapFeaturesQuery,
    fetchRoadmapFeatures,

    // Mutations
    addFeatureToRoadmapMutation,
    removeFeatureFromRoadmapMutation,
    addRoadmapMutation,
    updateRoadmapMutation,
    deleteRoadmapMutation,

    // Convenient mutation methods
    addFeatureToRoadmap: (featureId: string, roadmapId: string) =>
      addFeatureToRoadmapMutation.mutateAsync({ featureId, roadmapId }),
    removeFeatureFromRoadmap: (featureId: string) =>
      removeFeatureFromRoadmapMutation.mutateAsync(featureId),
    addRoadmap: async (data: { name: string; description?: string; is_default?: boolean }): Promise<Roadmap> => {
      try {
        const result = await addRoadmapMutation.mutateAsync(data);
        return result;
      } catch (error) {
        console.error('Error in addRoadmap convenience method:', error);
        throw error;
      }
    },
    updateRoadmap: (id: string, data: { name?: string; description?: string; is_default?: boolean }) =>
      updateRoadmapMutation.mutateAsync({ id, ...data }),
    deleteRoadmap: (id: string) =>
      deleteRoadmapMutation.mutateAsync(id),

    // Operation states
    isAdding: addFeatureToRoadmapMutation.isPending,
    isRemoving: removeFeatureFromRoadmapMutation.isPending,

    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] }),

    // Direct refetch function from useQuery
    roadmapsRefetch: refetch
  }
}
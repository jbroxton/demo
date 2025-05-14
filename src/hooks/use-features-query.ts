'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Feature } from '@/types/models'

// Query key for features
const FEATURES_QUERY_KEY = 'features'

/**
 * Hook for working with features using React Query
 */
export function useFeaturesQuery() {
  const queryClient = useQueryClient()

  // Get all features
  const { data: features = [], isLoading, error } = useQuery<Feature[]>({
    queryKey: [FEATURES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/features-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      return response.json()
    },
  })

  // Get features by interface ID
  const getFeaturesByInterfaceId = (interfaceId: string) => {
    return features.filter(feature => feature.interfaceId === interfaceId)
  }

  // Get feature by ID
  const getFeatureById = (featureId: string) => {
    return features.find(feature => feature.id === featureId)
  }

  // Create feature mutation
  const addFeatureMutation = useMutation({
    mutationFn: async (feature: Omit<Feature, 'id' | 'releases'>): Promise<Feature> => {
      const response = await fetch('/api/features-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feature),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (newFeature) => {
      // Update cache with the new feature
      queryClient.setQueryData<Feature[]>([FEATURES_QUERY_KEY], (oldData = []) => {
        return [...oldData, newFeature]
      })
      
      // Invalidate interfaces query to update related data
      queryClient.invalidateQueries({ queryKey: ['interfaces'] })
    },
  })

  // Update feature name mutation
  const updateFeatureNameMutation = useMutation({
    mutationFn: async ({ featureId, name }: { featureId: string, name: string }) => {
      if (!name.trim()) return null
      
      const response = await fetch('/api/features-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: featureId, name }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { featureId, name }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated feature name
      queryClient.setQueryData<Feature[]>([FEATURES_QUERY_KEY], (oldData = []) => {
        return oldData.map(feature => 
          feature.id === data.featureId 
            ? { ...feature, name: data.name } 
            : feature
        )
      })
    },
  })

  // Update feature description mutation
  const updateFeatureDescriptionMutation = useMutation({
    mutationFn: async ({ featureId, description }: { featureId: string, description: string }) => {
      if (description === undefined) return null

      // Ensure description is a string
      const descriptionString = typeof description === 'string'
        ? description
        : JSON.stringify(description);

      const response = await fetch('/api/features-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: featureId,
          description: descriptionString
        }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      return { featureId, description }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated feature description
      queryClient.setQueryData<Feature[]>([FEATURES_QUERY_KEY], (oldData = []) => {
        return oldData.map(feature =>
          feature.id === data.featureId
            ? { ...feature, description: data.description }
            : feature
        )
      })
    },
  })

  // Update feature priority mutation
  const updateFeaturePriorityMutation = useMutation({
    mutationFn: async ({ featureId, priority }: { featureId: string, priority: 'High' | 'Med' | 'Low' }) => {
      if (!priority) return null
      
      const response = await fetch('/api/features-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: featureId, priority }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { featureId, priority }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated feature priority
      queryClient.setQueryData<Feature[]>([FEATURES_QUERY_KEY], (oldData = []) => {
        return oldData.map(feature => 
          feature.id === data.featureId 
            ? { ...feature, priority: data.priority } 
            : feature
        )
      })
    },
  })

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const response = await fetch(`/api/features-db?id=${featureId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return featureId
    },
    onSuccess: (featureId) => {
      // Remove the deleted feature from cache
      queryClient.setQueryData<Feature[]>([FEATURES_QUERY_KEY], (oldData = []) => {
        return oldData.filter(feature => feature.id !== featureId)
      })
      
      // Invalidate interfaces query to update related data
      queryClient.invalidateQueries({ queryKey: ['interfaces'] })
    },
  })

  // Add a feature (matches Zustand API)
  const addFeature = async (feature: Omit<Feature, 'id' | 'releases'>) => {
    return addFeatureMutation.mutateAsync(feature)
  }
  
  // Update feature name
  const updateFeatureName = async (featureId: string, name: string) => {
    if (!name.trim()) return
    return updateFeatureNameMutation.mutateAsync({ featureId, name })
  }
  
  // Update feature description
  const updateFeatureDescription = async (featureId: string, description: string) => {
    return updateFeatureDescriptionMutation.mutateAsync({ featureId, description })
  }
  
  // Update feature priority
  const updateFeaturePriority = async (featureId: string, priority: 'High' | 'Med' | 'Low') => {
    return updateFeaturePriorityMutation.mutateAsync({ featureId, priority })
  }
  
  // Delete feature
  const deleteFeature = async (featureId: string) => {
    try {
      await deleteFeatureMutation.mutateAsync(featureId)
      return true
    } catch (error) {
      console.error('Error deleting feature:', error)
      return false
    }
  }
  
  // Update feature with release
  const updateFeatureWithRelease = (featureId: string, releaseId: string) => {
    // This will be implemented properly when we handle the release-feature relationship
    console.log('updateFeatureWithRelease called:', featureId, releaseId)
    
    // For now, just invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: [FEATURES_QUERY_KEY] })
  }

  return {
    // State
    features,
    isLoading,
    error,
    
    // Feature retrieval methods
    getFeaturesByInterfaceId,
    getFeatureById,
    
    // Mutations
    addFeatureMutation,
    updateFeatureNameMutation,
    updateFeatureDescriptionMutation,
    updateFeaturePriorityMutation,
    deleteFeatureMutation,
    
    // Zustand-compatible methods
    addFeature,
    updateFeatureName,
    updateFeatureDescription,
    updateFeaturePriority,
    deleteFeature,
    updateFeatureWithRelease,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [FEATURES_QUERY_KEY] })
  }
}
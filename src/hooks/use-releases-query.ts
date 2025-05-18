'use client'

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { Release } from '@/types/models'

// Query key for releases
const RELEASES_QUERY_KEY = 'releases'

// Define options type for the hook
type UseReleasesQueryOptions = {
  enabled?: boolean;
};

/**
 * Hook for working with releases using React Query
 */
export function useReleasesQuery(options?: UseReleasesQueryOptions) {
  const queryClient = useQueryClient()

  // Get all releases
  const { data: releases = [], isLoading, error } = useQuery<Release[]>({
    queryKey: [RELEASES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/releases-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const result = await response.json()
      // API returns { success: boolean, data: Release[] }
      return result.data || []
    },
    // Apply enabled option from the passed options, default to true if not specified
    enabled: options?.enabled !== undefined ? options.enabled : true
  })

  // Get releases by feature ID
  const getReleasesByFeatureId = (featureId: string) => {
    return releases.filter(release => release.featureId === featureId)
  }

  // Get release by ID
  const getReleaseById = (releaseId: string) => {
    return releases.find(release => release.id === releaseId)
  }

  // Create release mutation
  const addReleaseMutation = useMutation({
    mutationFn: async (release: Omit<Release, 'id' | 'tenantId'>): Promise<Release> => {
      const response = await fetch('/api/releases-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(release),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      // API returns { success: boolean, data: Release }
      return result.data
    },
    onSuccess: (newRelease) => {
      // Update cache with the new release
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return [...oldData, newRelease]
      })
      
      // Invalidate features query to update related data
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })

  // Update release name mutation
  const updateReleaseNameMutation = useMutation({
    mutationFn: async ({ releaseId, name }: { releaseId: string, name: string }) => {
      if (!name.trim()) return null
      
      const response = await fetch('/api/releases-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: releaseId, name }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { releaseId, name }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated release name
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return oldData.map(release => 
          release.id === data.releaseId 
            ? { ...release, name: data.name } 
            : release
        )
      })
    },
  })

  // Update release description mutation
  const updateReleaseDescriptionMutation = useMutation({
    mutationFn: async ({ releaseId, description }: { releaseId: string, description: string }) => {
      if (description === undefined) return null
      
      const response = await fetch('/api/releases-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: releaseId, description }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { releaseId, description }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated release description
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return oldData.map(release => 
          release.id === data.releaseId 
            ? { ...release, description: data.description } 
            : release
        )
      })
    },
  })

  // Update release priority mutation
  const updateReleasePriorityMutation = useMutation({
    mutationFn: async ({ releaseId, priority }: { releaseId: string, priority: 'High' | 'Med' | 'Low' }) => {
      if (!priority) return null
      
      const response = await fetch('/api/releases-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: releaseId, priority }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { releaseId, priority }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated release priority
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return oldData.map(release => 
          release.id === data.releaseId 
            ? { ...release, priority: data.priority } 
            : release
        )
      })
    },
  })

  // Update release date mutation
  const updateReleaseDateMutation = useMutation({
    mutationFn: async ({ releaseId, releaseDate }: { releaseId: string, releaseDate: string }) => {
      if (!releaseDate) return null
      
      const response = await fetch('/api/releases-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: releaseId, releaseDate }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { releaseId, releaseDate }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated release date
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return oldData.map(release => 
          release.id === data.releaseId 
            ? { ...release, releaseDate: data.releaseDate } 
            : release
        )
      })
    },
  })

  // Delete release mutation
  const deleteReleaseMutation = useMutation({
    mutationFn: async (releaseId: string) => {
      const response = await fetch(`/api/releases-db?id=${releaseId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return releaseId
    },
    onSuccess: (releaseId) => {
      // Remove the deleted release from cache
      queryClient.setQueryData<Release[]>([RELEASES_QUERY_KEY], (oldData = []) => {
        return oldData.filter(release => release.id !== releaseId)
      })
      
      // Invalidate features query to update related data
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })

  // Add a release (matches Zustand API)
  const addRelease = async (release: Omit<Release, 'id' | 'tenantId'>) => {
    return addReleaseMutation.mutateAsync(release)
  }
  
  // Update release name
  const updateReleaseName = async (releaseId: string, name: string) => {
    if (!name.trim()) return
    return updateReleaseNameMutation.mutateAsync({ releaseId, name })
  }
  
  // Update release description
  const updateReleaseDescription = async (releaseId: string, description: string) => {
    return updateReleaseDescriptionMutation.mutateAsync({ releaseId, description })
  }
  
  // Update release priority
  const updateReleasePriority = async (releaseId: string, priority: 'High' | 'Med' | 'Low') => {
    return updateReleasePriorityMutation.mutateAsync({ releaseId, priority })
  }
  
  // Update release date
  const updateReleaseDate = async (releaseId: string, releaseDate: string) => {
    return updateReleaseDateMutation.mutateAsync({ releaseId, releaseDate })
  }
  
  // Delete release
  const deleteRelease = async (releaseId: string) => {
    try {
      await deleteReleaseMutation.mutateAsync(releaseId)
      return true
    } catch (error) {
      console.error('Error deleting release:', error)
      return false
    }
  }

  return {
    // State
    releases,
    isLoading,
    error,
    
    // Release retrieval methods
    getReleasesByFeatureId,
    getReleaseById,
    
    // Mutations
    addReleaseMutation,
    updateReleaseNameMutation,
    updateReleaseDescriptionMutation,
    updateReleasePriorityMutation,
    updateReleaseDateMutation,
    deleteReleaseMutation,
    
    // Zustand-compatible methods
    addRelease,
    updateReleaseName,
    updateReleaseDescription,
    updateReleasePriority,
    updateReleaseDate,
    deleteRelease,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [RELEASES_QUERY_KEY] })
  }
}
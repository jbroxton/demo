'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Requirement } from '@/types/models'

// Query key for requirements
const REQUIREMENTS_QUERY_KEY = 'requirements'

/**
 * Hook for working with requirements using React Query
 */
export function useRequirementsQuery() {
  const queryClient = useQueryClient()

  // Get all requirements
  const { data: requirements = [], isLoading, error } = useQuery<Requirement[]>({
    queryKey: [REQUIREMENTS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/requirements-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      return response.json()
    },
  })

  // Get requirements by feature ID
  const getRequirementsByFeatureId = (featureId: string) => {
    return useQuery<Requirement[]>({
      queryKey: [REQUIREMENTS_QUERY_KEY, 'feature', featureId],
      queryFn: async () => {
        const response = await fetch(`/api/requirements-db?featureId=${featureId}`)
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        return response.json()
      },
    })
  }

  // Get requirements by release ID
  const getRequirementsByReleaseId = (releaseId: string) => {
    return useQuery<Requirement[]>({
      queryKey: [REQUIREMENTS_QUERY_KEY, 'release', releaseId],
      queryFn: async () => {
        const response = await fetch(`/api/requirements-db?releaseId=${releaseId}`)
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        return response.json()
      },
    })
  }

  // Create requirement mutation
  const addRequirementMutation = useMutation({
    mutationFn: async (requirement: Omit<Requirement, 'id'>): Promise<Requirement> => {
      const response = await fetch('/api/requirements-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirement),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (newRequirement) => {
      // Update cache with the new requirement
      queryClient.setQueryData<Requirement[]>([REQUIREMENTS_QUERY_KEY], (oldData = []) => {
        return [...oldData, newRequirement]
      })
      
      // Update feature-specific query cache if this requirement is for a feature
      if (newRequirement.featureId) {
        queryClient.setQueryData<Requirement[]>(
          [REQUIREMENTS_QUERY_KEY, 'feature', newRequirement.featureId],
          (oldData = []) => [...oldData, newRequirement]
        )
      }
      
      // Update release-specific query cache if this requirement is for a release
      if (newRequirement.releaseId) {
        queryClient.setQueryData<Requirement[]>(
          [REQUIREMENTS_QUERY_KEY, 'release', newRequirement.releaseId],
          (oldData = []) => [...oldData, newRequirement]
        )
      }
    },
  })

  // Update requirement mutation
  const updateRequirementMutation = useMutation({
    mutationFn: async (data: Partial<Requirement> & { id: string }): Promise<Requirement> => {
      const response = await fetch('/api/requirements-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [REQUIREMENTS_QUERY_KEY] })
      
      // Also invalidate any feature or release specific queries
      if (variables.featureId) {
        queryClient.invalidateQueries({ 
          queryKey: [REQUIREMENTS_QUERY_KEY, 'feature', variables.featureId] 
        })
      }
      
      if (variables.releaseId) {
        queryClient.invalidateQueries({ 
          queryKey: [REQUIREMENTS_QUERY_KEY, 'release', variables.releaseId] 
        })
      }
    },
  })

  // Delete requirement mutation
  const deleteRequirementMutation = useMutation({
    mutationFn: async (data: { id: string, featureId?: string, releaseId?: string }) => {
      const response = await fetch(`/api/requirements-db?id=${data.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return data
    },
    onSuccess: (data) => {
      // Remove the deleted requirement from cache
      queryClient.setQueryData<Requirement[]>([REQUIREMENTS_QUERY_KEY], (oldData = []) => {
        return oldData.filter(requirement => requirement.id !== data.id)
      })
      
      // Also remove from feature-specific query cache if applicable
      if (data.featureId) {
        queryClient.setQueryData<Requirement[]>(
          [REQUIREMENTS_QUERY_KEY, 'feature', data.featureId],
          (oldData = []) => oldData ? oldData.filter(req => req.id !== data.id) : []
        )
      }
      
      // Also remove from release-specific query cache if applicable
      if (data.releaseId) {
        queryClient.setQueryData<Requirement[]>(
          [REQUIREMENTS_QUERY_KEY, 'release', data.releaseId],
          (oldData = []) => oldData ? oldData.filter(req => req.id !== data.id) : []
        )
      }
    },
  })

  // Compatibility methods that match the Zustand API
  const getRequirements = () => requirements
  
  const getRequirementById = (requirementId: string) => {
    return requirements.find(requirement => requirement.id === requirementId)
  }
  
  const addRequirement = async (requirement: Omit<Requirement, 'id'>) => {
    return addRequirementMutation.mutateAsync(requirement)
  }
  
  const updateRequirementName = async (id: string, name: string) => {
    return updateRequirementMutation.mutateAsync({ id, name })
  }
  
  const updateRequirementDescription = async (id: string, description: string) => {
    return updateRequirementMutation.mutateAsync({ id, description })
  }
  
  const updateRequirementOwner = async (id: string, owner: string) => {
    return updateRequirementMutation.mutateAsync({ id, owner })
  }
  
  const updateRequirementPriority = async (id: string, priority: 'High' | 'Med' | 'Low') => {
    return updateRequirementMutation.mutateAsync({ id, priority })
  }
  
  const updateRequirementRelease = async (id: string, releaseId: string | undefined | null) => {
    return updateRequirementMutation.mutateAsync({ id, releaseId: releaseId || undefined })
  }
  
  const updateRequirementCuj = async (id: string, cuj: string) => {
    return updateRequirementMutation.mutateAsync({ id, cuj })
  }
  
  const updateRequirementAcceptanceCriteria = async (id: string, acceptanceCriteria: string) => {
    return updateRequirementMutation.mutateAsync({ id, acceptanceCriteria })
  }
  
  const deleteRequirement = async (id: string, featureId?: string, releaseId?: string) => {
    try {
      await deleteRequirementMutation.mutateAsync({ id, featureId, releaseId })
      return true
    } catch (error) {
      console.error('Error deleting requirement:', error)
      return false
    }
  }

  return {
    // State
    requirements,
    isLoading,
    error,
    
    // Query helpers
    getRequirementsByFeatureId,
    getRequirementsByReleaseId,
    
    // Mutations
    addRequirementMutation,
    updateRequirementMutation,
    deleteRequirementMutation,
    
    // Zustand-compatible methods
    getRequirements,
    getRequirementById,
    addRequirement,
    updateRequirementName,
    updateRequirementDescription,
    updateRequirementOwner,
    updateRequirementPriority,
    updateRequirementRelease,
    updateRequirementCuj,
    updateRequirementAcceptanceCriteria,
    deleteRequirement,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [REQUIREMENTS_QUERY_KEY] })
  }
}
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Interface } from '@/types/models'

// Query key for interfaces
const INTERFACES_QUERY_KEY = 'interfaces'

/**
 * Hook for working with interfaces using React Query
 */
export function useInterfacesQuery() {
  const queryClient = useQueryClient()

  // Get all interfaces
  const { data: interfaces = [], isLoading, error } = useQuery<Interface[]>({
    queryKey: [INTERFACES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/interfaces-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const result = await response.json();
      // API returns { success: boolean, data: Interface[] }
      return result.data || [];
    },
  })

  // Create interface mutation
  const addInterfaceMutation = useMutation({
    mutationFn: async (interface_: Omit<Interface, 'id' | 'features'>): Promise<Interface> => {
      const response = await fetch('/api/interfaces-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interface_),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json();
      // API returns { success: boolean, data: Interface }
      return result.data;
    },
    onSuccess: (newInterface) => {
      // Update cache with the new interface
      queryClient.setQueryData<Interface[]>([INTERFACES_QUERY_KEY], (oldData = []) => {
        return [...oldData, newInterface]
      })
      
      // Invalidate products query to update related data
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Update interface name mutation
  const updateInterfaceNameMutation = useMutation({
    mutationFn: async ({ interfaceId, name }: { interfaceId: string, name: string }) => {
      if (!name.trim()) return null
      
      const response = await fetch('/api/interfaces-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: interfaceId, name }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { interfaceId, name }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated interface name
      queryClient.setQueryData<Interface[]>([INTERFACES_QUERY_KEY], (oldData = []) => {
        return oldData.map(interface_ => 
          interface_.id === data.interfaceId 
            ? { ...interface_, name: data.name } 
            : interface_
        )
      })
    },
  })

  // Update interface description mutation
  const updateInterfaceDescriptionMutation = useMutation({
    mutationFn: async ({ interfaceId, description }: { interfaceId: string, description: string }) => {
      if (!description.trim()) return null
      
      const response = await fetch('/api/interfaces-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: interfaceId, description }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { interfaceId, description }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated interface description
      queryClient.setQueryData<Interface[]>([INTERFACES_QUERY_KEY], (oldData = []) => {
        return oldData.map(interface_ => 
          interface_.id === data.interfaceId 
            ? { ...interface_, description: data.description } 
            : interface_
        )
      })
    },
  })

  // Delete interface mutation
  const deleteInterfaceMutation = useMutation({
    mutationFn: async (interfaceId: string) => {
      const response = await fetch(`/api/interfaces-db?id=${interfaceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return interfaceId
    },
    onSuccess: (interfaceId) => {
      // Remove the deleted interface from cache
      queryClient.setQueryData<Interface[]>([INTERFACES_QUERY_KEY], (oldData = []) => {
        return oldData.filter(interface_ => interface_.id !== interfaceId)
      })
      
      // Invalidate products query to update related data
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Compatibility methods that match the Zustand API
  const getInterfaces = () => interfaces;
  
  const getInterfacesByProductId = (productId: string) => {
    return interfaces.filter(interface_ => interface_.productId === productId)
  }
  
  const getInterfaceById = (interfaceId: string) => {
    return interfaces.find(interface_ => interface_.id === interfaceId)
  }
  
  const addInterface = async (interface_: Omit<Interface, 'id' | 'features'>) => {
    return addInterfaceMutation.mutateAsync(interface_)
  }
  
  const updateInterfaceName = async (interfaceId: string, name: string) => {
    if (!name.trim()) return
    return updateInterfaceNameMutation.mutateAsync({ interfaceId, name })
  }
  
  const updateInterfaceDescription = async (interfaceId: string, description: string) => {
    if (!description.trim()) return
    return updateInterfaceDescriptionMutation.mutateAsync({ interfaceId, description })
  }
  
  const deleteInterface = async (interfaceId: string) => {
    try {
      await deleteInterfaceMutation.mutateAsync(interfaceId)
      return true
    } catch (error) {
      console.error('Error deleting interface:', error)
      return false
    }
  }
  
  // Method for updating interface with feature (temporary)
  const updateInterfaceWithFeature = (interfaceId: string, featureId: string) => {
    // This will be implemented properly when we refactor features
    console.log('updateInterfaceWithFeature called:', interfaceId, featureId)
    
    // For now, we'll just invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: [INTERFACES_QUERY_KEY] })
  }

  return {
    // State
    interfaces,
    isLoading,
    error,
    
    // Mutations
    addInterfaceMutation,
    updateInterfaceNameMutation,
    updateInterfaceDescriptionMutation,
    deleteInterfaceMutation,
    
    // Zustand-compatible methods
    getInterfaces,
    getInterfacesByProductId,
    getInterfaceById,
    addInterface,
    updateInterfaceName,
    updateInterfaceDescription,
    deleteInterface,
    updateInterfaceWithFeature,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [INTERFACES_QUERY_KEY] })
  }
}
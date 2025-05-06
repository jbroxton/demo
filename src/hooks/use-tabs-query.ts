'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tab } from '@/types/models'

// Query key for tabs
const TABS_QUERY_KEY = 'tabs'

/**
 * Hook for working with tabs using React Query
 */
export function useTabsQuery() {
  const queryClient = useQueryClient()

  // Get all tabs and active tab id
  const { data, isLoading, error } = useQuery<{ tabs: Tab[], activeTabId: string | null }>({
    queryKey: [TABS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/tabs-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      return response.json()
    },
  })

  const tabs = data?.tabs || []
  const activeTabId = data?.activeTabId || null

  // Create and open tab mutation
  const openTabMutation = useMutation({
    mutationFn: async (tab: Omit<Tab, 'id'>): Promise<{ tab: Tab, isExisting: boolean }> => {
      const response = await fetch('/api/tabs-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tab),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Close tab mutation
  const closeTabMutation = useMutation({
    mutationFn: async (tabId: string): Promise<{ newActiveTabId: string | null }> => {
      const response = await fetch(`/api/tabs-db?id=${tabId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Activate tab mutation
  const activateTabMutation = useMutation({
    mutationFn: async (tabId: string) => {
      const response = await fetch('/api/tabs-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'activate',
          tabId
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { tabId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Update tab title mutation (for all tabs with the same itemId and type)
  const updateTabTitleMutation = useMutation({
    mutationFn: async ({ itemId, type, title }: { itemId: string, type: Tab['type'], title: string }) => {
      const response = await fetch('/api/tabs-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateTitle',
          itemId,
          type,
          title
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { itemId, type, title }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Update specific tab mutation
  const updateTabMutation = useMutation({
    mutationFn: async ({ tabId, newTabProps }: { tabId: string, newTabProps: Partial<Tab> }) => {
      const response = await fetch('/api/tabs-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateTab',
          tabId,
          newTabProps
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { tabId, newTabProps }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Update new tab to saved item mutation
  const updateNewTabToSavedItemMutation = useMutation({
    mutationFn: async ({ 
      temporaryTabId, 
      newItemId, 
      newItemName, 
      type 
    }: { 
      temporaryTabId: string, 
      newItemId: string, 
      newItemName: string, 
      type: Tab['type'] 
    }): Promise<{ newTabId: string }> => {
      const response = await fetch('/api/tabs-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateNewTabToSavedItem',
          temporaryTabId,
          newItemId,
          newItemName,
          type
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
    },
  })

  // Compatibility methods that match the Zustand API
  const openTab = async (tab: Omit<Tab, 'id'>) => {
    return openTabMutation.mutateAsync(tab)
  }
  
  const closeTab = async (tabId: string) => {
    return closeTabMutation.mutateAsync(tabId)
  }
  
  const activateTab = async (tabId: string) => {
    return activateTabMutation.mutateAsync(tabId)
  }
  
  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId)
  }
  
  const updateTabTitle = async (itemId: string, type: Tab['type'], newTitle: string) => {
    return updateTabTitleMutation.mutateAsync({ itemId, type, title: newTitle })
  }
  
  const updateTab = async (tabId: string, newTabProps: Partial<Tab>) => {
    return updateTabMutation.mutateAsync({ tabId, newTabProps })
  }
  
  const updateNewTabToSavedItem = async (temporaryTabId: string, newItemId: string, newItemName: string, type: Tab['type']) => {
    return updateNewTabToSavedItemMutation.mutateAsync({ temporaryTabId, newItemId, newItemName, type })
  }

  return {
    // State
    tabs,
    activeTabId,
    isLoading,
    error,
    
    // Mutations
    openTabMutation,
    closeTabMutation,
    activateTabMutation,
    updateTabTitleMutation,
    updateTabMutation,
    updateNewTabToSavedItemMutation,
    
    // Zustand-compatible methods
    openTab,
    closeTab,
    activateTab,
    getActiveTab,
    updateTabTitle,
    updateTab,
    updateNewTabToSavedItem,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
  }
}
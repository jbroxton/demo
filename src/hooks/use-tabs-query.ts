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
      try {
        console.log('Fetching tabs...');
        const response = await fetch('/api/tabs-db');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          return Promise.reject(new Error(`Failed to fetch tabs: ${response.status} - ${errorText}`));
        }
        const result = await response.json();
        console.log('Tabs fetched raw response:', result);
        console.log('Tabs data:', result.data);
        // The API returns { data: { tabs: [], activeTabId: null } }
        // But we expect { tabs: [], activeTabId: null }
        return result.data || result;
      } catch (error) {
        console.error('Error fetching tabs:', error);
        return Promise.reject(error instanceof Error ? error : new Error('Unknown error fetching tabs'));
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const tabs = data?.tabs || []
  const activeTabId = data?.activeTabId || null
  
  console.log('use-tabs-query - data from query:', data)
  console.log('use-tabs-query - current activeTabId:', activeTabId)
  console.log('use-tabs-query - current tabs:', tabs.map(t => ({ id: t.id, title: t.title, type: t.type })))
  console.log('use-tabs-query - tabs length:', tabs.length)

  // Create and open tab mutation
  const openTabMutation = useMutation({
    mutationFn: async (tab: Omit<Tab, 'id'>): Promise<{ tab: Tab, isExisting: boolean }> => {
      console.log('Opening tab with data:', tab);
      try {
        const response = await fetch('/api/tabs-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tab),
        })
        
        if (!response.ok) {
          const errorDetails = await response.text()
          console.error('Tab creation failed:', response.status, errorDetails)
          throw new Error(`Tab creation failed: ${response.status} - ${errorDetails}`)
        }
        
        const result = await response.json()
        console.log('Tab created successfully:', result)
        // The API returns { data: { tab, isExisting } }
        return result.data || result
      } catch (error) {
        console.error('Error in tab creation:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('Tab mutation success:', data)
      console.log('New tab created with ID:', data.tab?.id)
      console.log('Is existing tab?:', data.isExisting)
      console.log('Invalidating tabs query...')
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
      console.log('Tabs query invalidated, should refetch now')
    },
    onError: (error) => {
      console.error('Tab mutation error:', error)
    }
  })

  // Close tab mutation
  const closeTabMutation = useMutation({
    mutationFn: async (tabId: string): Promise<{ newActiveTabId: string | null }> => {
      const response = await fetch(`/api/tabs-db?id=${tabId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorDetails = await response.text()
        console.error('Tab close failed:', response.status, errorDetails)
        throw new Error(`Tab close failed: ${response.status} - ${errorDetails}`)
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
      console.log('activateTabMutation called with tabId:', tabId, 'type:', typeof tabId)
      
      // Ensure tabId is a string
      const stringTabId = String(tabId);
      console.log('activateTabMutation stringTabId:', stringTabId)
      
      try {
        const response = await fetch('/api/tabs-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'activate',
            tabId: stringTabId
          }),
        });

        console.log('activateTabMutation response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('activateTabMutation error:', errorText);
          return Promise.reject(new Error(`Failed to activate tab: ${response.status} - ${errorText}`));
        }

        const result = await response.json();
        console.log('activateTabMutation result:', result);
        return result;
      } catch (error) {
        console.error('Error activating tab:', error);
        return Promise.reject(error instanceof Error ? error : new Error('Unknown error activating tab'));
      }
    },
    onMutate: async (tabId: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      // Optimistically update the active tab
      if (previousData) {
        queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
          ...previousData,
          activeTabId: tabId
        });
      }
      
      // Return context to use in onError
      return { previousData };
    },
    onError: (err, tabId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousData) {
        queryClient.setQueryData([TABS_QUERY_KEY], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] });
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

      const responseData = await response.json()

      // Even if the API just returns { success: true }, we still need to return the data
      // the mutation expects, which is the input parameters
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
    console.log('openTab called with:', tab);
    return openTabMutation.mutateAsync(tab)
  }
  
  const closeTab = async (tabId: string) => {
    const stringTabId = String(tabId);
    return closeTabMutation.mutateAsync(stringTabId)
  }
  
  const activateTab = async (tabId: string) => {
    console.log('use-tabs-query: activateTab called with tabId:', tabId, 'type:', typeof tabId)
    const stringTabId = String(tabId);
    const result = await activateTabMutation.mutateAsync(stringTabId)
    console.log('use-tabs-query: activateTab result:', result)
    return result
  }
  
  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId)
  }
  
  const updateTabTitle = async (itemId: string, type: Tab['type'], newTitle: string) => {
    return updateTabTitleMutation.mutateAsync({ itemId, type, title: newTitle })
  }
  
  const updateTab = async (tabId: string, newTabProps: Partial<Tab>) => {
    const stringTabId = String(tabId);
    return updateTabMutation.mutateAsync({ tabId: stringTabId, newTabProps })
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
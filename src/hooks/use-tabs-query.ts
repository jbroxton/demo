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
        const response = await fetch('/api/tabs-db');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          return Promise.reject(new Error(`Failed to fetch tabs: ${response.status} - ${errorText}`));
        }
        const result = await response.json();
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
  
  // Removed console logs for performance

  // Create and open tab mutation
  const openTabMutation = useMutation({
    mutationFn: async (tab: Omit<Tab, 'id'>): Promise<{ tab: Tab, isExisting: boolean }> => {
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
        // The API returns { data: { tab, isExisting } }
        return result.data || result
      } catch (error) {
        console.error('Error in tab creation:', error)
        throw error
      }
    },
    onMutate: async (tab) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      return { previousData };
    },
    onSuccess: (data) => {
      // Directly update cache instead of invalidating and refetching
      const currentData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      if (currentData) {
        // If the tab already exists, don't modify the tabs array
        if (!data.isExisting) {
          // Add the new tab to the existing tabs
          queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
            tabs: [...currentData.tabs, data.tab],
            activeTabId: data.tab.id
          });
        } else {
          // Just update the active tab ID if the tab already exists
          queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
            ...currentData,
            activeTabId: data.tab.id
          });
        }
      }
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
    onMutate: async (tabId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      // Optimistically remove the tab
      if (previousData?.tabs) {
        const remainingTabs = previousData.tabs.filter(tab => tab.id !== tabId);
        
        // Determine new active tab ID
        let newActiveTabId = previousData.activeTabId;
        if (previousData.activeTabId === tabId && remainingTabs.length > 0) {
          // Set active tab to the last tab
          newActiveTabId = remainingTabs[remainingTabs.length - 1].id;
        } else if (remainingTabs.length === 0) {
          newActiveTabId = null;
        }
        
        // Update cache
        queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
          tabs: remainingTabs,
          activeTabId: newActiveTabId
        });
      }
      
      return { previousData };
    },
    onError: (err, tabId, context) => {
      // Restore previous data if the mutation fails
      if (context?.previousData) {
        queryClient.setQueryData([TABS_QUERY_KEY], context.previousData);
      }
    },
    onSuccess: () => {
      // No need to invalidate when using optimistic updates
    },
  })

  // Activate tab mutation
  const activateTabMutation = useMutation({
    mutationFn: async (tabId: string) => {
      // Ensure tabId is a string
      const stringTabId = String(tabId);
      
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

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          return Promise.reject(new Error(`Failed to activate tab: ${response.status} - ${errorText}`));
        }

        const result = await response.json();
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
      // Removed refetch which causes flickers and jumps
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
    onMutate: async ({ itemId, type, title }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      // Optimistically update tab titles
      if (previousData?.tabs) {
        const updatedTabs = previousData.tabs.map(tab => {
          // Update all tabs that match the item ID and type
          if (tab.itemId === itemId && tab.type === type) {
            return { ...tab, title };
          }
          return tab;
        });
        
        // Update cache
        queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
          ...previousData,
          tabs: updatedTabs
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Restore previous data if the mutation fails
      if (context?.previousData) {
        queryClient.setQueryData([TABS_QUERY_KEY], context.previousData);
      }
    },
    onSuccess: () => {
      // No need to invalidate when using optimistic updates
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
    onMutate: async ({ tabId, newTabProps }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      // Optimistically update the tab
      if (previousData?.tabs) {
        const updatedTabs = previousData.tabs.map(tab => {
          if (tab.id === tabId) {
            return { ...tab, ...newTabProps };
          }
          return tab;
        });
        
        // Update cache
        queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
          ...previousData,
          tabs: updatedTabs
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Restore previous data if the mutation fails
      if (context?.previousData) {
        queryClient.setQueryData([TABS_QUERY_KEY], context.previousData);
      }
    },
    onSuccess: () => {
      // No need to invalidate when using optimistic updates
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
    onMutate: async ({ temporaryTabId, newItemId, newItemName, type }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [TABS_QUERY_KEY] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY]);
      
      // Optimistically update the tab
      if (previousData?.tabs) {
        const updatedTabs = previousData.tabs.map(tab => {
          if (tab.id === temporaryTabId) {
            return { 
              ...tab, 
              itemId: newItemId,
              title: newItemName
            };
          }
          return tab;
        });
        
        // Update cache
        queryClient.setQueryData<{ tabs: Tab[], activeTabId: string | null }>([TABS_QUERY_KEY], {
          ...previousData,
          tabs: updatedTabs
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Restore previous data if the mutation fails
      if (context?.previousData) {
        queryClient.setQueryData([TABS_QUERY_KEY], context.previousData);
      }
    },
    onSuccess: () => {
      // No need to invalidate when using optimistic updates
    },
  })

  // Compatibility methods that match the Zustand API
  const openTab = async (tab: Omit<Tab, 'id'>) => {
    return openTabMutation.mutateAsync(tab)
  }
  
  const closeTab = async (tabId: string) => {
    const stringTabId = String(tabId);
    return closeTabMutation.mutateAsync(stringTabId)
  }
  
  const activateTab = async (tabId: string) => {
    const stringTabId = String(tabId);
    return activateTabMutation.mutateAsync(stringTabId)
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
    
    // Refetch helper - only use when absolutely necessary as it can cause flickering
    refetch: () => queryClient.invalidateQueries({ queryKey: [TABS_QUERY_KEY] })
  }
}
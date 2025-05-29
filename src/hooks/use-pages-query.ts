'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Page, PageType, AnyPropertyValue } from '@/types/models/Page'
import { Block, BlockType } from '@/types/models/Block'

// Query keys for pages
const PAGES_QUERY_KEY = 'pages'
const PAGE_QUERY_KEY = 'page'
const BLOCKS_QUERY_KEY = 'blocks'

/**
 * Hook for working with pages using React Query
 */
export function usePagesQuery(options?: {
  type?: PageType;
  parentId?: string | null;
  limit?: number;
  offset?: number;
}) {
  const queryClient = useQueryClient()

  // Get all pages with optional filtering
  const { data: pages = [], isLoading, error } = useQuery<Page[]>({
    queryKey: [PAGES_QUERY_KEY, options],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    queryFn: async () => {
      console.log('🔍 REAL APP DEBUG: Pages query starting...')
      
      const searchParams = new URLSearchParams()
      
      if (options?.type) searchParams.set('type', options.type)
      if (options?.parentId !== undefined) {
        searchParams.set('parent_id', options.parentId === null ? 'null' : options.parentId)
      }
      if (options?.limit) searchParams.set('limit', options.limit.toString())
      if (options?.offset) searchParams.set('offset', options.offset.toString())

      // Add cache busting timestamp
      searchParams.set('_t', Date.now().toString());
      
      const url = `/api/pages-db?${searchParams.toString()}`;
      console.log('🔍 REAL APP DEBUG: Fetching from URL:', url)

      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-cache', // Force browser to not use cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('🔍 REAL APP DEBUG: Response status:', response.status)
      
      if (!response.ok) {
        console.error(`Pages API error: ${response.status} ${response.statusText}`)
        const errorData = await response.text()
        console.error('Pages API error response:', errorData)
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🔍 REAL APP DEBUG: API result:', result)
      console.log('🔍 REAL APP DEBUG: Number of pages returned:', result.data?.length || 0)
      
      if (result.data && result.data.length > 0) {
        console.log('🔍 REAL APP DEBUG: First page:', result.data[0])
        console.log('🔍 REAL APP DEBUG: Root pages count:', result.data.filter((p: any) => !p.parent_id).length)
        console.log('🔍 REAL APP DEBUG: Child pages count:', result.data.filter((p: any) => p.parent_id).length)
      }
      
      return result.data || []
    }
  })


  // Get page by ID hook
  const usePageQuery = (pageId: string) => {
    return useQuery<Page>({
      queryKey: [PAGE_QUERY_KEY, pageId],
      queryFn: async () => {
        const response = await fetch(`/api/pages-db?id=${pageId}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const result = await response.json()
        return result.data
      },
      enabled: !!pageId,
    })
  }

  // Helper functions
  const getPagesByType = (type: PageType) => {
    return pages.filter((page: Page) => page.type === type)
  }

  const getPageById = (pageId: string) => {
    return pages.find((page: Page) => page.id === pageId)
  }

  const getChildPages = (parentId: string) => {
    return pages.filter((page: Page) => page.parent_id === parentId)
  }

  const getRootPages = () => {
    return pages.filter((page: Page) => page.parent_id === null)
  }

  // Create page mutation
  const addPageMutation = useMutation({
    mutationFn: async (pageData: {
      type: PageType;
      title: string;
      parent_id?: string;
      properties?: Record<string, AnyPropertyValue>;
      blocks?: Block[];
    }): Promise<Page> => {
      const response = await fetch('/api/pages-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pageData),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (newPage) => {
      // Update all pages caches by finding and updating them
      const queryCache = queryClient.getQueryCache()
      const queries = queryCache.getAll()
      
      // Find all pages queries and update them manually
      queries.forEach(query => {
        if (query.queryKey[0] === PAGES_QUERY_KEY) {
          const currentData = query.state.data as Page[] | undefined
          if (currentData && Array.isArray(currentData)) {
            const updatedData = [...currentData, newPage]
            queryClient.setQueryData(query.queryKey, updatedData)
          }
        }
      })
      
      // Invalidate all pages queries to ensure consistency and trigger refetch for any missed caches
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] })
    },
  })

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, updates }: {
      pageId: string;
      updates: {
        title?: string;
        type?: PageType;
        parent_id?: string | null;
        properties?: Record<string, AnyPropertyValue>;
        blocks?: Block[];
      };
    }): Promise<Page> => {
      const response = await fetch(`/api/pages-db?id=${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (updatedPage) => {
      // Update single page cache first
      queryClient.setQueryData([PAGE_QUERY_KEY, updatedPage.id], updatedPage)
      
      // Update all existing pages caches by finding and updating them
      const queryCache = queryClient.getQueryCache()
      const queries = queryCache.getAll()
      
      // Find all pages queries and update them manually
      queries.forEach(query => {
        if (query.queryKey[0] === PAGES_QUERY_KEY) {
          const currentData = query.state.data as Page[] | undefined
          if (currentData && Array.isArray(currentData)) {
            const updatedData = currentData.map(page => 
              page.id === updatedPage.id ? updatedPage : page
            )
            queryClient.setQueryData(query.queryKey, updatedData)
          }
        }
      })
      
      // Invalidate all pages queries to ensure consistency and trigger refetch for any missed caches
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] })
    },
  })

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/pages-db?id=${pageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return pageId
    },
    onSuccess: (pageId) => {
      // Update all pages caches by finding and updating them
      const queryCache = queryClient.getQueryCache()
      const queries = queryCache.getAll()
      
      // Find all pages queries and update them manually
      queries.forEach(query => {
        if (query.queryKey[0] === PAGES_QUERY_KEY) {
          const currentData = query.state.data as Page[] | undefined
          if (currentData && Array.isArray(currentData)) {
            const updatedData = currentData.filter(page => page.id !== pageId)
            queryClient.setQueryData(query.queryKey, updatedData)
          }
        }
      })
      
      // Remove single page cache
      queryClient.removeQueries({ queryKey: [PAGE_QUERY_KEY, pageId] })
      
      // Invalidate all pages queries
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] })
    },
  })

  // Block operations are handled directly in the page updates since blocks are stored as JSONB in pages table

  // Convenient wrapper functions
  const addPage = async (pageData: {
    type: PageType;
    title: string;
    parent_id?: string;
    properties?: Record<string, AnyPropertyValue>;
    blocks?: Block[];
  }) => {
    return addPageMutation.mutateAsync(pageData)
  }

  const updatePage = async (pageId: string, updates: {
    title?: string;
    type?: PageType;
    parent_id?: string | null;
    properties?: Record<string, AnyPropertyValue>;
    blocks?: Block[];
  }) => {
    return updatePageMutation.mutateAsync({ pageId, updates })
  }

  const deletePage = async (pageId: string) => {
    try {
      await deletePageMutation.mutateAsync(pageId)
      return true
    } catch (error) {
      console.error('Error deleting page:', error)
      return false
    }
  }

  const addBlock = async (pageId: string, block: {
    type: BlockType;
    content: any;
  }, position?: number) => {
    // Get current page to modify blocks array
    const currentPage = pages.find((p: Page) => p.id === pageId)
    if (!currentPage) throw new Error('Page not found')
    
    // Ensure blocks array exists
    if (!currentPage.blocks) {
      currentPage.blocks = []
    }
    
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: block.type,
      content: block.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedBlocks = [...currentPage.blocks]
    if (position !== undefined && position >= 0 && position <= currentPage.blocks.length) {
      updatedBlocks.splice(position, 0, newBlock)
    } else {
      updatedBlocks.push(newBlock)
    }
    
    await updatePage(pageId, { blocks: updatedBlocks })
    return newBlock
  }

  const updateBlock = async (pageId: string, blockId: string, updates: {
    type?: BlockType;
    content?: any;
  }) => {
    // Get current page to modify blocks array
    const currentPage = pages.find((p: Page) => p.id === pageId)
    if (!currentPage) throw new Error('Page not found')
    
    // Ensure blocks array exists
    if (!currentPage.blocks) {
      currentPage.blocks = []
    }
    
    const blockIndex = currentPage.blocks.findIndex((b: Block) => b.id === blockId)
    if (blockIndex === -1) throw new Error('Block not found')
    
    const updatedBlocks = [...currentPage.blocks]
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    await updatePage(pageId, { blocks: updatedBlocks })
    return updatedBlocks[blockIndex]
  }

  const deleteBlock = async (pageId: string, blockId: string) => {
    try {
      // Get current page to modify blocks array
      const currentPage = pages.find((p: Page) => p.id === pageId)
      if (!currentPage) throw new Error('Page not found')
      
      const updatedBlocks = currentPage.blocks.filter((b: Block) => b.id !== blockId)
      if (updatedBlocks.length === currentPage.blocks.length) {
        throw new Error('Block not found')
      }
      
      await updatePage(pageId, { blocks: updatedBlocks })
      return true
    } catch (error) {
      console.error('Error deleting block:', error)
      return false
    }
  }

  return {
    // State
    pages,
    isLoading,
    error,
    
    // Helper hooks
    usePageQuery,
    
    // Helper functions
    getPagesByType,
    getPageById,
    getChildPages,
    getRootPages,
    
    // Page mutations
    addPageMutation,
    updatePageMutation,
    deletePageMutation,
    
    // Convenient wrapper functions
    addPage,
    updatePage,
    deletePage,
    addBlock,
    updateBlock,
    deleteBlock,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] })
  }
}
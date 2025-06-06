'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Import React Query hooks
import { usePagesQuery } from '@/hooks/use-pages-query';


// Default state for the context
const defaultContextValue = {
  pages: {
    pages: [],
    isLoading: true,
    error: null,
    getPages: () => [],
    getPageById: () => null,
    getPagesByType: () => [],
    getRootPages: () => [],
    getChildPages: () => [],
    refetch: () => Promise.resolve(),
  },
};

// Create the context with default values
const UnifiedStateContext = createContext<any>(defaultContextValue);

// Main hook to access the unified state
export const useUnifiedState = () => {
  return useContext(UnifiedStateContext);
};

// Specific hook for pages
export const useUnifiedPages = () => {
  const { pages } = useUnifiedState();
  return pages;
};

// Provider component
export const UnifiedStateProvider = ({ children }: { children: ReactNode }) => {
  // Note: We've fully migrated to DB-backed storage so we always use it
  // We don't need to wrap with TanstackQueryProvider since it's already in AppProviders
  // Since this is now wrapped in dynamic import with ssr: false, we can safely use DB-backed provider
  return (
    <DbBackedStateProvider>
      {children}
    </DbBackedStateProvider>
  );
};

// Component that provides DB-backed state using React Query
const DbBackedStateProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  
  // Load pages data (it's used in sidebar and tabs)
  const pagesQuery = usePagesQuery();
  
  
  // Type-safe approach for the value object
  const value = {
    pages: {
      ...pagesQuery,
      pages: pagesQuery.pages || [],
      getPages: () => pagesQuery.pages || [],
      getPageById: (id: string) => {
        const pages = pagesQuery.pages || [];
        return pages.find(p => p.id === id) || null;
      },
      getPagesByType: (type: string) => {
        const pages = pagesQuery.pages || [];
        return pages.filter(p => p.type === type);
      },
      getRootPages: () => {
        const pages = pagesQuery.pages || [];
        return pages.filter(p => !p.parent_id);
      },
      getChildPages: (parentId: string) => {
        const pages = pagesQuery.pages || [];
        return pages.filter(p => p.parent_id === parentId);
      },
      // Mutation functions
      addPage: pagesQuery.addPage,
      updatePage: pagesQuery.updatePage,
      updatePageTitle: pagesQuery.updatePageTitle,
      deletePage: pagesQuery.deletePage,
      addBlock: pagesQuery.addBlock,
      updateBlock: pagesQuery.updateBlock,
      deleteBlock: pagesQuery.deleteBlock,
    },
  };
  
  return (
    <UnifiedStateContext.Provider value={value}>
      {children}
    </UnifiedStateContext.Provider>
  );
};

// NOTE: Client-side state provider with Zustand has been deprecated and removed
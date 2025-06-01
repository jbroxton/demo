'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Import React Query hooks
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useReleasesQuery } from '@/hooks/use-releases-query';
import { usePagesQuery } from '@/hooks/use-pages-query';

// Import feature flags
import { USE_DB_BACKED_STORAGE } from '@/config/features';

// Default state for the context
const defaultContextValue = {
  products: {
    products: [],
    isLoading: true,
    error: null,
    getProducts: () => [],
    getProductById: () => null,
    refetch: () => Promise.resolve(),
  },
  interfaces: {
    interfaces: [],
    isLoading: true,
    error: null,
    getInterfaces: () => [],
    getInterfaceById: () => null,
    refetch: () => Promise.resolve(),
  },
  features: {
    features: [],
    isLoading: true,
    error: null,
    getFeatures: () => [],
    getFeatureById: () => null,
    refetch: () => Promise.resolve(),
  },
  releases: {
    releases: [],
    isLoading: true,
    error: null,
    getReleases: () => [],
    getReleaseById: () => null,
    refetch: () => Promise.resolve(),
  },
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
  isUsingDbBackedStorage: USE_DB_BACKED_STORAGE,
};

// Create the context with default values
const UnifiedStateContext = createContext<any>(defaultContextValue);

// Main hook to access the unified state
export const useUnifiedState = () => {
  return useContext(UnifiedStateContext);
};

// Specific hooks for individual entity types
export const useUnifiedProducts = () => {
  const { products } = useUnifiedState();
  return products;
};

export const useUnifiedInterfaces = () => {
  const { interfaces } = useUnifiedState();
  return interfaces;
};

export const useUnifiedFeatures = () => {
  const { features } = useUnifiedState();
  return features;
};

export const useUnifiedReleases = () => {
  const { releases } = useUnifiedState();
  return releases;
};

export const useUnifiedPages = () => {
  const { pages } = useUnifiedState();
  return pages;
};

// Provider component
export const UnifiedStateProvider = ({ children }: { children: ReactNode }) => {
  // Track if we're in the browser
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Set isBrowser on mount
  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
  }, []);
  
  // Only render the appropriate provider in the browser
  if (!isBrowser) {
    // Return a simplified version during SSR
    return (
      <UnifiedStateContext.Provider value={defaultContextValue}>
        {children}
      </UnifiedStateContext.Provider>
    );
  }
  
  // Note: We've fully migrated to DB-backed storage so we always use it
  // We don't need to wrap with TanstackQueryProvider since it's already in AppProviders
  return (
    <DbBackedStateProvider>
      {children}
    </DbBackedStateProvider>
  );
};

// Component that provides DB-backed state using React Query
const DbBackedStateProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  
  // Only load release data when we're on dashboard pages
  const isReleaseDataNeeded = pathname?.includes('/dashboard');
  
  // Use React Query hooks
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const featuresQuery = useFeaturesQuery();
  
  // Pass enabled option to useReleasesQuery based on pathname
  const releasesQuery = useReleasesQuery({ 
    enabled: isReleaseDataNeeded 
  });
  
  // Always load pages data (it's used in sidebar and tabs)
  const pagesQuery = usePagesQuery();
  
  
  // Type-safe approach for the value object
  const value = {
    products: {
      ...productsQuery,
      // products is already typed as Product[] and defaults to []
      products: productsQuery.products || [],
      getProducts: () => productsQuery.products || [],
      getProductById: (id: string) => {
        const products = productsQuery.products || [];
        return products.find(p => p.id === id) || null;
      },
    },
    interfaces: {
      ...interfacesQuery,
      interfaces: interfacesQuery.interfaces || [],
      getInterfaces: () => interfacesQuery.interfaces || [],
      getInterfaceById: (id: string) => {
        const interfaces = interfacesQuery.interfaces || [];
        return interfaces.find(i => i.id === id) || null;
      },
    },
    features: {
      ...featuresQuery,
      features: featuresQuery.features || [],
      getFeatures: () => featuresQuery.features || [],
      getFeatureById: (id: string) => {
        const features = featuresQuery.features || [];
        return features.find(f => f.id === id) || null;
      },
    },
    releases: {
      ...releasesQuery,
      releases: releasesQuery.releases || [],
      getReleases: () => releasesQuery.releases || [],
      getReleaseById: (id: string) => {
        const releases = releasesQuery.releases || [];
        return releases.find(r => r.id === id) || null;
      },
    },
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
      // Mutation functions for consistency with other entities
      addPage: pagesQuery.addPage,
      updatePage: pagesQuery.updatePage,
      updatePageTitle: pagesQuery.updatePageTitle,
      deletePage: pagesQuery.deletePage,
      addBlock: pagesQuery.addBlock,
      updateBlock: pagesQuery.updateBlock,
      deleteBlock: pagesQuery.deleteBlock,
    },
    isUsingDbBackedStorage: true,
  };
  
  return (
    <UnifiedStateContext.Provider value={value}>
      {children}
    </UnifiedStateContext.Provider>
  );
};

// NOTE: Client-side state provider with Zustand has been deprecated and removed
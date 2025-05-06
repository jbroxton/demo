'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { TanstackQueryProvider } from '@/providers/query-provider';
import { usePathname } from 'next/navigation';

// Import React Query hooks
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useReleasesQuery } from '@/hooks/use-releases-query';

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
  
  // Create a safe wrapper for empty arrays
  const safeArray = <T extends unknown>(arr: T[] | undefined): T[] => arr || [];
  
  // Simplify to avoid any type issues
  const value = {
    products: {
      ...productsQuery,
      products: safeArray(productsQuery.products),
      getProducts: () => safeArray(productsQuery.products),
      getProductById: (id: string) => safeArray(productsQuery.products).find(p => p.id === id),
    },
    interfaces: {
      ...interfacesQuery,
      interfaces: safeArray(interfacesQuery.interfaces),
      getInterfaces: () => safeArray(interfacesQuery.interfaces),
      getInterfaceById: (id: string) => safeArray(interfacesQuery.interfaces).find(i => i.id === id),
    },
    features: {
      ...featuresQuery,
      features: safeArray(featuresQuery.features),
      getFeatures: () => safeArray(featuresQuery.features),
      getFeatureById: (id: string) => safeArray(featuresQuery.features).find(f => f.id === id),
    },
    releases: {
      ...releasesQuery,
      releases: safeArray(releasesQuery.releases),
      getReleases: () => safeArray(releasesQuery.releases),
      getReleaseById: (id: string) => safeArray(releasesQuery.releases).find(r => r.id === id),
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
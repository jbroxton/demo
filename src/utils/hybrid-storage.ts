import { createJSONStorage } from 'zustand/middleware';
import QuickLRU from 'quick-lru';

// Use quick-lru instead of a simple object for better memory management and performance
const memoryCache = new QuickLRU<string, Record<string, string>>({ maxSize: 100 });

// Hybrid storage adapter that works in both browser and server contexts
export function createHybridStorage(storeName: string) {
  return createJSONStorage(() => {
    // Check if we're in a browser context
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // In browser: Use API calls to access server-side SQLite
      return {
        getItem: async (name: string): Promise<string | null> => {
          try {
            // For features store, always use fresh data without cache
            // For other stores, check cache first
            if (storeName !== 'features' && memoryCache.has(storeName)) {
              const storeCache = memoryCache.get(storeName);
              if (storeCache && storeCache[name]) {
                return storeCache[name];
              }
            }
            
            // Use cache control to ensure we get fresh data (especially for features)
            const fetchOptions: RequestInit = storeName === 'features' 
              ? { cache: 'no-cache' }  // Always use fresh data for features
              : {};                    // Default behavior for other stores
            
            const response = await fetch(
              `/api/store?key=${encodeURIComponent(name)}&store=${encodeURIComponent(storeName)}`,
              fetchOptions
            );
            
            if (!response.ok) return null;
            const data = await response.json();
            
            // Cache the result (except for features if it's being accessed from releases)
            if (data.value) {
              let storeCache = memoryCache.get(storeName);
              if (!storeCache) {
                storeCache = {};
              }
              
              storeCache[name] = data.value;
              memoryCache.set(storeName, storeCache);
            }
            
            return data.value;
          } catch (error) {
            console.error(`Error retrieving ${storeName} data:`, error);
            return null;
          }
        },
        setItem: async (name: string, value: string): Promise<void> => {
          try {
            // Update cache first
            let storeCache = memoryCache.get(storeName);
            if (!storeCache) {
              storeCache = {};
            } else {
              // Create a new object to avoid modifying the cached one directly
              storeCache = { ...storeCache };
            }
            
            storeCache[name] = value;
            memoryCache.set(storeName, storeCache);
            
            // Then update server
            await fetch(`/api/store`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: name, value, store: storeName })
            });
          } catch (error) {
            console.error(`Error saving ${storeName} data:`, error);
          }
        },
        removeItem: async (name: string): Promise<void> => {
          try {
            // Update cache first
            const storeCache = memoryCache.get(storeName);
            if (storeCache) {
              const updatedCache = { ...storeCache };
              delete updatedCache[name];
              memoryCache.set(storeName, updatedCache);
            }
            
            // Then update server
            await fetch(`/api/store?key=${encodeURIComponent(name)}&store=${encodeURIComponent(storeName)}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error(`Error removing ${storeName} data:`, error);
          }
        }
      };
    } else {
      // Fallback for server-side rendering
      // Note: This won't persist data but prevents errors during SSR
      const memoryStorage: Record<string, string> = {};
      return {
        getItem: (name: string) => memoryStorage[name] || null,
        setItem: (name: string, value: string) => { memoryStorage[name] = value; },
        removeItem: (name: string) => { delete memoryStorage[name]; }
      };
    }
  });
} 
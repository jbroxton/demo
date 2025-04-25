import { createJSONStorage } from 'zustand/middleware';

// Cache to avoid repeated API calls for the same data
let memoryCache: Record<string, Record<string, string>> = {};

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
            // Check cache first
            if (memoryCache[storeName]?.[name]) {
              return memoryCache[storeName][name];
            }
            
            const response = await fetch(`/api/store?key=${encodeURIComponent(name)}&store=${encodeURIComponent(storeName)}`);
            if (!response.ok) return null;
            const data = await response.json();
            
            // Cache the result
            if (!memoryCache[storeName]) memoryCache[storeName] = {};
            if (data.value) memoryCache[storeName][name] = data.value;
            
            return data.value;
          } catch (error) {
            console.error(`Error retrieving ${storeName} data:`, error);
            return null;
          }
        },
        setItem: async (name: string, value: string): Promise<void> => {
          try {
            // Update cache first
            if (!memoryCache[storeName]) memoryCache[storeName] = {};
            memoryCache[storeName][name] = value;
            
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
            if (memoryCache[storeName]) {
              delete memoryCache[storeName][name];
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
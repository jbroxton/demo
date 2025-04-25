# Migrating from localStorage to SQLite with Minimal Changes

## Overview
This document outlines the minimum steps required to migrate the app from using localStorage via Zustand to using SQLite for data persistence. The approach focuses on keeping the existing Zustand store API intact while changing the underlying storage mechanism.

## Quick Start Guide

To implement the V1 migration (Products store only):

1. **Install Dependencies**:
   ```bash
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. **Create Three New Files**:
   - `src/services/db.server.ts` - SQLite database service (server-side only)
   - `src/app/api/store/route.ts` - API routes for client-server communication
   - `src/utils/hybrid-storage.ts` - Storage adapter that works in both client and server

3. **Update Products Store**:
   - Modify `src/stores/products.ts` to use the new hybrid storage adapter
   - Change `createJSONStorage(() => localStorage)` to `createHybridStorage('products')`

4. **Test the Implementation**:
   - Verify you can add new products and they persist after refresh
   - Check the SQLite database file is created at the project root

5. **Common Issues to Watch For**:
   - Ensure all SQLite operations run only on the server
   - Use parameterized queries to prevent SQL injection
   - Pay attention to client-server boundaries

See detailed implementation steps and code samples below.

## Implementation Plan

The migration will be split into two phases:

### V1: Minimal, Incremental Approach (Products Store Only)
- Simple migration of just the Products store
- Acceptable to lose data during migration
- Focus on proving the concept works
- Client-server architecture changes to handle browser/server contexts

### V2: Complete Migration (Future Enhancement)
- Migration of all remaining stores
- Data preservation considerations
- Additional optimizations and reliability features

## V1 Implementation (Products Store Only)

### 1. Add SQLite Dependencies

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### 2. Create Server-Side Database Service

Create a server-only version of `src/services/db.server.ts`:

```typescript
// IMPORTANT: This file should only be imported from server components or API routes
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

// Initialize the SQLite database
export function getDb() {
  // Only initialize the database once
  if (!db) {
    db = new Database(path.join(process.cwd(), 'specky.db'));
    initDatabase();
  }
  return db;
}

// Create only the products table
function initDatabase() {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);
  
  // Create storage table for Zustand state
  db.exec(`
    CREATE TABLE IF NOT EXISTS products_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
```

### 3. Create Non-Dynamic API Route

Create `src/app/api/store/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/services/db.server';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    const storeName = request.nextUrl.searchParams.get('store');
    
    if (!key || !storeName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = getDb();
    
    // Create the table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${storeName}_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    const stmt = db.prepare(`SELECT value FROM ${storeName}_state WHERE key = ?`);
    const result = stmt.get(key) as { value: string } | undefined;
    
    return NextResponse.json({ value: result ? result.value : null });
  } catch (error) {
    console.error(`Error retrieving data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, store } = body;
    
    if (!key || !value || !store) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = getDb();
    
    // Create the table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${store}_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    const stmt = db.prepare(`
      INSERT INTO ${store}_state (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error saving data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    const storeName = request.nextUrl.searchParams.get('store');
    
    if (!key || !storeName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = getDb();
    
    const stmt = db.prepare(`DELETE FROM ${storeName}_state WHERE key = ?`);
    stmt.run(key);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error removing data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
```

### 4. Create Hybrid Storage Adapter with Caching

Create `src/utils/hybrid-storage.ts`:

```typescript
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
```

### 5. Update Products Store Only

Modify only the Products store to use the hybrid storage adapter:

```typescript
// src/stores/products.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createHybridStorage } from '@/utils/hybrid-storage';

// ...existing type definitions...

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const newProduct = {
          ...product,
          id: generateId(),
          interfaces: []
        };
        set((state) => ({
          products: [...state.products, newProduct]
        }));
      },
      getProducts: () => get().products,
      updateProductWithInterface: (productId, interfaceId) => {
        set((state) => ({
          products: state.products.map(product => 
            product.id === productId 
              ? { 
                  ...product, 
                  interfaces: [...(product.interfaces || []), interfaceId] 
                } 
              : product
          )
        }));
      }
    }),
    {
      name: 'products-storage',
      storage: createHybridStorage('products')
    }
  )
);
```

### 6. Testing V1 Implementation

After implementing the changes for the Products store, verify that:
- You can add new products
- Products persist after page reload
- Any modifications to products are saved correctly

This minimal approach accepts data loss during migration and focuses on proving the concept works with one store, while properly handling the client-server boundary.

## V1 Risks and Considerations

Before proceeding with the V1 implementation, consider these potential risks and issues:

### 1. Client-Side vs. Server-Side Execution

**Risk**: SQLite operations won't work in the browser because SQLite requires file system access.

**Mitigation**: Ensure that SQLite operations only run on the server side in a Next.js application. Consider using Server Components or API routes for database interactions.

### 2. Database Initialization Timing

**Risk**: The current approach initializes the database in `layout.tsx`, but this component might be rendered in both client and server contexts.

**Mitigation**: Move database initialization to a server-only module or use a check like `if (typeof window === 'undefined')` to ensure it only runs on the server.

### 3. Missing Error Recovery

**Risk**: The current storage adapter silently logs errors without recovery mechanisms.

**Mitigation**: Add proper error handling with fallback options and error reporting. Consider implementing retry logic for temporary failures.

### 4. SQL Injection Vulnerability

**Risk**: Using template literals for SQL queries with user-controlled input is unsafe.

**Mitigation**: Always use parameterized queries as shown in the examples. Avoid constructing queries with string concatenation.

### 5. Transaction Support

**Risk**: The current adapter handles operations individually without transaction support, which could lead to data inconsistency.

**Mitigation**: Implement transaction support for operations that need to maintain data integrity.

### 6. Database File Management

**Risk**: The database file location and permissions might cause issues in different environments.

**Mitigation**: Ensure the application has proper write permissions to the database location. Consider making the database path configurable based on the environment.

### 7. Testing Challenges

**Risk**: The tight coupling of database code might make testing more difficult.

**Mitigation**: Consider adding abstraction layers to allow mocking the database for testing purposes.

## V2 Implementation (Future Enhancement)

The following items are considered V2 and can be implemented later after V1 is proven successful:

### 1. Complete Database Schema

Expand the schema to include all data types:

```typescript
// Additional tables in initDatabase()
db.exec(`
  CREATE TABLE IF NOT EXISTS interfaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    productId TEXT,
    FOREIGN KEY (productId) REFERENCES products(id)
  );
`);

// ...additional tables for features, releases, etc.
```

### 2. Data Migration Utility

Create a comprehensive data migration utility to preserve data:

```typescript
// src/scripts/migrate-data.ts
import db from '../services/db';

export async function migrateAllData() {
  // Migration logic for all stores
  // ...
}
```

### 3. Client-Server Bridge

For more complex deployments, implement API routes:

```typitten
// src/app/api/store/[storeName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/services/db';

export async function GET(request, { params }) {
  // API implementation
  // ...
}
```

### 4. Performance Optimizations

Add caching and performance improvements:

```typescript
// In-memory cache implementation
let memoryCache = {};

// Batched writes implementation
// ...
```

### 5. Migrate Remaining Stores

After V1 is proven successful, migrate each remaining store one by one.

### 6. Error Handling & Monitoring

Add comprehensive error handling and monitoring.

### 7. Testing & Validation

Implement comprehensive testing for all data stores and interactions.

These V2 items can be implemented incrementally after V1 is stable, based on the app's evolving needs.

## Implementation Notes

### Implementation Process
The V1 migration for the Products store was successfully implemented following these steps:

1. **Added SQLite Dependencies**: Installed `better-sqlite3` and its TypeScript type definitions.

2. **Created Server-Side Database Service**: Implemented a server-only database service in `src/services/db.server.ts` that initializes the database and creates necessary tables.

3. **Implemented Non-Dynamic API Route**: Created API route in `src/app/api/store/route.ts` with query parameters and request body to pass store information.

4. **Developed Hybrid Storage Adapter with Caching**: Created a custom storage adapter in `src/utils/hybrid-storage.ts` that works in both browser and server contexts and includes memory caching.

5. **Updated Products Store**: Modified the Products store to use the hybrid storage adapter instead of localStorage.

### Common Errors & Solutions

1. **Client-Side SQLite Errors**: 
   - Error: SQLite operations failing in the browser context
   - Solution: Implemented a hybrid approach where browser uses API routes to communicate with server-side SQLite

2. **SSR Compatibility Issues**:
   - Error: Server-side rendering failing due to localStorage references
   - Solution: Added a fallback in-memory storage for server context to prevent errors during SSR

3. **Database Initialization Timing**:
   - Error: Multiple database connections being created
   - Solution: Implemented a singleton pattern for the database connection

4. **Query Parameterization**:
   - Error: Potential SQL injection risks
   - Solution: Used parameterized queries with the `?` placeholder for all SQL operations

5. **Next.js Dynamic Route Params**:
   - Error: `Route "/api/store/[storeName]" used params.storeName. params should be awaited before using its properties.`
   - Solution: Completely avoided dynamic routes by using a flat API route structure (`/api/store`) and passing parameters via query string or request body

6. **Performance with API Calls**:
   - Error: Potential performance issues with frequent API calls
   - Solution: Implemented in-memory caching in the hybrid storage adapter to reduce API calls

### Best Practices for Future Migrations

1. **Avoid Dynamic Routes for Simple APIs**: Use query parameters and request body instead of Next.js dynamic routes when possible to avoid route parameter handling issues.

2. **Implement Client-Side Caching**: Always add caching to reduce API calls and improve performance.

3. **Create Tables on Demand**: Each API route should ensure required tables exist before performing operations.

4. **Incremental Approach**: Migrating one store at a time proved successful - this allows for isolated testing and reduces risk.

5. **Client-Server Separation**: Clearly separate client and server code, particularly for database operations.

6. **Error Handling**: Implement thorough error handling with appropriate fallbacks for a more robust system.

7. **Type Safety**: Maintain strong typing across the entire data flow for better reliability.

8. **Storage Abstraction**: The hybrid storage adapter pattern can be reused for other stores, making future migrations easier.

9. **Testing Strategy**: Test each migration thoroughly in isolation before moving to the next store.

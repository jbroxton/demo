// IMPORTANT: This file should only be imported from server components or API routes
/**
 * @file db.server.ts
 * @description Database initialization and configuration.
 * Originally SQLite, now migrated to Supabase PostgreSQL.
 * SQLite code is preserved below for reference during migration.
 */

import { supabase } from './supabase';

// Re-export the supabase client for backward compatibility
// This allows existing code to gradually migrate from getDb() to direct supabase usage
export { supabase };

/**
 * Get database client (for migration compatibility)
 * @deprecated Use `import { supabase } from './supabase'` directly instead
 * @returns Supabase client instance
 */
export function getDb() {
  console.warn('getDb() is deprecated. Use supabase client directly.');
  return supabase;
}

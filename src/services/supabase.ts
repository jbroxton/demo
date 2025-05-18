/**
 * @file supabase.ts
 * @description Supabase client configuration for server-side database operations.
 * This module creates a singleton Supabase client instance that can be imported
 * and used throughout the application for database operations.
 * @example
 * ```typescript
 * import { supabase } from '@/services/supabase';
 * 
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .eq('tenant_id', tenantId);
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/models/Supabase';

// Type-check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

/**
 * Supabase client instance configured for server-side operations.
 * 
 * This client:
 * - Uses the service role key for full database access
 * - Has authentication disabled (we use NextAuth)
 * - Should only be used in server-side code (API routes, server components)
 * - Provides access to all Supabase features (database, storage, realtime)
 * 
 * @constant
 * @type {import('@supabase/supabase-js').SupabaseClient}
 * 
 * @remarks
 * - Never expose the service role key to client-side code
 * - Always include tenant_id filters for multi-tenant queries
 * - Handle errors appropriately in consuming code
 *  I disabled auth since we're using NextAuth
 * 
 * @see {@link https://supabase.com/docs/reference/javascript/initializing}
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false 
    }
  }
);
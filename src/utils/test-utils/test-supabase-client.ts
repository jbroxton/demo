/**
 * @file Test Supabase Client
 * @description Supabase client configured specifically for testing with proper auth handling
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/models/Supabase';

// Test Supabase client with service role for testing
export const testSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-test-user-id': process.env.TEST_USER_ID!,
        'x-test-tenant-id': process.env.TEST_TENANT_ID!,
      }
    }
  }
);

// Helper to set tenant context for tests
export async function setTestTenantContext(tenantId: string, userId: string) {
  // Set RLS context variables for tests
  await testSupabase.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: tenantId,
    is_local: true
  });
  
  await testSupabase.rpc('set_config', {
    setting_name: 'app.current_user_id', 
    setting_value: userId,
    is_local: true
  });
}

// Cleanup function for tests
export async function cleanupTestData(tenantId: string) {
  // Clean up test data from both systems
  await testSupabase
    .from('ai_chat_fully_managed_assistants')
    .delete()
    .eq('tenant_id', tenantId);
    
  await testSupabase
    .from('tenant_settings')
    .delete()
    .eq('tenant_id', tenantId);
}
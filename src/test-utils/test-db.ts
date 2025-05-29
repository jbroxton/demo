/**
 * Test database utilities for setting up and cleaning up test data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Real test data from env.local
const REAL_USER_ID = '20000000-0000-0000-0000-000000000001';
const REAL_TENANT_ID = '22222222-2222-2222-2222-222222222222';

export async function setupTestDb(): Promise<void> {
  try {
    // Ensure test user exists
    const { error: userError } = await supabase.auth.admin.createUser({
      email: 'pm1@demo.com',
      password: 'test-password-123',
      user_metadata: {
        tenant_id: REAL_TENANT_ID,
        name: 'Sarah Chen',
      },
    });

    // Ignore error if user already exists
    if (userError && !userError.message.includes('already registered')) {
      console.warn('Warning setting up test user:', userError.message);
    }

    // Create test tenant settings if not exists
    const { error: tenantError } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: REAL_TENANT_ID,
        settings: {
          openai_api_key: process.env.OPENAI_API_KEY,
          assistant_id: 'asst_test_integration',
          base_instructions: 'You are a helpful product management assistant.',
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id',
      });

    if (tenantError) {
      console.warn('Warning setting up tenant settings:', tenantError.message);
    }

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export async function cleanupTestDb(): Promise<void> {
  try {
    // Clean up test data for the real tenant ID
    const tables = [
      'agent_actions',
      'agent_sessions', 
      'requirements',
      'features',
      'releases',
      'roadmaps',
      'products',
      'documents',
      'attachments',
      'interfaces',
      'tabs',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('tenant_id', REAL_TENANT_ID);

      if (error) {
        console.warn(`Warning cleaning up ${table}:`, error.message);
      }
    }

    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}

export async function createTestProduct(name: string = 'Test Product'): Promise<string> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: 'Test product for integration testing',
      tenant_id: REAL_TENANT_ID,
      created_by: REAL_USER_ID,
      updated_by: REAL_USER_ID,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test product: ${error.message}`);
  }

  return data.id;
}

export async function createTestFeature(productId: string, name: string = 'Test Feature'): Promise<string> {
  const { data, error } = await supabase
    .from('features')
    .insert({
      name,
      description: 'Test feature for integration testing',
      product_id: productId,
      tenant_id: REAL_TENANT_ID,
      created_by: REAL_USER_ID,
      updated_by: REAL_USER_ID,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test feature: ${error.message}`);
  }

  return data.id;
}

export async function createTestAgentSession(): Promise<string> {
  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({
      tenant_id: REAL_TENANT_ID,
      user_id: REAL_USER_ID,
      openai_thread_id: 'thread_test_integration',
      mode: 'agent',
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test agent session: ${error.message}`);
  }

  return data.id;
}

export { REAL_USER_ID, REAL_TENANT_ID };
/**
 * Enhanced test database utilities for real data testing
 * Supports TipTap content, auth workflows, and isolated test scenarios
 */

import { supabase } from '@/services/supabase';

// Real test data from environment
export const REAL_USER_ID = process.env.TEST_USER_ID || '20000000-0000-0000-0000-000000000001';
export const REAL_TENANT_ID = process.env.TEST_TENANT_ID || '22222222-2222-2222-2222-222222222222';
export const EMPTY_TENANT_ID = '11111111-1111-1111-1111-111111111111';
export const NEW_USER_ID = '10000000-0000-0000-0000-000000000001';

// Track created entities for cleanup
const createdEntities: { [key: string]: string[] } = {
  products: [],
  features: [],
  requirements: [],
  releases: [],
  roadmaps: [],
  documents: [],
  agent_sessions: [],
  pages: [],
  tabs: []
};

export async function setupTestDb(): Promise<void> {
  try {
    // Ensure test users exist with real auth
    await ensureTestUser(REAL_USER_ID, 'pm1@demo.com', 'Sarah Chen', REAL_TENANT_ID);
    await ensureTestUser(NEW_USER_ID, 'newuser@test.com', 'New User', EMPTY_TENANT_ID);

    // Create test tenant settings if not exists
    const { error: tenantError } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: REAL_TENANT_ID,
        settings: {
          openai_api_key: process.env.OPENAI_API_KEY,
          assistant_id: 'asst_test_integration',
          base_instructions: 'You are a helpful product management assistant for testing.',
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id',
      });

    if (tenantError) {
      console.warn('Warning setting up tenant settings:', tenantError.message);
    }

    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export async function ensureTestUser(userId: string, email: string, name: string, tenantId: string): Promise<void> {
  try {
    // Try to create user via Supabase Auth Admin API
    const { error: userError } = await supabase.auth.admin.createUser({
      email,
      password: 'test-password-123',
      user_metadata: {
        tenant_id: tenantId,
        name,
      },
      email_confirm: true, // Auto-confirm for testing
    });

    // Ignore error if user already exists
    if (userError && !userError.message.includes('already registered')) {
      console.warn(`Warning setting up test user ${email}:`, userError.message);
    }

    // Ensure user_tenants relationship exists
    const { error: linkError } = await supabase
      .from('user_tenants')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tenant_id',
      });

    if (linkError) {
      console.warn(`Warning linking user ${userId} to tenant ${tenantId}:`, linkError.message);
    }
  } catch (error) {
    console.warn(`Warning ensuring test user ${email}:`, error);
  }
}

export async function cleanupTestDb(): Promise<void> {
  try {
    // Clean up tracked entities in reverse order (to respect foreign keys)
    const entityTypes = Object.keys(createdEntities).reverse();
    
    for (const entityType of entityTypes) {
      const ids = createdEntities[entityType];
      if (ids.length > 0) {
        const { error } = await supabase
          .from(entityType)
          .delete()
          .in('id', ids);

        if (error) {
          console.warn(`Warning cleaning up ${entityType}:`, error.message);
        } else {
          console.log(`✅ Cleaned up ${ids.length} ${entityType} entities`);
        }
        // Clear the tracking array
        createdEntities[entityType] = [];
      }
    }

    // Clean up test data for both tenants (but preserve seed data)
    const cleanupTables = [
      'agent_actions',
      'agent_sessions', 
    ];

    for (const table of cleanupTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('tenant_id', [REAL_TENANT_ID, EMPTY_TENANT_ID]);

      if (error) {
        console.warn(`Warning cleaning up ${table}:`, error.message);
      }
    }

    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}

export async function createTestProduct(name: string = 'Test Product', tenantId: string = REAL_TENANT_ID): Promise<string> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: `Test product for integration testing - ${new Date().toISOString()}`,
      tenant_id: tenantId,
      created_by: REAL_USER_ID,
      updated_by: REAL_USER_ID,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test product: ${error.message}`);
  }

  // Track for cleanup
  createdEntities.products.push(data.id);
  return data.id;
}

export async function createTestFeature(productId: string, name: string = 'Test Feature', tenantId: string = REAL_TENANT_ID): Promise<string> {
  const { data, error } = await supabase
    .from('features')
    .insert({
      name,
      description: `Test feature for integration testing - ${new Date().toISOString()}`,
      product_id: productId,
      tenant_id: tenantId,
      created_by: REAL_USER_ID,
      updated_by: REAL_USER_ID,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test feature: ${error.message}`);
  }

  // Track for cleanup
  createdEntities.features.push(data.id);
  return data.id;
}

export async function createTestAgentSession(tenantId: string = REAL_TENANT_ID): Promise<string> {
  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({
      tenant_id: tenantId,
      user_id: REAL_USER_ID,
      openai_thread_id: `thread_test_${Date.now()}`,
      mode: 'agent',
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test agent session: ${error.message}`);
  }

  // Track for cleanup
  createdEntities.agent_sessions.push(data.id);
  return data.id;
}

export async function createTestPage(type: string = 'project', title: string = 'Test Page', tenantId: string = REAL_TENANT_ID): Promise<string> {
  const tiptapContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `This is test content for ${title} created at ${new Date().toISOString()}`
          }
        ]
      }
    ]
  };

  const { data, error } = await supabase
    .from('pages')
    .insert({
      type,
      title,
      tenant_id: tenantId,
      created_by: REAL_USER_ID,
      updated_by: REAL_USER_ID,
      properties: {
        status: {
          type: 'select',
          select: { name: 'Active', color: 'green' }
        }
      },
      blocks: [
        {
          type: 'document',
          content: {
            tiptap_content: tiptapContent,
            word_count: title.split(' ').length + 10
          }
        }
      ]
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test page: ${error.message}`);
  }

  // Track for cleanup
  createdEntities.pages.push(data.id);
  return data.id;
}

export async function updatePageTipTapContent(pageId: string, content: any): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .update({
      blocks: [
        {
          type: 'document',
          content: {
            tiptap_content: content,
            word_count: JSON.stringify(content).length / 5 // Rough estimate
          }
        }
      ],
      updated_at: new Date().toISOString(),
      updated_by: REAL_USER_ID,
    })
    .eq('id', pageId);

  if (error) {
    throw new Error(`Failed to update page TipTap content: ${error.message}`);
  }
}

export async function getPageTipTapContent(pageId: string): Promise<any> {
  const { data, error } = await supabase
    .from('pages')
    .select('blocks')
    .eq('id', pageId)
    .single();

  if (error) {
    throw new Error(`Failed to get page content: ${error.message}`);
  }

  return data.blocks?.[0]?.content?.tiptap_content || null;
}

// Utility to get real seeded data for testing
export async function getRealSeededProducts(tenantId: string = REAL_TENANT_ID): Promise<any[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get seeded products: ${error.message}`);
  }

  return data || [];
}

export async function getRealSeededFeatures(tenantId: string = REAL_TENANT_ID): Promise<any[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*, products(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get seeded features: ${error.message}`);
  }

  return data || [];
}

// Test data verification helpers
export async function verifyTestEnvironment(): Promise<{ isReady: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // Check Supabase connection
    const { error: connectionError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (connectionError) {
      issues.push(`Supabase connection failed: ${connectionError.message}`);
    }

    // Check if test tenants exist
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', [REAL_TENANT_ID, EMPTY_TENANT_ID]);

    if (tenantsError) {
      issues.push(`Test tenants check failed: ${tenantsError.message}`);
    } else if (!tenants || tenants.length < 2) {
      issues.push('Test tenants not found - run seed data');
    }

    // Check if seeded data exists
    const seededProducts = await getRealSeededProducts();
    if (seededProducts.length === 0) {
      issues.push('No seeded products found - run seed data');
    }

    return {
      isReady: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Environment verification failed: ${error}`);
    return { isReady: false, issues };
  }
}
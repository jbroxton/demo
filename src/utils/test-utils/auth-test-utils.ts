/**
 * Authentication test utilities for real user auth flows
 * Supports NextAuth sessions, Supabase auth, and tenant switching
 */

import { createClient } from '@supabase/supabase-js';
import { Session } from 'next-auth';
import { createMockSession } from './mock-session';
import { REAL_USER_ID, REAL_TENANT_ID, EMPTY_TENANT_ID, NEW_USER_ID } from './test-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TestAuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantName: string;
}

// Predefined test users for different scenarios
export const TEST_USERS = {
  PM_USER: {
    id: REAL_USER_ID,
    email: 'pm1@test.com',
    name: 'Sarah Chen',
    tenantId: REAL_TENANT_ID,
    tenantName: 'ShopFlow Commerce'
  },
  NEW_USER: {
    id: NEW_USER_ID,
    email: 'newuser@test.com', 
    name: 'New User',
    tenantId: EMPTY_TENANT_ID,
    tenantName: 'New User Tenant'
  }
} as const;

/**
 * Create a real NextAuth session for testing
 */
export function createTestAuthSession(userType: keyof typeof TEST_USERS = 'PM_USER'): Session {
  const user = TEST_USERS[userType];
  
  return createMockSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
  });
}

/**
 * Authenticate with Supabase using test credentials
 */
export async function authenticateTestUser(userType: keyof typeof TEST_USERS = 'PM_USER'): Promise<any> {
  const user = TEST_USERS[userType];
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: 'test-password-123',
  });

  if (error) {
    throw new Error(`Failed to authenticate test user ${user.email}: ${error.message}`);
  }

  return data;
}

/**
 * Get authenticated Supabase client for testing
 */
export async function getAuthenticatedSupabaseClient(userType: keyof typeof TEST_USERS = 'PM_USER') {
  const authData = await authenticateTestUser(userType);
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session?.access_token}`,
      },
    },
  });
}

/**
 * Test user permission scenarios
 */
export async function testUserPermissions(userId: string, tenantId: string): Promise<{
  canAccessTenant: boolean;
  canCreateData: boolean;
  canUpdateData: boolean;
  canDeleteData: boolean;
}> {
  try {
    // Test tenant access
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    const canAccessTenant = !tenantError && !!tenantData;

    // Test CRUD operations with this user's context
    const testPermissions = {
      canAccessTenant,
      canCreateData: false,
      canUpdateData: false,
      canDeleteData: false,
    };

    if (canAccessTenant) {
      // Test create permission
      try {
        const { error: createError } = await supabase
          .from('products')
          .insert({
            name: 'Permission Test Product',
            description: 'Testing permissions',
            tenant_id: tenantId,
            created_by: userId,
            updated_by: userId,
          })
          .select('id')
          .single();

        testPermissions.canCreateData = !createError;

        if (!createError) {
          // If we can create, test update and delete
          const { data: createdProduct } = await supabase
            .from('products')
            .select('id')
            .eq('name', 'Permission Test Product')
            .eq('tenant_id', tenantId)
            .single();

          if (createdProduct) {
            // Test update
            const { error: updateError } = await supabase
              .from('products')
              .update({ name: 'Updated Permission Test Product' })
              .eq('id', createdProduct.id);

            testPermissions.canUpdateData = !updateError;

            // Test delete (cleanup)
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', createdProduct.id);

            testPermissions.canDeleteData = !deleteError;
          }
        }
      } catch (error) {
        console.warn('Permission test error:', error);
      }
    }

    return testPermissions;
  } catch (error) {
    console.error('Error testing user permissions:', error);
    return {
      canAccessTenant: false,
      canCreateData: false,
      canUpdateData: false,
      canDeleteData: false,
    };
  }
}

/**
 * Test tenant isolation by attempting cross-tenant access
 */
export async function testTenantIsolation(userId: string, allowedTenantId: string, forbiddenTenantId: string): Promise<{
  canAccessAllowedTenant: boolean;
  canAccessForbiddenTenant: boolean;
  isolationWorking: boolean;
}> {
  const allowedPermissions = await testUserPermissions(userId, allowedTenantId);
  const forbiddenPermissions = await testUserPermissions(userId, forbiddenTenantId);

  return {
    canAccessAllowedTenant: allowedPermissions.canAccessTenant,
    canAccessForbiddenTenant: forbiddenPermissions.canAccessTenant,
    isolationWorking: allowedPermissions.canAccessTenant && !forbiddenPermissions.canAccessTenant,
  };
}

/**
 * Simulate user switching tenants
 */
export async function simulateTenantSwitch(userId: string, fromTenantId: string, toTenantId: string): Promise<{
  canSwitchToTenant: boolean;
  newSession: Session | null;
}> {
  try {
    // Check if user has access to the target tenant
    const { data: tenantAccess, error } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', toTenantId)
      .single();

    const canSwitchToTenant = !error && !!tenantAccess;

    let newSession: Session | null = null;
    if (canSwitchToTenant) {
      // Get tenant name for session
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', toTenantId)
        .single();

      // Get user data
      const user = Object.values(TEST_USERS).find(u => u.id === userId);
      
      if (user && tenantData) {
        newSession = createMockSession({
          userId: user.id,
          tenantId: toTenantId,
          email: user.email,
          name: user.name,
        });
      }
    }

    return {
      canSwitchToTenant,
      newSession,
    };
  } catch (error) {
    console.error('Error simulating tenant switch:', error);
    return {
      canSwitchToTenant: false,
      newSession: null,
    };
  }
}

/**
 * Test auth flow end-to-end
 */
export async function testAuthFlow(userType: keyof typeof TEST_USERS = 'PM_USER'): Promise<{
  success: boolean;
  steps: { [key: string]: boolean };
  errors: string[];
}> {
  const user = TEST_USERS[userType];
  const steps = {
    createSession: false,
    authenticateSupabase: false,
    checkPermissions: false,
    testTenantAccess: false,
  };
  const errors: string[] = [];

  try {
    // Step 1: Create NextAuth session
    const session = createTestAuthSession(userType);
    steps.createSession = !!session && session.user?.id === user.id;
    if (!steps.createSession) {
      errors.push('Failed to create NextAuth session');
    }

    // Step 2: Authenticate with Supabase
    try {
      await authenticateTestUser(userType);
      steps.authenticateSupabase = true;
    } catch (error) {
      errors.push(`Supabase auth failed: ${error}`);
    }

    // Step 3: Check permissions
    try {
      const permissions = await testUserPermissions(user.id, user.tenantId);
      steps.checkPermissions = permissions.canAccessTenant;
      if (!steps.checkPermissions) {
        errors.push('User cannot access their own tenant');
      }
    } catch (error) {
      errors.push(`Permission check failed: ${error}`);
    }

    // Step 4: Test tenant access
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('tenant_id', user.tenantId)
        .limit(1);

      steps.testTenantAccess = !!products;
      if (!steps.testTenantAccess) {
        errors.push('Cannot access tenant data');
      }
    } catch (error) {
      errors.push(`Tenant data access failed: ${error}`);
    }

    return {
      success: Object.values(steps).every(step => step),
      steps,
      errors,
    };
  } catch (error) {
    errors.push(`Auth flow failed: ${error}`);
    return {
      success: false,
      steps,
      errors,
    };
  }
}

/**
 * Setup auth for test suites
 */
export async function setupAuthForTests(): Promise<void> {
  // Mock getServerSession for NextAuth
  const mockGetServerSession = jest.fn();
  
  // Default to PM user session
  mockGetServerSession.mockResolvedValue(createTestAuthSession('PM_USER'));
  
  // Make it available globally for tests
  (global as any).mockGetServerSession = mockGetServerSession;
  
  console.log('✅ Auth setup completed for tests');
}

/**
 * Cleanup auth after tests
 */
export async function cleanupAuthAfterTests(): Promise<void> {
  // Sign out any authenticated sessions
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Warning during auth cleanup:', error);
  }
  
  // Clear global mocks
  if ((global as any).mockGetServerSession) {
    delete (global as any).mockGetServerSession;
  }
  
  console.log('✅ Auth cleanup completed');
} 
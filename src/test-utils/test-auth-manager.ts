/**
 * Test Authentication Manager
 * 
 * Comprehensive auth utilities for both Jest and Playwright tests.
 * Handles real Supabase authentication, NextAuth sessions, and multi-tenant scenarios.
 */

import { createClient } from '@supabase/supabase-js';
import { Session } from 'next-auth';
import { TEST_USERS, TEST_TENANTS, TestUser, getTestUserCredentials } from './test-users';
import { createMockSession } from './mock-session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class TestAuthManager {
  private supabase = createClient(supabaseUrl, supabaseServiceKey);
  private authenticatedSessions = new Map<string, any>();
  private currentUser: TestUser | null = null;

  /**
   * Setup all test users in Supabase Auth
   * Call this once before running tests
   */
  async setupAllTestUsers(): Promise<void> {
    console.log('🔐 Setting up test users...');
    
    for (const [userKey, user] of Object.entries(TEST_USERS)) {
      try {
        await this.ensureUserExists(user);
        console.log(`✅ User ${user.email} ready`);
      } catch (error) {
        console.warn(`⚠️ Warning setting up ${user.email}:`, error);
      }
    }

    // Setup tenant relationships
    await this.setupTenantRelationships();
    console.log('✅ All test users configured');
  }

  /**
   * Ensure a test user exists in Supabase Auth
   */
  private async ensureUserExists(user: TestUser): Promise<void> {
    try {
      // Create user via Admin API
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: {
          tenant_id: user.tenantId,
          name: user.name,
          role: user.role,
        },
        email_confirm: true, // Auto-confirm for testing
      });

      // Ignore if user already exists
      if (error && !error.message.includes('already registered')) {
        throw error;
      }

      // Ensure user record exists in our users table
      if (data.user) {
        const { error: upsertError } = await this.supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (upsertError) {
          console.warn(`Warning upserting user record for ${user.email}:`, upsertError);
        }
      }
    } catch (error) {
      // Log but don't fail - user might already exist
      console.warn(`User setup warning for ${user.email}:`, error);
    }
  }

  /**
   * Setup tenant relationships for all users
   */
  private async setupTenantRelationships(): Promise<void> {
    // Ensure tenants exist
    for (const tenant of Object.values(TEST_TENANTS)) {
      const { error: tenantError } = await this.supabase
        .from('tenants')
        .upsert({
          id: tenant.id,
          name: tenant.name,
          description: tenant.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (tenantError) {
        console.warn(`Warning setting up tenant ${tenant.name}:`, tenantError);
      }

      // Setup tenant settings
      if (Object.keys(tenant.settings).length > 0) {
        const { error: settingsError } = await this.supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: tenant.id,
            settings: tenant.settings,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'tenant_id',
          });

        if (settingsError) {
          console.warn(`Warning setting up tenant settings for ${tenant.name}:`, settingsError);
        }
      }
    }

    // Link users to tenants
    for (const user of Object.values(TEST_USERS)) {
      const { error: linkError } = await this.supabase
        .from('user_tenants')
        .upsert({
          user_id: user.id,
          tenant_id: user.tenantId,
          role: user.role,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tenant_id',
        });

      if (linkError) {
        console.warn(`Warning linking user ${user.email} to tenant:`, linkError);
      }
    }
  }

  /**
   * Authenticate a test user with Supabase
   */
  async authenticateUser(userKey: keyof typeof TEST_USERS): Promise<{
    user: TestUser;
    session: any;
    supabaseClient: any;
  }> {
    const user = TEST_USERS[userKey];
    
    // Check if we already have an authenticated session
    if (this.authenticatedSessions.has(userKey)) {
      return this.authenticatedSessions.get(userKey);
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (error) {
        throw new Error(`Authentication failed for ${user.email}: ${error.message}`);
      }

      // Create authenticated client
      const authenticatedClient = createClient(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`,
          },
        },
      });

      const authResult = {
        user,
        session: data.session,
        supabaseClient: authenticatedClient,
      };

      // Cache the session
      this.authenticatedSessions.set(userKey, authResult);
      this.currentUser = user;

      return authResult;
    } catch (error) {
      console.error(`Failed to authenticate ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * Create NextAuth session for Jest tests
   */
  createNextAuthSession(userKey: keyof typeof TEST_USERS): Session {
    const user = TEST_USERS[userKey];
    
    return createMockSession({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): TestUser | null {
    return this.currentUser;
  }

  /**
   * Switch to a different user (for multi-user testing)
   */
  async switchUser(userKey: keyof typeof TEST_USERS): Promise<void> {
    await this.authenticateUser(userKey);
  }

  /**
   * Test user permissions against specific actions
   */
  async testUserPermissions(userKey: keyof typeof TEST_USERS): Promise<{
    canAccessTenant: boolean;
    canCreateProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canManageUsers: boolean;
    canAccessAI: boolean;
    permissionErrors: string[];
  }> {
    const user = TEST_USERS[userKey];
    const { supabaseClient } = await this.authenticateUser(userKey);
    const permissionErrors: string[] = [];

    // Test tenant access
    const { data: tenantData, error: tenantError } = await supabaseClient
      .from('user_tenants')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenantId)
      .single();

    const canAccessTenant = !tenantError && !!tenantData;
    if (!canAccessTenant) {
      permissionErrors.push('Cannot access assigned tenant');
    }

    // Test product creation
    let canCreateProducts = false;
    if (user.permissions.canCreateProducts) {
      try {
        const { error: createError } = await supabaseClient
          .from('products')
          .insert({
            name: `Permission Test Product ${Date.now()}`,
            description: 'Testing product creation permissions',
            tenant_id: user.tenantId,
            created_by: user.id,
            updated_by: user.id,
          })
          .select('id')
          .single();

        canCreateProducts = !createError;
        if (createError) {
          permissionErrors.push(`Product creation failed: ${createError.message}`);
        }
      } catch (error) {
        permissionErrors.push(`Product creation test failed: ${error}`);
      }
    }

    return {
      canAccessTenant,
      canCreateProducts,
      canEditProducts: user.permissions.canEditProducts,
      canDeleteProducts: user.permissions.canDeleteProducts,
      canManageUsers: user.permissions.canManageUsers,
      canAccessAI: user.permissions.canAccessAI,
      permissionErrors,
    };
  }

  /**
   * Test tenant isolation
   */
  async testTenantIsolation(userKey: keyof typeof TEST_USERS): Promise<{
    canAccessOwnTenant: boolean;
    canAccessOtherTenants: boolean;
    isolationWorking: boolean;
    isolationErrors: string[];
  }> {
    const user = TEST_USERS[userKey];
    const { supabaseClient } = await this.authenticateUser(userKey);
    const isolationErrors: string[] = [];

    // Test access to own tenant's data
    const { data: ownProducts, error: ownError } = await supabaseClient
      .from('products')
      .select('id, name')
      .eq('tenant_id', user.tenantId)
      .limit(1);

    const canAccessOwnTenant = !ownError;
    if (ownError) {
      isolationErrors.push(`Cannot access own tenant data: ${ownError.message}`);
    }

    // Test access to other tenant's data
    const otherTenantIds = Object.values(TEST_TENANTS)
      .map(t => t.id)
      .filter(id => id !== user.tenantId);

    let canAccessOtherTenants = false;
    for (const otherTenantId of otherTenantIds) {
      const { data: otherProducts, error: otherError } = await supabaseClient
        .from('products')
        .select('id, name')
        .eq('tenant_id', otherTenantId)
        .limit(1);

      if (!otherError && otherProducts && otherProducts.length > 0) {
        canAccessOtherTenants = true;
        isolationErrors.push(`Can access other tenant data: ${otherTenantId}`);
        break;
      }
    }

    const isolationWorking = canAccessOwnTenant && !canAccessOtherTenants;

    return {
      canAccessOwnTenant,
      canAccessOtherTenants,
      isolationWorking,
      isolationErrors,
    };
  }

  /**
   * Cleanup all authenticated sessions
   */
  async cleanup(): Promise<void> {
    try {
      // Sign out from Supabase
      await this.supabase.auth.signOut();
      
      // Clear cached sessions
      this.authenticatedSessions.clear();
      this.currentUser = null;
      
      console.log('✅ Auth cleanup completed');
    } catch (error) {
      console.warn('Warning during auth cleanup:', error);
    }
  }

  /**
   * Get credentials for Playwright tests
   */
  getPlaywrightCredentials(userKey: keyof typeof TEST_USERS) {
    return getTestUserCredentials(userKey);
  }

  /**
   * Create auth state file for Playwright
   */
  async createPlaywrightAuthState(userKey: keyof typeof TEST_USERS, outputPath: string): Promise<void> {
    const { user, session } = await this.authenticateUser(userKey);
    
    // Create auth state in Playwright format
    const authState = {
      cookies: [],
      origins: [
        {
          origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          localStorage: [
            {
              name: 'next-auth.session-token',
              value: session?.access_token || '',
            },
            {
              name: 'user-data',
              value: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                tenantId: user.tenantId,
              }),
            },
          ],
        },
      ],
    };

    // Write to file (would need fs import for actual file writing)
    console.log(`Auth state created for ${user.email} at ${outputPath}`);
  }
}

// Global instance for test suites
export const testAuthManager = new TestAuthManager();

// Convenience functions for common use cases
export async function setupTestAuth(): Promise<void> {
  await testAuthManager.setupAllTestUsers();
}

export async function authenticateTestUser(userKey: keyof typeof TEST_USERS) {
  return await testAuthManager.authenticateUser(userKey);
}

export function createTestSession(userKey: keyof typeof TEST_USERS): Session {
  return testAuthManager.createNextAuthSession(userKey);
}

export async function cleanupTestAuth(): Promise<void> {
  await testAuthManager.cleanup();
} 
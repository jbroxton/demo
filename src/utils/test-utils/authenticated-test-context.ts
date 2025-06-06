/**
 * @file Authenticated Test Context
 * @description Reusable authenticated context for all integration tests
 * 
 * This follows the userContext.js pattern mentioned in the Medium article,
 * providing a centralized, reusable authentication context that works with:
 * - Real Supabase authentication
 * - NextAuth sessions
 * - Multi-tenant scenarios
 * - Permission testing
 * 
 * Based on the existing comprehensive test framework in this codebase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { Session } from 'next-auth';
import { testAuthManager, TestAuthManager } from './test-auth-manager';
import { TEST_USERS, TestUser, DEFAULT_TEST_USER } from './test-users';
import { createMockSession } from './mock-session';
import { setupTestDb, cleanupTestDb } from './test-db';

export interface AuthenticatedTestContext {
  user: TestUser;
  session: Session;
  supabaseClient: SupabaseClient;
  isAuthenticated: boolean;
  tenantId: string;
  userId: string;
}

export interface TestContextOptions {
  userKey?: keyof typeof TEST_USERS;
  setupDatabase?: boolean;
  cleanup?: boolean;
}

/**
 * Authenticated Test Context Manager
 * 
 * Provides a reusable authenticated context for integration tests.
 * This is the equivalent of a "userContext.js" file that can be imported
 * and used across all test files.
 */
class AuthenticatedTestContextManager {
  private currentContext: AuthenticatedTestContext | null = null;
  private authManager: TestAuthManager;
  private setupComplete = false;

  constructor() {
    this.authManager = testAuthManager;
  }

  /**
   * Create an authenticated test context
   * This is the main function that should be called in test setup
   */
  async createAuthenticatedContext(options: TestContextOptions = {}): Promise<AuthenticatedTestContext> {
    const {
      userKey = 'PM_SARAH',
      setupDatabase = true,
      cleanup = false
    } = options;

    // Setup test environment if needed
    if (!this.setupComplete && setupDatabase) {
      await this.setupTestEnvironment();
      this.setupComplete = true;
    }

    // Cleanup previous context if needed
    if (cleanup && this.currentContext) {
      await this.cleanup();
    }

    // Authenticate the user
    const authResult = await this.authManager.authenticateUser(userKey);
    
    // Create NextAuth session
    const session = this.authManager.createNextAuthSession(userKey);

    // Create the context
    this.currentContext = {
      user: authResult.user,
      session,
      supabaseClient: authResult.supabaseClient,
      isAuthenticated: true,
      tenantId: authResult.user.tenantId,
      userId: authResult.user.id,
    };

    console.log(`✅ Authenticated test context created for ${authResult.user.email}`);
    return this.currentContext;
  }

  /**
   * Get the current authenticated context
   * Useful for accessing the context from any test function
   */
  getCurrentContext(): AuthenticatedTestContext | null {
    return this.currentContext;
  }

  /**
   * Switch to a different user context
   * Useful for multi-user testing scenarios
   */
  async switchUser(userKey: keyof typeof TEST_USERS): Promise<AuthenticatedTestContext> {
    await this.authManager.switchUser(userKey);
    return this.createAuthenticatedContext({ userKey, setupDatabase: false });
  }

  /**
   * Create a context for testing without authentication
   * Useful for testing auth failure scenarios
   */
  createUnauthenticatedContext(): Partial<AuthenticatedTestContext> {
    return {
      user: undefined,
      session: undefined,
      supabaseClient: supabase,
      isAuthenticated: false,
      tenantId: undefined,
      userId: undefined,
    };
  }

  /**
   * Setup test environment (database, users, etc.)
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('🚀 Setting up test environment...');
    
    // Setup all test users
    await this.authManager.setupAllTestUsers();
    
    // Setup test database
    await setupTestDb();
    
    console.log('✅ Test environment setup complete');
  }

  /**
   * Cleanup test context and resources
   */
  async cleanup(): Promise<void> {
    try {
      // Cleanup authentication
      await this.authManager.cleanup();
      
      // Cleanup database if needed
      await cleanupTestDb();
      
      // Clear current context
      this.currentContext = null;
      
      console.log('✅ Test context cleanup complete');
    } catch (error) {
      console.warn('Warning during test context cleanup:', error);
    }
  }

  /**
   * Test user permissions
   */
  async testPermissions(userKey?: keyof typeof TEST_USERS): Promise<any> {
    const key = userKey || (this.currentContext?.user ? 
      Object.keys(TEST_USERS).find(k => TEST_USERS[k as keyof typeof TEST_USERS].id === this.currentContext!.user.id) as keyof typeof TEST_USERS :
      'PM_SARAH'
    );
    
    return await this.authManager.testUserPermissions(key);
  }

  /**
   * Test tenant isolation
   */
  async testTenantIsolation(userKey?: keyof typeof TEST_USERS): Promise<any> {
    const key = userKey || 'PM_SARAH';
    return await this.authManager.testTenantIsolation(key);
  }

  /**
   * Set tenant context for RLS
   */
  async setTenantContext(tenantId: string, userId: string): Promise<void> {
    if (!this.currentContext?.supabaseClient) {
      throw new Error('No authenticated context available');
    }

    // Set RLS context variables for multi-tenant isolation
    try {
      await this.currentContext.supabaseClient.rpc('set_config', {
        setting_name: 'app.current_tenant_id',
        setting_value: tenantId,
        is_local: true
      });
      
      await this.currentContext.supabaseClient.rpc('set_config', {
        setting_name: 'app.current_user_id', 
        setting_value: userId,
        is_local: true
      });
    } catch (error) {
      // RLS config functions might not exist in all environments
      console.warn('Could not set RLS context:', error);
    }
  }

  /**
   * Create a test-specific Supabase client with proper auth headers
   */
  createTestSupabaseClient(accessToken?: string): SupabaseClient {
    // Return the global client - it already has service role permissions
    return supabase;
  }
}

// Global instance for reuse across tests
export const authenticatedTestContext = new AuthenticatedTestContextManager();

/**
 * Convenience functions for common use cases (following userContext.js pattern)
 */

/**
 * Setup authenticated context for a test suite
 * Use this in beforeAll or beforeEach
 */
export async function setupAuthenticatedContext(options: TestContextOptions = {}): Promise<AuthenticatedTestContext> {
  return await authenticatedTestContext.createAuthenticatedContext(options);
}

/**
 * Get current authenticated user context
 * Use this in any test function that needs the auth context
 */
export function getAuthenticatedContext(): AuthenticatedTestContext | null {
  return authenticatedTestContext.getCurrentContext();
}

/**
 * Switch to different user for multi-user testing
 */
export async function switchToUser(userKey: keyof typeof TEST_USERS): Promise<AuthenticatedTestContext> {
  return await authenticatedTestContext.switchUser(userKey);
}

/**
 * Cleanup authenticated context
 * Use this in afterAll or afterEach
 */
export async function cleanupAuthenticatedContext(): Promise<void> {
  await authenticatedTestContext.cleanup();
}

/**
 * Test user permissions within authenticated context
 */
export async function testUserPermissions(userKey?: keyof typeof TEST_USERS): Promise<any> {
  return await authenticatedTestContext.testPermissions(userKey);
}

/**
 * Test tenant isolation within authenticated context
 */
export async function testTenantIsolation(userKey?: keyof typeof TEST_USERS): Promise<any> {
  return await authenticatedTestContext.testTenantIsolation(userKey);
}

/**
 * Create authenticated Supabase client for current context
 */
export function createAuthenticatedSupabaseClient(): SupabaseClient {
  return authenticatedTestContext.createTestSupabaseClient();
}

/**
 * Set tenant context for RLS testing
 */
export async function setTestTenantContext(tenantId: string, userId: string): Promise<void> {
  await authenticatedTestContext.setTenantContext(tenantId, userId);
}

/**
 * Create unauthenticated context for auth failure testing
 */
export function createUnauthenticatedContext(): Partial<AuthenticatedTestContext> {
  return authenticatedTestContext.createUnauthenticatedContext();
}

/**
 * Higher-order function to wrap tests with authentication
 * This is the equivalent of a React context provider for tests
 */
export function withAuthenticatedContext<T extends any[]>(
  testFn: (context: AuthenticatedTestContext, ...args: T) => Promise<void>,
  options: TestContextOptions = {}
) {
  return async (...args: T): Promise<void> => {
    const context = await setupAuthenticatedContext(options);
    try {
      await testFn(context, ...args);
    } finally {
      if (options.cleanup !== false) {
        await cleanupAuthenticatedContext();
      }
    }
  };
}

/**
 * Test helper for scenarios requiring multiple users
 */
export async function withMultipleUsers<T>(
  userKeys: (keyof typeof TEST_USERS)[],
  testFn: (contexts: AuthenticatedTestContext[]) => Promise<T>
): Promise<T> {
  const contexts: AuthenticatedTestContext[] = [];
  
  try {
    // Create contexts for all users
    for (const userKey of userKeys) {
      const context = await authenticatedTestContext.createAuthenticatedContext({ 
        userKey, 
        setupDatabase: contexts.length === 0 // Only setup DB for first user
      });
      contexts.push(context);
    }
    
    return await testFn(contexts);
  } finally {
    await cleanupAuthenticatedContext();
  }
}

// Export additional constants
export { TEST_USERS, DEFAULT_TEST_USER };

/**
 * Usage Examples:
 * 
 * // Basic usage in a test file:
 * import { setupAuthenticatedContext, getAuthenticatedContext, cleanupAuthenticatedContext } from './authenticated-test-context';
 * 
 * beforeAll(async () => {
 *   await setupAuthenticatedContext({ userKey: 'PM_SARAH' });
 * });
 * 
 * afterAll(async () => {
 *   await cleanupAuthenticatedContext();
 * });
 * 
 * test('should create assistant with authenticated user', async () => {
 *   const context = getAuthenticatedContext()!;
 *   const result = await someService.createAssistant(context.tenantId);
 *   expect(result).toBeDefined();
 * });
 * 
 * // Using the higher-order function wrapper:
 * test('should work with auth context', withAuthenticatedContext(async (context) => {
 *   const result = await someService.doSomething(context.tenantId);
 *   expect(result).toBeDefined();
 * }));
 * 
 * // Multi-user testing:
 * test('should handle multiple users', async () => {
 *   await withMultipleUsers(['PM_SARAH', 'PM_ALEX'], async (contexts) => {
 *     const [sarah, alex] = contexts;
 *     // Test collaboration between users
 *   });
 * });
 */
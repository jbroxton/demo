/**
 * Jest Test Setup Utilities
 * 
 * Comprehensive setup for Jest unit and integration tests with real auth
 */

import { setupTestAuth, cleanupTestAuth, createTestSession } from './test-auth-manager';
import { TEST_USERS } from './test-users';
import { setupTestDb, cleanupTestDb } from './test-db';
import { renderWithProviders } from './test-providers';

// Global test state
let globalTestSetupDone = false;

/**
 * Setup before all test suites run
 */
export async function globalTestSetup(): Promise<void> {
  if (globalTestSetupDone) return;
  
  console.log('🚀 Starting Jest global setup...');
  
  try {
    // Setup test database with real users
    await setupTestDb();
    console.log('✅ Test database ready');
    
    // Setup authentication with real users
    await setupTestAuth();
    console.log('✅ Test auth ready');
    
    // Mock NextAuth getServerSession
    setupNextAuthMocks();
    console.log('✅ NextAuth mocks ready');
    
    globalTestSetupDone = true;
    console.log('🎉 Jest global setup completed');
  } catch (error) {
    console.error('❌ Jest global setup failed:', error);
    throw error;
  }
}

/**
 * Cleanup after all test suites complete
 */
export async function globalTestTeardown(): Promise<void> {
  console.log('🧹 Starting Jest global cleanup...');
  
  try {
    await cleanupTestAuth();
    await cleanupTestDb();
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    console.log('✅ Jest global cleanup completed');
  } catch (error) {
    console.warn('⚠️ Warning during Jest cleanup:', error);
  }
}

/**
 * Setup NextAuth mocks for testing
 */
function setupNextAuthMocks(): void {
  // Mock getServerSession to return PM_SARAH by default
  const mockGetServerSession = jest.fn();
  mockGetServerSession.mockResolvedValue(createTestSession('PM_SARAH'));
  
  // Make available globally
  (global as any).mockGetServerSession = mockGetServerSession;
  
  // Mock NextAuth imports
  jest.mock('next-auth/next', () => ({
    getServerSession: mockGetServerSession,
  }));
  
  jest.mock('next-auth', () => ({
    getServerSession: mockGetServerSession,
  }));
}

/**
 * Test suite setup for individual test files
 */
export function setupTestSuite(options?: {
  defaultUser?: keyof typeof TEST_USERS;
  skipAuth?: boolean;
  skipDb?: boolean;
}) {
  const { 
    defaultUser = 'PM_SARAH', 
    skipAuth = false, 
    skipDb = false 
  } = options || {};
  
  beforeAll(async () => {
    await globalTestSetup();
    
    if (!skipAuth) {
      // Set default user session
      const mockSession = createTestSession(defaultUser);
      (global as any).mockGetServerSession.mockResolvedValue(mockSession);
    }
  });
  
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    if (!skipAuth) {
      // Restore default session
      const mockSession = createTestSession(defaultUser);
      (global as any).mockGetServerSession.mockResolvedValue(mockSession);
    }
  });
  
  afterAll(async () => {
    if (!skipDb) {
      await cleanupTestDb();
    }
  });
}

/**
 * Create test wrapper with authentication context
 */
export function createAuthenticatedTestWrapper(userKey: keyof typeof TEST_USERS = 'PM_SARAH') {
  const session = createTestSession(userKey);
  
  return function AuthTestWrapper({ children }: { children: React.ReactNode }) {
    return renderWithProviders(children as React.ReactElement, { session });
  };
}

/**
 * Mock API responses for Jest tests
 */
export function mockAPIResponses(scenario: 'success' | 'error' | 'empty' | 'permission_denied') {
  const mockFetch = jest.fn();
  
  switch (scenario) {
    case 'success':
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: '1', name: 'Test Product 1' },
            { id: '2', name: 'Test Product 2' },
          ],
        }),
      });
      break;
      
    case 'error':
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });
      break;
      
    case 'empty':
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });
      break;
      
    case 'permission_denied':
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions' }),
      });
      break;
  }
  
  // Mock global fetch
  (global as any).fetch = mockFetch;
  
  return mockFetch;
}

/**
 * Create test data factories with proper tenant context
 */
export function createTestDataFactories(userKey: keyof typeof TEST_USERS = 'PM_SARAH') {
  const user = TEST_USERS[userKey];
  const timestamp = Date.now();
  
  return {
    product: (overrides = {}) => ({
      id: `test-product-${timestamp}`,
      name: `Test Product ${timestamp}`,
      description: 'A test product for Jest testing',
      tenant_id: user.tenantId,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }),
    
    feature: (productId: string, overrides = {}) => ({
      id: `test-feature-${timestamp}`,
      name: `Test Feature ${timestamp}`,
      description: 'A test feature for Jest testing',
      product_id: productId,
      tenant_id: user.tenantId,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }),
    
    requirement: (featureId: string, overrides = {}) => ({
      id: `test-requirement-${timestamp}`,
      title: `Test Requirement ${timestamp}`,
      description: 'A test requirement for Jest testing',
      feature_id: featureId,
      tenant_id: user.tenantId,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }),
  };
}

/**
 * Test user switching within Jest tests
 */
export function testWithDifferentUsers(
  testName: string,
  testFn: (userKey: keyof typeof TEST_USERS, user: any) => Promise<void>
) {
  describe(testName, () => {
    const testUsers: Array<keyof typeof TEST_USERS> = [
      'PM_SARAH',
      'PM_ALEX', 
      'MEMBER_USER',
      'VIEWER_USER',
    ];
    
    testUsers.forEach(userKey => {
      const user = TEST_USERS[userKey];
      
      it(`works for ${user.role} user (${user.name})`, async () => {
        // Switch session for this test
        const mockSession = createTestSession(userKey);
        (global as any).mockGetServerSession.mockResolvedValue(mockSession);
        
        await testFn(userKey, user);
      });
    });
  });
}

/**
 * Test tenant isolation within Jest tests
 */
export function testTenantIsolation(
  testName: string,
  testFn: (userKey: keyof typeof TEST_USERS, otherUserKey: keyof typeof TEST_USERS) => Promise<void>
) {
  describe(`${testName} - Tenant Isolation`, () => {
    it('isolates ShopFlow and TechStart users', async () => {
      await testFn('PM_SARAH', 'PM_DIFFERENT_TENANT');
    });
    
    it('allows same-tenant users to collaborate', async () => {
      await testFn('PM_SARAH', 'PM_ALEX');
    });
  });
}

/**
 * Helper to assert permission errors
 */
export function expectPermissionError(result: any) {
  expect(result).toEqual(
    expect.objectContaining({
      success: false,
      error: expect.stringMatching(/permission|unauthorized|forbidden/i),
    })
  );
}

/**
 * Helper to assert successful API responses
 */
export function expectSuccessfulResponse(result: any) {
  expect(result).toEqual(
    expect.objectContaining({
      success: true,
      data: expect.any(Object),
    })
  );
}

/**
 * Custom Jest matchers for testing
 */
export const customMatchers = {
  toBeAuthenticatedUser(received: any, expected: keyof typeof TEST_USERS) {
    const user = TEST_USERS[expected];
    const pass = received?.user?.id === user.id && 
                 received?.user?.email === user.email;
    
    if (pass) {
      return {
        message: () => `Expected not to be authenticated as ${user.name}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected to be authenticated as ${user.name}, got ${received?.user?.name || 'none'}`,
        pass: false,
      };
    }
  },
  
  toHaveValidTenantContext(received: any, expectedTenantId: string) {
    const pass = received?.tenant_id === expectedTenantId;
    
    if (pass) {
      return {
        message: () => `Expected not to have tenant context ${expectedTenantId}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected tenant context ${expectedTenantId}, got ${received?.tenant_id || 'none'}`,
        pass: false,
      };
    }
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAuthenticatedUser(expected: keyof typeof TEST_USERS): R;
      toHaveValidTenantContext(expectedTenantId: string): R;
    }
  }
}

// Add custom matchers to Jest
if (typeof expect !== 'undefined') {
  expect.extend(customMatchers);
} 
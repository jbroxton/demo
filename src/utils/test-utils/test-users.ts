/**
 * Real Test Users Database for Authentication Testing
 * 
 * This file contains real user accounts for testing with actual Supabase auth.
 * These users have different roles, tenants, and permission levels for comprehensive testing.
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  tenantId: string;
  tenantName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    canCreateProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canManageUsers: boolean;
    canAccessAI: boolean;
  };
}

export interface TestTenant {
  id: string;
  name: string;
  description: string;
  settings: {
    openai_api_key?: string;
    assistant_id?: string;
    base_instructions?: string;
  };
}

// Real test tenants
export const TEST_TENANTS: Record<string, TestTenant> = {
  SHOPFLOW: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'ShopFlow Commerce',
    description: 'E-commerce platform development team',
    settings: {
      openai_api_key: process.env.OPENAI_API_KEY,
      assistant_id: 'asst_shopflow_test',
      base_instructions: 'You are a helpful product management assistant for ShopFlow Commerce.',
    },
  },
  EMPTY_TENANT: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Empty Tenant',
    description: 'Empty tenant for testing new user flows',
    settings: {},
  },
};

// Real test users with proper credentials
export const TEST_USERS: Record<string, TestUser> = {
  // Primary PM user with full permissions
  PM_SARAH: {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'pm1@demo.com',
    password: 'TestPassword123!',
    name: 'Sarah Chen',
    tenantId: TEST_TENANTS.SHOPFLOW.id,
    tenantName: TEST_TENANTS.SHOPFLOW.name,
    role: 'owner',
    permissions: {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canManageUsers: true,
      canAccessAI: true,
    },
  },
  
  // Secondary PM user for collaboration testing
  PM_ALEX: {
    id: '20000000-0000-0000-0000-000000000002',
    email: 'pm2@demo.com',
    password: 'TestPassword123!',
    name: 'Alex Rodriguez',
    tenantId: TEST_TENANTS.SHOPFLOW.id,
    tenantName: TEST_TENANTS.SHOPFLOW.name,
    role: 'admin',
    permissions: {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canManageUsers: false,
      canAccessAI: true,
    },
  },
  
  
  // Limited permissions user
  MEMBER_USER: {
    id: '20000000-0000-0000-0000-000000000003',
    email: 'member@demo.com',
    password: 'TestPassword123!',
    name: 'Taylor Smith',
    tenantId: TEST_TENANTS.SHOPFLOW.id,
    tenantName: TEST_TENANTS.SHOPFLOW.name,
    role: 'member',
    permissions: {
      canCreateProducts: false,
      canEditProducts: true,
      canDeleteProducts: false,
      canManageUsers: false,
      canAccessAI: false,
    },
  },
  
  // Viewer only user
  VIEWER_USER: {
    id: '20000000-0000-0000-0000-000000000004',
    email: 'viewer@demo.com',
    password: 'TestPassword123!',
    name: 'Riley Johnson',
    tenantId: TEST_TENANTS.SHOPFLOW.id,
    tenantName: TEST_TENANTS.SHOPFLOW.name,
    role: 'viewer',
    permissions: {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canManageUsers: false,
      canAccessAI: false,
    },
  },
  
  // New user for onboarding flows
  NEW_USER: {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'newuser@demo.com',
    password: 'TestPassword123!',
    name: 'Casey Wilson',
    tenantId: TEST_TENANTS.EMPTY_TENANT.id,
    tenantName: TEST_TENANTS.EMPTY_TENANT.name,
    role: 'owner',
    permissions: {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canManageUsers: true,
      canAccessAI: true,
    },
  },
};

// User groups for specific test scenarios
export const USER_GROUPS = {
  SHOPFLOW_USERS: [TEST_USERS.PM_SARAH, TEST_USERS.PM_ALEX, TEST_USERS.MEMBER_USER, TEST_USERS.VIEWER_USER],
  ADMIN_USERS: [TEST_USERS.PM_SARAH, TEST_USERS.PM_ALEX, TEST_USERS.NEW_USER],
  LIMITED_USERS: [TEST_USERS.MEMBER_USER, TEST_USERS.VIEWER_USER],
};

// Default test credentials for quick access
export const DEFAULT_TEST_USER = TEST_USERS.PM_SARAH;
export const DEFAULT_TENANT = TEST_TENANTS.SHOPFLOW;

// Test scenarios mapping
export const TEST_SCENARIOS = {
  BASIC_AUTH: TEST_USERS.PM_SARAH,
  COLLABORATION: [TEST_USERS.PM_SARAH, TEST_USERS.PM_ALEX],
  PERMISSION_TESTING: USER_GROUPS.LIMITED_USERS,
  NEW_USER_FLOW: TEST_USERS.NEW_USER,
  MULTI_TENANT_ADMIN: TEST_USERS.PM_SARAH,
} as const;

// Environment-specific overrides
export function getTestUserCredentials(userKey: keyof typeof TEST_USERS): {
  email: string;
  password: string;
  expectedName: string;
  expectedTenant: string;
} {
  const user = TEST_USERS[userKey];
  return {
    email: user.email,
    password: user.password,
    expectedName: user.name,
    expectedTenant: user.tenantName,
  };
}

// Helper to get users by tenant
export function getUsersByTenant(tenantId: string): TestUser[] {
  return Object.values(TEST_USERS).filter(user => user.tenantId === tenantId);
}

// Helper to get users by role
export function getUsersByRole(role: TestUser['role']): TestUser[] {
  return Object.values(TEST_USERS).filter(user => user.role === role);
}

// Helper to check if user has permission
export function userHasPermission(userKey: keyof typeof TEST_USERS, permission: keyof TestUser['permissions']): boolean {
  return TEST_USERS[userKey].permissions[permission];
} 
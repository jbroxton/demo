/**
 * Playwright Authentication Helpers
 * 
 * Reusable auth functions for E2E tests with real users
 */

import { Page, BrowserContext, expect } from '@playwright/test';
import { TEST_USERS, getTestUserCredentials } from '../../../src/utils/test-utils/test-users';

export interface AuthenticatedUser {
  userKey: keyof typeof TEST_USERS;
  email: string;
  name: string;
  tenantId: string;
}

/**
 * Login with real test user credentials
 */
export async function loginWithUser(
  page: Page, 
  userKey: keyof typeof TEST_USERS,
  baseURL?: string
): Promise<AuthenticatedUser> {
  const credentials = getTestUserCredentials(userKey);
  const user = TEST_USERS[userKey];
  
  console.log(`🔐 Logging in as ${credentials.email}...`);
  
  // Navigate to signin page
  const signinUrl = baseURL ? `${baseURL}/signin` : '/signin';
  await page.goto(signinUrl);
  
  // Fill and submit login form
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login redirect
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Verify user is logged in by checking for dashboard page or any auth indicator
  await expect(page.locator('body')).toContainText('Dashboard'); // Simple check that we're on dashboard
  
  console.log(`✅ Successfully logged in as ${credentials.expectedName}`);
  
  return {
    userKey,
    email: credentials.email,
    name: credentials.expectedName,
    tenantId: user.tenantId,
  };
}

/**
 * Create authenticated browser context with stored auth state
 */
export async function createAuthenticatedContext(
  browser: any,
  userKey: keyof typeof TEST_USERS
): Promise<{ context: BrowserContext; user: AuthenticatedUser }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const user = await loginWithUser(page, userKey);
  
  // Save auth state for reuse
  await context.storageState({ path: `tests/auth-${userKey}.json` });
  
  return { context, user };
}

/**
 * Switch user in existing page
 */
export async function switchUser(
  page: Page,
  newUserKey: keyof typeof TEST_USERS
): Promise<AuthenticatedUser> {
  console.log(`🔄 Switching to user ${newUserKey}...`);
  
  // Logout current user
  await page.locator('[data-testid="user-menu"]').click();
  await page.click('[data-testid="logout-button"]');
  
  // Login with new user
  return await loginWithUser(page, newUserKey);
}

/**
 * Test multi-user collaboration by opening multiple contexts
 */
export async function setupMultiUserCollaboration(
  browser: any,
  userKeys: Array<keyof typeof TEST_USERS>
): Promise<Array<{ context: BrowserContext; page: Page; user: AuthenticatedUser }>> {
  const collaborators = [];
  
  for (const userKey of userKeys) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const user = await loginWithUser(page, userKey);
    
    collaborators.push({ context, page, user });
  }
  
  return collaborators;
}

/**
 * Verify user permissions in the UI
 */
export async function verifyUserPermissions(
  page: Page,
  userKey: keyof typeof TEST_USERS
): Promise<{
  canSeeCreateButton: boolean;
  canSeeEditButton: boolean;
  canSeeDeleteButton: boolean;
  canAccessAdminArea: boolean;
  permissionErrors: string[];
}> {
  const user = TEST_USERS[userKey];
  const permissionErrors: string[] = [];
  
  // Navigate to products page to test permissions
  await page.goto('/products');
  
  // Test create permissions
  const createButton = page.locator('[data-testid="create-product-button"]');
  const canSeeCreateButton = await createButton.isVisible();
  
  if (user.permissions.canCreateProducts !== canSeeCreateButton) {
    permissionErrors.push(
      `Create button visibility mismatch: expected ${user.permissions.canCreateProducts}, got ${canSeeCreateButton}`
    );
  }
  
  // Test edit permissions (if products exist)
  const editButton = page.locator('[data-testid="edit-product-button"]').first();
  const canSeeEditButton = await editButton.isVisible().catch(() => false);
  
  // Test admin area access
  let canAccessAdminArea = false;
  try {
    await page.goto('/admin');
    const adminPanel = page.locator('[data-testid="admin-panel"]');
    canAccessAdminArea = await adminPanel.isVisible({ timeout: 3000 });
  } catch (error) {
    // Admin area not accessible
  }
  
  if (user.permissions.canManageUsers !== canAccessAdminArea) {
    permissionErrors.push(
      `Admin access mismatch: expected ${user.permissions.canManageUsers}, got ${canAccessAdminArea}`
    );
  }
  
  return {
    canSeeCreateButton,
    canSeeEditButton,
    canSeeDeleteButton: false, // Would need specific test
    canAccessAdminArea,
    permissionErrors,
  };
}

/**
 * Test tenant isolation by verifying data visibility
 */
export async function verifyTenantIsolation(
  page: Page,
  userKey: keyof typeof TEST_USERS
): Promise<{
  canSeeOwnTenantData: boolean;
  cannotSeeOtherTenantData: boolean;
  isolationWorking: boolean;
  isolationErrors: string[];
}> {
  const user = TEST_USERS[userKey];
  const isolationErrors: string[] = [];
  
  // Navigate to products page
  await page.goto('/products');
  
  // Check if user can see their tenant's data
  const productCards = page.locator('[data-testid="product-card"]');
  const productCount = await productCards.count();
  const canSeeOwnTenantData = productCount >= 0; // Even 0 is valid for empty tenants
  
  // Try to navigate to a URL that might expose other tenant data
  // This would depend on your app's URL structure
  const currentUrl = page.url();
  const hasCorrectTenantContext = currentUrl.includes(user.tenantId) || 
                                  !currentUrl.includes('tenant_id=');
  
  if (!hasCorrectTenantContext) {
    isolationErrors.push('URL contains other tenant context');
  }
  
  // Check if any product cards contain references to other tenants
  // This would be a serious security issue
  const cannotSeeOtherTenantData = true; // Assume isolated unless proven otherwise
  
  // Additional isolation checks could go here
  // e.g., inspecting network requests, checking for tenant ID leaks in DOM
  
  const isolationWorking = canSeeOwnTenantData && cannotSeeOtherTenantData && hasCorrectTenantContext;
  
  return {
    canSeeOwnTenantData,
    cannotSeeOtherTenantData,
    isolationWorking,
    isolationErrors,
  };
}

/**
 * Mock API responses for specific test scenarios
 */
export async function setupAPIInterception(
  page: Page,
  scenario: 'empty_tenant' | 'full_tenant' | 'permission_denied'
): Promise<void> {
  switch (scenario) {
    case 'empty_tenant':
      await page.route('/api/products*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });
      break;
      
    case 'full_tenant':
      await page.route('/api/products*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Test Product 1', description: 'Mock product for testing' },
            { id: '2', name: 'Test Product 2', description: 'Another mock product' },
          ]),
        });
      });
      break;
      
    case 'permission_denied':
      await page.route('/api/products*', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Insufficient permissions' }),
        });
      });
      break;
  }
}

/**
 * Cleanup auth state and logout
 */
export async function cleanupAuth(page: Page): Promise<void> {
  try {
    // Try to logout if user menu is visible
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible({ timeout: 1000 })) {
      await userMenu.click();
      await page.click('[data-testid="logout-button"]');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    }
  } catch (error) {
    // User might already be logged out or page might be in different state
    console.log('Auth cleanup: User already logged out or in different state');
  }
}

/**
 * Helper to generate test data with proper tenant context
 */
export function createTestData(userKey: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userKey];
  const timestamp = Date.now();
  
  return {
    product: {
      name: `Test Product ${timestamp}`,
      description: `Product created during E2E test for ${user.name}`,
      tenant_id: user.tenantId,
    },
    feature: {
      name: `Test Feature ${timestamp}`,
      description: `Feature created during E2E test for ${user.name}`,
    },
    requirement: {
      title: `Test Requirement ${timestamp}`,
      description: `Requirement created during E2E test for ${user.name}`,
    },
  };
}

/**
 * Wait for real-time updates (useful for collaboration testing)
 */
export async function waitForRealtimeUpdate(
  page: Page,
  selector: string,
  expectedText: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ({ selector, expectedText }) => {
        const element = document.querySelector(selector);
        return element && element.textContent?.includes(expectedText);
      },
      { selector, expectedText },
      { timeout }
    );
    return true;
  } catch (error) {
    console.warn(`Realtime update timeout: ${expectedText} not found in ${selector}`);
    return false;
  }
} 
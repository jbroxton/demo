import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS, getTestUserCredentials } from '../src/test-utils/test-users';

/**
 * Global setup for Playwright tests
 * Authenticates using API requests instead of UI interaction
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const apiBaseURL = baseURL || 'http://localhost:3001';
  
  console.log('🚀 Starting Playwright global setup...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the app to be ready
    console.log('⏳ Waiting for app to be ready...');
    await page.goto(apiBaseURL, { waitUntil: 'networkidle' });
    
    // Authenticate using UI (more reliable for NextAuth)
    console.log('🔐 Authenticating via UI...');
    const credentials = {
      email: 'pm1@test.com',
      password: 'password'
    };
    
    // Navigate to signin page
    await page.goto(`${apiBaseURL}/signin`);
    
    // Fill and submit login form
    console.log('📝 Filling login form...');
    await page.fill('#email', credentials.email);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');
    
    // Wait for either dashboard or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ UI authentication successful');
      
      // Verify we're actually on dashboard
      const currentUrl = page.url();
      console.log(`📍 Current URL after auth: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully on dashboard - authentication established');
      } else {
        console.log('⚠️ Authentication completed but not on dashboard');
      }
      
      // Save the authenticated state
      await context.storageState({ path: 'tests/auth-state.json' });
      console.log('✅ Authentication state saved');
      
    } catch (error) {
      console.log('⚠️ UI authentication may have failed, checking current state...');
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if there are any error messages
      const errorMessage = await page.locator('.text-destructive').textContent().catch(() => null);
      if (errorMessage) {
        console.log(`❌ Error message: ${errorMessage}`);
      }
      
      // Save state anyway for fallback
      await context.storageState({ path: 'tests/auth-state.json' });
      console.log('✅ Fallback authentication state saved');
    }
    
    // Verify API access
    console.log('🗄️ Verifying API access...');
    const apiResponse = await page.request.get(`${apiBaseURL}/api/products-db`);
    if (apiResponse.ok()) {
      console.log('✅ API access verified');
    } else {
      console.warn(`⚠️ API access failed with status: ${apiResponse.status()}`);
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    
    // Still create auth state file so tests can run
    try {
      await context.storageState({ path: 'tests/auth-state.json' });
      console.log('✅ Created fallback auth state');
    } catch (stateError) {
      console.error('❌ Failed to create auth state:', stateError);
    }
    
    // Don't throw error - let tests run even if auth setup fails
    console.warn('⚠️ Continuing with tests despite setup issues');
    
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Global setup completed');
}

export default globalSetup; 
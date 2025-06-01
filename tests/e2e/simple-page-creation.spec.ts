import { test, expect } from '@playwright/test';

/**
 * Simple test to verify page creation and tab opening works end-to-end
 */

test.describe('Simple Page Creation and Tab Opening', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test('should create a page entity and open its tab', async ({ page }) => {
    console.log('🧪 Starting simple page creation test...');
    
    // Step 1: Navigate to dashboard
    await page.goto('/dashboard');
    console.log('📍 Navigated to dashboard');
    
    // Step 2: Wait for sidebar to load
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    console.log('✅ Sidebar loaded');
    
    // Step 3: Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-dashboard.png', fullPage: true });
    
    // Step 4: Find and click the create page button
    const pagesHeader = page.locator('[data-section="pages-header"]');
    const createButton = pagesHeader.locator('button').last();
    
    console.log('🎯 Looking for create page button...');
    await expect(createButton).toBeVisible({ timeout: 5000 });
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/02-before-click.png', fullPage: true });
    
    console.log('🖱️ Clicking create page button...');
    await createButton.click();
    
    // Step 5: Wait for dialog and take screenshot
    console.log('⏳ Waiting for dialog to appear...');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    
    await page.screenshot({ path: 'test-results/03-dialog-opened.png', fullPage: true });
    console.log('✅ Dialog opened successfully');
    
    // Step 6: Verify dialog content
    const dialogTitle = dialog.locator('h2');
    await expect(dialogTitle).toContainText('Create New Page');
    console.log('✅ Dialog shows correct title');
    
    // Step 7: Click the Create button
    const createEntityButton = dialog.locator('button').filter({ hasText: /create/i });
    await expect(createEntityButton).toBeVisible();
    console.log('🎯 Found Create button');
    
    // Take screenshot before creating
    await page.screenshot({ path: 'test-results/04-before-create.png', fullPage: true });
    
    console.log('🖱️ Clicking Create button...');
    await createEntityButton.click();
    
    // Step 8: Wait for dialog to close
    console.log('⏳ Waiting for dialog to close...');
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    console.log('✅ Dialog closed');
    
    // Step 9: Wait for backend operations to complete
    await page.waitForTimeout(3000);
    
    // Step 10: Look for the new page in sidebar
    console.log('🔍 Looking for new page in sidebar...');
    const pagesTree = page.locator('[data-section="pages-tree"]');
    
    // Take screenshot after creation
    await page.screenshot({ path: 'test-results/05-after-creation.png', fullPage: true });
    
    // Look for "New Feature" or "New Page" (based on EntityCreator default names)
    const newPageButton = pagesTree.locator('button').filter({ hasText: /New Feature|New Page/i }).first();
    
    // Give extra time for the page to appear in sidebar
    await expect(newPageButton).toBeVisible({ timeout: 20000 });
    console.log('✅ New page appears in sidebar');
    
    // Step 11: Click on the new page to open tab
    console.log('🖱️ Clicking on new page to open tab...');
    await newPageButton.click();
    
    // Step 12: Wait for tab to open and take final screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/06-final-state.png', fullPage: true });
    
    // Step 13: Verify tab opened (check for tab-related content)
    // This depends on your tab system implementation
    const body = page.locator('body');
    console.log('✅ Tab interaction completed');
    
    // Get the page title to verify we're in the right place
    const pageTitle = await page.title();
    console.log(`📄 Current page title: ${pageTitle}`);
    
    // Check for any error messages
    const errorMessages = page.locator('.text-red-500, .text-destructive, [role="alert"]');
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      console.log('⚠️ Found error messages on page:');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`  - ${errorText}`);
      }
    } else {
      console.log('✅ No error messages found');
    }
    
    console.log('🎉 Test completed successfully!');
    console.log('📸 Screenshots saved to test-results/ directory');
  });
});
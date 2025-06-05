import { test, expect } from '@playwright/test';

test.describe('Debug Feedback Creation', () => {
  test('debug feedback creation step by step', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="pages-section"]');
    
    console.log('✅ Dashboard loaded');
    
    // Click feedback button in sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    console.log('✅ Clicked feedback button');
    
    // Wait for nested sidebar to appear
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    console.log('✅ Feedback sidebar opened');
    
    // Take a screenshot before clicking create
    await page.screenshot({ path: 'debug-before-create.png' });
    
    // Check if the "New" button exists
    const createButton = page.locator('[data-testid="feedback-create-button"]');
    await expect(createButton).toBeVisible();
    console.log('✅ Create button is visible');
    
    // Click create new feedback button
    await createButton.click();
    console.log('✅ Clicked create button');
    
    // Wait a moment for any async operations
    await page.waitForTimeout(2000);
    
    // Take a screenshot after clicking create
    await page.screenshot({ path: 'debug-after-create.png' });
    
    // Check for console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Try to find the page title input with a longer timeout
    try {
      await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 10000 });
      console.log('✅ Page title input found');
    } catch (error) {
      console.log('❌ Page title input not found');
      
      // Check for any tabs
      const tabs = await page.locator('[data-testid^="tab-"]').count();
      console.log(`📝 Number of tabs found: ${tabs}`);
      
      // Check for canvas content
      const canvas = page.locator('[data-testid="main-content-area"]');
      if (await canvas.isVisible()) {
        const canvasText = await canvas.textContent();
        console.log(`📝 Canvas content: ${canvasText}`);
      }
      
      // Check for any error messages
      const errorMessages = await page.locator('[class*="error"], [class*="Error"]').count();
      console.log(`📝 Error elements found: ${errorMessages}`);
      
      throw error;
    }
  });
});
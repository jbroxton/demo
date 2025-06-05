import { test, expect } from '@playwright/test';

test.describe('Debug Feedback Creation - Simple', () => {
  test('test feedback creation with console logs', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🎯')) {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Navigate to the dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="pages-section"]');

    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');

    console.log('About to click feedback create button...');

    // Click create new feedback button and wait for any feedback-related logs
    await page.click('[data-testid="feedback-create-button"]');

    console.log('Clicked feedback create button, waiting for logs...');

    // Wait a moment for the async operations
    await page.waitForTimeout(5000);

    // Print feedback-related console logs
    console.log('Feedback-related console logs:', consoleLogs);

    // Check if we can find the title input
    const titleInput = page.locator('[data-testid="page-title-input"]');
    const isVisible = await titleInput.isVisible();
    console.log('Title input visible:', isVisible);

    if (isVisible) {
      const inputValue = await titleInput.inputValue();
      console.log('Title input value:', inputValue);
      console.log('Expected value for feedback: "Untitled Feedback"');
      
      if (inputValue !== 'Untitled Feedback') {
        console.log('❌ WRONG VALUE - This is not a new feedback tab!');
      } else {
        console.log('✅ CORRECT VALUE - New feedback tab created');
      }
    }

    // Check for active tab title in tabs container
    const activeTab = page.locator('[data-testid^="tab-"][class*="active"], [data-testid^="tab-"][class*="selected"]');
    if (await activeTab.count() > 0) {
      const activeTabText = await activeTab.first().textContent();
      console.log('Active tab text:', activeTabText);
    }

    // Check tabs
    const tabs = await page.locator('[data-testid^="tab-"]').count();
    console.log('Number of tabs:', tabs);
  });
});
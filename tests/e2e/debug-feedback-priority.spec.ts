import { test, expect } from '@playwright/test';

test.describe('Debug Feedback Priority Select', () => {
  test('test what priority elements are available', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="pages-section"]');

    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');

    // Click create new feedback button
    await page.click('[data-testid="feedback-create-button"]');

    // Wait for the new feedback tab to open
    await page.waitForSelector('[data-testid="page-title-input"]');

    // Wait for feedback metadata section
    await page.waitForSelector('[data-testid="feedback-metadata-section"]');

    // Check what priority-related elements exist
    const prioritySelect = page.locator('[data-testid="feedback-priority-select"]');
    const priorityTrigger = page.locator('[data-testid="feedback-priority-select-trigger"]');
    
    console.log('Priority select count:', await prioritySelect.count());
    console.log('Priority trigger count:', await priorityTrigger.count());
    
    console.log('Priority select visible:', await prioritySelect.isVisible());
    console.log('Priority trigger visible:', await priorityTrigger.isVisible());

    // Try clicking the trigger instead
    if (await priorityTrigger.isVisible()) {
      await priorityTrigger.click();
      console.log('Clicked priority trigger');
      
      // Wait for dropdown to open
      await page.waitForTimeout(1000);
      
      // Check if High option appears
      const highOption = page.locator('text=High');
      console.log('High option count:', await highOption.count());
      console.log('High option visible:', await highOption.isVisible());
    }
  });
});
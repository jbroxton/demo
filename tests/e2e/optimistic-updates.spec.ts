/**
 * Playwright E2E Tests for Optimistic Updates
 * 
 * Tests real browser interactions to verify optimistic updates work correctly
 * across all UI components (tabs, sidebar, page editor).
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Optimistic Updates E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test.describe('Cross-Component Title Synchronization', () => {
    test('should sync page title changes across tabs, sidebar, and editor', async ({ page }) => {
      // Create or open a page for testing
      await createTestPage(page);
      
      // Verify initial state
      const titleInput = page.locator('input[placeholder="Untitled"]');
      const initialTitle = await titleInput.inputValue();
      expect(initialTitle).toBeTruthy();

      // Change title in page editor
      const newTitle = `Updated Title ${Date.now()}`;
      await page.locator('input[placeholder="Untitled"]').fill(newTitle);
      
      // Wait a bit for debouncing
      await page.waitForTimeout(400);

      // Verify title updates in tab immediately (optimistic)
      const tabTitle = await page.locator('[data-tab-state="active"] span').textContent();
      expect(tabTitle).toBe(newTitle);

      // Verify title updates in sidebar if visible
      const sidebarPageLink = page.locator(`[data-entity-name="${newTitle}"]`).first();
      if (await sidebarPageLink.isVisible()) {
        expect(await sidebarPageLink.textContent()).toBe(newTitle);
      }

      // Wait for network request to complete
      await page.waitForResponse(response => 
        response.url().includes('/api/pages-db') && 
        response.status() === 200
      );
    });

    test('should handle inline tab editing and sync to page editor', async ({ page }) => {
      await createTestPage(page);

      // Find the active tab and trigger inline editing
      const activeTab = page.locator('[data-tab-state="active"]');
      await activeTab.hover();
      
      // Click the edit button (pencil icon)
      const editButton = activeTab.locator('[data-action="edit-tab"]');
      await editButton.click();

      // Edit the tab title inline
      const newTitle = `Tab Edited ${Date.now()}`;
      const editInput = activeTab.locator('input');
      await editInput.fill(newTitle);
      await editInput.press('Enter');

      // Verify the page editor title input updates
      await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(newTitle);

      // Verify network request was made
      await page.waitForResponse(response => 
        response.url().includes('/api/pages-db') && 
        response.status() === 200
      );
    });
  });

  test.describe('TipTap Editor Content Auto-Save', () => {
    test('should auto-save content changes with proper debouncing', async ({ page }) => {
      await createTestPage(page);

      // Find the TipTap editor
      const editor = page.locator('.ProseMirror').first();
      await editor.click();

      // Add content to the editor
      const testContent = `Test content added at ${Date.now()}`;
      await editor.fill(testContent);

      // Wait for debouncing (800ms for content)
      await page.waitForTimeout(1000);

      // Verify network request was made for content save
      await page.waitForResponse(response => 
        response.url().includes('/api/pages-db') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );

      // Refresh the page to verify content persisted
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Content should still be there
      const persistedContent = await page.locator('.ProseMirror').first().textContent();
      expect(persistedContent).toContain(testContent);
    });

    test('should handle rapid typing without overwhelming API', async ({ page }) => {
      await createTestPage(page);

      // Track network requests
      const apiCalls: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/pages-db') && request.method() === 'PATCH') {
          apiCalls.push(request.url());
        }
      });

      const editor = page.locator('.ProseMirror').first();
      await editor.click();

      // Simulate rapid typing
      await editor.type('Rapid typing test', { delay: 50 });
      await editor.type(' with more content', { delay: 30 });
      await editor.type(' and even more!', { delay: 20 });

      // Wait for debouncing to complete
      await page.waitForTimeout(1200);

      // Should have limited API calls due to debouncing
      expect(apiCalls.length).toBeLessThan(5); // Reasonable limit for debounced calls
    });
  });

  test.describe('Network Resilience and Error Handling', () => {
    test('should show optimistic updates even with slow network', async ({ page }) => {
      // Slow down network to simulate poor connection
      await page.route('/api/pages-db*', async route => {
        await page.waitForTimeout(2000); // 2 second delay
        await route.continue();
      });

      await createTestPage(page);

      const newTitle = `Slow Network Title ${Date.now()}`;
      
      // Change title
      await page.locator('input[placeholder="Untitled"]').fill(newTitle);
      
      // Title should update immediately in UI (optimistic)
      await expect(page.locator('[data-tab-state="active"] span')).toHaveText(newTitle, { timeout: 1000 });

      // Wait for actual network request to complete
      await page.waitForResponse(response => 
        response.url().includes('/api/pages-db') && 
        response.status() === 200,
        { timeout: 5000 }
      );
    });

    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('/api/pages-db*', route => route.abort('failed'));

      await createTestPage(page);

      const newTitle = `Failed Network Title ${Date.now()}`;
      
      // Change title
      await page.locator('input[placeholder="Untitled"]').fill(newTitle);

      // UI should still update optimistically
      await expect(page.locator('[data-tab-state="active"] span')).toHaveText(newTitle, { timeout: 1000 });

      // Should handle the error gracefully (no crashes)
      await page.waitForTimeout(1000);
      
      // Page should still be functional
      expect(await page.isVisible('input[placeholder="Untitled"]')).toBe(true);
    });
  });

  test.describe('Performance Under Load', () => {
    test('should remain responsive during multiple rapid edits', async ({ page }) => {
      await createTestPage(page);

      // Perform multiple rapid edits
      for (let i = 0; i < 5; i++) {
        const title = `Rapid Edit ${i} ${Date.now()}`;
        await page.locator('input[placeholder="Untitled"]').fill(title);
        await page.waitForTimeout(100); // Small delay between edits
      }

      // UI should remain responsive
      const finalTitle = `Final Title ${Date.now()}`;
      await page.locator('input[placeholder="Untitled"]').fill(finalTitle);
      
      // Should still update optimistically
      await expect(page.locator('[data-tab-state="active"] span')).toHaveText(finalTitle, { timeout: 1000 });
    });

    test('should handle multiple component edits simultaneously', async ({ page }) => {
      await createTestPage(page);

      // Open multiple tabs with the same page (if possible)
      // Or test multiple components editing same data
      
      const title1 = `Editor Title ${Date.now()}`;
      const title2 = `Tab Title ${Date.now() + 1}`;

      // Edit in page editor
      await page.locator('input[placeholder="Untitled"]').fill(title1);
      
      // Quickly edit in tab (simulate concurrent editing)
      const activeTab = page.locator('[data-tab-state="active"]');
      await activeTab.hover();
      const editButton = activeTab.locator('[data-action="edit-tab"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        const editInput = activeTab.locator('input');
        await editInput.fill(title2);
        await editInput.press('Enter');
      }

      // Last edit should win
      await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(title2, { timeout: 2000 });
    });
  });

  test.describe('Component State Consistency', () => {
    test('should maintain consistent state after page refresh', async ({ page }) => {
      await createTestPage(page);

      const newTitle = `Persistent Title ${Date.now()}`;
      const newContent = `Persistent content ${Date.now()}`;

      // Edit title and content
      await page.locator('input[placeholder="Untitled"]').fill(newTitle);
      
      const editor = page.locator('.ProseMirror').first();
      await editor.click();
      await editor.fill(newContent);

      // Wait for saves to complete
      await page.waitForTimeout(1500);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // State should be consistent
      await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(newTitle);
      
      const persistedContent = await page.locator('.ProseMirror').first().textContent();
      expect(persistedContent).toContain(newContent);
    });

    test('should handle browser back/forward navigation correctly', async ({ page }) => {
      await createTestPage(page);

      const originalTitle = await page.locator('input[placeholder="Untitled"]').inputValue();
      
      // Edit the title
      const newTitle = `Navigation Title ${Date.now()}`;
      await page.locator('input[placeholder="Untitled"]').fill(newTitle);
      await page.waitForTimeout(500);

      // Navigate away and back
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Title should be preserved
      await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue(newTitle);
    });
  });
});

// Helper function to create a test page
async function createTestPage(page: Page) {
  // Check if we're already on a page editor
  const pageEditor = page.locator('input[type="text"]').filter({ hasText: /untitled/i }).or(
    page.locator('input[placeholder="Untitled"]')
  );
  
  if (await pageEditor.isVisible()) {
    // Already on a page editor
    return;
  }

  console.log('Looking for existing pages or page creation options...');

  // Option 1: Click on an existing page in sidebar
  const existingPageButton = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
  if (await existingPageButton.isVisible({ timeout: 5000 })) {
    console.log('Found existing page, clicking...');
    await existingPageButton.click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're now on a page editor
    const titleInput = page.locator('input[placeholder="Untitled"]');
    if (await titleInput.isVisible({ timeout: 5000 })) {
      console.log('Successfully navigated to existing page');
      return;
    }
  }

  // Option 2: Create a new page using EntityCreator
  console.log('No existing pages found, trying to create a new page...');
  const createPageButton = page.locator('[data-section="pages-header"] button').last(); // EntityCreator button
  if (await createPageButton.isVisible({ timeout: 5000 })) {
    console.log('Found create page button, clicking...');
    await createPageButton.click();
    
    // Wait for dialog and fill it out
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible({ timeout: 5000 })) {
      console.log('Dialog opened, filling out page creation form...');
      
      // Select page type (default should be fine)
      const pageTypeSelect = dialog.locator('select, [role="combobox"]').first();
      if (await pageTypeSelect.isVisible({ timeout: 2000 })) {
        await pageTypeSelect.click();
        // Select "product" or the first available option
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible({ timeout: 2000 })) {
          await firstOption.click();
        }
      }
      
      // Click create button
      const createButton = dialog.locator('button').filter({ hasText: /create/i }).first();
      if (await createButton.isVisible({ timeout: 2000 })) {
        console.log('Clicking create button...');
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're now on a page editor
        const titleInput = page.locator('input[placeholder="Untitled"]');
        if (await titleInput.isVisible({ timeout: 5000 })) {
          console.log('Successfully created and navigated to new page');
          return;
        }
      }
    }
  }

  // Option 3: Use URL navigation as fallback (if we know the pattern)
  console.log('Trying direct navigation...');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Check again if any pages are now visible
  const pagesList = page.locator('[data-entity-type="page"]');
  const pageCount = await pagesList.count();
  console.log(`Found ${pageCount} pages after navigation`);
  
  if (pageCount > 0) {
    const firstPageButton = pagesList.first().locator('[data-action="open-tab"]');
    if (await firstPageButton.isVisible({ timeout: 3000 })) {
      await firstPageButton.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }

  // If still no page available, provide helpful error
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-createTestPage-failure.png', fullPage: true });
  
  throw new Error(`Could not create or navigate to a test page. Current URL: ${currentUrl}. Please check the dashboard has pages or page creation is working.`);
}

// Additional test utilities
test.describe('Test Utilities Validation', () => {
  test('createTestPage utility should work correctly', async ({ page }) => {
    await createTestPage(page);
    
    // Should have a page editor visible
    await expect(page.locator('input[placeholder="Untitled"]')).toBeVisible();
  });
});
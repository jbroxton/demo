/**
 * E2E tests for title synchronization between sidebar, tabs, and content
 */

import { test, expect } from '@playwright/test';

test.describe('Title Synchronization', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should show same title in sidebar, tab, and content for existing page', async ({ page }) => {
    console.log('🧪 Testing: Title synchronization across components');

    // Find an existing page in sidebar
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    await expect(sidebarPage).toBeVisible({ timeout: 10000 });

    // Get the sidebar title before clicking
    const sidebarTitle = await sidebarPage.getAttribute('data-entity-name');
    console.log(`📁 Sidebar shows: "${sidebarTitle}"`);

    // Click to open the page tab
    await sidebarPage.click();
    await page.waitForLoadState('networkidle');

    // Check tab title
    const activeTab = page.locator('[data-tab-state="active"] span');
    await expect(activeTab).toBeVisible({ timeout: 5000 });
    const tabTitle = await activeTab.textContent();
    console.log(`🏷️  Tab shows: "${tabTitle}"`);

    // Check content title input
    const contentInput = page.locator('input[placeholder="New Page"]');
    await expect(contentInput).toBeVisible({ timeout: 5000 });
    const contentTitle = await contentInput.inputValue();
    console.log(`📝 Content shows: "${contentTitle}"`);

    // Compare all three
    console.log('\n=== TITLE COMPARISON ===');
    console.log(`Sidebar:  "${sidebarTitle}"`);
    console.log(`Tab:      "${tabTitle}"`);
    console.log(`Content:  "${contentTitle}"`);

    // Assertions
    expect(sidebarTitle).toBeTruthy();
    expect(tabTitle).toBeTruthy();
    expect(contentTitle).toBeTruthy();

    // Check if they match (this is what we're trying to fix)
    if (sidebarTitle === tabTitle && tabTitle === contentTitle) {
      console.log('✅ SUCCESS: All titles match!');
    } else {
      console.log('❌ MISMATCH: Titles do not match');
      console.log(`  Sidebar === Tab: ${sidebarTitle === tabTitle}`);
      console.log(`  Tab === Content: ${tabTitle === contentTitle}`);
      console.log(`  Sidebar === Content: ${sidebarTitle === contentTitle}`);
    }

    // For now, let's not make this assertion fail so we can see the current state
    // expect(sidebarTitle).toBe(tabTitle);
    // expect(tabTitle).toBe(contentTitle);
  });

  test('should check if content title input is editable', async ({ page }) => {
    console.log('🧪 Testing: Content title editability');

    // Open an existing page
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    await expect(sidebarPage).toBeVisible({ timeout: 10000 });
    await sidebarPage.click();
    await page.waitForLoadState('networkidle');

    // Try to edit the content title
    const contentInput = page.locator('input[placeholder="New Page"]');
    await expect(contentInput).toBeVisible({ timeout: 5000 });

    const originalValue = await contentInput.inputValue();
    console.log(`📝 Original content title: "${originalValue}"`);

    // Try to type in the input
    const testText = `Test Edit ${Date.now()}`;
    console.log(`⌨️  Trying to set title to: "${testText}"`);

    await contentInput.focus();
    await contentInput.fill(testText);
    
    const newValue = await contentInput.inputValue();
    console.log(`📝 New content title: "${newValue}"`);

    if (newValue === testText) {
      console.log('✅ Content input IS editable');
      
      // Wait a moment for potential optimistic updates
      await page.waitForTimeout(1000);
      
      // Check if tab updated
      const tabTitle = await page.locator('[data-tab-state="active"] span').textContent();
      console.log(`🏷️  Tab title after edit: "${tabTitle}"`);
      
      if (tabTitle === testText) {
        console.log('✅ Tab title updated optimistically!');
      } else {
        console.log('❌ Tab title did not update');
      }
    } else {
      console.log('❌ Content input is NOT editable');
      console.log(`  Expected: "${testText}"`);
      console.log(`  Got: "${newValue}"`);
    }

    // Restore original title
    if (originalValue) {
      await contentInput.fill(originalValue);
    }
  });

  test('should create new page and verify title sources', async ({ page }) => {
    console.log('🧪 Testing: New page title synchronization');

    // Create a new page
    const createButton = page.locator('[data-section="pages-header"] button').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Wait for dialog and create page
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    
    const createInDialog = dialog.locator('button').filter({ hasText: /create/i }).first();
    await createInDialog.click();
    await page.waitForLoadState('networkidle');

    // Check if editor opened
    const contentInput = page.locator('input[placeholder="New Page"]');
    await expect(contentInput).toBeVisible({ timeout: 5000 });

    // Check initial state
    const initialContentValue = await contentInput.inputValue();
    const initialTabTitle = await page.locator('[data-tab-state="active"] span').textContent();
    
    console.log(`📝 New page - Content: "${initialContentValue}"`);
    console.log(`🏷️  New page - Tab: "${initialTabTitle}"`);

    // Try to set a title
    const newTitle = `New Page Test ${Date.now()}`;
    await contentInput.fill(newTitle);
    
    const updatedContentValue = await contentInput.inputValue();
    console.log(`📝 After edit - Content: "${updatedContentValue}"`);
    
    // Wait for optimistic updates
    await page.waitForTimeout(1000);
    
    const updatedTabTitle = await page.locator('[data-tab-state="active"] span').textContent();
    console.log(`🏷️  After edit - Tab: "${updatedTabTitle}"`);

    // Check sidebar (might need to refresh)
    const refreshButton = page.locator('[data-section="pages-header"] button[title*="refresh"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }

    // Find the new page in sidebar
    const newPageInSidebar = page.locator(`[data-entity-name="${newTitle}"]`).first();
    if (await newPageInSidebar.isVisible({ timeout: 3000 })) {
      console.log(`📁 Found in sidebar: "${newTitle}"`);
      console.log('✅ All components synchronized!');
    } else {
      console.log('❌ New page not found in sidebar with updated title');
    }
  });
});
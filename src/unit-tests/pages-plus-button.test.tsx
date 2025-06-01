/**
 * Playwright E2E Test: Pages Plus Button Functionality
 * 
 * Tests the enhanced pages "+" button that:
 * - Single click: Creates Feature page by default
 * - Right click: Shows context menu with Product, Release, Roadmap options
 */

import { test, expect } from '@playwright/test';

test.describe('Pages Plus Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load and ensure we're authenticated
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    
    // Clear any existing pages for clean testing
    // This might need adjustment based on your app's reset mechanism
    console.log('Test setup complete - app loaded');
  });

  test('single click creates Feature page by default', async ({ page }) => {
    console.log('🧪 Testing single-click Feature creation...');
    
    // Find the pages "+" button
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first(); // Plus icon button
    
    // Verify the button exists and has correct tooltip
    await expect(plusButton).toBeVisible();
    await expect(plusButton).toHaveAttribute('title', 'Add Feature (right-click for more options)');
    
    // Count existing tabs before clicking
    const initialTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    console.log(`Initial tab count: ${initialTabCount}`);
    
    // Single click the plus button
    await plusButton.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(1000); // Give time for the page creation and tab opening
    
    // Verify a new tab was created
    const newTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    console.log(`New tab count: ${newTabCount}`);
    expect(newTabCount).toBe(initialTabCount + 1);
    
    // Verify the new tab is a Feature tab
    const newTab = page.locator('[data-component="tab-container"] [role="tab"]').last();
    const tabText = await newTab.textContent();
    console.log(`New tab text: ${tabText}`);
    expect(tabText).toContain('New Feature');
    
    // Verify the tab is active (has aria-selected="true")
    await expect(newTab).toHaveAttribute('aria-selected', 'true');
    
    // Verify we can see the page editor with Feature content
    await expect(page.locator('.unified-page-editor')).toBeVisible();
    
    // Check that the page title shows "New Feature"
    const titleInput = page.locator('.unified-page-editor input[type="text"]');
    await expect(titleInput).toHaveValue('New Feature');
    
    console.log('✅ Single-click Feature creation test passed');
  });

  test('right click shows context menu with page type options', async ({ page }) => {
    console.log('🧪 Testing right-click context menu...');
    
    // Find the pages "+" button
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    
    // Right-click the plus button to open context menu
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu to appear
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });
    
    // Verify context menu is visible
    const contextMenu = page.locator('[role="menu"]');
    await expect(contextMenu).toBeVisible();
    
    // Verify all expected menu items are present
    const expectedItems = ['New Product', 'New Release', 'New Roadmap'];
    
    for (const itemText of expectedItems) {
      const menuItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: itemText });
      await expect(menuItem).toBeVisible();
      console.log(`✓ Found menu item: ${itemText}`);
    }
    
    // Verify Feature is NOT in the context menu (since it's the default single-click action)
    const featureItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Feature' });
    await expect(featureItem).toHaveCount(0);
    
    // Close context menu by clicking elsewhere
    await page.click('body');
    await expect(contextMenu).not.toBeVisible();
    
    console.log('✅ Right-click context menu test passed');
  });

  test('context menu creates Product page correctly', async ({ page }) => {
    console.log('🧪 Testing Product creation from context menu...');
    
    // Find the pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu and click "New Product"
    await page.waitForSelector('[role="menu"]');
    const productMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Product' });
    
    // Count existing tabs before clicking
    const initialTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    
    await productMenuItem.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(1000);
    
    // Verify a new tab was created with "New Product"
    const newTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    const newTab = page.locator('[data-component="tab-container"] [role="tab"]').last();
    const tabText = await newTab.textContent();
    expect(tabText).toContain('New Product');
    
    // Verify the page editor shows Product content
    const titleInput = page.locator('.unified-page-editor input[type="text"]');
    await expect(titleInput).toHaveValue('New Product');
    
    console.log('✅ Product creation from context menu test passed');
  });

  test('context menu creates Release page correctly', async ({ page }) => {
    console.log('🧪 Testing Release creation from context menu...');
    
    // Find the pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu and click "New Release"
    await page.waitForSelector('[role="menu"]');
    const releaseMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Release' });
    
    // Count existing tabs before clicking
    const initialTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    
    await releaseMenuItem.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(1000);
    
    // Verify a new tab was created with "New Release"
    const newTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    const newTab = page.locator('[data-component="tab-container"] [role="tab"]').last();
    const tabText = await newTab.textContent();
    expect(tabText).toContain('New Release');
    
    // Verify the page editor shows Release content
    const titleInput = page.locator('.unified-page-editor input[type="text"]');
    await expect(titleInput).toHaveValue('New Release');
    
    console.log('✅ Release creation from context menu test passed');
  });

  test('context menu creates Roadmap page correctly', async ({ page }) => {
    console.log('🧪 Testing Roadmap creation from context menu...');
    
    // Find the pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu and click "New Roadmap"
    await page.waitForSelector('[role="menu"]');
    const roadmapMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    
    // Count existing tabs before clicking
    const initialTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    
    await roadmapMenuItem.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(1000);
    
    // Verify a new tab was created with "New Roadmap"
    const newTabCount = await page.locator('[data-component="tab-container"] [role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    const newTab = page.locator('[data-component="tab-container"] [role="tab"]').last();
    const tabText = await newTab.textContent();
    expect(tabText).toContain('New Roadmap');
    
    // Verify the page editor shows Roadmap content
    const titleInput = page.locator('.unified-page-editor input[type="text"]');
    await expect(titleInput).toHaveValue('New Roadmap');
    
    console.log('✅ Roadmap creation from context menu test passed');
  });

  test('button tooltip is correct', async ({ page }) => {
    console.log('🧪 Testing button tooltip...');
    
    // Find the pages "+" button
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    
    // Verify tooltip text
    await expect(plusButton).toHaveAttribute('title', 'Add Feature (right-click for more options)');
    
    console.log('✅ Button tooltip test passed');
  });

  test('context menu items have correct icons', async ({ page }) => {
    console.log('🧪 Testing context menu icons...');
    
    // Find the pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu
    await page.waitForSelector('[role="menu"]');
    const contextMenu = page.locator('[role="menu"]');
    
    // Check that menu items have icons (svg elements)
    const productItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Product' });
    await expect(productItem.locator('svg')).toBeVisible();
    
    const releaseItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Release' });
    await expect(releaseItem.locator('svg')).toBeVisible();
    
    const roadmapItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await expect(roadmapItem.locator('svg')).toBeVisible();
    
    console.log('✅ Context menu icons test passed');
  });

  test('pages appear in sidebar after creation', async ({ page }) => {
    console.log('🧪 Testing pages appear in sidebar...');
    
    // Create a Feature page via single click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.locator('button').filter({ hasText: '' }).first();
    await plusButton.click();
    
    // Wait for page creation
    await page.waitForTimeout(1500);
    
    // Check that the new page appears in the pages tree
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const newPageInSidebar = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'New Feature' });
    
    // Wait a bit more for the sidebar to update
    await page.waitForTimeout(1000);
    
    // The page should appear in the sidebar
    await expect(newPageInSidebar).toBeVisible();
    
    console.log('✅ Pages appear in sidebar test passed');
  });
});
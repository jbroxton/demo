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
    await page.goto('http://localhost:3001/dashboard');
    
    // Wait for the app to load and ensure we're authenticated
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    
    console.log('Test setup complete - app loaded');
  });

  test('single click creates Feature page by default', async ({ page }) => {
    console.log('🧪 Testing single-click Feature creation...');
    
    // Find the main pages "+" button (PageTypeCreator) next to the Pages header
    const pagesSection = page.locator('[data-section="pages-header"]');
    await expect(pagesSection).toBeVisible();
    
    // Target the specific PageTypeCreator button by its tooltip
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await expect(plusButton).toBeVisible();
    
    // Count existing tabs before clicking
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const initialTabCount = await tabContainer.locator('[role="tab"]').count();
    console.log(`Initial tab count: ${initialTabCount}`);
    
    // Single click the plus button
    await plusButton.click();
    
    // Wait for the new tab to appear and page creation to complete
    await page.waitForTimeout(2000);
    
    // Verify a new tab was created
    const newTabCount = await tabContainer.locator('[role="tab"]').count();
    console.log(`New tab count: ${newTabCount}`);
    expect(newTabCount).toBe(initialTabCount + 1);
    
    // Verify the new tab contains "New Feature"
    const allTabs = tabContainer.locator('[role="tab"]');
    const newFeatureTabs = allTabs.filter({ hasText: 'New Feature' });
    await expect(newFeatureTabs).toHaveCount(1);
    
    console.log('✅ Single-click Feature creation test passed');
  });

  test('right click shows context menu with page type options', async ({ page }) => {
    console.log('🧪 Testing right-click context menu...');
    
    // Find the main pages "+" button (PageTypeCreator)
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Right-click the plus button to open context menu
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu to appear
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });
    
    // Verify context menu is visible
    const contextMenu = page.locator('[role="menu"]');
    await expect(contextMenu).toBeVisible();
    
    // Verify expected menu items are present (Feature, Project, and Roadmap)
    const expectedItems = ['New Feature', 'New Project', 'New Roadmap'];
    
    for (const itemText of expectedItems) {
      const menuItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: itemText });
      await expect(menuItem).toBeVisible();
      console.log(`✓ Found menu item: ${itemText}`);
    }
    
    // Verify Product and Release are NOT in the context menu
    const productItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Product' });
    await expect(productItem).toHaveCount(0);
    
    const releaseItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Release' });
    await expect(releaseItem).toHaveCount(0);
    
    // Close context menu by pressing Escape
    await page.keyboard.press('Escape');
    await expect(contextMenu).not.toBeVisible();
    
    console.log('✅ Right-click context menu test passed');
  });

  test('context menu creates Project page correctly', async ({ page }) => {
    console.log('🧪 Testing Project creation from context menu...');
    
    // Find the main pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu and click "New Project"
    await page.waitForSelector('[role="menu"]');
    const projectMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Project' });
    
    // Count existing tabs before clicking
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const initialTabCount = await tabContainer.locator('[role="tab"]').count();
    
    await projectMenuItem.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(2000);
    
    // Verify a new tab was created
    const newTabCount = await tabContainer.locator('[role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    // Verify the newest tab contains "New Project"
    const newestTab = tabContainer.locator('[role="tab"]').last();
    await expect(newestTab).toContainText('New Project');
    
    console.log('✅ Project creation from context menu test passed');
  });

  test('context menu creates Roadmap page correctly', async ({ page }) => {
    console.log('🧪 Testing Roadmap creation from context menu...');
    
    // Find the main pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu and click "New Roadmap"
    await page.waitForSelector('[role="menu"]');
    const roadmapMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    
    // Count existing tabs before clicking
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const initialTabCount = await tabContainer.locator('[role="tab"]').count();
    
    await roadmapMenuItem.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(2000);
    
    // Verify a new tab was created
    const newTabCount = await tabContainer.locator('[role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    // Verify the newest tab contains "New Roadmap"
    const newestTab = tabContainer.locator('[role="tab"]').last();
    await expect(newestTab).toContainText('New Roadmap');
    
    console.log('✅ Roadmap creation from context menu test passed');
  });

  test('button tooltip is correct', async ({ page }) => {
    console.log('🧪 Testing button tooltip...');
    
    // Find the main pages "+" button
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Verify button is visible and has correct tooltip
    await expect(plusButton).toBeVisible();
    
    console.log('✅ Button tooltip test passed');
  });

  test('context menu items have correct icons', async ({ page }) => {
    console.log('🧪 Testing context menu icons...');
    
    // Find the main pages "+" button and right-click
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click({ button: 'right' });
    
    // Wait for context menu
    await page.waitForSelector('[role="menu"]');
    const contextMenu = page.locator('[role="menu"]');
    
    // Check that all menu items have icons (svg elements)
    const featureItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Feature' });
    await expect(featureItem.locator('svg')).toBeVisible();
    
    const projectItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Project' });
    await expect(projectItem.locator('svg')).toBeVisible();
    
    const roadmapItem = contextMenu.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await expect(roadmapItem.locator('svg')).toBeVisible();
    
    console.log('✅ Context menu icons test passed');
  });
});
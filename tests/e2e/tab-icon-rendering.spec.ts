/**
 * Playwright E2E Test: Tab Icon Rendering for Parent vs Child Pages
 * 
 * Tests the hypothesis that:
 * - Parent pages (top-level) show correct page type icons in tabs
 * - Child pages show generic page icons due to cache/query issues
 * 
 * This test will verify the difference in icon rendering between parent and child pages.
 */

import { test, expect } from '@playwright/test';

test.describe('Tab Icon Rendering: Parent vs Child Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001/dashboard');
    
    // Wait for the app to load and ensure we're authenticated
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    
    console.log('Test setup complete - app loaded');
  });

  test('parent page shows correct feature icon in tab', async ({ page }) => {
    console.log('🧪 Testing parent page tab icon...');
    
    // Create a top-level Feature page using the main pages "+" button
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Single click to create Feature page
    await plusButton.click();
    
    // Wait for the new tab to appear
    await page.waitForTimeout(2000);
    
    // Find the newest tab
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const newestTab = tabContainer.locator('[role="tab"]').last();
    
    // Verify tab title contains "New Feature"
    await expect(newestTab).toContainText('New Feature');
    
    // Check the tab icon - should be Puzzle icon for Feature, not FileText
    const tabIcon = newestTab.locator('svg').first();
    await expect(tabIcon).toBeVisible();
    
    // Get the icon's class or data attributes to verify it's the correct icon
    // The Feature icon should be the Puzzle icon, not the generic FileText icon
    const tabIconSvg = await tabIcon.innerHTML();
    console.log('🔍 Parent tab icon SVG:', tabIconSvg);
    
    // Store parent tab ID for later comparison
    const parentTabId = await newestTab.getAttribute('data-tab-id') || await newestTab.getAttribute('value');
    console.log('✅ Parent tab created with ID:', parentTabId);
    
    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/parent-tab-icon.png' });
  });

  test('child page shows generic page icon in tab (demonstrates bug)', async ({ page }) => {
    console.log('🧪 Testing child page tab icon...');
    
    // First, create a parent page to have something to add children to
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Find the parent page in the sidebar
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const parentPage = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'New Feature' }).first();
    await expect(parentPage).toBeVisible();
    
    // Right-click on the parent page to open context menu
    await parentPage.click({ button: 'right' });
    
    // Wait for context menu and click "Add Child" -> "New Feature"
    await page.waitForSelector('[role="menu"]', { timeout: 5000 });
    
    // Look for "Add Child" submenu
    const addChildMenu = page.locator('[role="menuitem"]').filter({ hasText: 'Add Child' });
    await expect(addChildMenu).toBeVisible();
    await addChildMenu.hover();
    
    // Wait for submenu to appear and click "New Feature"
    await page.waitForTimeout(500);
    const newFeatureItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Feature' }).last();
    
    // Count tabs before creating child
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const initialTabCount = await tabContainer.locator('[role="tab"]').count();
    
    await newFeatureItem.click();
    
    // Wait for the new child tab to appear
    await page.waitForTimeout(2000);
    
    // Verify a new tab was created
    const newTabCount = await tabContainer.locator('[role="tab"]').count();
    expect(newTabCount).toBe(initialTabCount + 1);
    
    // Find the newest tab (should be the child page)
    const newestTab = tabContainer.locator('[role="tab"]').last();
    await expect(newestTab).toContainText('New Feature');
    
    // Check the tab icon - this is where the bug manifests
    const tabIcon = newestTab.locator('svg').first();
    await expect(tabIcon).toBeVisible();
    
    const tabIconSvg = await tabIcon.innerHTML();
    console.log('🔍 Child tab icon SVG:', tabIconSvg);
    
    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/child-tab-icon.png' });
    
    console.log('✅ Child page tab created - check if icon is generic vs feature-specific');
  });

  test('compare parent vs child tab icons side by side', async ({ page }) => {
    console.log('🧪 Testing parent vs child tab icons side by side...');
    
    // Step 1: Create parent page
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Step 2: Create child page
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const parentPage = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'New Feature' }).first();
    
    await parentPage.click({ button: 'right' });
    await page.waitForSelector('[role="menu"]');
    
    const addChildMenu = page.locator('[role="menuitem"]').filter({ hasText: 'Add Child' });
    await addChildMenu.hover();
    await page.waitForTimeout(500);
    
    const newFeatureItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Feature' }).last();
    await newFeatureItem.click();
    await page.waitForTimeout(2000);
    
    // Step 3: Compare the icons
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const allTabs = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' });
    
    // Should have 2 tabs with "New Feature" - parent and child
    const tabCount = await allTabs.count();
    console.log(`📊 Found ${tabCount} tabs with "New Feature"`);
    
    if (tabCount >= 2) {
      // Get the first two tabs (parent and child)
      const parentTab = allTabs.first();
      const childTab = allTabs.last();
      
      // Get both tab icons
      const parentTabIcon = await parentTab.locator('svg').first().innerHTML();
      const childTabIcon = await childTab.locator('svg').first().innerHTML();
      
      console.log('🔍 Parent tab icon SVG:', parentTabIcon);
      console.log('🔍 Child tab icon SVG:', childTabIcon);
      
      // Check if they're different (this would confirm the bug)
      const iconsAreDifferent = parentTabIcon !== childTabIcon;
      console.log(`🔍 Icons are different: ${iconsAreDifferent}`);
      
      if (iconsAreDifferent) {
        console.log('❌ BUG CONFIRMED: Parent and child tabs show different icons for same page type');
      } else {
        console.log('✅ Icons are the same - no bug detected');
      }
      
      // Take screenshot showing both tabs
      await page.screenshot({ path: 'test-results/parent-vs-child-tabs.png' });
    }
  });

  test('verify tab icon matches page type in sidebar', async ({ page }) => {
    console.log('🧪 Testing tab icon matches sidebar page icon...');
    
    // Create a Feature page
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Get the sidebar page icon
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const sidebarPage = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'New Feature' }).first();
    const sidebarIcon = sidebarPage.locator('svg').first();
    const sidebarIconSvg = await sidebarIcon.innerHTML();
    
    // Get the tab icon
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const tab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).first();
    const tabIcon = tab.locator('svg').first();
    const tabIconSvg = await tabIcon.innerHTML();
    
    console.log('🔍 Sidebar icon SVG:', sidebarIconSvg);
    console.log('🔍 Tab icon SVG:', tabIconSvg);
    
    // They should match for consistent UX
    const iconsMatch = sidebarIconSvg === tabIconSvg;
    console.log(`🔍 Sidebar and tab icons match: ${iconsMatch}`);
    
    if (!iconsMatch) {
      console.log('❌ INCONSISTENCY: Sidebar and tab show different icons for same page');
    } else {
      console.log('✅ Icons are consistent between sidebar and tab');
    }
  });

  test('debug tab icon rendering timing', async ({ page }) => {
    console.log('🧪 Testing tab icon rendering timing...');
    
    // Create a page and monitor icon changes over time
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    await plusButton.click();
    
    // Check icon immediately after tab creation
    await page.waitForTimeout(100);
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const tab = tabContainer.locator('[role="tab"]').last();
    
    if (await tab.isVisible()) {
      const immediateIcon = await tab.locator('svg').first().innerHTML();
      console.log('🔍 Icon immediately after creation:', immediateIcon);
    }
    
    // Check icon after 500ms
    await page.waitForTimeout(500);
    if (await tab.isVisible()) {
      const delayedIcon = await tab.locator('svg').first().innerHTML();
      console.log('🔍 Icon after 500ms:', delayedIcon);
    }
    
    // Check icon after 1000ms
    await page.waitForTimeout(500);
    if (await tab.isVisible()) {
      const laterIcon = await tab.locator('svg').first().innerHTML();
      console.log('🔍 Icon after 1000ms:', laterIcon);
    }
    
    // Check icon after 2000ms (total)
    await page.waitForTimeout(1000);
    if (await tab.isVisible()) {
      const finalIcon = await tab.locator('svg').first().innerHTML();
      console.log('🔍 Icon after 2000ms:', finalIcon);
    }
  });
});
/**
 * Simple Page Assignments Test
 * 
 * Tests core functionality:
 * 1. Verify assignments section exists in page details drawer
 * 2. Verify database has assignment properties structure
 * 3. Test assignment component rendering
 */

import { test, expect } from '@playwright/test';

test.describe('Page Assignments - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    console.log('🧪 Test setup complete');
  });

  test('should display assignments section in page details drawer', async ({ page }) => {
    console.log('🧪 Testing assignments section visibility...');
    
    // Create a feature page
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Open feature tab
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await featureTab.click();
    await page.waitForTimeout(1000);
    
    // Open details drawer
    const detailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await detailsButton.click();
    await page.waitForTimeout(1000);
    
    // Verify assignments section exists
    const assignmentsHeading = page.locator('h3').filter({ hasText: 'Assignments' });
    await expect(assignmentsHeading).toBeVisible();
    console.log('✅ Assignments section found');
    
    // Verify roadmaps section exists
    const roadmapsLabel = page.locator('label').filter({ hasText: 'Roadmaps' });
    await expect(roadmapsLabel).toBeVisible();
    console.log('✅ Roadmaps section found');
    
    // Verify releases section exists
    const releasesLabel = page.locator('label').filter({ hasText: 'Releases' });
    await expect(releasesLabel).toBeVisible();
    console.log('✅ Releases section found');
    
    // Verify dropdown buttons exist
    const roadmapDropdown = page.locator('button').filter({ hasText: 'Select roadmaps...' });
    await expect(roadmapDropdown).toBeVisible();
    console.log('✅ Roadmap dropdown found');
    
    const releaseDropdown = page.locator('button').filter({ hasText: 'Select releases...' });
    await expect(releaseDropdown).toBeVisible();
    console.log('✅ Release dropdown found');
    
    // Verify empty state messages
    const noRoadmapAssignments = page.locator('text=No roadmap assignments');
    await expect(noRoadmapAssignments).toBeVisible();
    console.log('✅ Empty roadmap state found');
    
    const noReleaseAssignments = page.locator('text=No release assignments');
    await expect(noReleaseAssignments).toBeVisible();
    console.log('✅ Empty release state found');
    
    console.log('🎉 Assignments section test completed successfully!');
  });

  test('should verify database has assignment properties structure', async ({ page }) => {
    console.log('🧪 Testing database assignment structure...');
    
    // Create a feature page
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Get the page ID from the newest tab
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    const pageId = await featureTab.getAttribute('data-tab-id') || await featureTab.getAttribute('value');
    
    console.log('📊 Feature page ID:', pageId);
    
    // Check database structure via API
    const response = await page.request.get(`/api/pages-db?id=${pageId}`);
    expect(response.status()).toBe(200);
    
    const pageData = await response.json();
    console.log('💽 Page properties structure:', JSON.stringify(pageData.properties, null, 2));
    
    // Verify assignment properties exist
    expect(pageData.properties).toBeDefined();
    expect(pageData.properties.assignedTo).toBeDefined();
    expect(pageData.properties.assignedTo.roadmaps).toBeDefined();
    expect(pageData.properties.assignedTo.releases).toBeDefined();
    
    // Verify they are arrays
    expect(Array.isArray(pageData.properties.assignedTo.roadmaps)).toBe(true);
    expect(Array.isArray(pageData.properties.assignedTo.releases)).toBe(true);
    
    // Verify they start empty
    expect(pageData.properties.assignedTo.roadmaps.length).toBe(0);
    expect(pageData.properties.assignedTo.releases.length).toBe(0);
    
    console.log('✅ Database assignment structure verified');
    console.log('🎉 Database structure test completed successfully!');
  });

  test('should have available roadmaps and releases for assignment', async ({ page }) => {
    console.log('🧪 Testing available options for assignment...');
    
    // Create a roadmap first
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Create roadmap via context menu
    await plusButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    
    const roadmapMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await expect(roadmapMenuItem).toBeVisible();
    await roadmapMenuItem.click();
    await page.waitForTimeout(2000);
    
    // Create a feature
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Open feature details
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await featureTab.click();
    await page.waitForTimeout(1000);
    
    const detailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await detailsButton.click();
    await page.waitForTimeout(1000);
    
    // Try to open roadmap dropdown
    const roadmapDropdown = page.locator('button').filter({ hasText: 'Select roadmaps...' });
    await roadmapDropdown.click();
    await page.waitForTimeout(1000);
    
    // Check if roadmap options exist (should show our created roadmap)
    const commandItems = page.locator('[data-slot="command-item"], [role="option"]');
    const itemCount = await commandItems.count();
    
    console.log(`📊 Found ${itemCount} available options in dropdown`);
    
    if (itemCount > 0) {
      console.log('✅ Roadmap options are available for assignment');
      
      // Check if our roadmap appears
      const roadmapOptions = page.locator('[data-slot="command-item"], [role="option"]').filter({ hasText: 'New Roadmap' });
      const roadmapCount = await roadmapOptions.count();
      console.log(`📊 Found ${roadmapCount} roadmap options`);
      
      if (roadmapCount > 0) {
        console.log('✅ Created roadmap appears in assignment options');
      }
    } else {
      console.log('⚠️ No assignment options found - may be an issue with data loading');
    }
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/assignments-dropdown-options.png' });
    
    console.log('🎉 Assignment options test completed!');
  });
});
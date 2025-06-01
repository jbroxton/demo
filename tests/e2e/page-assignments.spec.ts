/**
 * Playwright E2E Test: Page Assignments Feature
 * 
 * Tests the complete page assignment workflow:
 * 1. Create a feature page and a roadmap page
 * 2. Open feature details drawer
 * 3. Assign feature to roadmap via dropdown
 * 4. Verify assignment appears as badge
 * 5. Verify database stores assignment correctly
 * 6. Remove assignment via badge X button
 * 7. Verify assignment removed from UI and database
 */

import { test, expect } from '@playwright/test';

test.describe('Page Assignments Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001/dashboard');
    
    // Wait for the app to load and ensure we're authenticated
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    
    console.log('🧪 Test setup complete - app loaded');
  });

  test('should assign feature to roadmap and store in database', async ({ page }) => {
    console.log('🧪 Testing feature assignment to roadmap...');
    
    // Step 1: Create a roadmap page first (needed for assignment)
    console.log('📝 Creating roadmap page...');
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Right-click to get context menu with other page types
    await plusButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    
    // Look for roadmap option in context menu
    const roadmapMenuItem = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await expect(roadmapMenuItem).toBeVisible();
    await roadmapMenuItem.click();
    
    // Wait for roadmap to be created
    await page.waitForTimeout(2000);
    
    // Step 2: Create a feature page
    console.log('📝 Creating feature page...');
    await plusButton.click(); // Single click creates feature
    await page.waitForTimeout(2000);
    
    // Step 3: Open the feature page details drawer
    console.log('🔍 Opening feature details drawer...');
    
    // Find the newest tab (should be the feature)
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await expect(featureTab).toBeVisible();
    
    // Activate the feature tab
    await featureTab.click();
    await page.waitForTimeout(1000);
    
    // Click the Details button to open drawer (in the page editor action bar)
    const detailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await expect(detailsButton).toBeVisible();
    await detailsButton.click();
    
    // Wait for drawer to open
    await page.waitForTimeout(1000);
    
    // Step 4: Verify assignments section exists
    console.log('✅ Verifying assignments section...');
    const assignmentsSection = page.locator('h3').filter({ hasText: 'Assignments' });
    await expect(assignmentsSection).toBeVisible();
    
    // Find roadmaps dropdown
    const roadmapsLabel = page.locator('label').filter({ hasText: 'Roadmaps' });
    await expect(roadmapsLabel).toBeVisible();
    
    // Step 5: Assign feature to roadmap
    console.log('🔗 Assigning feature to roadmap...');
    
    // Click roadmaps dropdown trigger
    const roadmapDropdown = page.locator('button').filter({ hasText: 'Select roadmaps...' });
    await expect(roadmapDropdown).toBeVisible();
    await roadmapDropdown.click();
    
    // Wait for popover to open
    await page.waitForTimeout(500);
    
    // Look for the first roadmap option in the dropdown
    const roadmapOption = page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: 'New Roadmap' }).first();
    await expect(roadmapOption).toBeVisible();
    
    // Click to assign
    await roadmapOption.click();
    
    // Wait for assignment to process
    await page.waitForTimeout(1000);
    
    // Step 6: Verify assignment badge appears
    console.log('🏷️ Verifying assignment badge...');
    
    // Look for the assignment badge
    const assignmentBadge = page.locator('[data-slot="badge"], .bg-white\\/10').filter({ hasText: 'New Roadmap' });
    await expect(assignmentBadge).toBeVisible();
    
    // Step 7: Verify database storage
    console.log('💾 Verifying database storage...');
    
    // Get the feature page ID from the current tab
    const currentTab = tabContainer.locator('[role="tab"][data-state="active"], [role="tab"].active').first();
    const featurePageId = await currentTab.getAttribute('data-tab-id') || await currentTab.getAttribute('value');
    
    console.log('📊 Feature page ID:', featurePageId);
    
    // Check database via API call
    const response = await page.request.get(`/api/pages-db?id=${featurePageId}`);
    expect(response.status()).toBe(200);
    
    const pageData = await response.json();
    console.log('💽 Page data from DB:', JSON.stringify(pageData.properties?.assignedTo, null, 2));
    
    // Verify assignments structure in database
    expect(pageData.properties).toBeDefined();
    expect(pageData.properties.assignedTo).toBeDefined();
    expect(pageData.properties.assignedTo.roadmaps).toBeDefined();
    expect(pageData.properties.assignedTo.roadmaps.length).toBe(1);
    expect(pageData.properties.assignedTo.roadmaps[0].title).toBe('New Roadmap');
    
    console.log('✅ Assignment successfully stored in database');
    
    // Step 8: Remove assignment via badge X button
    console.log('❌ Testing assignment removal...');
    
    // Find and click the X button on the badge
    const removeBadgeButton = assignmentBadge.locator('button').filter({ hasText: '' }); // X icon
    await expect(removeBadgeButton).toBeVisible();
    await removeBadgeButton.click();
    
    // Wait for removal to process
    await page.waitForTimeout(1000);
    
    // Step 9: Verify assignment badge is removed
    console.log('🗑️ Verifying badge removal...');
    
    // Badge should no longer exist
    await expect(assignmentBadge).not.toBeVisible();
    
    // Should show "No roadmap assignments" text
    const noAssignmentsText = page.locator('text=No roadmap assignments');
    await expect(noAssignmentsText).toBeVisible();
    
    // Step 10: Verify database reflects removal
    console.log('💾 Verifying database removal...');
    
    // Check database again
    const responseAfterRemoval = await page.request.get(`/api/pages-db?id=${featurePageId}`);
    expect(responseAfterRemoval.status()).toBe(200);
    
    const pageDataAfterRemoval = await responseAfterRemoval.json();
    console.log('💽 Page data after removal:', JSON.stringify(pageDataAfterRemoval.properties?.assignedTo, null, 2));
    
    // Verify assignments are empty in database
    expect(pageDataAfterRemoval.properties.assignedTo.roadmaps.length).toBe(0);
    
    console.log('✅ Assignment successfully removed from database');
    
    // Take final screenshot for verification
    await page.screenshot({ path: 'test-results/page-assignments-complete.png' });
    
    console.log('🎉 Page assignments test completed successfully!');
  });

  test('should handle multiple roadmap assignments', async ({ page }) => {
    console.log('🧪 Testing multiple roadmap assignments...');
    
    // Create two roadmaps first
    console.log('📝 Creating multiple roadmaps...');
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Create first roadmap
    await plusButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    const roadmapOption1 = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await roadmapOption1.click();
    await page.waitForTimeout(2000);
    
    // Create second roadmap
    await plusButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    const roadmapOption2 = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await roadmapOption2.click();
    await page.waitForTimeout(2000);
    
    // Create feature
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    // Open details drawer
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await featureTab.click();
    await page.waitForTimeout(1000);
    
    const detailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await detailsButton.click();
    await page.waitForTimeout(1000);
    
    // Assign to first roadmap
    const roadmapDropdown = page.locator('button').filter({ hasText: 'Select roadmaps...' });
    await roadmapDropdown.click();
    await page.waitForTimeout(500);
    
    const firstRoadmap = page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: 'New Roadmap' }).first();
    await firstRoadmap.click();
    await page.waitForTimeout(1000);
    
    // Assign to second roadmap (dropdown should show "1 selected")
    const roadmapDropdown2 = page.locator('button').filter({ hasText: '1 selected' });
    await roadmapDropdown2.click();
    await page.waitForTimeout(500);
    
    const secondRoadmap = page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: 'New Roadmap' }).last();
    await secondRoadmap.click();
    await page.waitForTimeout(1000);
    
    // Verify both badges appear
    const badges = page.locator('[data-slot="badge"], .bg-white\\/10').filter({ hasText: 'New Roadmap' });
    await expect(badges).toHaveCount(2);
    
    // Verify database has both assignments
    const currentTab = tabContainer.locator('[role="tab"][data-state="active"], [role="tab"].active').first();
    const featurePageId = await currentTab.getAttribute('data-tab-id') || await currentTab.getAttribute('value');
    
    const response = await page.request.get(`/api/pages-db?id=${featurePageId}`);
    const pageData = await response.json();
    
    expect(pageData.properties.assignedTo.roadmaps.length).toBe(2);
    
    console.log('✅ Multiple assignments test completed successfully!');
  });

  test('should persist assignments across page refreshes', async ({ page }) => {
    console.log('🧪 Testing assignment persistence across refreshes...');
    
    // Create roadmap and feature with assignment (simplified version)
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: 'Add Feature (right-click for more options)' });
    
    // Create roadmap
    await plusButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    const roadmapOption = page.locator('[role="menuitem"]').filter({ hasText: 'New Roadmap' });
    await roadmapOption.click();
    await page.waitForTimeout(2000);
    
    // Create feature and assign to roadmap
    await plusButton.click();
    await page.waitForTimeout(2000);
    
    const tabContainer = page.locator('[data-component="tabs-container"], .tabs-container, [role="tablist"]');
    const featureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await featureTab.click();
    
    const detailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await detailsButton.click();
    await page.waitForTimeout(1000);
    
    const roadmapDropdown = page.locator('button').filter({ hasText: 'Select roadmaps...' });
    await roadmapDropdown.click();
    await page.waitForTimeout(500);
    
    const roadmapAssignment = page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: 'New Roadmap' });
    await roadmapAssignment.click();
    await page.waitForTimeout(2000);
    
    // Verify assignment badge exists
    let assignmentBadge = page.locator('[data-slot="badge"], .bg-white\\/10').filter({ hasText: 'New Roadmap' });
    await expect(assignmentBadge).toBeVisible();
    
    // Refresh page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForSelector('[data-section="pages-header"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Reopen the feature details
    const refreshedFeatureTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await refreshedFeatureTab.click();
    await page.waitForTimeout(1000);
    
    const refreshedDetailsButton = page.locator('.flex.items-center.gap-2').getByRole('button', { name: /Details|Close/ });
    await refreshedDetailsButton.click();
    await page.waitForTimeout(1000);
    
    // Verify assignment badge still exists after refresh
    assignmentBadge = page.locator('[data-slot="badge"], .bg-white\\/10').filter({ hasText: 'New Roadmap' });
    await expect(assignmentBadge).toBeVisible();
    
    console.log('✅ Assignment persistence test completed successfully!');
  });
});
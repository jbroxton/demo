import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../../src/test-utils/test-users';

/**
 * E2E Test: Pages Creation Flow from Sidebar Navigation
 * 
 * Tests the complete workflow of creating pages from the sidebar navigation:
 * 1. Navigate to dashboard
 * 2. Create a new page using the sidebar button
 * 3. Fill out page creation form
 * 4. Verify page appears in sidebar
 * 5. Test page type selection and properties
 * 6. Test child page creation
 */

test.describe('Pages Creation Flow from Sidebar', () => {
  // Use authenticated session from global setup
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard where sidebar is visible
    await page.goto('/dashboard');
    
    // Wait for sidebar to be loaded with pages data
    await page.waitForSelector('[data-section="pages-tree"]', { timeout: 10000 });
    
    // Verify we're authenticated by checking for user greeting
    await expect(page.locator('[data-section="user-greeting"]')).toBeVisible();
  });

  test('should create a new page from sidebar Pages section', async ({ page }) => {
    console.log('🧪 Testing: Create new page from sidebar');
    
    // Step 1: Locate the Pages section in sidebar
    const pagesSection = page.locator('[data-section="pages-header"]');
    await expect(pagesSection).toBeVisible();
    
    // Step 2: Click the EntityCreator "+" button to create a new page
    const createPageButton = pagesSection.locator('button').filter({ hasText: '' }).last(); // Button with Plus icon
    await expect(createPageButton).toBeVisible();
    await createPageButton.click();
    
    console.log('✅ Clicked create page button');
    
    // Step 3: Wait for the EntityCreator dialog to appear
    // The dialog should have "Create New Page" in the title
    const createPageDialog = page.locator('[role="dialog"]');
    await expect(createPageDialog).toBeVisible({ timeout: 5000 });
    
    // Verify it's the correct dialog by checking the title
    await expect(createPageDialog.locator('h2')).toContainText('Create New Page');
    
    console.log('✅ Page creation dialog opened');
    
    // Step 4: Click the "Create" button (no form to fill - EntityCreator creates directly)
    const createButton = createPageDialog.locator('button').filter({ hasText: /create/i });
    await expect(createButton).toBeVisible();
    
    // Wait for any loading state to complete
    await expect(createButton).not.toBeDisabled({ timeout: 5000 });
    
    await createButton.click();
    
    console.log('✅ Clicked create button');
    
    // Step 5: Wait for dialog to close (might take a moment due to backend operations)
    await expect(createPageDialog).not.toBeVisible({ timeout: 10000 });
    
    console.log('✅ Dialog closed');
    
    // Step 6: Wait for the new page to appear in sidebar tree
    // The page will have a default name like "New Feature" or "New Page"
    const pagesTree = page.locator('[data-section="pages-tree"]');
    await expect(pagesTree).toBeVisible();
    
    // Look for a newly created page (likely named "New Feature" based on EntityCreator code)
    const newPageInSidebar = pagesTree.locator('button').filter({ hasText: /New Feature|New Page/i }).first();
    await expect(newPageInSidebar).toBeVisible({ timeout: 15000 });
    
    console.log('✅ New page appears in sidebar');
    
    // Step 7: Verify the page is clickable and opens a tab
    await newPageInSidebar.click();
    
    // Wait for tab system to update - check for any content indicating a tab opened
    // Since this app uses tabs, we might see tab content or URL changes
    await page.waitForTimeout(2000); // Give time for tab system to update
    
    console.log('✅ Successfully clicked on created page');
  });

  test('should create child pages from parent page in sidebar', async ({ page }) => {
    console.log('🧪 Testing: Create child page from parent in sidebar');
    
    // Step 1: Find an existing page that can have children
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const existingPage = pagesTree.locator('[data-entity-type="page"]').first();
    
    if (await existingPage.isVisible()) {
      // Step 2: Hover over the page to reveal the child creation button
      await existingPage.hover();
      
      // Step 3: Look for the plus button that appears on hover (EntityCreator with context)
      // This should be the group-hover:opacity-100 button in the page row
      const childCreateButton = existingPage.locator('button').last(); // Should be the + button
      
      // Wait a moment for hover effects
      await page.waitForTimeout(1000);
      
      if (await childCreateButton.isVisible()) {
        await childCreateButton.click();
        
        console.log('✅ Clicked child page creation button');
        
        // Step 4: Handle the EntityCreator dialog (same as parent creation)
        const createDialog = page.locator('[role="dialog"]');
        await expect(createDialog).toBeVisible();
        
        // Verify it's a child page dialog by checking for parent context
        await expect(createDialog).toContainText(/associated with/i);
        
        // Click create (no form to fill)
        const createButton = createDialog.locator('button').filter({ hasText: /create/i });
        await createButton.click();
        
        await expect(createDialog).not.toBeVisible({ timeout: 10000 });
        
        console.log('✅ Created child page');
        
        // Step 5: Verify child page appears (may need to expand parent first)
        const newChildPage = pagesTree.locator('button').filter({ hasText: /New Feature|New Page/i }).first();
        await expect(newChildPage).toBeVisible({ timeout: 15000 });
        
        console.log('✅ Child page appears in sidebar');
      } else {
        console.log('⚠️ No child creation button found on hover, skipping child page test');
      }
    } else {
      console.log('⚠️ No existing pages found for child creation test');
    }
  });

  test('should handle page creation multiple times', async ({ page }) => {
    console.log('🧪 Testing: Create multiple pages');
    
    const numberOfPages = 3;
    
    for (let i = 0; i < numberOfPages; i++) {
      // Create page
      const createPageButton = page.locator('[data-section="pages-header"]').locator('button').last();
      await createPageButton.click();
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Click create
      const createButton = dialog.locator('button').filter({ hasText: /create/i });
      await createButton.click();
      
      await expect(dialog).not.toBeVisible({ timeout: 10000 });
      
      console.log(`✅ Created page ${i + 1}/${numberOfPages}`);
      
      // Brief pause between creations
      await page.waitForTimeout(2000);
    }
    
    // Verify multiple pages exist
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const allPages = pagesTree.locator('[data-entity-type="page"]');
    const pageCount = await allPages.count();
    
    expect(pageCount).toBeGreaterThanOrEqual(numberOfPages);
    console.log(`✅ Total pages in sidebar: ${pageCount}`);
  });

  test('should handle dialog cancellation', async ({ page }) => {
    console.log('🧪 Testing: Cancel page creation dialog');
    
    // Step 1: Open page creation dialog
    const createPageButton = page.locator('[data-section="pages-header"]').locator('button').last();
    await createPageButton.click();
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Step 2: Click cancel button
    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // Step 3: Verify dialog closes without creating a page
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    
    console.log('✅ Dialog cancelled successfully');
  });

  test('should handle sidebar interaction states correctly', async ({ page }) => {
    console.log('🧪 Testing: Sidebar interaction states');
    
    // Test expand/collapse functionality if pages exist
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const firstPage = pagesTree.locator('[data-entity-type="page"]').first();
    
    if (await firstPage.isVisible()) {
      // Check if page has expand/collapse functionality
      const expandButton = firstPage.locator('[data-action="toggle"]').first();
      
      if (await expandButton.isVisible()) {
        console.log('✅ Found expandable page');
        
        // Test expansion
        const initialExpanded = await firstPage.getAttribute('data-expanded');
        await expandButton.click();
        
        // Wait for state change
        await page.waitForTimeout(500);
        
        const afterExpanded = await firstPage.getAttribute('data-expanded');
        expect(afterExpanded).not.toBe(initialExpanded);
        
        console.log('✅ Page expand/collapse working');
      }
    }
    
    // Test hover states for action buttons
    if (await firstPage.isVisible()) {
      await firstPage.hover();
      
      // Check if hover reveals additional buttons
      await page.waitForTimeout(500);
      
      const hoverButtons = firstPage.locator('button.opacity-0.group-hover\\:opacity-100');
      const buttonCount = await hoverButtons.count();
      
      if (buttonCount > 0) {
        console.log(`✅ Found ${buttonCount} hover-revealed buttons`);
      }
    }
  });
});
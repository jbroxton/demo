import { test, expect } from '@playwright/test';

test.describe('Child Page Creation Issue Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to capture detailed debug info
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Capture network requests to monitor API calls
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    // Capture any page errors
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR]:`, error);
    });

    // Login first
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'pm1@demo.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('reproduces child page creation loading failure', async ({ page }) => {
    console.log('=== STARTING CHILD PAGE CREATION TEST ===');
    
    // Step 1: Navigate to dashboard and verify sidebar is loaded
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 10000 });
    console.log('✓ Dashboard loaded, sidebar visible');

    // Step 2: Create a parent page first (so we have something to add children to)
    console.log('\n--- Creating Parent Page ---');
    
    // Look for create page button or similar
    const createButton = page.locator('[data-testid="create-page-button"], [data-testid="add-page-button"], button:has-text("Add Page"), button:has-text("Create Page")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      console.log('✓ Clicked create page button');
    } else {
      // Alternative: try right-clicking on empty space or using keyboard shortcut
      await page.keyboard.press('Control+n'); // Try keyboard shortcut
      console.log('✓ Tried keyboard shortcut for new page');
    }

    // Fill in parent page details
    const titleInput = page.locator('[data-testid="page-title-input"], [data-testid="title-input"], input[placeholder*="title" i]').first();
    await titleInput.waitFor({ timeout: 5000 });
    await titleInput.fill('Test Parent Page');
    console.log('✓ Entered parent page title');

    // Save the parent page
    const saveButton = page.locator('[data-testid="save-button"], [data-testid="save-page-button"], button:has-text("Save"), button:has-text("Create")').first();
    await saveButton.click();
    console.log('✓ Saved parent page');

    // Wait for parent page to appear in sidebar
    await page.waitForSelector('text="Test Parent Page"', { timeout: 10000 });
    console.log('✓ Parent page appears in sidebar');

    // Step 3: Right-click on the parent page in the sidebar
    console.log('\n--- Right-clicking Parent Page ---');
    
    const parentPageElement = page.locator('[data-testid="sidebar-page"], [data-testid="page-item"]').filter({ hasText: 'Test Parent Page' }).first();
    await parentPageElement.waitFor({ timeout: 5000 });
    
    // Get the parent page's position for debugging
    const parentBox = await parentPageElement.boundingBox();
    console.log(`✓ Parent page element found at position: ${JSON.stringify(parentBox)}`);

    await parentPageElement.click({ button: 'right' });
    console.log('✓ Right-clicked on parent page');

    // Step 4: Look for "Add Child" or similar context menu option
    console.log('\n--- Looking for Context Menu ---');
    
    const contextMenu = page.locator('[data-testid="context-menu"], [role="menu"], .context-menu').first();
    await contextMenu.waitFor({ timeout: 5000 });
    console.log('✓ Context menu appeared');

    // Log all available menu options for debugging
    const menuItems = await contextMenu.locator('button, [role="menuitem"], a').allTextContents();
    console.log(`Available menu options: ${JSON.stringify(menuItems)}`);

    // Step 5: Select child creation option
    const addChildOption = contextMenu.locator('text="Add Child", text="Add Child Feature", text="Create Child", text="New Child"').first();
    
    if (await addChildOption.isVisible()) {
      await addChildOption.click();
      console.log('✓ Clicked Add Child option');
    } else {
      // Try other possible child creation options
      const alternativeOptions = await contextMenu.locator('button, [role="menuitem"]').all();
      for (const option of alternativeOptions) {
        const text = await option.textContent();
        if (text && (text.toLowerCase().includes('child') || text.toLowerCase().includes('feature'))) {
          await option.click();
          console.log(`✓ Clicked alternative child option: ${text}`);
          break;
        }
      }
    }

    // Step 6: Monitor child creation process
    console.log('\n--- Monitoring Child Creation ---');
    
    // Look for child type selection if it appears
    const childTypeSelector = page.locator('[data-testid="child-type-selector"], [data-testid="page-type-selector"]');
    if (await childTypeSelector.isVisible({ timeout: 2000 })) {
      console.log('✓ Child type selector appeared');
      
      // Select Feature type if available
      const featureOption = page.locator('text="Feature", [data-testid="feature-option"]').first();
      if (await featureOption.isVisible()) {
        await featureOption.click();
        console.log('✓ Selected Feature child type');
      }
    }

    // Fill in child page details
    const childTitleInput = page.locator('[data-testid="page-title-input"], [data-testid="title-input"], input[placeholder*="title" i]').first();
    if (await childTitleInput.isVisible({ timeout: 3000 })) {
      await childTitleInput.fill('Test Child Feature');
      console.log('✓ Entered child page title');

      // Save the child page
      const childSaveButton = page.locator('[data-testid="save-button"], [data-testid="save-page-button"], button:has-text("Save"), button:has-text("Create")').first();
      await childSaveButton.click();
      console.log('✓ Saved child page');
    }

    // Step 7: Check if child page loads properly or shows error
    console.log('\n--- Checking Child Page Loading ---');
    
    // Wait for child to appear in sidebar (title sync check)
    try {
      await page.waitForSelector('text="Test Child Feature"', { timeout: 10000 });
      console.log('✓ Child page title synced to sidebar');
    } catch (error) {
      console.error('✗ Child page title did not appear in sidebar');
      throw error;
    }

    // Click on the child page to load its content
    const childPageElement = page.locator('[data-testid="sidebar-page"], [data-testid="page-item"]').filter({ hasText: 'Test Child Feature' }).first();
    await childPageElement.click();
    console.log('✓ Clicked on child page in sidebar');

    // Monitor for loading states and errors
    console.log('\n--- Monitoring Page Content Loading ---');
    
    // Check for various possible error states
    const errorStates = [
      'text="FAILS TO LOAD PAGE"',
      'text="Failed to load"',
      'text="Error loading page"',
      '[data-testid="error-message"]',
      '[data-testid="loading-error"]',
      '.error-message',
      '.loading-error'
    ];

    let errorFound = false;
    for (const errorSelector of errorStates) {
      const errorElement = page.locator(errorSelector).first();
      if (await errorElement.isVisible({ timeout: 1000 })) {
        console.error(`✗ ERROR FOUND: ${errorSelector}`);
        const errorText = await errorElement.textContent();
        console.error(`Error text: ${errorText}`);
        errorFound = true;
        break;
      }
    }

    // Check for successful loading indicators
    const loadingIndicators = [
      '[data-testid="page-content"]',
      '[data-testid="page-editor"]',
      '[data-testid="feature-content"]',
      '.page-content',
      '.tiptap-editor'
    ];

    let contentLoaded = false;
    for (const loadingSelector of loadingIndicators) {
      const contentElement = page.locator(loadingSelector).first();
      if (await contentElement.isVisible({ timeout: 5000 })) {
        console.log(`✓ Content loaded: ${loadingSelector}`);
        contentLoaded = true;
        break;
      }
    }

    // Step 8: Capture detailed logs about the page loading process
    console.log('\n--- Page Loading Analysis ---');
    console.log(`Error found: ${errorFound}`);
    console.log(`Content loaded: ${contentLoaded}`);

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check for any network failures
    const failedRequests = [];
    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Wait a bit to capture any async loading
    await page.waitForTimeout(3000);

    if (failedRequests.length > 0) {
      console.error('✗ Failed API requests:', JSON.stringify(failedRequests, null, 2));
    }

    // Step 9: Check database state vs UI state
    console.log('\n--- Database State Check ---');
    
    // Make an API call to check if the child page exists in the database
    const response = await page.request.get('/api/pages-db');
    const pagesData = await response.json();
    
    console.log('Pages in database:', JSON.stringify(pagesData, null, 2));
    
    // Look for our test child page
    const childPageInDb = pagesData.find((p: any) => 
      p.title === 'Test Child Feature' || p.name === 'Test Child Feature'
    );
    
    if (childPageInDb) {
      console.log('✓ Child page exists in database:', JSON.stringify(childPageInDb, null, 2));
    } else {
      console.error('✗ Child page NOT found in database');
    }

    // Step 10: Final assessment and specific error reproduction
    console.log('\n--- ISSUE REPRODUCTION SUMMARY ---');
    
    if (errorFound && !contentLoaded) {
      console.log('🎯 ISSUE REPRODUCED: Child page created, title synced, but content failed to load');
      
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: '/Users/delaghetto/Documents/Projects/demo/debug-child-page-failure.png',
        fullPage: true 
      });
      
      // The test should fail here to indicate the issue was reproduced
      expect(contentLoaded).toBe(true); // This will fail if content didn't load
      
    } else if (!errorFound && contentLoaded) {
      console.log('✓ No issue found: Child page loaded successfully');
      
    } else if (!errorFound && !contentLoaded) {
      console.log('? Unclear state: No error shown but no content loaded either');
      
      // Take screenshot for this case too
      await page.screenshot({ 
        path: '/Users/delaghetto/Documents/Projects/demo/debug-unclear-state.png',
        fullPage: true 
      });
      
    } else {
      console.log('? Mixed state: Error shown but some content loaded');
    }

    // Additional debugging: Check browser console for errors
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    if (consoleLogs.length > 0) {
      console.error('Browser console errors:', consoleLogs);
    }

    console.log('=== TEST COMPLETED ===');
  });

  test('verifies parent-child relationship in database', async ({ page }) => {
    console.log('=== VERIFYING PARENT-CHILD RELATIONSHIPS ===');
    
    // Check the database state for parent-child relationships
    const response = await page.request.get('/api/pages-db');
    const pagesData = await response.json();
    
    console.log('All pages in database:', JSON.stringify(pagesData, null, 2));
    
    // Look for parent-child relationships
    const parentPages = pagesData.filter((p: any) => !p.parent_id);
    const childPages = pagesData.filter((p: any) => p.parent_id);
    
    console.log(`Parent pages: ${parentPages.length}`);
    console.log(`Child pages: ${childPages.length}`);
    
    // Check if our test pages exist and have correct relationships
    const testParent = pagesData.find((p: any) => 
      p.title === 'Test Parent Page' || p.name === 'Test Parent Page'
    );
    
    const testChild = pagesData.find((p: any) => 
      p.title === 'Test Child Feature' || p.name === 'Test Child Feature'
    );
    
    if (testParent && testChild) {
      console.log('Test parent page:', JSON.stringify(testParent, null, 2));
      console.log('Test child page:', JSON.stringify(testChild, null, 2));
      
      // Verify the relationship
      if (testChild.parent_id === testParent.id) {
        console.log('✓ Parent-child relationship is correct in database');
      } else {
        console.error('✗ Parent-child relationship is incorrect');
        console.error(`Child parent_id: ${testChild.parent_id}, Parent id: ${testParent.id}`);
      }
    }
    
    console.log('=== RELATIONSHIP CHECK COMPLETED ===');
  });
});
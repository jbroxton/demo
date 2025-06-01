import { test, expect } from '@playwright/test';

test.describe('Child Page Creation Issue', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    
    // Enable console logging to capture any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR]:`, msg.text());
      }
    });
    
    // Capture any page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]:`, error.message);
    });
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test('reproduces child page creation and loading failure', async ({ page }) => {
    console.log('🧪 Testing: Child page creation and loading issue');
    
    // Step 1: Create a parent page first
    console.log('📝 Step 1: Creating parent page...');
    
    const pagesSection = page.locator('[data-section="pages-header"]');
    const plusButton = pagesSection.getByRole('button', { name: /Add/ });
    await expect(plusButton).toBeVisible();
    await plusButton.click();
    
    // Wait for EntityCreator dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Create the parent page
    const createButton = dialog.getByRole('button', { name: /Create/ });
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Wait for dialog to close and page to appear
    await expect(dialog).not.toBeVisible();
    await page.waitForTimeout(1000); // Allow time for page to be created
    
    // Step 2: Find the created parent page in sidebar
    console.log('🔍 Step 2: Finding parent page in sidebar...');
    
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const parentPage = pagesTree.locator('[data-entity-type="page"]').first();
    await expect(parentPage).toBeVisible();
    
    const parentTitle = await parentPage.textContent();
    console.log(`✅ Found parent page: "${parentTitle}"`);
    
    // Step 3: Right-click on parent page to get context menu
    console.log('🖱️ Step 3: Right-clicking parent page for context menu...');
    
    await parentPage.click({ button: 'right' });
    
    // Wait for context menu
    await page.waitForTimeout(500);
    const contextMenu = page.locator('[role="menu"]');
    
    if (await contextMenu.isVisible()) {
      console.log('✅ Context menu appeared');
      
      // Look for child creation options
      const menuItems = await contextMenu.locator('[role="menuitem"]').allTextContents();
      console.log('📋 Available menu items:', menuItems);
      
      // Look for "Add Child" or similar options
      const childOption = contextMenu.locator('[role="menuitem"]').filter({ 
        hasText: /add.*child|child.*feature|new.*child/i 
      });
      
      if (await childOption.count() > 0) {
        console.log('🎯 Found child creation option');
        await childOption.first().click();
        
        // Step 4: Handle child creation dialog/process
        console.log('📝 Step 4: Creating child page...');
        
        // Wait for potential dialog or immediate creation
        await page.waitForTimeout(500);
        
        // Check if a new dialog appeared for child creation
        const childDialog = page.locator('[role="dialog"]');
        if (await childDialog.isVisible()) {
          console.log('💬 Child creation dialog appeared');
          const childCreateButton = childDialog.getByRole('button', { name: /Create/ });
          if (await childCreateButton.isVisible()) {
            await childCreateButton.click();
            await expect(childDialog).not.toBeVisible();
          }
        }
        
        // Step 5: Wait for child page to appear and check loading
        console.log('⏳ Step 5: Waiting for child page to appear...');
        await page.waitForTimeout(2000); // Give time for child to be created
        
        // Look for child pages in the tree (should be nested under parent)
        const allPages = await pagesTree.locator('[data-entity-type="page"]').count();
        console.log(`📊 Total pages in tree: ${allPages}`);
        
        if (allPages > 1) {
          console.log('✅ Child page appears to be created');
          
          // Step 6: Try to click on the child page and see if it loads
          const childPage = pagesTree.locator('[data-entity-type="page"]').nth(1);
          const childTitle = await childPage.textContent();
          console.log(`🔍 Attempting to open child page: "${childTitle}"`);
          
          await childPage.click();
          
          // Step 7: Check for loading failures
          console.log('🔍 Step 7: Checking for page loading issues...');
          
          // Wait a moment for page to load
          await page.waitForTimeout(2000);
          
          // Look for error messages
          const errorSelectors = [
            '[data-testid="error-message"]',
            '[data-testid="loading-error"]',
            'text="FAILS TO LOAD PAGE"',
            'text="Failed to load"',
            'text="Error"',
            '.error-message',
            '.loading-error'
          ];
          
          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if (await errorElement.isVisible()) {
              const errorText = await errorElement.textContent();
              console.log(`❌ ERROR FOUND: ${errorText}`);
              errorFound = true;
              
              // Take screenshot of the error
              await page.screenshot({ path: `child-page-error-${Date.now()}.png` });
              break;
            }
          }
          
          // Check for loading indicators that never disappear
          const loadingSelectors = [
            '[data-testid="loading"]',
            '.loading',
            'text="Loading..."',
            '.spinner',
            '[aria-label="Loading"]'
          ];
          
          for (const selector of loadingSelectors) {
            const loadingElement = page.locator(selector);
            if (await loadingElement.isVisible()) {
              console.log(`⏳ Found persistent loading indicator: ${selector}`);
              errorFound = true;
            }
          }
          
          // Check if content area is empty or has placeholder content
          const contentArea = page.locator('[data-testid="main-content"], .canvas-editor, .page-content');
          if (await contentArea.isVisible()) {
            const contentText = await contentArea.textContent();
            if (!contentText || contentText.trim().length < 10) {
              console.log('⚠️ Content area appears to be empty or minimal');
              errorFound = true;
            }
          }
          
          if (errorFound) {
            console.log('🚨 ISSUE REPRODUCED: Child page created but failed to load properly');
            
            // Additional debugging: Check network requests
            const apiRequests = [];
            page.on('request', request => {
              if (request.url().includes('/api/')) {
                apiRequests.push({
                  url: request.url(),
                  method: request.method()
                });
              }
            });
            
            // Check for failed API requests
            const failedRequests = [];
            page.on('requestfailed', request => {
              failedRequests.push(request.url());
            });
            
            if (failedRequests.length > 0) {
              console.log('💥 Failed API requests:', failedRequests);
            }
            
            console.log('📊 Recent API requests:', apiRequests.slice(-5));
            
          } else {
            console.log('✅ Child page appears to be loading correctly');
          }
          
        } else {
          console.log('⚠️ No child page was created');
        }
        
      } else {
        console.log('⚠️ No child creation option found in context menu');
        console.log('Available options:', menuItems);
      }
      
      // Close context menu
      await page.keyboard.press('Escape');
      
    } else {
      console.log('❌ Context menu did not appear');
      
      // Try alternative: Look for + button next to the parent page
      const parentPlusButton = parentPage.locator('button', { hasText: '+' });
      if (await parentPlusButton.isVisible()) {
        console.log('🔍 Found + button next to parent, clicking...');
        await parentPlusButton.click();
        
        // Continue with child creation flow...
        const childDialog = page.locator('[role="dialog"]');
        if (await childDialog.isVisible()) {
          const createButton = childDialog.getByRole('button', { name: /Create/ });
          if (await createButton.isVisible()) {
            await createButton.click();
            console.log('✅ Created child via + button');
          }
        }
      }
    }
    
    console.log('🏁 Test completed');
  });

  test('checks database state vs UI state for child pages', async ({ page }) => {
    console.log('🧪 Testing: Database vs UI state consistency');
    
    // Make API call to check pages in database
    const response = await page.request.get('/api/pages-db');
    expect(response.ok()).toBeTruthy();
    
    const pagesData = await response.json();
    console.log(`📊 Pages in database: ${pagesData.length}`);
    
    // Count pages in UI
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const uiPageCount = await pagesTree.locator('[data-entity-type="page"]').count();
    console.log(`📊 Pages in UI: ${uiPageCount}`);
    
    // Check for mismatches
    if (pagesData.length !== uiPageCount) {
      console.log('⚠️ MISMATCH: Database and UI have different page counts');
      
      // Get more details
      for (const pageData of pagesData) {
        console.log(`DB Page: ${pageData.title} (ID: ${pageData.id}, Parent: ${pageData.parent_id})`);
      }
    }
  });
});
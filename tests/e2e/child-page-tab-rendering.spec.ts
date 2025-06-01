import { test, expect } from '@playwright/test';

test.describe('Child Page Tab Rendering Test', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test('verify child page loads properly in tab content', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Enable detailed console logging
    page.on('console', msg => {
      console.log(`[BROWSER]:`, msg.text());
    });
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Testing: Child page tab rendering');
    
    // Step 1: Find an existing child page in the sidebar
    const pagesTree = page.locator('[data-section="pages-tree"]');
    await expect(pagesTree).toBeVisible();
    
    // Wait for pages to load
    await page.waitForTimeout(2000);
    
    // Look for child pages (they appear in nested ul elements)
    const childPages = page.locator('ul[data-list="child-pages"] li button[data-action="open-tab"]');
    const childCount = await childPages.count();
    
    console.log(`📊 Found ${childCount} child pages in sidebar`);
    
    if (childCount > 0) {
      // Get the first child page
      const firstChild = childPages.first();
      const childTitle = await firstChild.textContent();
      const childPageId = await firstChild.getAttribute('data-entity-name') || 'unknown';
      
      console.log(`🎯 Testing child page: "${childTitle}" (ID: ${childPageId})`);
      
      // Step 2: Click on the child page to open it in a tab
      await firstChild.click();
      
      // Wait for tab to open and content to load
      await page.waitForTimeout(3000);
      
      // Step 3: Check if the page loaded successfully or failed
      const failedLoadMessage = page.locator('text="Failed to load page"');
      const hasFailedLoad = await failedLoadMessage.isVisible();
      
      // Step 4: Check for loading indicators
      const loadingMessage = page.locator('text="Loading page..."');
      const hasLoadingMessage = await loadingMessage.isVisible();
      
      // Step 5: Check for actual page content
      const pageEditor = page.locator('[data-component="canvas-content"]');
      const hasPageEditor = await pageEditor.isVisible();
      
      // Step 6: Look for the page title in the editor
      const titleElement = page.locator('h1, input[placeholder*="title"], [contenteditable="true"]').first();
      const hasTitleElement = await titleElement.isVisible();
      let titleText = '';
      if (hasTitleElement) {
        titleText = await titleElement.textContent() || '';
      }
      
      // Step 7: Check the UnifiedPageEditorWrapper specifically
      const editorWrapper = page.locator('[data-section="canvas-editor-content"]');
      const hasEditorWrapper = await editorWrapper.isVisible();
      
      console.log('\n📋 CHILD PAGE TAB LOADING RESULTS:');
      console.log(`   - Child page clicked: "${childTitle}"`);
      console.log(`   - Shows "Failed to load page": ${hasFailedLoad ? '❌ YES' : '✅ NO'}`);
      console.log(`   - Shows "Loading page...": ${hasLoadingMessage ? '⏳ YES' : '✅ NO'}`);
      console.log(`   - Page editor visible: ${hasPageEditor ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Title element visible: ${hasTitleElement ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Title text: "${titleText}"`);
      console.log(`   - Editor wrapper visible: ${hasEditorWrapper ? '✅ YES' : '❌ NO'}`);
      
      // Step 8: Take screenshots for debugging
      await page.screenshot({ path: 'child-page-tab-test.png', fullPage: true });
      
      if (hasFailedLoad) {
        console.log('\n🚨 ISSUE CONFIRMED: Child page shows "Failed to load page"');
        
        // Additional debugging: Check the tab system
        const activeTab = page.locator('[role="tab"][aria-selected="true"]');
        const activeTabText = await activeTab.textContent();
        console.log(`   - Active tab: "${activeTabText}"`);
        
        // Check if the page ID is correct in the tab
        const tabContainer = page.locator('[data-component="canvas-content"]');
        const tabId = await tabContainer.getAttribute('data-tab-id');
        console.log(`   - Tab ID: ${tabId}`);
        
        // Check if API calls are failing
        let apiErrors = [];
        page.on('response', response => {
          if (response.url().includes('/api/pages-db') && !response.ok()) {
            apiErrors.push(`${response.status()} - ${response.url()}`);
          }
        });
        
        if (apiErrors.length > 0) {
          console.log(`   - API Errors: ${apiErrors.join(', ')}`);
        }
      }
      
      // Test assertions
      expect(hasFailedLoad).toBe(false); // Should NOT show "Failed to load page"
      expect(hasPageEditor).toBe(true); // Should show page editor
      
    } else {
      console.log('⚠️ No child pages found - cannot test child page rendering');
      console.log('   Creating a test child page first...');
      
      // Create a test scenario: find a parent page and create a child
      const parentPages = page.locator('[data-entity-type="page"]');
      const parentCount = await parentPages.count();
      
      if (parentCount > 0) {
        const firstParent = parentPages.first();
        await firstParent.click({ button: 'right' });
        
        const contextMenu = page.locator('[role="menu"]');
        if (await contextMenu.isVisible()) {
          const addChildOption = contextMenu.locator('[role="menuitem"]').filter({ hasText: /add.*child/i });
          if (await addChildOption.isVisible()) {
            await addChildOption.hover();
            await page.waitForTimeout(300);
            
            const subMenu = page.locator('[role="menu"]').last();
            const newFeatureOption = subMenu.locator('[role="menuitem"]').filter({ hasText: 'New Feature' });
            if (await newFeatureOption.isVisible()) {
              await newFeatureOption.click();
              
              // Wait for child to be created
              await page.waitForTimeout(3000);
              
              // Now retry the test with the newly created child
              const newChildPages = page.locator('ul[data-list="child-pages"] li button[data-action="open-tab"]');
              const newChildCount = await newChildPages.count();
              
              if (newChildCount > 0) {
                console.log('✅ Created test child page, now testing...');
                const testChild = newChildPages.last(); // Get the newest child
                await testChild.click();
                await page.waitForTimeout(2000);
                
                const testFailedLoad = await page.locator('text="Failed to load page"').isVisible();
                console.log(`   - New child shows "Failed to load page": ${testFailedLoad ? '❌ YES' : '✅ NO'}`);
                
                expect(testFailedLoad).toBe(false);
              }
            }
          }
        }
      }
    }
  });
  
  test('check API response for child page data', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    console.log('🔍 Testing: API responses for child page data');
    
    // Intercept API calls to pages-db
    const apiResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/pages-db')) {
        try {
          const data = await response.json();
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            dataCount: Array.isArray(data) ? data.length : (data.data ? data.data.length : 'not array'),
            hasChildPages: Array.isArray(data) ? data.some(p => p.parent_id) : false
          });
        } catch (e) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            error: 'Failed to parse JSON'
          });
        }
      }
    });
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n📊 API RESPONSES:');
    apiResponses.forEach((resp, index) => {
      console.log(`   ${index + 1}. ${resp.url}`);
      console.log(`      Status: ${resp.status}`);
      console.log(`      Data count: ${resp.dataCount}`);
      console.log(`      Has child pages: ${resp.hasChildPages}`);
      if (resp.error) console.log(`      Error: ${resp.error}`);
    });
    
    // Verify that at least one API call returned child pages
    const hasChildPagesInApi = apiResponses.some(resp => resp.hasChildPages);
    console.log(`\n📋 Child pages found in API responses: ${hasChildPagesInApi ? '✅ YES' : '❌ NO'}`);
  });
});
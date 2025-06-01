import { test, expect } from '@playwright/test';

test.describe('Child Page Title Synchronization Test', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test('verify child page titles are synchronized across sidebar, tab, and content', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Testing: Child page title synchronization across all surfaces');
    
    // Step 1: Find a child page in sidebar
    const childPages = page.locator('ul[data-list="child-pages"] li button[data-action="open-tab"]');
    const childCount = await childPages.count();
    
    console.log(`📊 Found ${childCount} child pages`);
    
    if (childCount > 0) {
      const firstChild = childPages.first();
      
      // Step 2: Get title from SIDEBAR
      const sidebarTitle = await firstChild.textContent();
      console.log(`📍 SIDEBAR title: "${sidebarTitle}"`);
      
      // Step 3: Click to open tab and get title from TAB
      await firstChild.click();
      await page.waitForTimeout(2000);
      
      const activeTab = page.locator('[role="tab"][aria-selected="true"]');
      const tabTitle = await activeTab.textContent();
      console.log(`📍 TAB title: "${tabTitle}"`);
      
      // Step 4: Get title from CONTENT area
      const contentTitle = page.locator('h1, input[placeholder*="title"], [contenteditable="true"]').first();
      await contentTitle.waitFor({ state: 'visible', timeout: 5000 });
      const contentTitleText = await contentTitle.textContent() || await contentTitle.inputValue() || '';
      console.log(`📍 CONTENT title: "${contentTitleText}"`);
      
      // Step 5: Check if all three match
      const allTitlesMatch = sidebarTitle === tabTitle && tabTitle === contentTitleText.trim();
      
      console.log('\n📋 TITLE SYNCHRONIZATION RESULTS:');
      console.log(`   - Sidebar: "${sidebarTitle}"`);
      console.log(`   - Tab: "${tabTitle}"`);
      console.log(`   - Content: "${contentTitleText}"`);
      console.log(`   - All synchronized: ${allTitlesMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!allTitlesMatch) {
        console.log('\n🚨 TITLE SYNC ISSUE DETECTED:');
        if (sidebarTitle !== tabTitle) {
          console.log(`   ❌ Sidebar ≠ Tab: "${sidebarTitle}" vs "${tabTitle}"`);
        }
        if (tabTitle !== contentTitleText.trim()) {
          console.log(`   ❌ Tab ≠ Content: "${tabTitle}" vs "${contentTitleText}"`);
        }
        if (sidebarTitle !== contentTitleText.trim()) {
          console.log(`   ❌ Sidebar ≠ Content: "${sidebarTitle}" vs "${contentTitleText}"`);
        }
      }
      
      // Step 6: Test title editing synchronization
      console.log('\n🔄 Testing title editing synchronization...');
      
      const testTitle = `TEST SYNC ${Date.now()}`;
      
      // Edit title in content area
      await contentTitle.click();
      if (await contentTitle.getAttribute('contenteditable')) {
        await page.keyboard.selectAll();
        await page.keyboard.type(testTitle);
        await page.keyboard.press('Enter');
      } else {
        await contentTitle.fill(testTitle);
        await page.keyboard.press('Enter');
      }
      
      // Wait for synchronization
      await page.waitForTimeout(2000);
      
      // Check if sidebar and tab updated
      const newSidebarTitle = await firstChild.textContent();
      const newTabTitle = await activeTab.textContent();
      const newContentTitle = await contentTitle.textContent() || await contentTitle.inputValue() || '';
      
      console.log('\n📋 AFTER EDITING:');
      console.log(`   - Sidebar: "${newSidebarTitle}"`);
      console.log(`   - Tab: "${newTabTitle}"`);
      console.log(`   - Content: "${newContentTitle}"`);
      
      const editSyncWorking = newSidebarTitle?.includes(testTitle) && 
                              newTabTitle?.includes(testTitle) && 
                              newContentTitle?.includes(testTitle);
      
      console.log(`   - Edit synchronization working: ${editSyncWorking ? '✅ YES' : '❌ NO'}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'child-title-sync-test.png', fullPage: true });
      
      // Test assertions
      expect(allTitlesMatch, 'Initial titles should be synchronized').toBe(true);
      expect(editSyncWorking, 'Title edits should synchronize across all surfaces').toBe(true);
      
    } else {
      console.log('⚠️ No child pages found - creating one for testing...');
      
      // Create a child page for testing
      const parentPages = page.locator('[data-entity-type="page"]');
      if (await parentPages.count() > 0) {
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
              await page.waitForTimeout(3000);
              
              // Rerun the test with the new child
              console.log('✅ Created test child, retesting...');
              // Note: In a real test, we'd recursively call the test logic here
            }
          }
        }
      }
    }
  });
});
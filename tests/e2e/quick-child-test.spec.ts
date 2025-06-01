import { test, expect } from '@playwright/test';

test.describe('Quick Child Page Test', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test('check existing child page rendering and icons', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Enable console logging to capture debug info
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('🔨') || msg.text().includes('👶'))) {
        console.log(`[BROWSER]:`, msg.text());
      }
    });
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Looking for existing child pages...');
    
    // Wait for pages tree to load
    const pagesTree = page.locator('[data-section="pages-tree"]');
    await expect(pagesTree).toBeVisible();
    
    // Wait a moment for children to load
    await page.waitForTimeout(3000);
    
    // Find any page that has children (look for expanded ones)
    const pagesWithChildren = pagesTree.locator('[data-entity-type="page"][data-expanded="true"]');
    const count = await pagesWithChildren.count();
    
    console.log(`📊 Found ${count} expanded pages with potential children`);
    
    if (count > 0) {
      // Click on first child page if it exists
      const firstParent = pagesWithChildren.first();
      const parentTitle = await firstParent.textContent();
      console.log(`🔍 Checking parent: ${parentTitle}`);
      
      // Look for child pages in the tree
      const childPages = pagesTree.locator('ul[data-list="child-pages"] li');
      const childCount = await childPages.count();
      
      console.log(`📊 Found ${childCount} child pages in DOM`);
      
      if (childCount > 0) {
        // Click on first child to test rendering
        const firstChild = childPages.first();
        const childTitle = await firstChild.textContent();
        console.log(`🎯 Clicking on child: ${childTitle}`);
        
        // Get the child's button
        const childButton = firstChild.locator('button[data-action="open-tab"]');
        await childButton.click();
        
        // Wait for tab to open
        await page.waitForTimeout(2000);
        
        // Check if "Failed to load page" appears
        const failedLoadText = page.locator('text="Failed to load page"');
        const hasFailedLoad = await failedLoadText.isVisible();
        
        if (hasFailedLoad) {
          console.log('❌ ISSUE CONFIRMED: Child page shows "Failed to load page"');
          await page.screenshot({ path: 'child-failed-load.png' });
        } else {
          console.log('✅ Child page does not show "Failed to load page"');
        }
        
        // Check if title is visible
        const titleVisible = page.locator('h1, [contenteditable="true"]').first();
        const hasTitleVisible = await titleVisible.isVisible();
        
        if (hasTitleVisible) {
          const titleText = await titleVisible.textContent();
          console.log(`✅ Page title visible: "${titleText}"`);
        } else {
          console.log('❌ Page title not visible');
        }
        
        // Check child icon in sidebar
        const childIcon = firstChild.locator('svg').first();
        if (await childIcon.isVisible()) {
          const iconHTML = await childIcon.innerHTML();
          console.log('✅ Child icon found in sidebar');
          console.log(`   Icon HTML: ${iconHTML.substring(0, 100)}...`);
        } else {
          console.log('❌ Child icon not found in sidebar');
        }
        
        console.log('\n📋 SUMMARY:');
        console.log(`   - Child page loads without error: ${!hasFailedLoad ? '✅' : '❌'}`);
        console.log(`   - Child page title visible: ${hasTitleVisible ? '✅' : '❌'}`);
        console.log(`   - Child icon present: ${await childIcon.isVisible() ? '✅' : '❌'}`);
        
      } else {
        console.log('⚠️ No child pages found in DOM');
      }
    } else {
      console.log('⚠️ No expanded parent pages found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'quick-child-test.png', fullPage: true });
  });
});
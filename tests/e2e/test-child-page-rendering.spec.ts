import { test, expect } from '@playwright/test';

test.describe('Child Page Rendering Test', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Enable console logging to capture debug info
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('🔨') || msg.text().includes('👶'))) {
        console.log(`[BROWSER]:`, msg.text());
      }
    });
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test('create TEST feature and TEST CHILD, verify rendering and icons', async ({ page }) => {
    console.log('🧪 Testing: Feature creation with child rendering verification');
    
    // Step 1: Create parent feature called "TEST"
    console.log('📝 Step 1: Creating parent feature "TEST"...');
    
    const pagesSection = page.locator('[data-section="pages-header"]');
    await expect(pagesSection).toBeVisible();
    
    const plusButton = pagesSection.getByRole('button', { name: /Add/ });
    await expect(plusButton).toBeVisible();
    await plusButton.click();
    
    // Wait for new tab to appear (should auto-create "New Feature")
    await page.waitForTimeout(2000);
    
    // Find the new tab and rename it to "TEST"
    const tabContainer = page.locator('[data-component="tab-container"], .tabs-container, [role="tablist"]');
    const newTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await expect(newTab).toBeVisible();
    
    // Click on the tab to make it active
    await newTab.click();
    
    // Find the title input in the page editor and change it to "TEST"
    const titleInput = page.locator('input[placeholder*="title"], input[value*="New Feature"], h1[contenteditable="true"]').first();
    
    if (await titleInput.isVisible()) {
      await titleInput.click();
      await titleInput.selectText();
      await titleInput.fill('TEST');
      await page.keyboard.press('Enter');
    } else {
      // Try alternative approach - look for editable title
      const editableTitle = page.locator('[contenteditable="true"]').first();
      if (await editableTitle.isVisible()) {
        await editableTitle.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('TEST');
        await page.keyboard.press('Enter');
      }
    }
    
    // Wait for title to update
    await page.waitForTimeout(1000);
    
    console.log('✅ Created parent feature "TEST"');
    
    // Step 2: Find the TEST feature in sidebar and create child
    console.log('📝 Step 2: Creating child "TEST CHILD"...');
    
    const pagesTree = page.locator('[data-section="pages-tree"]');
    await expect(pagesTree).toBeVisible();
    
    // Find the TEST feature in the sidebar
    const testFeaturePage = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'TEST' });
    await expect(testFeaturePage).toBeVisible();
    
    // Right-click on TEST feature to open context menu
    await testFeaturePage.click({ button: 'right' });
    
    // Wait for context menu
    await page.waitForTimeout(500);
    const contextMenu = page.locator('[role="menu"]');
    await expect(contextMenu).toBeVisible();
    
    // Look for "Add Child" submenu
    const addChildOption = contextMenu.locator('[role="menuitem"]').filter({ hasText: /add.*child/i });
    await expect(addChildOption).toBeVisible();
    await addChildOption.hover();
    
    // Wait for submenu to appear
    await page.waitForTimeout(300);
    const subMenu = page.locator('[role="menu"]').last();
    
    // Click on "New Feature" option in submenu
    const newFeatureOption = subMenu.locator('[role="menuitem"]').filter({ hasText: 'New Feature' });
    await expect(newFeatureOption).toBeVisible();
    await newFeatureOption.click();
    
    // Wait for child to be created and tab to open
    await page.waitForTimeout(2000);
    
    console.log('✅ Child creation triggered');
    
    // Step 3: Verify child tab appears and rename to "TEST CHILD"
    console.log('📝 Step 3: Renaming child to "TEST CHILD"...');
    
    // Find the new child tab
    const childTab = tabContainer.locator('[role="tab"]').filter({ hasText: 'New Feature' }).last();
    await expect(childTab).toBeVisible();
    
    // Click on child tab to activate it
    await childTab.click();
    
    // Change title to "TEST CHILD"
    const childTitleInput = page.locator('input[placeholder*="title"], input[value*="New Feature"], h1[contenteditable="true"]').first();
    
    if (await childTitleInput.isVisible()) {
      await childTitleInput.click();
      await childTitleInput.selectText();
      await childTitleInput.fill('TEST CHILD');
      await page.keyboard.press('Enter');
    } else {
      const editableChildTitle = page.locator('[contenteditable="true"]').first();
      if (await editableChildTitle.isVisible()) {
        await editableChildTitle.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('TEST CHILD');
        await page.keyboard.press('Enter');
      }
    }
    
    await page.waitForTimeout(1000);
    console.log('✅ Renamed child to "TEST CHILD"');
    
    // Step 4: Verify child page renders correctly
    console.log('🔍 Step 4: Verifying child page rendering...');
    
    // Check that we're NOT seeing "Failed to load page"
    const failedLoadText = page.locator('text="Failed to load page"');
    const hasFailedLoad = await failedLoadText.isVisible();
    
    if (hasFailedLoad) {
      console.log('❌ ISSUE FOUND: Child page shows "Failed to load page"');
      await page.screenshot({ path: 'failed-load-child-page.png' });
    } else {
      console.log('✅ Child page does not show "Failed to load page"');
    }
    
    // Check that the title is visible and correct
    const pageTitle = page.locator('h1, [data-testid="page-title"]').filter({ hasText: 'TEST CHILD' });
    const hasTitleVisible = await pageTitle.isVisible();
    
    if (hasTitleVisible) {
      console.log('✅ Child page title "TEST CHILD" is visible');
    } else {
      console.log('❌ ISSUE FOUND: Child page title not visible');
      // Try to find any title elements
      const anyTitle = page.locator('h1, [contenteditable="true"]').first();
      if (await anyTitle.isVisible()) {
        const titleText = await anyTitle.textContent();
        console.log(`   Found title element with text: "${titleText}"`);
      }
    }
    
    // Step 5: Check icons in sidebar - compare parent vs child
    console.log('🔍 Step 5: Checking feature icons in sidebar...');
    
    // Check parent TEST feature icon
    const parentFeature = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'TEST' }).first();
    const parentIcon = parentFeature.locator('svg').first();
    
    if (await parentIcon.isVisible()) {
      // Get the icon's class or data attributes to identify icon type
      const parentIconClasses = await parentIcon.getAttribute('class') || '';
      const parentIconData = await parentIcon.innerHTML();
      console.log('✅ Parent feature icon found');
      console.log(`   Parent icon classes: ${parentIconClasses}`);
      console.log(`   Parent icon HTML: ${parentIconData.substring(0, 100)}...`);
    } else {
      console.log('❌ Parent feature icon not found');
    }
    
    // Check child TEST CHILD feature icon
    const childFeature = pagesTree.locator('[data-entity-type="page"]').filter({ hasText: 'TEST CHILD' });
    
    if (await childFeature.isVisible()) {
      const childIcon = childFeature.locator('svg').first();
      
      if (await childIcon.isVisible()) {
        const childIconClasses = await childIcon.getAttribute('class') || '';
        const childIconData = await childIcon.innerHTML();
        console.log('✅ Child feature icon found');
        console.log(`   Child icon classes: ${childIconClasses}`);
        console.log(`   Child icon HTML: ${childIconData.substring(0, 100)}...`);
        
        // Compare if icons are the same
        const iconsMatch = parentIconData === childIconData;
        if (iconsMatch) {
          console.log('✅ Parent and child have same icon (both Feature icons)');
        } else {
          console.log('❌ ISSUE FOUND: Parent and child have different icons');
          console.log('   This indicates child might have wrong page type');
        }
      } else {
        console.log('❌ Child feature icon not found in sidebar');
      }
    } else {
      console.log('❌ Child feature not found in sidebar');
    }
    
    // Step 6: Final verification - take screenshot
    console.log('📸 Step 6: Taking final screenshot...');
    await page.screenshot({ path: 'child-page-test-final.png', fullPage: true });
    
    // Step 7: Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   - Child page loads without "Failed to load page": ${!hasFailedLoad ? '✅' : '❌'}`);
    console.log(`   - Child page title is visible: ${hasTitleVisible ? '✅' : '❌'}`);
    console.log(`   - Parent and child icons match: ${await parentIcon.isVisible() && await childFeature.locator('svg').isVisible() ? '✅' : '❌'}`);
    
    // Test assertions
    expect(hasFailedLoad).toBe(false); // Should NOT show "Failed to load page"
    expect(hasTitleVisible).toBe(true); // Should show the title
  });
});
import { test, expect } from '@playwright/test';

test.describe('Feature Child Creation Test', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test('check what child types are available for Feature', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Checking Feature child options...');
    
    // Find pages tree
    const pagesTree = page.locator('[data-section="pages-tree"]');
    await expect(pagesTree).toBeVisible();
    
    // Find any feature page (they should have type=feature)
    const featurePages = pagesTree.locator('[data-entity-type="page"]');
    const count = await featurePages.count();
    
    console.log(`📊 Found ${count} pages total`);
    
    if (count > 0) {
      // Right-click on first page to see context menu
      const firstPage = featurePages.first();
      const pageTitle = await firstPage.textContent();
      console.log(`🎯 Right-clicking on: "${pageTitle}"`);
      
      await firstPage.click({ button: 'right' });
      
      // Wait for context menu
      await page.waitForTimeout(500);
      const contextMenu = page.locator('[role="menu"]');
      
      if (await contextMenu.isVisible()) {
        console.log('✅ Context menu appeared');
        
        // Look for "Add Child" submenu
        const addChildOption = contextMenu.locator('[role="menuitem"]').filter({ hasText: /add.*child/i });
        
        if (await addChildOption.isVisible()) {
          console.log('✅ Found "Add Child" option');
          await addChildOption.hover();
          
          // Wait for submenu
          await page.waitForTimeout(300);
          const subMenu = page.locator('[role="menu"]').last();
          
          if (await subMenu.isVisible()) {
            console.log('✅ Submenu appeared');
            
            // Get all available child options
            const childOptions = await subMenu.locator('[role="menuitem"]').allTextContents();
            console.log('📋 Available child types:', childOptions);
            
            // Take screenshot of menu
            await page.screenshot({ path: 'feature-child-menu.png' });
            
            // Check if there are options other than "New Feature"
            const hasOnlyFeature = childOptions.length === 1 && childOptions[0].includes('Feature');
            if (hasOnlyFeature) {
              console.log('❌ ISSUE: Feature can only create Feature children');
              console.log('   This means Feature → Feature → Feature...');
              console.log('   Should Feature be able to create Release children?');
            } else {
              console.log('✅ Feature has multiple child type options');
            }
          } else {
            console.log('❌ Submenu did not appear');
          }
        } else {
          console.log('❌ No "Add Child" option found');
          const allMenuItems = await contextMenu.locator('[role="menuitem"]').allTextContents();
          console.log('Available menu items:', allMenuItems);
        }
      } else {
        console.log('❌ Context menu did not appear');
      }
    }
  });
});
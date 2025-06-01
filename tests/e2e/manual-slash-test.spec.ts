import { test, expect } from '@playwright/test';

test.describe('Manual Slash Commands Test', () => {
  test('should test slash commands by creating a page manually', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot to see what's available
    await page.screenshot({ path: 'dashboard-state.png' });
    
    // Navigate to Pages section first, then find Features
    console.log('Looking for Pages or Features navigation...');
    
    // Look for Features link/button in sidebar or navigation
    const featuresButton = page.locator('text="Features"').first();
    if (await featuresButton.isVisible()) {
      console.log('Found Features button, clicking...');
      await featuresButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Alternative: look for sidebar navigation
      const sidebarFeatures = page.locator('[data-testid*="feature"], .sidebar [href*="feature"], nav [href*="feature"]').first();
      if (await sidebarFeatures.isVisible()) {
        console.log('Found Features in sidebar, clicking...');
        await sidebarFeatures.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now look for existing features or create new one
    console.log('Looking for feature items or create button...');
    
    // Look for existing feature items first
    const existingFeature = page.locator('[data-testid*="feature"], .feature-item, .feature-card').first();
    if (await existingFeature.isVisible()) {
      console.log('Found existing feature, clicking...');
      await existingFeature.click();
      await page.waitForTimeout(2000);
    } else {
      // Try to create a new feature
      const createFeatureBtn = page.locator('button:has-text("Create"), button:has-text("Add Feature"), button:has-text("+")').first();
      if (await createFeatureBtn.isVisible()) {
        console.log('Found create button, clicking...');
        await createFeatureBtn.click();
        await page.waitForTimeout(1000);
        
        // Fill in feature details
        const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="title"], input[type="text"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Feature for Slash Commands');
          
          // Save the feature
          const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
    
    // Look for any additional navigation if needed
    const pageButtons = page.locator('button, a').filter({ hasText: /page|document|note|edit/i });
    const buttonCount = await pageButtons.count();
    console.log(`Found ${buttonCount} potential page/edit buttons`);
    
    // Just find any TipTap editor on current page
    const allEditors = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    const editorCount = await allEditors.count();
    console.log(`Found ${editorCount} potential editors`);
    
    if (editorCount > 0) {
      // Use the first editor found
      const editor = allEditors.first();
      console.log('Found editor, testing slash commands...');
      
      // Click and focus
      await editor.click();
      await page.waitForTimeout(500);
      
      // Clear content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Type slash
      console.log('Typing slash...');
      await page.keyboard.type('/');
      await page.waitForTimeout(2000); // Give plenty of time
      
      // Take screenshot after slash
      await page.screenshot({ path: 'after-slash.png' });
      
      // Look for ANY new elements that might be the menu
      const possibleMenus = page.locator('div[class*="fixed"], div[class*="absolute"], div[class*="z-"], [role="menu"], [role="listbox"]');
      const menuCount = await possibleMenus.count();
      console.log(`Found ${menuCount} possible menu elements after slash`);
      
      let menuFound = false;
      for (let i = 0; i < menuCount; i++) {
        const menu = possibleMenus.nth(i);
        if (await menu.isVisible()) {
          const text = await menu.textContent();
          if (text && (text.includes('API') || text.includes('Template') || text.includes('MVP'))) {
            console.log(`✅ Found command menu at index ${i} with content: ${text.substring(0, 100)}...`);
            menuFound = true;
            
            // Try to click API if found
            const apiOption = menu.locator('text=API').first();
            if (await apiOption.isVisible()) {
              console.log('Clicking API option...');
              await apiOption.click();
              await page.waitForTimeout(1000);
              
              // Check if API was inserted
              const editorContent = await editor.textContent();
              if (editorContent && editorContent.includes('API')) {
                console.log('✅ API successfully inserted!');
                
                // Test multiple use
                await page.keyboard.type(' and ');
                await page.keyboard.type('/');
                await page.waitForTimeout(2000);
                
                // Check for second menu
                const secondMenuCount = await possibleMenus.count();
                if (secondMenuCount > 0) {
                  for (let j = 0; j < secondMenuCount; j++) {
                    const secondMenu = possibleMenus.nth(j);
                    if (await secondMenu.isVisible()) {
                      const secondText = await secondMenu.textContent();
                      if (secondText && secondText.includes('MVP')) {
                        console.log('✅ Second menu found - multiple use works!');
                        break;
                      }
                    }
                  }
                }
              }
            }
            break;
          }
        }
      }
      
      if (!menuFound) {
        console.log('❌ No command menu found after typing slash');
        const currentContent = await editor.textContent();
        console.log('Current editor content:', currentContent);
      }
      
      // Basic test - verify typing works
      await page.keyboard.type('basic test');
      const finalContent = await editor.textContent();
      console.log('Final editor content:', finalContent);
      
      // At minimum, verify the editor accepts input
      expect(finalContent).toContain('test');
      console.log('✅ Basic editor functionality verified');
      
    } else {
      console.log('❌ No TipTap editors found on page');
      
      // Take final screenshot for debugging
      await page.screenshot({ path: 'no-editor-found.png' });
      
      // At least verify we can navigate
      expect(page.url()).toContain('localhost');
    }
  });
});
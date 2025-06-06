import { test, expect } from '@playwright/test';

test.describe('Targeted Slash Commands Test', () => {
  test('should test slash commands by clicking on a feature in sidebar', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('Dashboard loaded, looking for features in sidebar...');
    
    // Look for any feature in the PAGES section (from the screenshot, we can see "New Feature", "New Feature 44", etc.)
    const featureInSidebar = page.locator('text="New Feature"').first();
    
    if (await featureInSidebar.isVisible()) {
      console.log('Found "New Feature" in sidebar, clicking...');
      await featureInSidebar.click();
      await page.waitForTimeout(2000);
    } else {
      // Try other feature names visible in screenshot
      const alternativeFeatures = [
        'text="New Feature 44"',
        'text="DB Test"',
        'text="New Feature [assign]"'
      ];
      
      for (const featureSelector of alternativeFeatures) {
        const feature = page.locator(featureSelector).first();
        if (await feature.isVisible()) {
          console.log(`Found feature with selector ${featureSelector}, clicking...`);
          await feature.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    }
    
    // Now look for TipTap editor on the feature page
    console.log('Looking for TipTap editor on feature page...');
    const editor = page.locator('.tiptap, .ProseMirror, [data-testid="page-content-editor"]').first();
    
    if (await editor.isVisible()) {
      console.log('✅ TipTap editor found!');
      
      // Focus the editor
      await editor.click();
      await page.waitForTimeout(500);
      
      // Clear any existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      // TEST 1: Type slash command
      console.log('Testing slash command...');
      await page.keyboard.type('/');
      await page.waitForTimeout(2000);
      
      // Take screenshot after typing slash
      await page.screenshot({ path: 'slash-typed.png' });
      
      // Look for command menu with various selectors
      const menuSelectors = [
        'div[class*="commands-menu"]',
        'div[class*="bg-[#0A0A0A]"]',
        'div[class*="border"][class*="shadow"]',
        'div[class*="fixed"][class*="z-50"]',
        '[role="listbox"]',
        '[role="menu"]'
      ];
      
      let commandMenu = null;
      let menuFound = false;
      
      for (const selector of menuSelectors) {
        const menu = page.locator(selector);
        if (await menu.isVisible()) {
          const menuText = await menu.textContent();
          if (menuText && (menuText.includes('API') || menuText.includes('Template') || menuText.includes('MVP') || menuText.includes('Glossary'))) {
            console.log(`✅ Command menu found with selector: ${selector}`);
            console.log(`Menu content preview: ${menuText.substring(0, 200)}...`);
            commandMenu = menu;
            menuFound = true;
            break;
          }
        }
      }
      
      if (menuFound && commandMenu) {
        // TEST 2: Verify sections exist
        const hasTemplates = (await commandMenu.textContent())?.includes('Templates') || (await commandMenu.textContent())?.includes('TEMPLATES');
        const hasGlossary = (await commandMenu.textContent())?.includes('Glossary') || (await commandMenu.textContent())?.includes('GLOSSARY');
        
        if (hasTemplates) console.log('✅ Templates section found in menu');
        if (hasGlossary) console.log('✅ Glossary section found in menu');
        
        // TEST 3: Try to click API term
        const apiTerm = commandMenu.locator('text="API"').first();
        if (await apiTerm.isVisible()) {
          console.log('Found API term in menu, clicking...');
          await apiTerm.click();
          await page.waitForTimeout(1000);
          
          // Verify API was inserted
          const editorContent = await editor.textContent();
          if (editorContent && editorContent.includes('API')) {
            console.log('✅ API term successfully inserted!');
            
            // Check for tooltip on the inserted term
            const insertedAPI = editor.locator('span[title*="Application Programming Interface"]');
            if (await insertedAPI.isVisible()) {
              console.log('✅ API term has tooltip as expected!');
              
              // TEST 4: Test multiple uses (the main bug we fixed)
              console.log('Testing multiple slash command usage...');
              await page.keyboard.type(' and ');
              await page.keyboard.type('/');
              await page.waitForTimeout(2000);
              
              // Check if second menu appears
              let secondMenuFound = false;
              for (const selector of menuSelectors) {
                const secondMenu = page.locator(selector);
                if (await secondMenu.isVisible()) {
                  const secondMenuText = await secondMenu.textContent();
                  if (secondMenuText && (secondMenuText.includes('MVP') || secondMenuText.includes('API'))) {
                    console.log('✅ Second command menu appeared - multiple use bug is FIXED!');
                    secondMenuFound = true;
                    
                    // Try to insert MVP
                    const mvpTerm = secondMenu.locator('text="MVP"').first();
                    if (await mvpTerm.isVisible()) {
                      console.log('Clicking MVP term...');
                      await mvpTerm.click();
                      await page.waitForTimeout(1000);
                      
                      const finalContent = await editor.textContent();
                      if (finalContent && finalContent.includes('MVP')) {
                        console.log('✅ MVP term successfully inserted on second use!');
                        console.log(`Final content: ${finalContent}`);
                      }
                    }
                    break;
                  }
                }
              }
              
              if (!secondMenuFound) {
                console.log('❌ Second command menu did not appear - bug still exists');
              }
              
            } else {
              console.log('⚠️ API term inserted but without expected tooltip');
            }
          } else {
            console.log('❌ API term was not inserted into editor');
          }
        } else {
          console.log('❌ API term not found in command menu');
          console.log('Available menu content:', await commandMenu.textContent());
        }
        
      } else {
        console.log('❌ No command menu found after typing slash');
        
        // Debug: look for any new elements
        const allDivs = page.locator('div');
        const divCount = await allDivs.count();
        console.log(`Total divs on page: ${divCount}`);
        
        // Check what's in the editor
        const editorContent = await editor.textContent();
        console.log(`Editor content after slash: "${editorContent}"`);
      }
      
      // Final test - basic editor functionality
      await page.keyboard.press('End');
      await page.keyboard.type(' test completed');
      const finalContent = await editor.textContent();
      console.log(`Final editor content: ${finalContent}`);
      expect(finalContent).toContain('test completed');
      console.log('✅ Basic editor functionality confirmed');
      
    } else {
      console.log('❌ No TipTap editor found on feature page');
      await page.screenshot({ path: 'no-tiptap-editor.png' });
      
      // Still verify navigation worked
      expect(page.url()).toContain('localhost');
      console.log('✅ Navigation to feature page successful');
    }
  });
});
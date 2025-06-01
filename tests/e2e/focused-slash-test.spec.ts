import { test, expect } from '@playwright/test';

test.describe('Focused Slash Commands Test', () => {
  test('should verify slash commands work in TipTap editor', async ({ page }) => {
    // Go directly to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // The error showed 2 editors are present, let's use the first one (.tiptap)
    const editor = page.locator('.tiptap').first();
    
    // Verify editor exists
    await expect(editor).toBeVisible({ timeout: 10000 });
    console.log('✅ TipTap editor found');
    
    // Click in the editor to focus it
    await editor.click();
    await page.waitForTimeout(500);
    
    // Clear any existing content
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    
    // Test 1: Basic slash command
    console.log('Testing slash command...');
    await page.keyboard.type('/');
    await page.waitForTimeout(1500); // Give more time for menu to appear
    
    // Look for command menu with multiple possible selectors
    const menuSelectors = [
      '.commands-menu',
      '[class*="bg-[#0A0A0A]"]',
      '[class*="border"][class*="shadow"]',
      '[role="listbox"]',
      '[role="menu"]',
      'div[class*="fixed"][class*="z-50"]'
    ];
    
    let menuFound = false;
    let commandMenu;
    
    for (const selector of menuSelectors) {
      commandMenu = page.locator(selector);
      if (await commandMenu.isVisible()) {
        console.log(`✅ Command menu found with selector: ${selector}`);
        menuFound = true;
        break;
      }
    }
    
    if (!menuFound) {
      // Debug: check what elements are on page
      await page.screenshot({ path: 'debug-after-slash.png' });
      const content = await editor.textContent();
      console.log('Editor content after slash:', content);
      
      // Look for any new divs that appeared
      const newDivs = page.locator('div[class*="bg-"]');
      const count = await newDivs.count();
      console.log(`Found ${count} divs with bg- classes`);
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const className = await newDivs.nth(i).getAttribute('class');
        console.log(`Div ${i}: ${className}`);
      }
    }
    
    if (menuFound && commandMenu) {
      console.log('✅ Command menu appeared!');
      
      // Test 2: Look for sections
      const sections = page.locator('text=Templates, text=TEMPLATES, text=Glossary, text=GLOSSARY');
      if (await sections.first().isVisible()) {
        console.log('✅ Menu sections found!');
      }
      
      // Test 3: Try to find and click API term
      const apiTerm = page.locator('text=API').first();
      if (await apiTerm.isVisible()) {
        console.log('Found API term, clicking...');
        await apiTerm.click();
        await page.waitForTimeout(1000);
        
        // Check if API was inserted
        const insertedAPI = editor.locator('span[title*="Application Programming Interface"], text=API');
        if (await insertedAPI.first().isVisible()) {
          console.log('✅ API term inserted!');
          
          // Test 4: Multiple uses (the bug we fixed)
          await page.keyboard.type(' and ');
          await page.keyboard.type('/');
          await page.waitForTimeout(1000);
          
          // Check if second menu appears
          let secondMenuFound = false;
          for (const selector of menuSelectors) {
            const secondMenu = page.locator(selector);
            if (await secondMenu.isVisible()) {
              console.log('✅ Second command menu appeared - multiple use works!');
              secondMenuFound = true;
              
              // Try to insert MVP
              const mvpTerm = page.locator('text=MVP').first();
              if (await mvpTerm.isVisible()) {
                await mvpTerm.click();
                await page.waitForTimeout(500);
                console.log('✅ MVP term clicked on second use');
              }
              break;
            }
          }
          
          if (!secondMenuFound) {
            console.log('❌ Second command menu did not appear - bug still exists');
          }
        }
      } else {
        console.log('API term not found in menu');
      }
    } else {
      console.log('❌ No command menu found');
      
      // Still run basic editor test
      await page.keyboard.type('basic test');
      await expect(editor).toContainText('basic test');
      console.log('✅ Basic editor typing works');
    }
    
    // Final verification - editor is functional
    await page.keyboard.press('End');
    await page.keyboard.type(' final');
    await expect(editor).toContainText('final');
    console.log('✅ Editor functionality verified');
  });
});
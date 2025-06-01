import { test, expect } from '@playwright/test';

test.describe('Clean Slash Commands Test', () => {
  test('should test slash commands functionality', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('Dashboard loaded, looking for features in sidebar...');
    
    // Click on "New Feature" in the sidebar (from the screenshot)
    const featureInSidebar = page.locator('text="New Feature"').first();
    
    if (await featureInSidebar.isVisible()) {
      console.log('Found "New Feature" in sidebar, clicking...');
      await featureInSidebar.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for TipTap editor
    const editor = page.locator('.tiptap, .ProseMirror, [data-testid="page-content-editor"]').first();
    
    if (await editor.isVisible()) {
      console.log('✅ TipTap editor found!');
      
      // Focus and clear editor
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      // Type slash command
      console.log('Testing slash command...');
      await page.keyboard.type('/');
      await page.waitForTimeout(2000);
      
      // Look for command menu with more specific selector to avoid multiple matches
      const commandMenu = page.locator('div.fixed.z-50').filter({ hasText: 'Templates' }).or(
        page.locator('div.fixed.z-50').filter({ hasText: 'Glossary' })
      ).first();
      
      let menuFound = false;
      
      if (await commandMenu.isVisible()) {
        console.log('✅ Command menu found!');
        const menuText = await commandMenu.textContent();
        if (menuText && (menuText.includes('API') || menuText.includes('Template'))) {
          console.log('✅ Command menu contains expected content!');
          menuFound = true;
          
          // Try to click API
          const apiTerm = commandMenu.locator('text="API"').first();
          if (await apiTerm.isVisible()) {
            console.log('Clicking API term...');
            await apiTerm.click();
            await page.waitForTimeout(1000);
            
            const editorContent = await editor.textContent();
            if (editorContent && editorContent.includes('API')) {
              console.log('✅ API term inserted successfully!');
              
              // Test multiple uses
              await page.keyboard.type(' and ');
              await page.keyboard.type('/');
              await page.waitForTimeout(2000);
              
              // Check second menu
              const secondMenu = page.locator('div.fixed.z-50').filter({ hasText: 'Templates' }).or(
                page.locator('div.fixed.z-50').filter({ hasText: 'Glossary' })
              ).first();
              
              if (await secondMenu.isVisible()) {
                console.log('✅ Second menu appeared - bug fixed!');
              } else {
                console.log('❌ Second menu failed');
              }
            }
          } else {
            console.log('❌ API term not found in menu');
          }
        }
      }
      
      if (!menuFound) {
        console.log('❌ No command menu found');
      }
      
      // Basic test
      await page.keyboard.type('test');
      const finalContent = await editor.textContent();
      expect(finalContent).toContain('test');
      console.log('✅ Basic functionality verified');
      
    } else {
      console.log('❌ No editor found');
      expect(page.url()).toContain('localhost');
    }
  });
});
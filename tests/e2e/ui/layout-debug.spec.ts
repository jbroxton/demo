import { test, expect } from '@playwright/test';

/**
 * Debug Layout Test - Check what's actually happening with CSS Grid
 */
test.describe('Layout Debug', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should debug CSS Grid layout changes', async ({ page }) => {
    console.log('🔍 Debugging CSS Grid layout implementation');
    
    // Check initial state
    const workspaceGrid = page.locator('.workspace-grid').first();
    await expect(workspaceGrid).toBeVisible();
    
    const initialGridColumns = await workspaceGrid.evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return {
        gridTemplateColumns: computedStyle.gridTemplateColumns,
        inlineStyle: (el as HTMLElement).style.gridTemplateColumns,
        debugGrid: el.getAttribute('data-debug-grid'),
        rightSidebarOpen: el.getAttribute('data-right-sidebar-open'),
        rightSidebarWidth: el.getAttribute('data-right-sidebar-width')
      };
    });
    
    console.log('📊 Initial Grid State:', initialGridColumns);
    
    // Check initial main content size
    const mainContent = page.locator('[data-testid="main-content"]').first();
    const initialMainBox = await mainContent.boundingBox();
    console.log(`📏 Initial main content: ${initialMainBox?.width}x${initialMainBox?.height} at (${initialMainBox?.x}, ${initialMainBox?.y})`);
    
    // Look for AI Chat button
    const aiChatButton = page.locator('button[aria-label="AI Chat"]').first();
    const aiChatVisible = await aiChatButton.isVisible().catch(() => false);
    
    if (aiChatVisible) {
      console.log('🎯 Clicking AI Chat button...');
      await aiChatButton.click();
      await page.waitForTimeout(1000);
      
      // Check grid state after click
      const afterClickGridColumns = await workspaceGrid.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return {
          gridTemplateColumns: computedStyle.gridTemplateColumns,
          inlineStyle: (el as HTMLElement).style.gridTemplateColumns,
          debugGrid: el.getAttribute('data-debug-grid'),
          rightSidebarOpen: el.getAttribute('data-right-sidebar-open'),
          rightSidebarWidth: el.getAttribute('data-right-sidebar-width')
        };
      });
      
      console.log('📊 After Click Grid State:', afterClickGridColumns);
      
      // Check main content size after click
      const afterClickMainBox = await mainContent.boundingBox();
      console.log(`📏 After click main content: ${afterClickMainBox?.width}x${afterClickMainBox?.height} at (${afterClickMainBox?.x}, ${afterClickMainBox?.y})`);
      
      // Check right sidebar
      const rightSidebar = page.locator('.utility-panel').first();
      const rightSidebarBox = await rightSidebar.boundingBox();
      console.log(`📏 Right sidebar: ${rightSidebarBox?.width}x${rightSidebarBox?.height} at (${rightSidebarBox?.x}, ${rightSidebarBox?.y})`);
      
      // Check if the React state actually changed
      const uiStateDebug = await page.evaluate(() => {
        // Try to access any global state debugging if available
        return {
          windowWidth: window.innerWidth,
          rightSidebarVisible: document.querySelector('.utility-panel')?.clientWidth || 0
        };
      });
      
      console.log('🔧 UI State Debug:', uiStateDebug);
      
      // Take a screenshot for manual inspection
      await page.screenshot({ path: 'debug-layout-after-click.png', fullPage: true });
      
    } else {
      console.log('❌ AI Chat button not found');
    }
  });
});
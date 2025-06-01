import { test, expect } from '@playwright/test';

/**
 * Detailed Debug - Check the complete element hierarchy
 */
test.describe('Layout Detailed Debug', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should trace the complete element hierarchy', async ({ page }) => {
    console.log('🔍 Tracing element hierarchy for main content');
    
    const mainContent = page.locator('[data-testid="main-content"]').first();
    await expect(mainContent).toBeVisible();
    
    // Get the complete hierarchy and styles
    const hierarchyInfo = await mainContent.evaluate(el => {
      const hierarchy = [];
      let current = el;
      
      while (current && current !== document.body) {
        const styles = window.getComputedStyle(current);
        const info = {
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          width: styles.width,
          minWidth: styles.minWidth,
          maxWidth: styles.maxWidth,
          display: styles.display,
          position: styles.position,
          gridArea: styles.gridArea,
          gridColumn: styles.gridColumn,
          flexBasis: styles.flexBasis,
          flexGrow: styles.flexGrow,
          flexShrink: styles.flexShrink,
          overflow: styles.overflow,
          boxSizing: styles.boxSizing
        };
        hierarchy.push(info);
        current = current.parentElement;
      }
      
      return hierarchy;
    });
    
    console.log('📊 Element Hierarchy (child to parent):');
    hierarchyInfo.forEach((info, index) => {
      console.log(`  ${index}: ${info.tagName}.${info.className}`, {
        width: info.width,
        minWidth: info.minWidth,
        maxWidth: info.maxWidth,
        display: info.display,
        gridArea: info.gridArea,
        gridColumn: info.gridColumn
      });
    });
    
    // Click AI Chat and check again
    const aiChatButton = page.locator('button[aria-label="AI Chat"]').first();
    const aiChatVisible = await aiChatButton.isVisible().catch(() => false);
    
    if (aiChatVisible) {
      console.log('🎯 Clicking AI Chat button...');
      await aiChatButton.click();
      await page.waitForTimeout(1000);
      
      const afterClickHierarchy = await mainContent.evaluate(el => {
        const hierarchy = [];
        let current = el;
        
        while (current && current !== document.body) {
          const styles = window.getComputedStyle(current);
          const info = {
            tagName: current.tagName,
            className: current.className,
            width: styles.width,
            minWidth: styles.minWidth,
            maxWidth: styles.maxWidth,
            gridArea: styles.gridArea
          };
          hierarchy.push(info);
          current = current.parentElement;
        }
        
        return hierarchy;
      });
      
      console.log('📊 After Click Hierarchy:');
      afterClickHierarchy.forEach((info, index) => {
        console.log(`  ${index}: ${info.tagName}.${info.className}`, {
          width: info.width,
          minWidth: info.minWidth,
          maxWidth: info.maxWidth,
          gridArea: info.gridArea
        });
      });
      
      // Also check the workspace grid itself
      const workspaceInfo = await page.locator('.workspace-grid').evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          gridTemplateColumns: styles.gridTemplateColumns,
          width: styles.width,
          clientWidth: el.clientWidth,
          offsetWidth: el.offsetWidth
        };
      });
      
      console.log('📊 Workspace Grid Info:', workspaceInfo);
    }
  });
});
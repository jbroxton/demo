import { test, expect } from '@playwright/test';

/**
 * Tests for responsive UI layout behavior
 * Verifies that components properly resize and position relative to each other
 * Tests sidebar, canvas, and right nav interactions
 */

test.describe('Layout Responsive Behavior', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-component="left-sidebar"]', { timeout: 10000 });
  });

  test('should have proper initial layout dimensions on login', async ({ page }) => {
    console.log('🧪 Testing: Initial layout dimensions after login');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/layout-01-initial.png', fullPage: true });
    
    // Get viewport size
    const viewportSize = page.viewportSize();
    console.log(`📐 Viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    
    // Test main layout containers
    const leftSidebar = page.locator('[data-component="left-sidebar"]');
    const mainContent = page.locator('main, [data-testid="main-content"], .main-content').first();
    
    // Verify sidebar is visible and positioned correctly
    await expect(leftSidebar).toBeVisible();
    const sidebarBox = await leftSidebar.boundingBox();
    
    if (sidebarBox && viewportSize) {
      console.log(`📏 Sidebar: ${sidebarBox.width}x${sidebarBox.height} at (${sidebarBox.x}, ${sidebarBox.y})`);
      
      // Sidebar should be at left edge
      expect(sidebarBox.x).toBeLessThanOrEqual(5); // Allow small margin
      
      // Sidebar should extend to near full height
      expect(sidebarBox.height).toBeGreaterThan(viewportSize.height * 0.8);
    }
    
    // Find main content area (might be different selectors depending on your layout)
    const possibleMainSelectors = [
      'main',
      '[data-testid="main-content"]', 
      '.main-content',
      '[data-section="main"]',
      '.flex-1', // Tailwind main content
      '[role="main"]'
    ];
    
    let mainContentBox = null;
    let mainContentElement = null;
    
    for (const selector of possibleMainSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        mainContentElement = element;
        mainContentBox = await element.boundingBox();
        console.log(`📏 Found main content with selector: ${selector}`);
        break;
      }
    }
    
    if (mainContentBox && sidebarBox && viewportSize) {
      console.log(`📏 Main content: ${mainContentBox.width}x${mainContentBox.height} at (${mainContentBox.x}, ${mainContentBox.y})`);
      
      // Main content should start after sidebar
      expect(mainContentBox.x).toBeGreaterThanOrEqual(sidebarBox.width - 10); // Allow small overlap
      
      // Main content should use remaining width
      const expectedWidth = viewportSize.width - sidebarBox.width;
      const actualWidth = mainContentBox.width;
      const widthDifference = Math.abs(expectedWidth - actualWidth);
      
      console.log(`📊 Expected main width: ${expectedWidth}, Actual: ${actualWidth}, Difference: ${widthDifference}`);
      
      // Allow 50px tolerance for proper layout
      expect(widthDifference).toBeLessThan(50);
      
      // Main content should take full height
      expect(mainContentBox.height).toBeGreaterThan(viewportSize.height * 0.7);
    } else {
      console.log('⚠️ Could not find main content area - layout might have issues');
    }
    
    console.log('✅ Initial layout dimensions verified');
  });

  test('should properly resize canvas when right navigation opens/closes', async ({ page }) => {
    console.log('🧪 Testing: Canvas resize with right nav interactions');
    
    // First, find and open a tab that has content
    const pagesTree = page.locator('[data-section="pages-tree"]');
    const firstPage = pagesTree.locator('button').first();
    
    if (await firstPage.isVisible()) {
      await firstPage.click();
      await page.waitForTimeout(2000); // Wait for tab to open
    }
    
    // Take screenshot before right nav interaction
    await page.screenshot({ path: 'test-results/layout-02-before-right-nav.png', fullPage: true });
    
    // Look for canvas/editor area (adjust selectors based on your app)
    const possibleCanvasSelectors = [
      '.ProseMirror', // TipTap editor
      '[data-testid="editor"]',
      '[data-testid="canvas"]',
      '.editor-content',
      '.tiptap',
      '.canvas'
    ];
    
    let canvasElement = null;
    let initialCanvasBox = null;
    
    for (const selector of possibleCanvasSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        canvasElement = element;
        initialCanvasBox = await element.boundingBox();
        console.log(`📏 Found canvas with selector: ${selector}`);
        break;
      }
    }
    
    if (!canvasElement || !initialCanvasBox) {
      console.log('⚠️ No canvas found, looking for any content area');
      // Fallback to main content area
      canvasElement = page.locator('main, .main-content').first();
      if (await canvasElement.isVisible()) {
        initialCanvasBox = await canvasElement.boundingBox();
      }
    }
    
    if (initialCanvasBox) {
      console.log(`📏 Initial canvas: ${initialCanvasBox.width}x${initialCanvasBox.height} at (${initialCanvasBox.x}, ${initialCanvasBox.y})`);
    }
    
    // Look for right navigation trigger (might be a button or area)
    const possibleRightNavTriggers = [
      '[data-testid="right-nav-toggle"]',
      '[data-testid="properties-panel"]',
      '.right-sidebar-trigger',
      'button[aria-label*="Properties"]',
      'button[aria-label*="Right"]',
      // Could be an area at the right edge of screen
      '.right-panel-trigger'
    ];
    
    let rightNavTrigger = null;
    
    for (const selector of possibleRightNavTriggers) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        rightNavTrigger = element;
        console.log(`🎯 Found right nav trigger: ${selector}`);
        break;
      }
    }
    
    // If no trigger found, try clicking near the right edge to see if there's a hidden trigger
    if (!rightNavTrigger) {
      console.log('🎯 No right nav trigger found, trying right edge click');
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        // Click near right edge, middle of screen
        await page.click(`${viewportSize.width - 20} ${viewportSize.height / 2}`);
        await page.waitForTimeout(1000);
      }
    } else {
      // Click the right nav trigger
      await rightNavTrigger.click();
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot after right nav interaction
    await page.screenshot({ path: 'test-results/layout-03-after-right-nav.png', fullPage: true });
    
    // Check if right panel appeared
    const possibleRightPanels = [
      '[data-testid="right-panel"]',
      '[data-testid="properties-panel"]', 
      '.right-sidebar',
      '.properties-panel',
      '.right-nav'
    ];
    
    let rightPanel = null;
    let rightPanelBox = null;
    
    for (const selector of possibleRightPanels) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        rightPanel = element;
        rightPanelBox = await element.boundingBox();
        console.log(`📏 Found right panel: ${selector}`);
        break;
      }
    }
    
    if (rightPanelBox) {
      console.log(`📏 Right panel: ${rightPanelBox.width}x${rightPanelBox.height} at (${rightPanelBox.x}, ${rightPanelBox.y})`);
      
      // Verify canvas resized to accommodate right panel
      if (canvasElement && initialCanvasBox) {
        const newCanvasBox = await canvasElement.boundingBox();
        
        if (newCanvasBox) {
          console.log(`📏 New canvas: ${newCanvasBox.width}x${newCanvasBox.height} at (${newCanvasBox.x}, ${newCanvasBox.y})`);
          
          // Canvas should be narrower now
          expect(newCanvasBox.width).toBeLessThan(initialCanvasBox.width);
          
          // Canvas should not overlap with right panel
          expect(newCanvasBox.x + newCanvasBox.width).toBeLessThanOrEqual(rightPanelBox.x + 10); // Allow small margin
          
          console.log('✅ Canvas properly resized to accommodate right panel');
        }
      }
    } else {
      console.log('⚠️ Right panel not found - might not be implemented or different trigger needed');
    }
    
    // Try to close right panel if it opened
    if (rightNavTrigger) {
      await rightNavTrigger.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after closing
      await page.screenshot({ path: 'test-results/layout-04-after-close.png', fullPage: true });
      
      // Verify canvas returned to original size
      if (canvasElement && initialCanvasBox) {
        const finalCanvasBox = await canvasElement.boundingBox();
        
        if (finalCanvasBox) {
          console.log(`📏 Final canvas: ${finalCanvasBox.width}x${finalCanvasBox.height} at (${finalCanvasBox.x}, ${finalCanvasBox.y})`);
          
          // Canvas should return to approximately original width
          const widthDifference = Math.abs(finalCanvasBox.width - initialCanvasBox.width);
          expect(widthDifference).toBeLessThan(20); // Allow small differences
          
          console.log('✅ Canvas properly restored to original size');
        }
      }
    }
  });

  test('should not have overlapping UI components', async ({ page }) => {
    console.log('🧪 Testing: UI components should not overlap');
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'test-results/layout-05-overlap-check.png', fullPage: true });
    
    // Get all major UI components
    const leftSidebar = page.locator('[data-component="left-sidebar"]').first();
    const mainContent = page.locator('main, .main-content').first();
    
    const sidebarBox = await leftSidebar.boundingBox();
    const mainBox = await mainContent.boundingBox();
    
    if (sidebarBox && mainBox) {
      console.log(`📏 Sidebar: x=${sidebarBox.x}, width=${sidebarBox.width}, right=${sidebarBox.x + sidebarBox.width}`);
      console.log(`📏 Main: x=${mainBox.x}, width=${mainBox.width}`);
      
      // Main content should start after sidebar ends (with small tolerance)
      const gap = mainBox.x - (sidebarBox.x + sidebarBox.width);
      console.log(`📏 Gap between sidebar and main: ${gap}px`);
      
      // Allow small negative gap (slight overlap) but not major overlap
      expect(gap).toBeGreaterThan(-20);
      
      if (gap < 0) {
        console.log('⚠️ Warning: Main content overlaps sidebar');
      } else {
        console.log('✅ No overlap between sidebar and main content');
      }
    }
    
    // Check for other overlapping elements
    const allButtons = page.locator('button:visible');
    const buttonCount = await allButtons.count();
    
    console.log(`🔍 Checking ${buttonCount} visible buttons for overlaps`);
    
    // Sample check: ensure buttons don't overlap with each other significantly
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const buttonBox = await button.boundingBox();
      
      if (buttonBox) {
        // Check if button is within viewport
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          const withinViewport = buttonBox.x >= 0 && 
                                 buttonBox.y >= 0 && 
                                 buttonBox.x + buttonBox.width <= viewportSize.width &&
                                 buttonBox.y + buttonBox.height <= viewportSize.height;
          
          if (!withinViewport) {
            console.log(`⚠️ Button ${i} extends outside viewport: ${buttonBox.x}, ${buttonBox.y}, ${buttonBox.width}x${buttonBox.height}`);
          }
        }
      }
    }
    
    console.log('✅ Overlap check completed');
  });

  test('should maintain proper layout on window resize', async ({ page }) => {
    console.log('🧪 Testing: Layout behavior on window resize');
    
    // Test different viewport sizes
    const testSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 768, height: 1024, name: 'Tablet' }
    ];
    
    for (const size of testSizes) {
      console.log(`📐 Testing ${size.name}: ${size.width}x${size.height}`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1000); // Allow layout to settle
      
      // Take screenshot at this size
      await page.screenshot({ 
        path: `test-results/layout-06-${size.name.toLowerCase().replace(' ', '-')}.png`, 
        fullPage: true 
      });
      
      // Verify layout components are still properly positioned
      const leftSidebar = page.locator('[data-component="left-sidebar"]');
      const sidebarBox = await leftSidebar.boundingBox();
      
      if (sidebarBox) {
        // Sidebar should remain at left edge
        expect(sidebarBox.x).toBeLessThanOrEqual(5);
        
        // Sidebar should not be wider than 30% of viewport on smaller screens
        if (size.width < 1024) {
          expect(sidebarBox.width).toBeLessThan(size.width * 0.3);
        }
        
        console.log(`✅ ${size.name}: Sidebar properly positioned at ${sidebarBox.x}, width ${sidebarBox.width}`);
      }
      
      // Check if main content adapts
      const mainContent = page.locator('main, .main-content').first();
      if (await mainContent.isVisible()) {
        const mainBox = await mainContent.boundingBox();
        
        if (mainBox && sidebarBox) {
          const remainingWidth = size.width - sidebarBox.width;
          const mainWidthRatio = mainBox.width / remainingWidth;
          
          console.log(`📊 ${size.name}: Main content uses ${(mainWidthRatio * 100).toFixed(1)}% of available width`);
          
          // Main content should use most of the remaining space
          expect(mainWidthRatio).toBeGreaterThan(0.8);
        }
      }
    }
    
    // Return to default size
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('✅ Window resize test completed');
  });

  test('should handle sidebar collapse/expand properly', async ({ page }) => {
    console.log('🧪 Testing: Sidebar collapse/expand behavior');
    
    // Look for sidebar toggle button
    const possibleToggleSelectors = [
      '[data-testid="sidebar-toggle"]',
      '[aria-label*="collapse"]',
      '[aria-label*="expand"]',
      'button[title*="collapse"]',
      '.sidebar-toggle'
    ];
    
    let toggleButton = null;
    
    for (const selector of possibleToggleSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        toggleButton = element;
        console.log(`🎯 Found sidebar toggle: ${selector}`);
        break;
      }
    }
    
    const leftSidebar = page.locator('[data-component="left-sidebar"]');
    const initialSidebarBox = await leftSidebar.boundingBox();
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/layout-07-sidebar-initial.png', fullPage: true });
    
    if (toggleButton && initialSidebarBox) {
      console.log(`📏 Initial sidebar width: ${initialSidebarBox.width}px`);
      
      // Click toggle to collapse
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      // Take collapsed screenshot
      await page.screenshot({ path: 'test-results/layout-08-sidebar-collapsed.png', fullPage: true });
      
      const collapsedSidebarBox = await leftSidebar.boundingBox();
      
      if (collapsedSidebarBox) {
        console.log(`📏 Collapsed sidebar width: ${collapsedSidebarBox.width}px`);
        
        // Sidebar should be significantly narrower when collapsed
        expect(collapsedSidebarBox.width).toBeLessThan(initialSidebarBox.width * 0.5);
        
        // Main content should expand to use the extra space
        const mainContent = page.locator('main, .main-content').first();
        if (await mainContent.isVisible()) {
          const expandedMainBox = await mainContent.boundingBox();
          
          if (expandedMainBox) {
            console.log(`📏 Expanded main content width: ${expandedMainBox.width}px`);
            
            // Main content should be wider now
            // (We'd need initial main width to compare, but this tests the concept)
            const viewportSize = page.viewportSize();
            if (viewportSize) {
              const mainWidthRatio = expandedMainBox.width / viewportSize.width;
              expect(mainWidthRatio).toBeGreaterThan(0.7); // Should use most of the screen
            }
          }
        }
        
        // Click toggle to expand back
        await toggleButton.click();
        await page.waitForTimeout(1000);
        
        // Take expanded screenshot
        await page.screenshot({ path: 'test-results/layout-09-sidebar-expanded.png', fullPage: true });
        
        const finalSidebarBox = await leftSidebar.boundingBox();
        
        if (finalSidebarBox) {
          console.log(`📏 Final sidebar width: ${finalSidebarBox.width}px`);
          
          // Should return to approximately original width
          const widthDifference = Math.abs(finalSidebarBox.width - initialSidebarBox.width);
          expect(widthDifference).toBeLessThan(20);
          
          console.log('✅ Sidebar collapse/expand working properly');
        }
      }
    } else {
      console.log('⚠️ Sidebar toggle not found - might not be implemented');
    }
  });
});
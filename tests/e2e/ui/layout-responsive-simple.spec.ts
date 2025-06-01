import { test, expect } from '@playwright/test';

/**
 * Simple Layout Tests - Testing actual implementation
 * 
 * These tests verify the basic layout behavior using the actual
 * AI Chat and TODO buttons for right sidebar control.
 */
test.describe('Layout Basic Behavior', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should have proper initial layout with correct sidebar positioning', async ({ page }) => {
    console.log('🧪 Testing: Basic layout structure');
    
    const viewportSize = page.viewportSize();
    console.log(`📐 Viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    
    // Check left sidebar
    const leftSidebar = page.locator('.navigator-panel').first();
    await expect(leftSidebar).toBeVisible();
    
    const leftSidebarBox = await leftSidebar.boundingBox();
    expect(leftSidebarBox?.x).toBe(0); // Should start at left edge
    expect(leftSidebarBox?.height).toBeGreaterThan(500); // Should be tall
    
    console.log(`📏 Left Sidebar: ${leftSidebarBox?.width}x${leftSidebarBox?.height} at (${leftSidebarBox?.x}, ${leftSidebarBox?.y})`);
    
    // Check main content area 
    const mainContent = page.locator('[data-testid="main-content"]').first();
    await expect(mainContent).toBeVisible();
    
    const mainContentBox = await mainContent.boundingBox();
    
    // Main content should start after sidebar
    if (leftSidebarBox && mainContentBox) {
      expect(mainContentBox.x).toBeGreaterThan(leftSidebarBox.width - 10); // Allow small margin
      console.log(`📏 Main Content: ${mainContentBox.width}x${mainContentBox.height} at (${mainContentBox.x}, ${mainContentBox.y})`);
      console.log(`📊 Gap between sidebar and content: ${mainContentBox.x - leftSidebarBox.width}`);
    }
    
    // Check right sidebar area
    const rightSidebar = page.locator('.utility-panel').first();
    await expect(rightSidebar).toBeVisible();
    
    const rightSidebarBox = await rightSidebar.boundingBox();
    console.log(`📏 Right Sidebar: ${rightSidebarBox?.width}x${rightSidebarBox?.height} at (${rightSidebarBox?.x}, ${rightSidebarBox?.y})`);
  });

  test('should toggle right sidebar with AI Chat button', async ({ page }) => {
    console.log('🧪 Testing: AI Chat button toggles right sidebar');
    
    // First, ensure we can find the main content
    const mainContent = page.locator('[data-testid="main-content"]').first();
    await expect(mainContent).toBeVisible();
    
    const initialMainBox = await mainContent.boundingBox();
    console.log(`📏 Initial main content: ${initialMainBox?.width}x${initialMainBox?.height} at (${initialMainBox?.x}, ${initialMainBox?.y})`);
    
    // Look for AI Chat button (when right sidebar is collapsed)
    const aiChatButton = page.locator('button[aria-label="AI Chat"]').first();
    
    // Check if AI Chat button is visible (sidebar is closed)
    const aiChatVisible = await aiChatButton.isVisible().catch(() => false);
    
    if (aiChatVisible) {
      console.log('🎯 Found AI Chat button - clicking to open right sidebar');
      
      await aiChatButton.click();
      await page.waitForTimeout(1000);
      
      // Check if main content resized
      const afterOpenMainBox = await mainContent.boundingBox();
      console.log(`📏 After open main content: ${afterOpenMainBox?.width}x${afterOpenMainBox?.height} at (${afterOpenMainBox?.x}, ${afterOpenMainBox?.y})`);
      
      if (initialMainBox && afterOpenMainBox) {
        // Main content should get narrower when right sidebar opens
        expect(afterOpenMainBox.width).toBeLessThan(initialMainBox.width);
        console.log(`✅ Main content properly resized: ${initialMainBox.width} → ${afterOpenMainBox.width}`);
      }
      
      // Look for close button and close the sidebar
      const closeButton = page.locator('button[aria-label="Close sidebar"]').first();
      const closeButtonVisible = await closeButton.isVisible().catch(() => false);
      
      if (closeButtonVisible) {
        console.log('🎯 Found close button - clicking to close right sidebar');
        
        await closeButton.click();
        await page.waitForTimeout(1000);
        
        // Check if main content returned to original size
        const afterCloseMainBox = await mainContent.boundingBox();
        console.log(`📏 After close main content: ${afterCloseMainBox?.width}x${afterCloseMainBox?.height} at (${afterCloseMainBox?.x}, ${afterCloseMainBox?.y})`);
        
        if (afterCloseMainBox && initialMainBox) {
          // Main content should return to approximately original width
          const widthDifference = Math.abs(afterCloseMainBox.width - initialMainBox.width);
          expect(widthDifference).toBeLessThan(50); // Allow some tolerance
          console.log(`✅ Main content properly restored: ${afterCloseMainBox.width} (diff: ${widthDifference})`);
        }
      }
    } else {
      console.log('ℹ️ AI Chat button not visible - right sidebar might already be open');
      
      // Look for close button instead
      const closeButton = page.locator('button[aria-label="Close sidebar"]').first();
      const closeButtonVisible = await closeButton.isVisible().catch(() => false);
      
      if (closeButtonVisible) {
        console.log('🎯 Found close button - right sidebar is open');
        console.log('✅ Right sidebar toggle functionality exists');
      } else {
        throw new Error('Neither AI Chat button nor close button found - right sidebar toggle not working');
      }
    }
  });

  test('should have no overlapping components', async ({ page }) => {
    console.log('🧪 Testing: No overlapping UI components');
    
    // Get all main layout components
    const leftSidebar = page.locator('.navigator-panel').first();
    const mainContent = page.locator('[data-testid="main-content"]').first();
    const rightSidebar = page.locator('.utility-panel').first();
    
    await expect(leftSidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
    await expect(rightSidebar).toBeVisible();
    
    const leftBox = await leftSidebar.boundingBox();
    const mainBox = await mainContent.boundingBox();
    const rightBox = await rightSidebar.boundingBox();
    
    if (leftBox && mainBox && rightBox) {
      console.log(`📏 Left Sidebar: x=${leftBox.x}, width=${leftBox.width}, right=${leftBox.x + leftBox.width}`);
      console.log(`📏 Main Content: x=${mainBox.x}, width=${mainBox.width}, right=${mainBox.x + mainBox.width}`);
      console.log(`📏 Right Sidebar: x=${rightBox.x}, width=${rightBox.width}, right=${rightBox.x + rightBox.width}`);
      
      // Left sidebar should not overlap with main content
      expect(leftBox.x + leftBox.width).toBeLessThanOrEqual(mainBox.x + 5); // Allow small margin
      
      // Main content should not overlap with right sidebar
      expect(mainBox.x + mainBox.width).toBeLessThanOrEqual(rightBox.x + 5); // Allow small margin
      
      console.log('✅ No overlapping components detected');
    }
  });

  test('should maintain layout on window resize', async ({ page }) => {
    console.log('🧪 Testing: Layout maintains structure on resize');
    
    const sizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 1024, height: 768, name: 'Desktop Small' },
    ];
    
    for (const size of sizes) {
      console.log(`📐 Testing ${size.name}: ${size.width}x${size.height}`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1000);
      
      // Check that key components are still visible and properly positioned
      const leftSidebar = page.locator('.navigator-panel').first();
      const mainContent = page.locator('[data-testid="main-content"]').first();
      
      await expect(leftSidebar).toBeVisible();
      await expect(mainContent).toBeVisible();
      
      const leftBox = await leftSidebar.boundingBox();
      const mainBox = await mainContent.boundingBox();
      
      // Sidebar should always be at left edge
      expect(leftBox?.x).toBe(0);
      
      // Main content should be positioned after sidebar
      if (leftBox && mainBox) {
        expect(mainBox.x).toBeGreaterThan(leftBox.width - 10);
        console.log(`✅ ${size.name}: Layout preserved`);
      }
    }
  });
});
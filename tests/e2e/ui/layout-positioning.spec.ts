import { test, expect } from '@playwright/test';

/**
 * UI Layout and Positioning Tests
 * Tests component positioning, alignment, and layout behavior
 */
test.describe('UI Layout and Positioning', () => {
  
  test.beforeEach(async ({ page }) => {
    // Use stored auth state from global setup
    await page.goto('/dashboard');
  });

  test('header component is positioned correctly', async ({ page }) => {
    // Find header element (adjust selector based on your app)
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    const headerBox = await header.boundingBox();
    expect(headerBox?.y).toBe(0); // Header should be at top
    expect(headerBox?.width).toBeGreaterThan(800); // Should span width
  });

  test('sidebar positioning and dimensions', async ({ page }) => {
    // Navigate to a page with sidebar
    await page.goto('/products');
    
    // Check if sidebar exists (adjust selector for your app)
    const sidebar = page.locator('[data-testid="sidebar"], nav').first();
    
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      
      // Sidebar should be at left edge
      expect(sidebarBox?.x).toBe(0);
      
      // Should have reasonable width
      expect(sidebarBox?.width).toBeGreaterThan(200);
      expect(sidebarBox?.width).toBeLessThan(400);
    }
  });

  test('main content area positioning', async ({ page }) => {
    await page.goto('/products');
    
    // Find main content area
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();
    
    const mainBox = await main.boundingBox();
    
    // Main content should not start at x=0 if sidebar exists
    const sidebar = page.locator('[data-testid="sidebar"], nav').first();
    
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      // Main content should be to the right of sidebar
      expect(mainBox?.x).toBeGreaterThan(sidebarBox?.width || 0);
    }
  });

  test('button positioning and alignment', async ({ page }) => {
    await page.goto('/products');
    
    // Look for create button or primary action
    const createButton = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    
    if (await createButton.isVisible()) {
      const buttonBox = await createButton.boundingBox();
      
      // Button should be reasonably sized
      expect(buttonBox?.width).toBeGreaterThan(80);
      expect(buttonBox?.height).toBeGreaterThan(30);
      
      // Button should be clickable (not hidden)
      await expect(createButton).toBeEnabled();
    }
  });

  test('form field alignment', async ({ page }) => {
    // Try to find a form on the page
    await page.goto('/products');
    
    // Look for a create or edit form
    const createButton = page.locator('button').filter({ hasText: /create|add/i }).first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Wait for form to appear
      await page.waitForTimeout(1000);
      
      // Find form fields
      const formFields = page.locator('input[type="text"], textarea, select');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 1) {
        // Check alignment of first two fields
        const field1Box = await formFields.nth(0).boundingBox();
        const field2Box = await formFields.nth(1).boundingBox();
        
        if (field1Box && field2Box) {
          // Fields should be roughly left-aligned
          const alignmentDiff = Math.abs(field1Box.x - field2Box.x);
          expect(alignmentDiff).toBeLessThan(10);
          
          // Second field should be below first
          expect(field2Box.y).toBeGreaterThan(field1Box.y);
        }
      }
    }
  });

  test('modal dialog centering', async ({ page }) => {
    await page.goto('/products');
    
    // Try to open a modal
    const triggerButton = page.locator('button').filter({ hasText: /create|add|edit/i }).first();
    
    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      
      // Look for modal/dialog
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]').first();
      
      if (await modal.isVisible({ timeout: 2000 })) {
        const modalBox = await modal.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (modalBox && viewportSize) {
          // Modal should be roughly centered horizontally
          const centerX = viewportSize.width / 2;
          const modalCenterX = modalBox.x + modalBox.width / 2;
          const horizontalDiff = Math.abs(centerX - modalCenterX);
          
          expect(horizontalDiff).toBeLessThan(50);
          
          // Modal should be reasonable distance from top
          expect(modalBox.y).toBeGreaterThan(50);
          expect(modalBox.y).toBeLessThan(viewportSize.height / 3);
        }
      }
    }
  });

  test('responsive layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    
    // Check if sidebar collapses or becomes hidden
    const sidebar = page.locator('[data-testid="sidebar"], nav').first();
    
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      
      // On mobile, sidebar should either be hidden or overlay
      // This test depends on your responsive design
      console.log('Mobile sidebar dimensions:', sidebarBox);
    }
    
    // Main content should fill most of the width
    const main = page.locator('main, [role="main"]').first();
    if (await main.isVisible()) {
      const mainBox = await main.boundingBox();
      
      // Should use most of the viewport width
      expect(mainBox?.width).toBeGreaterThan(300);
    }
  });

  test('card/list item positioning', async ({ page }) => {
    await page.goto('/products');
    
    // Look for cards or list items
    const items = page.locator('[data-testid*="card"], [data-testid*="item"], .card, .item');
    const itemCount = await items.count();
    
    if (itemCount >= 2) {
      const firstItem = await items.nth(0).boundingBox();
      const secondItem = await items.nth(1).boundingBox();
      
      if (firstItem && secondItem) {
        // Items should be arranged in a grid or list
        const isHorizontalLayout = Math.abs(firstItem.y - secondItem.y) < 50;
        const isVerticalLayout = Math.abs(firstItem.x - secondItem.x) < 50;
        
        // Should be either horizontal or vertical layout
        expect(isHorizontalLayout || isVerticalLayout).toBe(true);
        
        if (isVerticalLayout) {
          // In vertical layout, second item should be below first
          expect(secondItem.y).toBeGreaterThan(firstItem.y);
        } else {
          // In horizontal layout, items should be on same row
          expect(Math.abs(firstItem.y - secondItem.y)).toBeLessThan(50);
        }
      }
    }
  });

  test('navigation menu positioning', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find navigation elements
    const navItems = page.locator('nav a, nav button, [role="navigation"] a');
    const navCount = await navItems.count();
    
    if (navCount >= 2) {
      const positions = [];
      
      for (let i = 0; i < Math.min(navCount, 4); i++) {
        const box = await navItems.nth(i).boundingBox();
        if (box) positions.push(box);
      }
      
      if (positions.length >= 2) {
        // Check if nav items are aligned
        const firstY = positions[0].y;
        const allSameY = positions.every(pos => Math.abs(pos.y - firstY) < 10);
        
        if (allSameY) {
          // Horizontal navigation - items should be ordered left to right
          for (let i = 1; i < positions.length; i++) {
            expect(positions[i].x).toBeGreaterThan(positions[i-1].x);
          }
        } else {
          // Vertical navigation - items should be ordered top to bottom
          for (let i = 1; i < positions.length; i++) {
            expect(positions[i].y).toBeGreaterThan(positions[i-1].y);
          }
        }
      }
    }
  });
}); 
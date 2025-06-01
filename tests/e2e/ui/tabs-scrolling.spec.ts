import { test, expect } from '@playwright/test';

/**
 * Tab Scrolling Tests
 * 
 * Tests tab scrolling behavior with:
 * - Scroll arrows visibility when tabs overflow
 * - No vertical scrollbar in tabs container
 * - Proper response to right sidebar state changes
 */
test.describe('Tab Scrolling Behavior', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should show scroll arrows when tabs overflow horizontally', async ({ page }) => {
    console.log('🧪 Testing: Tab scroll arrows appear when tabs overflow');
    
    // First, check if there are any tabs currently open
    const existingTabs = await page.locator('[data-tab-id]').count();
    console.log(`📊 Existing tabs: ${existingTabs}`);
    
    // We need to create enough tabs to cause overflow
    // Let's create pages which will open as tabs
    
    // Navigate to sidebar and create multiple pages to force tab overflow
    const sidebarAddButton = page.locator('button[data-action="add-page"]').first();
    const sidebarAddButtonVisible = await sidebarAddButton.isVisible().catch(() => false);
    
    if (sidebarAddButtonVisible) {
      console.log('📝 Creating multiple pages to force tab overflow...');
      
      // Create 8 pages to ensure overflow
      for (let i = 1; i <= 8; i++) {
        await sidebarAddButton.click();
        await page.waitForTimeout(300);
        console.log(`Created page ${i}`);
      }
      
      // Wait for all tabs to be created
      await page.waitForTimeout(1000);
      
      // Check tabs container state
      const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
      await expect(tabsContainer).toBeVisible();
      
      const containerInfo = await tabsContainer.evaluate(el => {
        return {
          isOverflowing: el.getAttribute('data-is-overflowing'),
          showLeftArrow: el.getAttribute('data-show-left-arrow'), 
          showRightArrow: el.getAttribute('data-show-right-arrow'),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          hasVerticalScroll: el.scrollHeight > el.clientHeight
        };
      });
      
      console.log('📊 Tabs container state:', containerInfo);
      
      // Test 1: Container should be overflowing
      expect(containerInfo.isOverflowing).toBe('true');
      console.log('✅ Tabs container is overflowing as expected');
      
      // Test 2: Right arrow should be visible (we're at the start)
      expect(containerInfo.showRightArrow).toBe('true');
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      await expect(rightArrow).toBeVisible();
      console.log('✅ Right scroll arrow is visible');
      
      // Test 3: No vertical scrollbar
      expect(containerInfo.hasVerticalScroll).toBe(false);
      console.log('✅ No vertical scrollbar detected');
      
      // Test 4: Scroll right and check left arrow appears
      await rightArrow.click();
      await page.waitForTimeout(500); // Wait for smooth scroll
      
      const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
      await expect(leftArrow).toBeVisible();
      console.log('✅ Left scroll arrow appears after scrolling');
      
      // Test 5: Verify smooth scrolling works
      const scrollPositionAfter = await tabsContainer.evaluate(el => el.scrollLeft);
      expect(scrollPositionAfter).toBeGreaterThan(0);
      console.log(`✅ Scroll position changed to: ${scrollPositionAfter}px`);
      
    } else {
      console.log('⚠️ Sidebar add button not found - testing with existing tabs');
      
      // Check if scroll arrows exist with current tabs
      const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
      const containerExists = await tabsContainer.isVisible().catch(() => false);
      
      if (containerExists) {
        const containerInfo = await tabsContainer.evaluate(el => ({
          isOverflowing: el.getAttribute('data-is-overflowing'),
          showLeftArrow: el.getAttribute('data-show-left-arrow'), 
          showRightArrow: el.getAttribute('data-show-right-arrow'),
          hasVerticalScroll: el.scrollHeight > el.clientHeight
        }));
        
        console.log('📊 Current tabs container state:', containerInfo);
        
        // At minimum, should have no vertical scroll
        expect(containerInfo.hasVerticalScroll).toBe(false);
        console.log('✅ No vertical scrollbar detected');
      }
    }
  });

  test('should respond to right sidebar state changes', async ({ page }) => {
    console.log('🧪 Testing: Tab scroll behavior responds to right sidebar changes');
    
    // Get initial tabs container state
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    const initialState = await tabsContainer.evaluate(el => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      isOverflowing: el.getAttribute('data-is-overflowing') === 'true'
    }));
    
    console.log('📊 Initial tabs container width:', initialState.clientWidth);
    
    // Open right sidebar by clicking AI Chat button
    const aiChatButton = page.locator('button[aria-label="AI Chat"]').first();
    const aiChatVisible = await aiChatButton.isVisible().catch(() => false);
    
    if (aiChatVisible) {
      console.log('🎯 Opening right sidebar...');
      await aiChatButton.click();
      await page.waitForTimeout(1000); // Wait for layout to settle
      
      const afterOpenState = await tabsContainer.evaluate(el => ({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        isOverflowing: el.getAttribute('data-is-overflowing') === 'true',
        hasVerticalScroll: el.scrollHeight > el.clientHeight
      }));
      
      console.log('📊 After opening sidebar - tabs container width:', afterOpenState.clientWidth);
      
      // Test 1: Container should be narrower after opening sidebar
      expect(afterOpenState.clientWidth).toBeLessThan(initialState.clientWidth);
      console.log('✅ Tabs container properly resized when sidebar opened');
      
      // Test 2: Still no vertical scroll
      expect(afterOpenState.hasVerticalScroll).toBe(false);
      console.log('✅ No vertical scrollbar after sidebar opened');
      
      // Test 3: If there are enough tabs, should show overflow
      if (afterOpenState.scrollWidth > afterOpenState.clientWidth) {
        expect(afterOpenState.isOverflowing).toBe(true);
        
        // Check if scroll arrows are visible
        const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
        const rightArrowVisible = await rightArrow.isVisible().catch(() => false);
        if (rightArrowVisible) {
          console.log('✅ Scroll arrows properly shown after sidebar opened');
        }
      }
      
      // Close sidebar and verify container expands back
      const closeButton = page.locator('button[aria-label="Close sidebar"]').first();
      const closeButtonVisible = await closeButton.isVisible().catch(() => false);
      
      if (closeButtonVisible) {
        console.log('🎯 Closing right sidebar...');
        await closeButton.click();
        await page.waitForTimeout(1000);
        
        const afterCloseState = await tabsContainer.evaluate(el => ({
          clientWidth: el.clientWidth,
          hasVerticalScroll: el.scrollHeight > el.clientHeight
        }));
        
        console.log('📊 After closing sidebar - tabs container width:', afterCloseState.clientWidth);
        
        // Container should expand back to approximately original width
        const widthDifference = Math.abs(afterCloseState.clientWidth - initialState.clientWidth);
        expect(widthDifference).toBeLessThan(10); // Allow small differences
        console.log('✅ Tabs container returned to original width');
        
        // Still no vertical scroll
        expect(afterCloseState.hasVerticalScroll).toBe(false);
        console.log('✅ No vertical scrollbar after sidebar closed');
      }
    } else {
      console.log('ℹ️ AI Chat button not visible - sidebar might already be open');
      
      // At minimum, verify no vertical scroll
      const currentState = await tabsContainer.evaluate(el => ({
        hasVerticalScroll: el.scrollHeight > el.clientHeight
      }));
      
      expect(currentState.hasVerticalScroll).toBe(false);
      console.log('✅ No vertical scrollbar detected');
    }
  });

  test('should maintain proper tab heights without vertical overflow', async ({ page }) => {
    console.log('🧪 Testing: Tabs maintain proper height without vertical overflow');
    
    // Check the overall tabs area
    const tabsArea = page.locator('[data-component="tabs-container"]').first();
    await expect(tabsArea).toBeVisible();
    
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    // Check dimensions
    const measurements = await page.evaluate(() => {
      const tabsArea = document.querySelector('[data-component="tabs-container"]') as HTMLElement;
      const tabsContainer = document.querySelector('[data-testid="tabs-scroll-container"]') as HTMLElement;
      const tabsList = document.querySelector('[data-section="tabs-list"]') as HTMLElement;
      
      return {
        tabsArea: {
          height: tabsArea?.offsetHeight || 0,
          scrollHeight: tabsArea?.scrollHeight || 0
        },
        tabsContainer: {
          height: tabsContainer?.offsetHeight || 0,
          scrollHeight: tabsContainer?.scrollHeight || 0,
          clientHeight: tabsContainer?.clientHeight || 0
        },
        tabsList: {
          height: tabsList?.offsetHeight || 0,
          scrollHeight: tabsList?.scrollHeight || 0
        }
      };
    });
    
    console.log('📊 Tabs measurements:', measurements);
    
    // Test 1: Tabs container should not have vertical overflow
    expect(measurements.tabsContainer.scrollHeight).toBeLessThanOrEqual(measurements.tabsContainer.clientHeight + 1);
    console.log('✅ Tabs container has no vertical overflow');
    
    // Test 2: Tabs should fit within expected height range (around 48-60px)
    expect(measurements.tabsContainer.height).toBeGreaterThan(40);
    expect(measurements.tabsContainer.height).toBeLessThan(80);
    console.log(`✅ Tabs container height is appropriate: ${measurements.tabsContainer.height}px`);
    
    // Test 3: Individual tab elements should not cause overflow
    const tabElements = page.locator('[data-tab-id]');
    const tabCount = await tabElements.count();
    
    if (tabCount > 0) {
      const firstTab = tabElements.first();
      const tabBox = await firstTab.boundingBox();
      
      if (tabBox) {
        console.log(`📏 First tab dimensions: ${tabBox.width}x${tabBox.height}`);
        
        // Tab height should be reasonable (not too tall)
        expect(tabBox.height).toBeLessThan(60);
        expect(tabBox.height).toBeGreaterThan(20);
        console.log('✅ Individual tab height is appropriate');
      }
    }
  });

  test('should handle scroll arrow interactions correctly', async ({ page }) => {
    console.log('🧪 Testing: Scroll arrow interactions work correctly');
    
    // Create enough content to ensure scrolling
    // Try to create multiple pages first
    const sidebarAddButton = page.locator('button[data-action="add-page"]').first();
    const sidebarAddButtonVisible = await sidebarAddButton.isVisible().catch(() => false);
    
    if (sidebarAddButtonVisible) {
      // Create multiple tabs to force scrolling
      for (let i = 1; i <= 6; i++) {
        await sidebarAddButton.click();
        await page.waitForTimeout(200);
      }
      
      await page.waitForTimeout(1000);
    }
    
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    // Check if we have overflow
    const hasOverflow = await tabsContainer.evaluate(el => {
      return el.scrollWidth > el.clientWidth;
    });
    
    if (hasOverflow) {
      console.log('🎯 Container is overflowing - testing scroll interactions');
      
      // Test right arrow functionality
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      const rightArrowVisible = await rightArrow.isVisible().catch(() => false);
      
      if (rightArrowVisible) {
        const initialScrollPos = await tabsContainer.evaluate(el => el.scrollLeft);
        console.log(`📊 Initial scroll position: ${initialScrollPos}`);
        
        // Click right arrow
        await rightArrow.click();
        await page.waitForTimeout(600); // Wait for smooth scroll animation
        
        const afterRightScrollPos = await tabsContainer.evaluate(el => el.scrollLeft);
        console.log(`📊 After right scroll: ${afterRightScrollPos}`);
        
        expect(afterRightScrollPos).toBeGreaterThan(initialScrollPos);
        console.log('✅ Right scroll arrow works correctly');
        
        // Check if left arrow is now visible
        const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
        await expect(leftArrow).toBeVisible();
        console.log('✅ Left scroll arrow appears after scrolling right');
        
        // Test left arrow functionality
        await leftArrow.click();
        await page.waitForTimeout(600);
        
        const afterLeftScrollPos = await tabsContainer.evaluate(el => el.scrollLeft);
        console.log(`📊 After left scroll: ${afterLeftScrollPos}`);
        
        expect(afterLeftScrollPos).toBeLessThan(afterRightScrollPos);
        console.log('✅ Left scroll arrow works correctly');
        
      } else {
        console.log('ℹ️ Right arrow not visible - may not be needed');
      }
    } else {
      console.log('ℹ️ Container not overflowing - scroll arrows not needed');
      
      // Verify arrows are hidden when not needed
      const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      
      const leftVisible = await leftArrow.isVisible().catch(() => false);
      const rightVisible = await rightArrow.isVisible().catch(() => false);
      
      expect(leftVisible).toBe(false);
      expect(rightVisible).toBe(false);
      console.log('✅ Scroll arrows correctly hidden when not needed');
    }
  });
});
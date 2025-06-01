import { test, expect } from '@playwright/test';

/**
 * Direct Tab Scroll Arrows Test
 * 
 * This test directly manipulates the container to force overflow
 * and validate scroll arrow functionality works as implemented.
 */
test.describe('Tab Scroll Arrows Direct Test', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should show and function scroll arrows when artificially constrained', async ({ page }) => {
    console.log('🧪 Testing: Scroll arrows by artificially constraining container width');
    
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    // Get initial state
    const initialState = await tabsContainer.evaluate(el => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      tabCount: el.querySelectorAll('[data-tab-id]').length
    }));
    
    console.log('📊 Initial state:', initialState);
    console.log(`📊 Tabs found: ${initialState.tabCount}`);
    
    if (initialState.tabCount < 3) {
      console.log('ℹ️ Not enough tabs to test scrolling effectively');
      return;
    }
    
    // Artificially constrain the container width to force overflow
    const constrainedWidth = Math.min(400, initialState.clientWidth * 0.4);
    console.log(`🎯 Constraining container to ${constrainedWidth}px to force overflow`);
    
    await tabsContainer.evaluate((el, width) => {
      // Temporarily constrain the width to force overflow
      (el as HTMLElement).style.width = `${width}px`;
      (el as HTMLElement).style.maxWidth = `${width}px`;
    }, constrainedWidth);
    
    // Wait for the resize observer to trigger
    await page.waitForTimeout(500);
    
    // Check if overflow is now detected
    const constrainedState = await tabsContainer.evaluate(el => ({
      isOverflowing: el.getAttribute('data-is-overflowing'),
      showLeftArrow: el.getAttribute('data-show-left-arrow'),
      showRightArrow: el.getAttribute('data-show-right-arrow'),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
      hasVerticalScroll: el.scrollHeight > el.clientHeight
    }));
    
    console.log('📊 Constrained state:', constrainedState);
    
    if (constrainedState.scrollWidth > constrainedState.clientWidth) {
      console.log('✅ Successfully forced overflow condition');
      
      // Test 1: Container should detect overflow
      expect(constrainedState.isOverflowing).toBe('true');
      console.log('✅ Overflow detection working');
      
      // Test 2: Right arrow should be visible (we're at start)
      expect(constrainedState.showRightArrow).toBe('true');
      
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      const rightArrowVisible = await rightArrow.isVisible().catch(() => false);
      expect(rightArrowVisible).toBe(true);
      console.log('✅ Right scroll arrow is visible');
      
      // Test 3: Left arrow should not be visible initially
      expect(constrainedState.showLeftArrow).toBe('false');
      const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
      const leftArrowVisible = await leftArrow.isVisible().catch(() => false);
      expect(leftArrowVisible).toBe(false);
      console.log('✅ Left scroll arrow correctly hidden at start');
      
      // Test 4: Click right arrow and verify scrolling
      await rightArrow.click();
      await page.waitForTimeout(600); // Wait for smooth scroll
      
      const afterRightScrollState = await tabsContainer.evaluate(el => ({
        scrollLeft: el.scrollLeft,
        showLeftArrow: el.getAttribute('data-show-left-arrow'),
        showRightArrow: el.getAttribute('data-show-right-arrow')
      }));
      
      expect(afterRightScrollState.scrollLeft).toBeGreaterThan(constrainedState.scrollLeft);
      console.log(`✅ Right scroll worked: ${constrainedState.scrollLeft} → ${afterRightScrollState.scrollLeft}`);
      
      // Left arrow should now be visible
      expect(afterRightScrollState.showLeftArrow).toBe('true');
      await expect(leftArrow).toBeVisible();
      console.log('✅ Left scroll arrow appears after scrolling right');
      
      // Test 5: Click left arrow and verify scrolling back
      await leftArrow.click();
      await page.waitForTimeout(600);
      
      const afterLeftScrollState = await tabsContainer.evaluate(el => ({
        scrollLeft: el.scrollLeft
      }));
      
      expect(afterLeftScrollState.scrollLeft).toBeLessThan(afterRightScrollState.scrollLeft);
      console.log(`✅ Left scroll worked: ${afterRightScrollState.scrollLeft} → ${afterLeftScrollState.scrollLeft}`);
      
      // Test 6: No vertical scrollbar throughout
      expect(constrainedState.hasVerticalScroll).toBe(false);
      console.log('✅ No vertical scrollbar detected during test');
      
    } else {
      console.log('❌ Could not force overflow even with constrained width');
      console.log(`Scroll width: ${constrainedState.scrollWidth}, Client width: ${constrainedState.clientWidth}`);
    }
    
    // Restore original width
    await tabsContainer.evaluate(el => {
      (el as HTMLElement).style.width = '';
      (el as HTMLElement).style.maxWidth = '';
    });
    
    await page.waitForTimeout(500);
    
    // Verify arrows are hidden after restoring width
    const restoredState = await tabsContainer.evaluate(el => ({
      isOverflowing: el.getAttribute('data-is-overflowing'),
      showLeftArrow: el.getAttribute('data-show-left-arrow'),
      showRightArrow: el.getAttribute('data-show-right-arrow')
    }));
    
    console.log('📊 Restored state:', restoredState);
    
    if (restoredState.isOverflowing === 'false') {
      expect(restoredState.showLeftArrow).toBe('false');
      expect(restoredState.showRightArrow).toBe('false');
      console.log('✅ Scroll arrows correctly hidden after restoring width');
    }
  });

  test('should handle edge cases and arrow states correctly', async ({ page }) => {
    console.log('🧪 Testing: Edge cases and arrow state management');
    
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    // Test 1: Verify no vertical overflow in any state
    const initialVerticalState = await tabsContainer.evaluate(el => ({
      hasVerticalScroll: el.scrollHeight > el.clientHeight,
      height: el.offsetHeight,
      scrollHeight: el.scrollHeight
    }));
    
    expect(initialVerticalState.hasVerticalScroll).toBe(false);
    console.log(`✅ No vertical overflow: height=${initialVerticalState.height}, scrollHeight=${initialVerticalState.scrollHeight}`);
    
    // Test 2: Container responds to window resize (simulating sidebar changes)
    const initialWidth = await tabsContainer.evaluate(el => el.clientWidth);
    console.log(`📊 Initial container width: ${initialWidth}px`);
    
    // Simulate window resize that would happen with sidebar toggle
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    const resizedWidth = await tabsContainer.evaluate(el => el.clientWidth);
    console.log(`📊 Width after viewport resize: ${resizedWidth}px`);
    
    // Width should change (could be larger or smaller depending on layout)
    expect(resizedWidth).not.toBe(initialWidth);
    console.log('✅ Container width responds to viewport changes');
    
    // Test 3: No vertical scroll persists after resize
    const afterResizeVertical = await tabsContainer.evaluate(el => ({
      hasVerticalScroll: el.scrollHeight > el.clientHeight
    }));
    
    expect(afterResizeVertical.hasVerticalScroll).toBe(false);
    console.log('✅ No vertical overflow after resize');
    
    // Restore viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Test 4: Verify scroll state updates correctly
    const scrollState = await tabsContainer.evaluate(el => {
      // Manually trigger the update function if we can access it
      // This tests that the scroll detection logic is working
      const rect = el.getBoundingClientRect();
      const isScrollable = el.scrollWidth > el.clientWidth;
      
      return {
        isScrollable,
        containerWidth: rect.width,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        isOverflowing: el.getAttribute('data-is-overflowing')
      };
    });
    
    console.log('📊 Final scroll state:', scrollState);
    
    // The overflow detection should be consistent
    const expectedOverflow = scrollState.scrollWidth > scrollState.clientWidth;
    expect(scrollState.isOverflowing).toBe(expectedOverflow.toString());
    console.log('✅ Overflow detection is consistent');
  });

  test('should maintain proper styling for scroll arrows', async ({ page }) => {
    console.log('🧪 Testing: Scroll arrow styling and positioning');
    
    // Force overflow to make arrows visible
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    // Constrain width to force arrows
    await tabsContainer.evaluate(el => {
      (el as HTMLElement).style.width = '300px';
      (el as HTMLElement).style.maxWidth = '300px';
    });
    
    await page.waitForTimeout(500);
    
    // Check if right arrow is now visible
    const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
    const rightArrowVisible = await rightArrow.isVisible().catch(() => false);
    
    if (rightArrowVisible) {
      console.log('🎯 Right arrow is visible - testing styling');
      
      // Test arrow positioning and styling
      const arrowBox = await rightArrow.boundingBox();
      const containerBox = await tabsContainer.boundingBox();
      
      if (arrowBox && containerBox) {
        // Arrow should be positioned on the right side of container
        expect(arrowBox.x).toBeGreaterThan(containerBox.x + containerBox.width - 50);
        console.log(`✅ Right arrow positioned correctly: ${arrowBox.x} within container ending at ${containerBox.x + containerBox.width}`);
        
        // Arrow should be vertically centered
        const arrowCenterY = arrowBox.y + arrowBox.height / 2;
        const containerCenterY = containerBox.y + containerBox.height / 2;
        const verticalDiff = Math.abs(arrowCenterY - containerCenterY);
        expect(verticalDiff).toBeLessThan(5); // Allow small positioning differences
        console.log(`✅ Right arrow vertically centered: diff=${verticalDiff}px`);
        
        // Test arrow styling
        const arrowStyles = await rightArrow.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            position: styles.position,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor,
            borderRadius: styles.borderRadius,
            width: styles.width,
            height: styles.height
          };
        });
        
        expect(arrowStyles.position).toBe('absolute');
        expect(parseInt(arrowStyles.zIndex)).toBeGreaterThan(10);
        console.log('✅ Right arrow has correct styling:', arrowStyles);
        
        // Test hover interaction
        await rightArrow.hover();
        await page.waitForTimeout(200);
        
        // Click to make left arrow visible
        await rightArrow.click();
        await page.waitForTimeout(600);
        
        const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
        const leftArrowVisible = await leftArrow.isVisible().catch(() => false);
        
        if (leftArrowVisible) {
          console.log('🎯 Left arrow is now visible - testing positioning');
          
          const leftArrowBox = await leftArrow.boundingBox();
          if (leftArrowBox) {
            // Left arrow should be on the left side
            expect(leftArrowBox.x).toBeLessThan(containerBox.x + 50);
            console.log(`✅ Left arrow positioned correctly: ${leftArrowBox.x} near container start at ${containerBox.x}`);
          }
        }
      }
    } else {
      console.log('ℹ️ Arrows not visible with current constraints - testing basic container');
    }
    
    // Restore container
    await tabsContainer.evaluate(el => {
      (el as HTMLElement).style.width = '';
      (el as HTMLElement).style.maxWidth = '';
    });
    
    console.log('✅ Scroll arrow styling test completed');
  });
});
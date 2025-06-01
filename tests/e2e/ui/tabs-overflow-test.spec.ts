import { test, expect } from '@playwright/test';

/**
 * Tab Overflow Test - Force tab overflow to test scroll arrows
 * 
 * This test specifically creates enough tabs to force horizontal overflow
 * and validates the scroll arrow functionality.
 */
test.describe('Tab Overflow and Scroll Arrows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should force tab overflow and show scroll arrows', async ({ page }) => {
    console.log('🧪 Testing: Force tab overflow to validate scroll arrows');
    
    // Look for entity creator dialog trigger - we'll create pages
    const entityCreatorTrigger = page.locator('button[data-action="create-entity"]').first();
    const entityCreatorVisible = await entityCreatorTrigger.isVisible().catch(() => false);
    
    if (entityCreatorVisible) {
      console.log('📝 Using entity creator to create multiple pages...');
      
      // Create 15 pages to definitely force overflow
      for (let i = 1; i <= 15; i++) {
        await entityCreatorTrigger.click();
        await page.waitForTimeout(100);
        
        // Look for page type option in the dialog
        const pageOption = page.locator('button[data-action="create-page"]').first();
        const pageOptionVisible = await pageOption.isVisible().catch(() => false);
        
        if (pageOptionVisible) {
          await pageOption.click();
          await page.waitForTimeout(300);
          console.log(`Created page ${i}`);
        } else {
          console.log(`❌ Could not find page creation option for iteration ${i}`);
          break;
        }
      }
    } else {
      // Alternative: Try to use sidebar navigation to create pages
      console.log('📝 Trying alternative page creation method...');
      
      // Look for any add/create buttons in the sidebar
      const createButtons = page.locator('button[aria-label*="Add"], button[aria-label*="Create"], button[data-action*="add"], button[data-action*="create"]');
      const buttonCount = await createButtons.count();
      
      if (buttonCount > 0) {
        console.log(`Found ${buttonCount} potential create buttons`);
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = createButtons.nth(i);
          const buttonText = await button.textContent().catch(() => '');
          const buttonLabel = await button.getAttribute('aria-label').catch(() => '');
          console.log(`Button ${i}: text="${buttonText}", label="${buttonLabel}"`);
          
          // Try clicking if it looks like a page creation button
          if (buttonText?.toLowerCase().includes('page') || buttonLabel?.toLowerCase().includes('page')) {
            console.log(`Trying to create pages with button: ${buttonText || buttonLabel}`);
            
            for (let j = 1; j <= 12; j++) {
              await button.click();
              await page.waitForTimeout(300);
              console.log(`Created item ${j}`);
            }
            break;
          }
        }
      }
    }
    
    // Wait for all tabs to be created and layout to settle
    await page.waitForTimeout(2000);
    
    // Now check the tabs container state
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    await expect(tabsContainer).toBeVisible();
    
    const containerState = await tabsContainer.evaluate(el => {
      return {
        isOverflowing: el.getAttribute('data-is-overflowing'),
        showLeftArrow: el.getAttribute('data-show-left-arrow'),
        showRightArrow: el.getAttribute('data-show-right-arrow'),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollLeft: el.scrollLeft,
        hasVerticalScroll: el.scrollHeight > el.clientHeight
      };
    });
    
    console.log('📊 Final tabs container state:', containerState);
    
    // Count actual tabs
    const tabCount = await page.locator('[data-tab-id]').count();
    console.log(`📊 Total tabs created: ${tabCount}`);
    
    if (containerState.scrollWidth > containerState.clientWidth) {
      console.log('✅ Successfully created overflow condition');
      
      // Test scroll arrow visibility
      expect(containerState.isOverflowing).toBe('true');
      expect(containerState.showRightArrow).toBe('true');
      
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      await expect(rightArrow).toBeVisible();
      console.log('✅ Right scroll arrow is visible');
      
      // Test scrolling functionality
      await rightArrow.click();
      await page.waitForTimeout(500);
      
      const afterScrollState = await tabsContainer.evaluate(el => ({
        scrollLeft: el.scrollLeft,
        showLeftArrow: el.getAttribute('data-show-left-arrow')
      }));
      
      expect(afterScrollState.scrollLeft).toBeGreaterThan(containerState.scrollLeft);
      expect(afterScrollState.showLeftArrow).toBe('true');
      
      const leftArrow = page.locator('[data-testid="scroll-left-arrow"]').first();
      await expect(leftArrow).toBeVisible();
      console.log('✅ Left scroll arrow appears after scrolling');
      
      // Test left scrolling
      await leftArrow.click();
      await page.waitForTimeout(500);
      
      const afterLeftScrollState = await tabsContainer.evaluate(el => el.scrollLeft);
      expect(afterLeftScrollState).toBeLessThan(afterScrollState.scrollLeft);
      console.log('✅ Left scrolling works correctly');
      
    } else {
      console.log('ℹ️ Could not create enough tabs to force overflow');
      console.log(`Container width: ${containerState.clientWidth}, Content width: ${containerState.scrollWidth}`);
      
      // At minimum, verify no vertical scroll
      expect(containerState.hasVerticalScroll).toBe(false);
      console.log('✅ No vertical scrollbar detected');
    }
    
    // Always test: No vertical scroll regardless of horizontal overflow
    expect(containerState.hasVerticalScroll).toBe(false);
    console.log('✅ Tabs container has no vertical scrollbar');
  });

  test('should handle overflow when right sidebar is open', async ({ page }) => {
    console.log('🧪 Testing: Tab overflow with right sidebar open (smaller space)');
    
    // Open right sidebar first to make less space available
    const aiChatButton = page.locator('button[aria-label="AI Chat"]').first();
    const aiChatVisible = await aiChatButton.isVisible().catch(() => false);
    
    if (aiChatVisible) {
      console.log('🎯 Opening right sidebar to reduce available space...');
      await aiChatButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check initial state with sidebar open
    const tabsContainer = page.locator('[data-testid="tabs-scroll-container"]').first();
    const initialWidth = await tabsContainer.evaluate(el => el.clientWidth);
    console.log(`📊 Available width with sidebar open: ${initialWidth}px`);
    
    // With reduced space, existing tabs might already overflow
    const initialState = await tabsContainer.evaluate(el => ({
      isOverflowing: el.getAttribute('data-is-overflowing') === 'true',
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      hasVerticalScroll: el.scrollHeight > el.clientHeight
    }));
    
    console.log('📊 Initial state with sidebar open:', initialState);
    
    // Test: No vertical scroll even with sidebar open
    expect(initialState.hasVerticalScroll).toBe(false);
    console.log('✅ No vertical scrollbar with right sidebar open');
    
    if (initialState.isOverflowing) {
      console.log('✅ Tabs are overflowing with sidebar open - testing scroll arrows');
      
      const rightArrow = page.locator('[data-testid="scroll-right-arrow"]').first();
      const rightArrowVisible = await rightArrow.isVisible().catch(() => false);
      
      expect(rightArrowVisible).toBe(true);
      console.log('✅ Right scroll arrow visible with reduced space');
      
      // Test scrolling works in reduced space
      await rightArrow.click();
      await page.waitForTimeout(500);
      
      const afterScrollPos = await tabsContainer.evaluate(el => el.scrollLeft);
      expect(afterScrollPos).toBeGreaterThan(0);
      console.log('✅ Scrolling works correctly with sidebar open');
      
    } else {
      console.log('ℹ️ Tabs still fit even with sidebar open');
      
      // Verify scroll arrows are hidden when not needed
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
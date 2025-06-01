import { test, expect } from '@playwright/test';

/**
 * User Interaction Tests
 * Tests complex user behaviors, input handling, and interactive elements
 */
test.describe('User Interactions', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('typing in input fields works correctly', async ({ page }) => {
    await page.goto('/products');
    
    // Look for a search input or create form
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Clear any existing text
      await searchInput.clear();
      
      // Type test text
      const testText = 'Test Product Search';
      await searchInput.type(testText);
      
      // Verify the text was entered
      await expect(searchInput).toHaveValue(testText);
      
      // Test backspace/delete functionality
      await page.keyboard.press('Backspace');
      await expect(searchInput).toHaveValue('Test Product Searc');
      
      // Test Ctrl+A and replace
      await page.keyboard.press('Control+a');
      await searchInput.type('New Text');
      await expect(searchInput).toHaveValue('New Text');
    }
  });

  test('button clicking and form submission', async ({ page }) => {
    await page.goto('/products');
    
    // Find a button to click
    const actionButton = page.locator('button').filter({ hasText: /create|add|save|submit/i }).first();
    
    if (await actionButton.isVisible() && await actionButton.isEnabled()) {
      // Record initial page state
      const initialUrl = page.url();
      
      // Click the button
      await actionButton.click();
      
      // Wait for any changes (page navigation, modal opening, etc.)
      await page.waitForTimeout(1000);
      
      // Verify something happened (URL changed, modal appeared, etc.)
      const currentUrl = page.url();
      const hasModal = await page.locator('[role="dialog"], .modal').isVisible();
      
      // Either URL should change or a modal should appear
      const somethingHappened = currentUrl !== initialUrl || hasModal;
      expect(somethingHappened).toBe(true);
    }
  });

  test('dropdown/select interaction', async ({ page }) => {
    await page.goto('/products');
    
    // Look for select dropdowns
    const selectElements = page.locator('select');
    const selectCount = await selectElements.count();
    
    if (selectCount > 0) {
      const select = selectElements.first();
      
      // Get available options
      const options = select.locator('option');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        // Select the second option
        const secondOption = await options.nth(1).textContent();
        await select.selectOption({ index: 1 });
        
        // Verify selection
        await expect(select).toHaveValue(await options.nth(1).getAttribute('value') || '');
      }
    }
    
    // Also test custom dropdowns (if any)
    const customDropdown = page.locator('[role="combobox"], [data-testid*="dropdown"]').first();
    if (await customDropdown.isVisible()) {
      await customDropdown.click();
      
      // Look for dropdown options
      const dropdownOptions = page.locator('[role="option"], [data-testid*="option"]');
      const optionCount = await dropdownOptions.count();
      
      if (optionCount > 0) {
        await dropdownOptions.first().click();
        // Verify dropdown closed and selection was made
        await expect(dropdownOptions.first()).not.toBeVisible();
      }
    }
  });

  test('keyboard navigation and accessibility', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through a few elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = page.locator(':focus');
      
      // Each focused element should be visible and interactive
      await expect(focusedElement).toBeVisible();
      
      // Check if it's a clickable element
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
                           await focusedElement.getAttribute('role') === 'button' ||
                           await focusedElement.getAttribute('tabindex') === '0';
      
      if (isInteractive) {
        // Test Enter key activation (for buttons/links)
        if (tagName === 'button' || tagName === 'a') {
          // Note: We don't actually press Enter to avoid navigation
          console.log(`Interactive element found: ${tagName}`);
        }
      }
    }
  });

  test('drag and drop functionality', async ({ page }) => {
    // This test is more app-specific, adjust based on your drag/drop features
    await page.goto('/products');
    
    // Look for draggable elements
    const draggableElements = page.locator('[draggable="true"], [data-testid*="drag"]');
    const dragCount = await draggableElements.count();
    
    if (dragCount >= 2) {
      const source = draggableElements.first();
      const target = draggableElements.nth(1);
      
      // Get initial positions
      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();
      
      if (sourceBox && targetBox) {
        // Perform drag and drop
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
        await page.mouse.up();
        
        // Wait for any animations
        await page.waitForTimeout(1000);
        
        // Verify the drag and drop had some effect
        // This is app-specific - you might check if elements reordered
        console.log('Drag and drop completed');
      }
    }
  });

  test('text editor/rich text input', async ({ page }) => {
    // Test TipTap or other rich text editors
    await page.goto('/products');
    
    // Look for rich text editor
    const editor = page.locator('.ProseMirror, [contenteditable="true"], [data-testid*="editor"]').first();
    
    if (await editor.isVisible()) {
      // Click to focus
      await editor.click();
      
      // Type some text
      await page.keyboard.type('This is a test of the rich text editor.');
      
      // Test formatting shortcuts
      await page.keyboard.press('Control+a'); // Select all
      await page.keyboard.press('Control+b'); // Bold (if supported)
      
      // Check if bold formatting was applied (TipTap specific)
      const boldText = page.locator('.ProseMirror strong, .ProseMirror b');
      if (await boldText.count() > 0) {
        await expect(boldText).toHaveText('This is a test of the rich text editor.');
      }
      
      // Test Enter for new line
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await page.keyboard.type('New paragraph.');
      
      // Verify content
      await expect(editor).toContainText('This is a test of the rich text editor.');
      await expect(editor).toContainText('New paragraph.');
    }
  });

  test('file upload interaction', async ({ page }) => {
    await page.goto('/products');
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      // Create a test file
      const testFile = {
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      };
      
      // Upload file
      await fileInput.setInputFiles({
        name: testFile.name,
        mimeType: testFile.mimeType,
        buffer: testFile.buffer
      });
      
      // Verify file was selected
      const fileValue = await fileInput.inputValue();
      expect(fileValue).toContain('test-image.jpg');
    }
  });

  test('context menu (right-click) interactions', async ({ page }) => {
    await page.goto('/products');
    
    // Find elements that might have context menus
    const contextTargets = page.locator('[data-testid*="card"], [data-testid*="item"], .card, .item');
    
    if (await contextTargets.count() > 0) {
      const target = contextTargets.first();
      
      // Right-click to trigger context menu
      await target.click({ button: 'right' });
      
      // Look for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="context"]');
      
      if (await contextMenu.isVisible({ timeout: 2000 })) {
        // Verify menu is positioned near the click
        const targetBox = await target.boundingBox();
        const menuBox = await contextMenu.boundingBox();
        
        if (targetBox && menuBox) {
          // Menu should appear near the target
          const isNearTarget = 
            menuBox.x >= targetBox.x - 50 && 
            menuBox.x <= targetBox.x + targetBox.width + 50 &&
            menuBox.y >= targetBox.y - 50 && 
            menuBox.y <= targetBox.y + targetBox.height + 50;
          
          expect(isNearTarget).toBe(true);
        }
        
        // Test clicking a menu item
        const menuItems = contextMenu.locator('[role="menuitem"], a, button');
        if (await menuItems.count() > 0) {
          await menuItems.first().click();
          
          // Menu should close after clicking
          await expect(contextMenu).not.toBeVisible();
        }
      }
    }
  });

  test('scroll behavior and infinite loading', async ({ page }) => {
    await page.goto('/products');
    
    // Get initial content count
    const items = page.locator('[data-testid*="card"], [data-testid*="item"], .card, .item');
    const initialCount = await items.count();
    
    if (initialCount > 0) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for potential infinite loading
      await page.waitForTimeout(2000);
      
      // Check if more items loaded
      const newCount = await items.count();
      
      // Either more items loaded, or we reached the end
      console.log(`Items before scroll: ${initialCount}, after scroll: ${newCount}`);
      
      // Test scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      // Verify we're back at top
      const scrollTop = await page.evaluate(() => window.pageYOffset);
      expect(scrollTop).toBe(0);
    }
  });

  test('copy and paste functionality', async ({ page }) => {
    await page.goto('/products');
    
    // Find a text input
    const textInput = page.locator('input[type="text"], textarea').first();
    
    if (await textInput.isVisible()) {
      await textInput.click();
      
      // Type some text
      const testText = 'Copy and paste test';
      await textInput.fill(testText);
      
      // Select all and copy
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+c');
      
      // Clear field
      await textInput.clear();
      
      // Paste
      await page.keyboard.press('Control+v');
      
      // Verify paste worked
      await expect(textInput).toHaveValue(testText);
    }
  });
}); 
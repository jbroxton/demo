/**
 * E2E tests for page content persistence
 * Tests that content is saved to database and persists across page refreshes and tab changes
 */

import { test, expect } from '@playwright/test';

test.describe('Content Persistence', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should persist content across page refresh and tab changes', async ({ page }) => {
    console.log('🧪 Testing: Content persistence across operations');

    // Step 1: Open an existing page
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    await expect(sidebarPage).toBeVisible({ timeout: 10000 });
    
    const pageTitle = await sidebarPage.getAttribute('data-entity-name');
    console.log(`📄 Opening page: "${pageTitle}"`);
    
    await sidebarPage.click();
    await page.waitForLoadState('networkidle');

    // Step 2: Find the TipTap editor content area
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10000 });
    console.log('✅ Found TipTap editor');

    // Step 3: Add test content "hello world"
    const testContent = 'hello world';
    console.log(`⌨️  Adding content: "${testContent}"`);
    
    await editor.click();
    await editor.fill(testContent);
    
    // Verify content was added
    const editorContent = await editor.textContent();
    console.log(`📝 Editor now contains: "${editorContent}"`);
    expect(editorContent).toContain(testContent);

    // Step 4: Wait for auto-save (debounced)
    console.log('⏳ Waiting for auto-save (2 seconds)...');
    await page.waitForTimeout(2000);

    // Step 5: Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 6: Verify content persisted after refresh
    console.log('🔍 Checking if content persisted after refresh...');
    await page.waitForTimeout(1000); // Wait for content to load
    
    const editorAfterRefresh = page.locator('.ProseMirror').first();
    await expect(editorAfterRefresh).toBeVisible({ timeout: 10000 });
    
    const contentAfterRefresh = await editorAfterRefresh.textContent();
    console.log(`📝 Content after refresh: "${contentAfterRefresh}"`);
    
    if (contentAfterRefresh?.includes(testContent)) {
      console.log('✅ SUCCESS: Content persisted after refresh!');
    } else {
      console.log('❌ FAILED: Content lost after refresh');
    }

    // Step 7: Switch to another tab (if available)
    const allTabs = page.locator('[data-tab-state]');
    const tabCount = await allTabs.count();
    console.log(`🏷️  Found ${tabCount} tabs`);

    if (tabCount > 1) {
      // Click on a different tab
      const otherTab = allTabs.nth(1);
      await otherTab.click();
      await page.waitForTimeout(1000);
      console.log('🔄 Switched to different tab');

      // Switch back to original tab
      const originalTab = allTabs.nth(0);
      await originalTab.click();
      await page.waitForTimeout(1000);
      console.log('🔄 Switched back to original tab');

      // Verify content still there
      const editorAfterTabSwitch = page.locator('.ProseMirror').first();
      const contentAfterTabSwitch = await editorAfterTabSwitch.textContent();
      console.log(`📝 Content after tab switch: "${contentAfterTabSwitch}"`);

      if (contentAfterTabSwitch?.includes(testContent)) {
        console.log('✅ SUCCESS: Content persisted after tab switch!');
      } else {
        console.log('❌ FAILED: Content lost after tab switch');
      }
    } else {
      console.log('ℹ️  Only one tab available, skipping tab switch test');
    }

    // Step 8: Check database directly via API
    console.log('🗄️  Checking database content via API...');
    
    // Get the current page ID from the URL or tab data
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Make API request to check database
    const response = await page.request.get('/api/pages-db');
    
    if (response.ok()) {
      const pagesData = await response.json();
      console.log('✅ API response received');
      
      // Find the page we were editing
      const pages = pagesData.data || [];
      const targetPage = pages.find((p: any) => p.title === pageTitle);
      
      if (targetPage) {
        console.log(`📄 Found page in database: ${targetPage.id}`);
        
        // Check if content is in blocks
        const blocks = targetPage.blocks || [];
        console.log(`📦 Page has ${blocks.length} blocks`);
        
        let foundTestContent = false;
        blocks.forEach((block: any, index: number) => {
          if (block.content && JSON.stringify(block.content).includes(testContent)) {
            console.log(`✅ Found test content in block ${index}!`);
            foundTestContent = true;
          }
        });
        
        if (foundTestContent) {
          console.log('🎉 SUCCESS: Content is properly saved in database!');
        } else {
          console.log('❌ FAILED: Test content not found in database blocks');
          console.log('📦 Block contents:', JSON.stringify(blocks, null, 2));
        }
      } else {
        console.log(`❌ Could not find page "${pageTitle}" in database`);
      }
    } else {
      console.log(`❌ API request failed: ${response.status()}`);
    }

    // Final verification: content should still be visible in editor
    const finalEditor = page.locator('.ProseMirror').first();
    const finalContent = await finalEditor.textContent();
    console.log(`📝 Final editor content: "${finalContent}"`);
    
    // Assert that content persists (this will fail if persistence is broken)
    expect(finalContent).toContain(testContent);
  });

  test('should auto-save content with proper debouncing', async ({ page }) => {
    console.log('🧪 Testing: Auto-save debouncing');

    // Open a page
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    await expect(sidebarPage).toBeVisible({ timeout: 10000 });
    await sidebarPage.click();
    await page.waitForLoadState('networkidle');

    // Find editor
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type rapidly to test debouncing
    console.log('⌨️  Typing rapidly to test debouncing...');
    await editor.click();
    await editor.fill('');
    
    // Type character by character with short delays
    const rapidText = 'rapid typing test';
    for (let i = 0; i < rapidText.length; i++) {
      await page.keyboard.type(rapidText[i]);
      await page.waitForTimeout(50); // 50ms between keystrokes
    }

    console.log(`📝 Typed: "${rapidText}"`);

    // Wait for debounce to settle
    console.log('⏳ Waiting for debounce to settle (3 seconds)...');
    await page.waitForTimeout(3000);

    // Refresh and check if final content saved
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const editorAfterRefresh = page.locator('.ProseMirror').first();
    await expect(editorAfterRefresh).toBeVisible({ timeout: 10000 });
    
    const savedContent = await editorAfterRefresh.textContent();
    console.log(`📝 Content after refresh: "${savedContent}"`);

    if (savedContent?.includes(rapidText)) {
      console.log('✅ SUCCESS: Debounced auto-save working!');
    } else {
      console.log('❌ FAILED: Debounced content not saved');
    }

    expect(savedContent).toContain(rapidText);
  });
});
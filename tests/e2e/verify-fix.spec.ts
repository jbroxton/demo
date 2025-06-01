import { test, expect } from '@playwright/test';

test.describe('Verify Child Page Fix', () => {
  test.use({ storageState: 'tests/auth-state.json' });
  
  test('child page should load successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Log individual page fetches
    page.on('console', msg => {
      if (msg.text().includes('🔍 Fetching individual page') || msg.text().includes('✅ Individual page fetched')) {
        console.log(`[FETCH]:`, msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Find first child page
    const childPages = page.locator('ul[data-list="child-pages"] li button[data-action="open-tab"]');
    const childCount = await childPages.count();
    
    console.log(`📊 Found ${childCount} child pages`);
    
    if (childCount > 0) {
      const firstChild = childPages.first();
      const childTitle = await firstChild.textContent();
      console.log(`🎯 Testing child: "${childTitle}"`);
      
      // Click child page
      await firstChild.click();
      await page.waitForTimeout(3000);
      
      // Check results
      const hasFailedLoad = await page.locator('text="Failed to load page"').isVisible();
      const hasPageEditor = await page.locator('[data-component="canvas-content"]').isVisible();
      const hasTitle = await page.locator('h1, [contenteditable="true"]').first().isVisible();
      
      console.log('\n🎉 FIX VERIFICATION:');
      console.log(`   - Child page: "${childTitle}"`);
      console.log(`   - Shows "Failed to load page": ${hasFailedLoad ? '❌ BROKEN' : '✅ FIXED'}`);
      console.log(`   - Page editor visible: ${hasPageEditor ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Title visible: ${hasTitle ? '✅ YES' : '❌ NO'}`);
      
      if (!hasFailedLoad && hasPageEditor) {
        console.log('\n🚀 SUCCESS: Child page loading is FIXED!');
      } else {
        console.log('\n💥 FAILURE: Child page still broken');
      }
      
      expect(hasFailedLoad).toBe(false);
      expect(hasPageEditor).toBe(true);
      
    } else {
      console.log('⚠️ No child pages found to test');
    }
  });
});
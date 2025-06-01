/**
 * Simple test to see what's on the dashboard and test title updates
 */

const { chromium } = require('playwright');

async function simpleTest() {
  console.log('🚀 Starting simple dashboard test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate and authenticate
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/signin')) {
      await page.fill('#email', 'pm1@test.com');
      await page.fill('#password', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ Authenticated');
    }

    // Take a screenshot to see what's there
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-debug.png');

    // Look for any existing tabs
    const tabs = await page.locator('[data-tab-state]').count();
    console.log(`🏷️  Found ${tabs} tabs`);

    if (tabs > 0) {
      // Click the first tab
      await page.locator('[data-tab-state]').first().click();
      console.log('🖱️  Clicked first tab');
      await page.waitForTimeout(1000);
      
      // Look for title input
      const titleInput = page.locator('input[placeholder="Untitled"]');
      if (await titleInput.isVisible({ timeout: 3000 })) {
        console.log('✅ Found title input!');
        
        // Test the title update
        const newTitle = `Test Title ${Date.now()}`;
        await titleInput.fill(newTitle);
        console.log(`📝 Updated title to: ${newTitle}`);
        
        // Wait for debounce
        await page.waitForTimeout(400);
        
        // Check if tab title updated
        const tabTitle = await page.locator('[data-tab-state="active"] span').textContent();
        console.log(`🏷️  Tab title is now: ${tabTitle}`);
        
        if (tabTitle === newTitle) {
          console.log('🎉 SUCCESS: Cross-component sync working!');
        } else {
          console.log('❌ FAILED: Tab title did not sync');
        }
        
        // Keep browser open longer to observe
        await page.waitForTimeout(10000);
      } else {
        console.log('❌ No title input found');
      }
    } else {
      console.log('❌ No tabs found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

simpleTest().catch(console.error);
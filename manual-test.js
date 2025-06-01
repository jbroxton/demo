/**
 * Manual test to create a page and test title updates
 */

const { chromium } = require('playwright');

async function manualTest() {
  console.log('🚀 Starting manual test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for manual observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate and authenticate
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/signin')) {
      console.log('🔐 Authenticating...');
      await page.fill('#email', 'pm1@test.com');
      await page.fill('#password', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ Authenticated');
    }

    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'manual-test-dashboard.png', fullPage: true });

    // Try to create a new page
    console.log('➕ Looking for create page button...');
    const createButton = page.locator('[data-section="pages-header"] button').first();
    
    if (await createButton.isVisible({ timeout: 5000 })) {
      console.log('🖱️  Clicking create button...');
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Look for dialog
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 3000 })) {
        console.log('📋 Dialog opened');
        
        // Click create button in dialog
        const dialogCreateButton = dialog.locator('button').filter({ hasText: /create/i }).first();
        if (await dialogCreateButton.isVisible()) {
          console.log('📝 Creating page...');
          await dialogCreateButton.click();
          await page.waitForTimeout(3000);
          
          // Look for title input
          const titleInput = page.locator('input[placeholder="Untitled"]');
          if (await titleInput.isVisible({ timeout: 5000 })) {
            console.log('✅ Found title input!');
            
            // Check current value
            const currentValue = await titleInput.inputValue();
            console.log(`📝 Current input value: "${currentValue}"`);
            
            // Try to type in it
            console.log('⌨️  Typing new title...');
            const newTitle = `Manual Test Title ${Date.now()}`;
            await titleInput.fill(newTitle);
            
            // Check if it accepted the input
            const newValue = await titleInput.inputValue();
            console.log(`📝 New input value: "${newValue}"`);
            
            if (newValue === newTitle) {
              console.log('✅ Input field is working!');
              
              // Wait a bit for optimistic updates
              await page.waitForTimeout(1000);
              
              // Check tab title
              const tabTitle = await page.locator('[data-tab-state="active"] span').textContent();
              console.log(`🏷️  Tab title: "${tabTitle}"`);
              
              if (tabTitle === newTitle) {
                console.log('🎉 SUCCESS: Title sync is working!');
              } else {
                console.log('❌ FAILED: Tab title not synced');
              }
            } else {
              console.log('❌ FAILED: Input field not accepting text');
            }
          } else {
            console.log('❌ No title input found');
          }
        }
      }
    } else {
      console.log('❌ Create button not found');
    }

    // Keep browser open for manual inspection
    console.log('👀 Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

manualTest().catch(console.error);
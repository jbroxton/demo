/**
 * Test to check if side nav, tab title, and content title come from the same source
 */

const { chromium } = require('playwright');

async function testTitleSources() {
  console.log('🚀 Testing title sources synchronization...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
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

    // Look for any existing page in sidebar to open
    console.log('🔍 Looking for existing pages in sidebar...');
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    
    if (await sidebarPage.isVisible({ timeout: 5000 })) {
      // Get the sidebar title before clicking
      const sidebarTitle = await sidebarPage.getAttribute('data-entity-name');
      console.log(`📁 Sidebar shows: "${sidebarTitle}"`);
      
      // Click to open the page
      await sidebarPage.click();
      await page.waitForTimeout(2000);
      
      // Now check tab title
      const tabTitleElement = page.locator('[data-tab-state="active"] span');
      const tabTitle = await tabTitleElement.textContent();
      console.log(`🏷️  Tab shows: "${tabTitle}"`);
      
      // Check content title input value
      const contentTitleInput = page.locator('input[placeholder="Untitled"]');
      if (await contentTitleInput.isVisible({ timeout: 3000 })) {
        const contentTitle = await contentTitleInput.inputValue();
        console.log(`📝 Content shows: "${contentTitle}"`);
        
        // Compare all three
        console.log('\n=== TITLE SOURCE COMPARISON ===');
        console.log(`Sidebar:  "${sidebarTitle}"`);
        console.log(`Tab:      "${tabTitle}"`);
        console.log(`Content:  "${contentTitle}"`);
        
        const allMatch = (sidebarTitle === tabTitle && tabTitle === contentTitle);
        const sidebarTabMatch = (sidebarTitle === tabTitle);
        const tabContentMatch = (tabTitle === contentTitle);
        
        if (allMatch) {
          console.log('✅ SUCCESS: All three sources match!');
        } else {
          console.log('❌ MISMATCH DETECTED:');
          if (!sidebarTabMatch) console.log('  - Sidebar ≠ Tab');
          if (!tabContentMatch) console.log('  - Tab ≠ Content');
        }
        
        // Test if content input is editable
        console.log('\n=== TESTING CONTENT EDITABILITY ===');
        const testText = 'TEST_EDIT';
        console.log(`⌨️  Trying to type "${testText}" in content input...`);
        
        await contentTitleInput.focus();
        await contentTitleInput.fill(testText);
        
        const newContentValue = await contentTitleInput.inputValue();
        console.log(`📝 Content now shows: "${newContentValue}"`);
        
        if (newContentValue === testText) {
          console.log('✅ Content input IS editable');
        } else {
          console.log('❌ Content input is NOT editable');
        }
        
      } else {
        console.log('❌ Content title input not found');
      }
      
    } else {
      console.log('❌ No existing pages found in sidebar');
    }

    // Keep browser open for inspection
    console.log('\n👀 Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

testTitleSources().catch(console.error);
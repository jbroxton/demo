/**
 * Simple test to verify page title updates from tab content work
 * This will test the fix we just implemented
 */

const { chromium } = require('playwright');

async function testTitleUpdate() {
  console.log('🚀 Starting page title update test...');
  
  const browser = await chromium.launch({ headless: false }); // Run with UI to see the changes
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication redirect if needed
    const currentUrl = page.url();
    if (currentUrl.includes('/signin')) {
      console.log('🔐 Need to authenticate...');
      await page.fill('#email', 'pm1@test.com');
      await page.fill('#password', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ Authenticated successfully');
    }

    // Look for existing pages or create one
    console.log('🔍 Looking for existing pages...');
    const existingPage = await page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    
    if (await existingPage.isVisible({ timeout: 5000 })) {
      console.log('📄 Found existing page, opening it...');
      await existingPage.click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('➕ No pages found, trying to create a new one...');
      
      // Try different ways to create a page
      // Option 1: Look for EntityCreator button near pages section
      const pagesCreateButton = await page.locator('[data-section="pages-header"] button').first();
      if (await pagesCreateButton.isVisible({ timeout: 3000 })) {
        console.log('📝 Found pages create button...');
        await pagesCreateButton.click();
        await page.waitForTimeout(1000);
        
        // Look for dialog and create page
        const dialog = page.locator('[role="dialog"]');
        if (await dialog.isVisible({ timeout: 3000 })) {
          console.log('📋 Dialog opened, creating page...');
          const createButton = dialog.locator('button').filter({ hasText: /create/i }).first();
          if (await createButton.isVisible({ timeout: 2000 })) {
            await createButton.click();
            await page.waitForLoadState('networkidle');
          }
        }
      } else {
        console.log('⚠️ Could not find page creation button, trying alternative...');
        // Try clicking any + button
        const plusButton = await page.locator('button').filter({ hasText: '+' }).first();
        if (await plusButton.isVisible({ timeout: 3000 })) {
          await plusButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Check if we have a page editor open
    const titleInput = page.locator('input[placeholder="Untitled"]');
    if (!(await titleInput.isVisible({ timeout: 5000 }))) {
      console.log('❌ Could not find page editor title input');
      return;
    }

    console.log('✅ Page editor is open');

    // Get initial states
    const initialTitle = await titleInput.inputValue();
    console.log(`📝 Initial title: "${initialTitle}"`);

    // Get initial tab title
    const activeTab = page.locator('[data-tab-state="active"] span');
    const initialTabTitle = await activeTab.textContent();
    console.log(`🏷️  Initial tab title: "${initialTabTitle}"`);

    // Update the title
    const newTitle = `Test Title ${Date.now()}`;
    console.log(`🔄 Updating title to: "${newTitle}"`);
    
    await titleInput.fill(newTitle);
    
    // Wait for debouncing
    console.log('⏳ Waiting for debounce (400ms)...');
    await page.waitForTimeout(400);

    // Check if tab title updated (optimistic update)
    const updatedTabTitle = await activeTab.textContent();
    console.log(`🏷️  Updated tab title: "${updatedTabTitle}"`);

    // Verify the update worked
    if (updatedTabTitle === newTitle) {
      console.log('✅ SUCCESS: Tab title updated optimistically!');
      console.log('🎉 Cross-component synchronization is working!');
    } else {
      console.log('❌ FAILED: Tab title did not update');
      console.log(`   Expected: "${newTitle}"`);
      console.log(`   Got: "${updatedTabTitle}"`);
    }

    // Check sidebar if visible
    const sidebarPage = page.locator(`[data-entity-name="${newTitle}"]`).first();
    if (await sidebarPage.isVisible({ timeout: 2000 })) {
      console.log('✅ SUCCESS: Sidebar also shows updated title!');
    } else {
      console.log('ℹ️  Sidebar not visible or title not updated there');
    }

    // Wait to see the result
    console.log('👀 Keeping browser open for 5 seconds to observe...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Test completed');
  }
}

// Run the test
testTitleUpdate().catch(console.error);
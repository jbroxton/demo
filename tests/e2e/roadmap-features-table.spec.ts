import { test, expect } from '@playwright/test';

test.describe('Roadmap Features Table', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('roadmap page shows features table without borders', async ({ page }) => {
    // Click on the specific roadmap tab "New Roadmap [Assign]"
    console.log('Looking for "New Roadmap [Assign]" tab');
    const roadmapTab = page.locator('[data-testid*="tab"]:has-text("New Roadmap [Assign]")').first();
    
    await expect(roadmapTab).toBeVisible({ timeout: 10000 });
    await roadmapTab.click();
    console.log('Clicked on New Roadmap [Assign] tab');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on a roadmap page
    await expect(page.locator('[data-testid="page-content-editor"]')).toBeVisible();
    console.log('Page content editor is visible');
    
    // Verify toolbar is hidden for roadmap pages
    const toolbar = page.locator('[data-testid="page-toolbar-container"]');
    const toolbarVisible = await toolbar.isVisible();
    console.log('Toolbar visible:', toolbarVisible);
    
    // Verify Add Block button is hidden for roadmap pages
    const addBlockButton = page.locator('[data-testid="page-add-block-button"]');
    const addBlockVisible = await addBlockButton.isVisible();
    console.log('Add Block button visible:', addBlockVisible);
    
    // Check what's actually in the editor content
    const editorHTML = await page.locator('[data-testid="page-content-editor"]').innerHTML();
    console.log('Editor HTML:', editorHTML.substring(0, 500) + '...');
    
    // Check for TipTap content
    const proseMirror = page.locator('.ProseMirror');
    if (await proseMirror.count() > 0) {
      const proseMirrorHTML = await proseMirror.innerHTML();
      console.log('ProseMirror HTML:', proseMirrorHTML);
    }
    
    // Look for our roadmap extension
    const roadmapNodes = await page.locator('[data-type="roadmap-features-table"]').count();
    console.log('Roadmap table nodes found:', roadmapNodes);
    
    // Check if roadmap features table is present
    const roadmapTable = page.locator('.roadmap-features-table-node');
    const roadmapTableCount = await roadmapTable.count();
    console.log('Roadmap table count:', roadmapTableCount);
    
    if (roadmapTableCount > 0) {
      console.log('Found roadmap table node');
      
      // Check for borders around the table container
      const containerStyles = await roadmapTable.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          border: computed.border,
          borderWidth: computed.borderWidth,
          borderStyle: computed.borderStyle,
          borderColor: computed.borderColor
        };
      });
      
      console.log('Container styles:', containerStyles);
      
      // Check for any nested borders
      const dataTableContainer = page.locator('.roadmap-features-table-node .rounded-md.border, .roadmap-features-table-node .border');
      const borderContainerCount = await dataTableContainer.count();
      console.log('Border containers found:', borderContainerCount);
      
      for (let i = 0; i < borderContainerCount; i++) {
        const borderStyles = await dataTableContainer.nth(i).evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            border: computed.border,
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderColor: computed.borderColor,
            borderRadius: computed.borderRadius,
            classes: el.className
          };
        });
        console.log(`Border container ${i} styles:`, borderStyles);
      }
    } else {
      console.log('No roadmap table found - checking what content exists');
      
      // Check for any table elements
      const anyTables = await page.locator('table').count();
      console.log('Any tables found:', anyTables);
      
      // Check for assigned features text
      const featuresText = await page.locator('text=features').count();
      console.log('Features text count:', featuresText);
    }
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'test-results/roadmap-table-debug.png',
      fullPage: true 
    });
    
    // Check that editor is read-only (try typing and see if it works)
    await page.click('[data-testid="page-content-editor"]');
    await page.keyboard.type('This should not appear if read-only');
    
    // Wait a moment and check if text appeared
    const editorContent = await page.locator('[data-testid="page-content-editor"]').textContent();
    console.log('Editor content after typing:', editorContent?.substring(0, 200) + '...');
  });

  test('simple roadmap debugging', async ({ page }) => {
    // Just navigate to the roadmap and see what we get
    const roadmapTab = page.locator('[data-testid*="tab"]:has-text("New Roadmap [Assign]")').first();
    
    await expect(roadmapTab).toBeVisible({ timeout: 10000 });
    await roadmapTab.click();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/simple-roadmap-debug.png',
      fullPage: true 
    });
    
    console.log('Simple roadmap test completed');
  });
});
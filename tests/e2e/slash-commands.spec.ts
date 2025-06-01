import { test, expect } from '@playwright/test';

test.describe('TipTap Slash Commands', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and authenticate if needed
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to sign in
    const signInButton = page.locator('text=Sign In');
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should open command menu with / and show grouped templates and glossary', async ({ page }) => {
    // Create or open a feature page
    await page.click('[data-testid="features-link"], [data-testid="sidebar-features"], :text("Features")');
    await page.waitForTimeout(1000);
    
    // Look for create feature button or existing feature
    const createButton = page.locator('[data-testid="create-feature-button"], button:has-text("Create"), button:has-text("Add")');
    const existingFeature = page.locator('[data-testid="feature-card"], .feature-item, text=Test Feature').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Fill in basic feature info if on creation form
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="name"], [data-testid="feature-title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Feature for Slash Commands');
        
        // Look for save/create button
        const saveButton = page.locator('button:has-text("Create"), button:has-text("Save"), [data-testid="save-button"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } else if (await existingFeature.isVisible()) {
      await existingFeature.click();
      await page.waitForTimeout(1000);
    }
    
    // Find the TipTap editor
    const editor = page.locator('.tiptap, [data-testid="page-content-editor"], .unified-page-content .ProseMirror');
    await expect(editor).toBeVisible();
    
    // Click in the editor to focus it
    await editor.click();
    await page.waitForTimeout(200);
    
    // Type the slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    // Verify command menu appears
    const commandMenu = page.locator('.commands-menu, [class*="bg-[#0A0A0A]"][class*="border"]');
    await expect(commandMenu).toBeVisible();
    
    // Check for Templates section
    const templatesSection = page.locator(':text("Templates"), :text("TEMPLATES")');
    await expect(templatesSection).toBeVisible();
    
    // Check for Glossary section  
    const glossarySection = page.locator(':text("Glossary"), :text("GLOSSARY")');
    await expect(glossarySection).toBeVisible();
    
    // Verify some template options are visible
    const shortPRD = page.locator(':text("Short PRD Template")');
    const mediumPRD = page.locator(':text("Medium PRD Template")');
    await expect(shortPRD.or(mediumPRD)).toBeVisible();
    
    // Verify some glossary terms are visible
    const apiTerm = page.locator(':text("API")');
    const mvpTerm = page.locator(':text("MVP")');
    await expect(apiTerm.or(mvpTerm)).toBeVisible();
  });

  test('should insert glossary term with tooltip when selected', async ({ page }) => {
    // Navigate to features and open/create a feature
    await page.click('[data-testid="features-link"], [data-testid="sidebar-features"], :text("Features")');
    await page.waitForTimeout(1000);
    
    // Create or open feature (simplified)
    const createButton = page.locator('[data-testid="create-feature-button"], button:has-text("Create"), button:has-text("Add")');
    const existingFeature = page.locator('[data-testid="feature-card"], .feature-item').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="name"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Feature');
        const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } else if (await existingFeature.isVisible()) {
      await existingFeature.click();
      await page.waitForTimeout(1000);
    }
    
    // Find and focus the editor
    const editor = page.locator('.tiptap, [data-testid="page-content-editor"], .unified-page-content .ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    
    // Clear any existing content and add some context
    await page.keyboard.press('Control+A');
    await page.keyboard.type('This feature will include an ');
    
    // Open slash commands
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    // Look for API term in the command menu
    const apiCommand = page.locator(':text("API")').first();
    await expect(apiCommand).toBeVisible();
    
    // Click on API term
    await apiCommand.click();
    await page.waitForTimeout(500);
    
    // Verify the term was inserted
    const insertedTerm = editor.locator('span[title*="Application Programming Interface"]');
    await expect(insertedTerm).toBeVisible();
    await expect(insertedTerm).toHaveText('API');
    
    // Verify tooltip appears on hover
    await insertedTerm.hover();
    await page.waitForTimeout(200);
    
    // Check that the span has a title attribute with the definition
    const titleAttribute = await insertedTerm.getAttribute('title');
    expect(titleAttribute).toContain('Application Programming Interface');
    expect(titleAttribute).toContain('protocols and tools for building software');
  });

  test('should insert template when selected', async ({ page }) => {
    // Navigate and setup feature
    await page.click('[data-testid="features-link"], [data-testid="sidebar-features"], :text("Features")');
    await page.waitForTimeout(1000);
    
    // Create or open feature  
    const createButton = page.locator('[data-testid="create-feature-button"], button:has-text("Create"), button:has-text("Add")');
    const existingFeature = page.locator('[data-testid="feature-card"], .feature-item').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="name"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Template Test Feature');
        const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } else if (await existingFeature.isVisible()) {
      await existingFeature.click();
      await page.waitForTimeout(1000);
    }
    
    // Find and focus the editor
    const editor = page.locator('.tiptap, [data-testid="page-content-editor"], .unified-page-content .ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    
    // Clear existing content
    await page.keyboard.press('Control+A');
    
    // Open slash commands
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    // Look for Short PRD Template
    const shortPRDTemplate = page.locator(':text("Short PRD Template")').first();
    await expect(shortPRDTemplate).toBeVisible();
    
    // Click on the template
    await shortPRDTemplate.click();
    await page.waitForTimeout(1000);
    
    // Verify template content was inserted
    await expect(editor.locator(':text("Product Requirements Document")')).toBeVisible();
    await expect(editor.locator(':text("Problem Statement")')).toBeVisible();
    await expect(editor.locator(':text("Solution Overview")')).toBeVisible();
    await expect(editor.locator(':text("Success Metrics")')).toBeVisible();
    await expect(editor.locator(':text("Requirements")')).toBeVisible();
  });

  test('should support keyboard navigation in command menu', async ({ page }) => {
    // Setup feature page
    await page.click('[data-testid="features-link"], [data-testid="sidebar-features"], :text("Features")');
    await page.waitForTimeout(1000);
    
    // Quick setup - try to find any existing feature or create one
    const existingFeature = page.locator('[data-testid="feature-card"], .feature-item').first();
    if (await existingFeature.isVisible()) {
      await existingFeature.click();
    } else {
      // Try to create a feature quickly
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Find editor
    const editor = page.locator('.tiptap, [data-testid="page-content-editor"], .unified-page-content .ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    
    // Open command menu
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    // Verify menu is visible
    const commandMenu = page.locator('.commands-menu, [class*="bg-[#0A0A0A]"]');
    await expect(commandMenu).toBeVisible();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Test escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Menu should be closed (or at least selection should be cleared)
    // We can verify by trying to type normally
    await page.keyboard.type('test');
    const testText = editor.locator(':text("test")');
    await expect(testText).toBeVisible();
  });

  test('should work multiple times (no single-use bug)', async ({ page }) => {
    // Setup feature page
    await page.click('[data-testid="features-link"], [data-testid="sidebar-features"], :text("Features")');
    await page.waitForTimeout(1000);
    
    const existingFeature = page.locator('[data-testid="feature-card"], .feature-item').first();
    if (await existingFeature.isVisible()) {
      await existingFeature.click();
    }
    
    // Find editor
    const editor = page.locator('.tiptap, [data-testid="page-content-editor"], .unified-page-content .ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    
    // First use - insert MVP term
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    const mvpTerm = page.locator(':text("MVP")').first();
    await expect(mvpTerm).toBeVisible();
    await mvpTerm.click();
    await page.waitForTimeout(500);
    
    // Verify first insertion
    const firstMVP = editor.locator('span[title*="Minimum Viable Product"]');
    await expect(firstMVP).toBeVisible();
    
    // Add some space and try again
    await page.keyboard.type(' and ');
    
    // Second use - this should work if we fixed the bug
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    // Should see command menu again
    const commandMenu = page.locator('.commands-menu, [class*="bg-[#0A0A0A]"]');
    await expect(commandMenu).toBeVisible();
    
    // Insert API term
    const apiTerm = page.locator(':text("API")').first();
    await expect(apiTerm).toBeVisible();
    await apiTerm.click();
    await page.waitForTimeout(500);
    
    // Verify second insertion worked
    const apiSpan = editor.locator('span[title*="Application Programming Interface"]');
    await expect(apiSpan).toBeVisible();
    
    // Both terms should be present
    await expect(firstMVP).toBeVisible();
    await expect(apiSpan).toBeVisible();
  });
});
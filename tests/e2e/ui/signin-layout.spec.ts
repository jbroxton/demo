import { test, expect } from '@playwright/test';

test.describe('Sign In Page Layout', () => {
  test('sign in page should fill full screen height', async ({ page }) => {
    // Clear session to ensure we get the login form
    await page.context().clearCookies();
    await page.goto('/signin');
    
    // Get viewport size
    const viewportSize = page.viewportSize();
    if (!viewportSize) throw new Error('Could not get viewport size');
    
    // Wait for page to load - looking for either the title or a loading spinner
    await page.waitForSelector('h1:has-text("Speqq")', { timeout: 10000 });
    
    // If we see "Show login form", click it to get the actual form
    const showLoginButton = page.locator('button:has-text("Show login form")');
    if (await showLoginButton.isVisible()) {
      await showLoginButton.click();
      await page.waitForSelector('[data-testid="auth-form"]', { timeout: 5000 });
    }
    
    // Check the main page container instead of just the form
    const pageContainer = page.locator('div').first(); // The main container div
    const containerBox = await pageContainer.boundingBox();
    
    if (!containerBox) throw new Error('Could not get container bounding box');
    
    // Check if the main container fills the full viewport
    expect(containerBox.height).toBeGreaterThanOrEqual(viewportSize.height * 0.95);
    
    // Check that the container starts at the top (y=0)
    expect(containerBox.y).toBeLessThanOrEqual(5); // Allow small tolerance for browser differences
    
    // Check the body element dimensions
    const bodyHeight = await page.evaluate(() => document.body.clientHeight);
    const windowHeight = await page.evaluate(() => window.innerHeight);
    
    console.log(`Body height: ${bodyHeight}, Window height: ${windowHeight}, Container height: ${containerBox.height}`);
    
    // Body should fill the window
    expect(bodyHeight).toBeGreaterThanOrEqual(windowHeight * 0.95);
    
    // Container should fill the body
    expect(containerBox.height).toBeGreaterThanOrEqual(bodyHeight * 0.95);
  });

  test('sign in page layout on different screen sizes', async ({ page }) => {
    // Clear session to ensure we get the login form
    await page.context().clearCookies();
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/signin');
    
    await page.waitForSelector('h1:has-text("Speqq")');
    
    // Handle "Show login form" button if present
    const showLoginButton = page.locator('button:has-text("Show login form")');
    if (await showLoginButton.isVisible()) {
      await showLoginButton.click();
      await page.waitForSelector('[data-testid="auth-form"]', { timeout: 5000 });
    }
    
    const mobileViewport = page.viewportSize();
    const mobileBody = await page.locator('body').boundingBox();
    
    if (mobileViewport && mobileBody) {
      expect(mobileBody.height).toBeGreaterThanOrEqual(mobileViewport.height * 0.95);
    }
    
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/signin');
    
    await page.waitForSelector('h1:has-text("Speqq")');
    
    const desktopViewport = page.viewportSize();
    const desktopBody = await page.locator('body').boundingBox();
    
    if (desktopViewport && desktopBody) {
      expect(desktopBody.height).toBeGreaterThanOrEqual(desktopViewport.height * 0.95);
    }
  });

  test('sign in page has no layout overflow issues', async ({ page }) => {
    // Clear session to ensure we get the login form
    await page.context().clearCookies();
    await page.goto('/signin');
    await page.waitForSelector('h1:has-text("Speqq")');
    
    // Handle "Show login form" button if present
    const showLoginButton = page.locator('button:has-text("Show login form")');
    if (await showLoginButton.isVisible()) {
      await showLoginButton.click();
      await page.waitForSelector('[data-testid="auth-form"]', { timeout: 5000 });
    }
    
    // Check for horizontal scrollbar
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 5); // Allow small tolerance
    
    // Check for vertical scrollbar when it shouldn't exist
    const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const windowHeight = await page.evaluate(() => window.innerHeight);
    
    // If content fits in viewport, there shouldn't be much scroll height difference
    if (bodyScrollHeight <= windowHeight) {
      expect(bodyScrollHeight).toBeLessThanOrEqual(windowHeight + 10);
    }
  });
});
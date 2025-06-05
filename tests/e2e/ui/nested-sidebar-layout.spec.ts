import { test, expect } from '@playwright/test';

test.describe('Nested Sidebar Layout Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="pages-container"]', { timeout: 10000 });
  });

  test('page container does not overlap with feedback sidebar when open', async ({ page }) => {
    // First, get the initial page container position
    const pageContainer = page.locator('[data-testid="pages-container"]');
    await expect(pageContainer).toBeVisible();
    
    const initialContainerBox = await pageContainer.boundingBox();
    expect(initialContainerBox).toBeTruthy();
    
    // Open the feedback sidebar by looking for feedback button in main sidebar
    const feedbackButton = page.locator('[data-testid="sidebar-feedback-button"]');
    await feedbackButton.click();
    
    // Wait for nested sidebar to appear
    const nestedSidebar = page.locator('[data-testid="nested-sidebar-container"]');
    await expect(nestedSidebar).toBeVisible({ timeout: 5000 });
    
    // Wait for transition to complete
    await page.waitForTimeout(500);
    
    // Get the feedback sidebar dimensions
    const feedbackSidebar = page.locator('[data-testid="feedback-list-container"]');
    await expect(feedbackSidebar).toBeVisible();
    
    const sidebarBox = await feedbackSidebar.boundingBox();
    expect(sidebarBox).toBeTruthy();
    
    // Get the updated page container position after sidebar opens
    const updatedContainerBox = await pageContainer.boundingBox();
    expect(updatedContainerBox).toBeTruthy();
    
    // Verify no overlap: page container left edge should be to the right of sidebar right edge
    if (sidebarBox && updatedContainerBox) {
      const sidebarRightEdge = sidebarBox.x + sidebarBox.width;
      const containerLeftEdge = updatedContainerBox.x;
      
      expect(containerLeftEdge).toBeGreaterThanOrEqual(sidebarRightEdge);
      
      // Also verify the container has moved to the right compared to initial position
      if (initialContainerBox) {
        expect(containerLeftEdge).toBeGreaterThan(initialContainerBox.x);
      }
    }
  });

  test('page container adjusts width when feedback sidebar opens', async ({ page }) => {
    // Get initial page container width
    const pageContainer = page.locator('[data-testid="pages-container"]');
    const initialContainerBox = await pageContainer.boundingBox();
    expect(initialContainerBox).toBeTruthy();
    
    // Open feedback sidebar
    const feedbackButton = page.locator('[data-testid="sidebar-feedback-button"]');
    await feedbackButton.click();
    
    // Wait for nested sidebar and transition
    await expect(page.locator('[data-testid="nested-sidebar-container"]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Get updated container dimensions
    const updatedContainerBox = await pageContainer.boundingBox();
    expect(updatedContainerBox).toBeTruthy();
    
    if (initialContainerBox && updatedContainerBox) {
      // Container should be narrower when sidebar is open
      expect(updatedContainerBox.width).toBeLessThan(initialContainerBox.width);
      
      // Container should have moved to the right
      expect(updatedContainerBox.x).toBeGreaterThan(initialContainerBox.x);
    }
  });

  test('page container returns to original position when feedback sidebar closes', async ({ page }) => {
    // Get initial position
    const pageContainer = page.locator('[data-testid="pages-container"]');
    const initialContainerBox = await pageContainer.boundingBox();
    
    // Open feedback sidebar
    const feedbackButton = page.locator('[data-testid="feedback-nav-button"]').first();
    await feedbackButton.click();
    
    // Wait for sidebar to open
    await expect(page.locator('[data-testid="nested-sidebar-container"]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Close the sidebar using the close button
    const closeButton = page.locator('[data-testid="close-nested-sidebar"]');
    await closeButton.click();
    
    // Wait for sidebar to close
    await expect(page.locator('[data-testid="nested-sidebar-container"]')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Get final position
    const finalContainerBox = await pageContainer.boundingBox();
    
    if (initialContainerBox && finalContainerBox) {
      // Container should return to approximately the same position
      expect(Math.abs(finalContainerBox.x - initialContainerBox.x)).toBeLessThan(10);
      expect(Math.abs(finalContainerBox.width - initialContainerBox.width)).toBeLessThan(10);
    }
  });

  test('layout works correctly with main sidebar collapsed and feedback sidebar open', async ({ page }) => {
    // First collapse the main sidebar
    const toggleButton = page.locator('[data-action="toggle-navigator"]');
    await toggleButton.click();
    
    // Wait for collapse transition
    await page.waitForTimeout(500);
    
    // Open feedback sidebar
    const feedbackButton = page.locator('[data-testid="feedback-nav-button"]').first();
    await feedbackButton.click();
    
    // Wait for nested sidebar to appear
    const nestedSidebar = page.locator('[data-testid="nested-sidebar-container"]');
    await expect(nestedSidebar).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Get page container and sidebar positions
    const pageContainer = page.locator('[data-testid="pages-container"]');
    const feedbackSidebar = page.locator('[data-testid="feedback-list-container"]');
    
    const containerBox = await pageContainer.boundingBox();
    const sidebarBox = await feedbackSidebar.boundingBox();
    
    // Verify no overlap even with collapsed main sidebar
    if (sidebarBox && containerBox) {
      const sidebarRightEdge = sidebarBox.x + sidebarBox.width;
      const containerLeftEdge = containerBox.x;
      
      expect(containerLeftEdge).toBeGreaterThanOrEqual(sidebarRightEdge);
    }
  });

  test('page container respects right sidebar when both nested and right sidebars are open', async ({ page }) => {
    // Open right sidebar first
    const rightSidebarToggle = page.locator('[data-testid="right-sidebar-toggle"]').first();
    if (await rightSidebarToggle.isVisible()) {
      await rightSidebarToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Open feedback (nested) sidebar
    const feedbackButton = page.locator('[data-testid="feedback-nav-button"]').first();
    await feedbackButton.click();
    
    // Wait for nested sidebar
    await expect(page.locator('[data-testid="nested-sidebar-container"]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Get all three areas
    const pageContainer = page.locator('[data-testid="pages-container"]');
    const feedbackSidebar = page.locator('[data-testid="feedback-list-container"]');
    const rightSidebar = page.locator('[data-section="utility-panel"]');
    
    const containerBox = await pageContainer.boundingBox();
    const leftSidebarBox = await feedbackSidebar.boundingBox();
    const rightSidebarBox = await rightSidebar.boundingBox();
    
    if (containerBox && leftSidebarBox && rightSidebarBox) {
      // Page container should not overlap with either sidebar
      const leftSidebarRightEdge = leftSidebarBox.x + leftSidebarBox.width;
      const containerLeftEdge = containerBox.x;
      const containerRightEdge = containerBox.x + containerBox.width;
      const rightSidebarLeftEdge = rightSidebarBox.x;
      
      // No overlap with left (feedback) sidebar
      expect(containerLeftEdge).toBeGreaterThanOrEqual(leftSidebarRightEdge);
      
      // No overlap with right sidebar
      expect(containerRightEdge).toBeLessThanOrEqual(rightSidebarLeftEdge);
    }
  });

  test('visual verification - take screenshot of layout with nested sidebar open', async ({ page }) => {
    // Open feedback sidebar
    const feedbackButton = page.locator('[data-testid="feedback-nav-button"]').first();
    await feedbackButton.click();
    
    // Wait for sidebar to fully load
    await expect(page.locator('[data-testid="feedback-list-container"]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Take screenshot for visual verification
    await expect(page).toHaveScreenshot('nested-sidebar-layout.png');
  });
});
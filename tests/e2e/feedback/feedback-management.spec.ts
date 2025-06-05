import { test, expect } from '@playwright/test';

test.describe('Feedback Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="pages-section"]');
  });

  test('create new feedback from sidebar', async ({ page }) => {
    // Click feedback button in sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    
    // Wait for nested sidebar to appear
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    
    // Click create new feedback button
    await page.click('[data-testid="feedback-create-button"]');
    
    // Wait for the new feedback tab to open
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close the nested sidebar to allow interaction with the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    // Verify the feedback editor is open
    await expect(page.locator('[data-testid="feedback-metadata-section"]')).toBeVisible();
    
    // Fill in feedback details
    await page.fill('[data-testid="page-title-input"]', 'Test Feedback Item');
    
    // Select priority - use the trigger element
    await page.click('[data-testid="feedback-priority-select-trigger"]');
    await page.click('text=High');
    
    // Wait for dropdown to close before clicking next dropdown
    await page.waitForTimeout(500);
    
    // Select feedback type - use the trigger element
    await page.click('[data-testid="feedback-type-select-trigger"]');
    await page.click('text=Bug');
    
    // Fill in customer info
    await page.fill('[data-testid="feedback-customer-name-input"]', 'John Doe');
    await page.fill('[data-testid="feedback-customer-email-input"]', 'john@example.com');
    
    // Verify feedback appears in the list
    await page.click('[data-testid="sidebar-feedback-button"]');
    await expect(page.locator('[data-testid^="feedback-list-item-"]')).toContainText('Test Feedback Item');
  });

  test('filter feedback by status', async ({ page }) => {
    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    
    // Create a feedback item first
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    await page.fill('[data-testid="page-title-input"]', 'New Feedback');
    
    // Go back to feedback list
    await page.click('[data-testid="sidebar-feedback-button"]');
    
    // Apply status filter
    await page.click('[data-testid="feedback-status-filter"]');
    await page.click('text=New');
    
    // Verify filtered results
    await expect(page.locator('[data-testid^="feedback-list-item-"]')).toContainText('New Feedback');
    
    // Change filter to "In Review"
    await page.click('[data-testid="feedback-status-filter"]');
    await page.click('text=In Review');
    
    // Verify no results (since we only have "new" feedback)
    await expect(page.locator('[data-testid="feedback-empty-state"]')).toContainText('No feedback matches your filters');
  });

  test('search feedback items', async ({ page }) => {
    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    
    // Create multiple feedback items
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    await page.click('[data-testid="close-nested-sidebar"]');
    await page.fill('[data-testid="page-title-input"]', 'Login Bug Report');
    
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    await page.click('[data-testid="close-nested-sidebar"]');
    await page.fill('[data-testid="page-title-input"]', 'Feature Request Dashboard');
    
    // Search for specific feedback
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.fill('[data-testid="feedback-search-input"]', 'Bug');
    
    // Verify search results
    await expect(page.locator('[data-testid^="feedback-list-item-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="feedback-list-item-"]')).toContainText('Login Bug Report');
  });

  test('assign feedback to feature updates status', async ({ page }) => {
    // Create a feature first
    await page.goto('/dashboard');
    
    // Create a feature through the Pages section
    const addPageButton = page.locator('[data-testid="add-page-button"]');
    await addPageButton.click();
    
    // Select feature type
    await page.click('text=Feature');
    await page.fill('[data-testid="page-title-input"]', 'User Authentication Feature');
    
    // Create a feedback item
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    await page.fill('[data-testid="page-title-input"]', 'Login Security Issue');
    
    // Assign to feature - use the trigger element
    await page.click('[data-testid="feedback-feature-assignment-select-trigger"]');
    await page.click('text=User Authentication Feature');
    
    // Verify status changed to "planned" - use the trigger element
    await expect(page.locator('[data-testid="feedback-status-select-trigger"] [data-radix-select-value]')).toContainText('planned');
    
    // Verify assignment indicator
    await expect(page.locator('[data-testid="feedback-assignment-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-assignment-confirmation"]')).toContainText('✓ Feedback assigned to feature');
    
    // Verify in list view
    await page.click('[data-testid="sidebar-feedback-button"]');
    const feedbackItem = page.locator('[data-testid^="feedback-list-item-"]').filter({ hasText: 'Login Security Issue' });
    await expect(feedbackItem.locator('[data-testid^="feedback-item-assigned-indicator-"]')).toBeVisible();
  });

  test('feedback metadata persists across tab switches', async ({ page }) => {
    // Create feedback with metadata
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    // Fill in all metadata
    await page.fill('[data-testid="page-title-input"]', 'Persistent Feedback');
    await page.click('[data-testid="feedback-priority-select-trigger"]');
    await page.click('text=High');
    
    // Wait for dropdown to close
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="feedback-type-select-trigger"]');
    await page.click('text=Feature Request');
    await page.fill('[data-testid="feedback-customer-name-input"]', 'Jane Smith');
    await page.fill('[data-testid="feedback-customer-email-input"]', 'jane@company.com');
    
    // Switch to a different tab (create another feedback)
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    
    // Switch back to the first feedback
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid^="feedback-list-item-"]').filter({ hasText: 'Persistent Feedback' });
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    // Verify all metadata is preserved
    await expect(page.locator('[data-testid="feedback-priority-select-trigger"] [data-radix-select-value]')).toContainText('high');
    await expect(page.locator('[data-testid="feedback-type-select-trigger"] [data-radix-select-value]')).toContainText('Feature Request');
    await expect(page.locator('[data-testid="feedback-customer-name-input"]')).toHaveValue('Jane Smith');
    await expect(page.locator('[data-testid="feedback-customer-email-input"]')).toHaveValue('jane@company.com');
  });

  test('close nested sidebar with backdrop click', async ({ page }) => {
    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    
    // Click on backdrop to close
    await page.click('[data-testid="nested-sidebar-backdrop"]');
    
    // Verify nested sidebar is closed
    await expect(page.locator('[data-testid="feedback-list-container"]')).not.toBeVisible();
    
    // Verify main sidebar is restored
    await expect(page.locator('[data-testid="pages-section"]')).toBeVisible();
  });

  test('close nested sidebar with close button', async ({ page }) => {
    // Open feedback sidebar
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.waitForSelector('[data-testid="feedback-list-container"]');
    
    // Click close button
    await page.click('[data-testid="close-nested-sidebar"]');
    
    // Verify nested sidebar is closed
    await expect(page.locator('[data-testid="feedback-list-container"]')).not.toBeVisible();
  });

  test('feedback status badge displays correctly', async ({ page }) => {
    // Create feedback and check status badges
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    await page.fill('[data-testid="page-title-input"]', 'Status Test Feedback');
    
    // Change status to "In Review"
    await page.click('[data-testid="feedback-status-select-trigger"]');
    await page.click('text=In Review');
    
    // Go back to list
    await page.click('[data-testid="sidebar-feedback-button"]');
    
    // Find the feedback item
    const feedbackItem = page.locator('[data-testid^="feedback-list-item-"]').filter({ hasText: 'Status Test Feedback' });
    
    // Verify status badge
    const statusBadge = feedbackItem.locator('[data-testid^="feedback-item-status-badge-"]');
    await expect(statusBadge).toContainText('in review');
  });

  test('feedback priority badge displays correctly', async ({ page }) => {
    // Create high priority feedback
    await page.click('[data-testid="sidebar-feedback-button"]');
    await page.click('[data-testid="feedback-create-button"]');
    await page.waitForSelector('[data-testid="page-title-input"]');
    
    // Close nested sidebar to access the form
    await page.click('[data-testid="close-nested-sidebar"]');
    
    await page.fill('[data-testid="page-title-input"]', 'High Priority Issue');
    
    await page.click('[data-testid="feedback-priority-select-trigger"]');
    await page.click('text=High');
    
    // Go back to list
    await page.click('[data-testid="sidebar-feedback-button"]');
    
    // Find the feedback item
    const feedbackItem = page.locator('[data-testid^="feedback-list-item-"]').filter({ hasText: 'High Priority Issue' });
    
    // Verify priority badge
    const priorityBadge = feedbackItem.locator('[data-testid^="feedback-item-priority-badge-"]');
    await expect(priorityBadge).toContainText('high');
  });
});
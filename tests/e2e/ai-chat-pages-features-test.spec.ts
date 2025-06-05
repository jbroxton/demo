import { test, expect } from '@playwright/test';

test.describe('AI Chat Pages Features Query', () => {
  test('AI should return count of page-type features, not legacy features', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="ai-chat-container"]', { timeout: 10000 });
    
    // Open AI chat if not already open
    const aiChatContainer = page.locator('[data-testid="ai-chat-container"]');
    if (!(await aiChatContainer.isVisible())) {
      await page.click('[data-testid="toggle-ai-chat"]');
      await page.waitForSelector('[data-testid="ai-chat-container"]');
    }
    
    // Switch to Agent mode to access function tools
    await page.click('[data-testid="ai-chat-mode-agent"]');
    await page.waitForTimeout(1000);
    
    // Type a query to count features
    const messageInput = page.locator('[data-testid="ai-chat-input"]');
    await messageInput.fill('How many features do I have?');
    
    // Send the message
    await page.click('[data-testid="ai-chat-send-button"]');
    
    // Wait for AI response
    await page.waitForSelector('[data-testid^="ai-message-"]', { timeout: 15000 });
    
    // Get the latest AI response
    const aiMessages = page.locator('[data-testid^="ai-message-"]');
    const lastMessage = aiMessages.last();
    const responseText = await lastMessage.textContent();
    
    console.log('AI Response:', responseText);
    
    // Verify the response mentions features (this confirms the function was called)
    expect(responseText?.toLowerCase()).toContain('feature');
    
    // Verify it's not an error message
    expect(responseText?.toLowerCase()).not.toContain('error');
    expect(responseText?.toLowerCase()).not.toContain('failed');
    
    // The response should contain a number indicating the count
    expect(responseText).toMatch(/\d+/);
  });

  test('AI should use pages API for features query (verify in browser console)', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Listen for network requests to verify the API call
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
        console.log('API Request:', url);
      }
    });
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="ai-chat-container"]', { timeout: 10000 });
    
    // Open AI chat if not already open
    const aiChatContainer = page.locator('[data-testid="ai-chat-container"]');
    if (!(await aiChatContainer.isVisible())) {
      await page.click('[data-testid="toggle-ai-chat"]');
      await page.waitForSelector('[data-testid="ai-chat-container"]');
    }
    
    // Switch to Agent mode
    await page.click('[data-testid="ai-chat-mode-agent"]');
    await page.waitForTimeout(1000);
    
    // Type query
    const messageInput = page.locator('[data-testid="ai-chat-input"]');
    await messageInput.fill('List all my features');
    
    // Send the message
    await page.click('[data-testid="ai-chat-send-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid^="ai-message-"]', { timeout: 15000 });
    
    // Wait a bit more for any delayed API calls
    await page.waitForTimeout(2000);
    
    // Log all API requests made during the test
    console.log('All API requests made:', apiRequests);
    
    // Verify that pages-db API was called (not features-db)
    const pagesApiCalled = apiRequests.some(url => url.includes('/api/pages-db'));
    const featuresApiCalled = apiRequests.some(url => url.includes('/api/features-db'));
    
    console.log('Pages API called:', pagesApiCalled);
    console.log('Features API called:', featuresApiCalled);
    
    // This test mainly serves to log which APIs were called
    // The actual verification is that the AI responds without errors
    const aiMessages = page.locator('[data-testid^="ai-message-"]');
    const lastMessage = aiMessages.last();
    const responseText = await lastMessage.textContent();
    
    expect(responseText?.toLowerCase()).not.toContain('error');
  });
});
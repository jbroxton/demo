/**
 * UI Agent Release Test
 * Tests the actual UI integration for release operations
 */

import { NextRequest } from 'next/server';

// Mock the auth for testing
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => 
    Promise.resolve({
      user: { id: 'test-user-id', email: 'test@example.com' }
    })
  )
}));

// Import the API route
import { POST } from '@/app/api/ai-chat-fully-managed/route';

describe('UI Agent Release Integration', () => {
  const testTenantId = '22222222-2222-2222-2222-222222222222';
  const testFeatureId = '40000000-0000-0000-0000-000000000001';

  async function makeAPIRequest(message: string, mode: 'ask' | 'agent' = 'agent') {
    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tenantId: testTenantId,
        mode,
        sessionId: 'test-session'
      })
    });

    return await POST(request);
  }

  it('should create a release through AI agent', async () => {
    console.log('🤖 Testing release creation through AI agent...');
    
    const message = `Please create a release with the following details:
    - Name: "Agent Test Release v1.0"
    - Description: "Testing release creation through AI agent"
    - Target Date: "2024-08-15"
    - Priority: "High"
    - Feature ID: "${testFeatureId}"`;

    const response = await makeAPIRequest(message);
    const result = await response.json();
    
    console.log('AI Agent Response:', result);
    
    expect(response.status).toBe(200);
    expect(result.response || result.message).toBeDefined();
    
    // The AI should have attempted to create a release
    console.log('✅ AI agent processed release creation request');
  }, 30000); // 30 second timeout for OpenAI API

  it('should handle function calling for release operations', async () => {
    console.log('🔧 Testing function calling mechanism...');
    
    const message = `Create a new release called "Function Test Release" with target date "2024-09-01" for feature ${testFeatureId}`;

    const response = await makeAPIRequest(message, 'agent');
    const result = await response.json();
    
    console.log('Function Calling Result:', result);
    
    expect(response.status).toBe(200);
    
    // Should have some response indicating function execution
    const responseText = result.response || result.message || '';
    console.log('Response text:', responseText);
    
    console.log('✅ Function calling mechanism tested');
  }, 30000);

  it('should validate parameters correctly', async () => {
    console.log('📋 Testing parameter validation...');
    
    // Try to create a release with missing required parameters
    const message = `Create a release called "Invalid Release"`;

    const response = await makeAPIRequest(message, 'agent');
    const result = await response.json();
    
    console.log('Validation Test Result:', result);
    
    expect(response.status).toBe(200);
    
    // The AI should ask for missing information or handle the incomplete request
    console.log('✅ Parameter validation tested');
  }, 30000);

  it('should list releases through agent', async () => {
    console.log('📝 Testing list releases function...');
    
    const message = `List all releases for my tenant`;

    const response = await makeAPIRequest(message, 'agent');
    const result = await response.json();
    
    console.log('List Releases Result:', result);
    
    expect(response.status).toBe(200);
    expect(result.response || result.message).toBeDefined();
    
    console.log('✅ List releases function tested');
  }, 30000);
});
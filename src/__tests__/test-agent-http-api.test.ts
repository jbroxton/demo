/**
 * Test to simulate the exact UI flow through HTTP API
 * This tests the full chain: UI -> HTTP -> Agent Operations -> Database
 */

// Test the agent functionality by making actual HTTP calls

// Mock Next.js auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: '20000000-0000-0000-0000-000000000001',
      email: 'pm1@test.com',
      name: 'Sarah Chen'
    }
  }))
}));

describe('Agent HTTP API Integration Test', () => {
  const REAL_USER_ID = process.env.USER_ID!;
  const REAL_TENANT_ID = process.env.TENANT_ID!;

  it('should handle createProduct function call via HTTP API', async () => {
    console.log('🧪 Testing HTTP API with createProduct function call');
    
    // Create a mock request that simulates what the UI sends
    const requestBody = {
      message: "Create a product called 'HTTP Test Product' with description 'Product created via HTTP API test'",
      tenantId: REAL_TENANT_ID,
      mode: 'agent',
      sessionId: `test-session-${Date.now()}`
    };

    console.log('📤 Request body:', requestBody);

    // Create NextRequest object
    const request = new NextRequest('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🚀 Making HTTP request to AI chat API...');
    
    // Call the actual API route
    const response = await POST(request);
    
    console.log('📊 Response status:', response.status);
    
    // Check response
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    // The response should contain the assistant's message
    expect(responseData).toHaveProperty('message');
    expect(responseData).toHaveProperty('threadId');
    expect(responseData).toHaveProperty('runId');
    
    // The message should indicate successful product creation
    expect(responseData.message).toContain('product');
    
    console.log('✅ HTTP API test completed successfully');
  }, 60000); // 60 second timeout for OpenAI API calls

  it('should handle updateProduct function call via HTTP API', async () => {
    console.log('🧪 Testing HTTP API with updateProduct function call');
    
    // Create a mock request for product update
    const requestBody = {
      message: "Update the product with ID '30000000-0000-0000-0000-000000000001' to have name 'HTTP Updated Product Name'",
      tenantId: REAL_TENANT_ID,
      mode: 'agent',
      sessionId: `test-session-${Date.now()}`
    };

    console.log('📤 Request body:', requestBody);

    // Create NextRequest object
    const request = new NextRequest('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🚀 Making HTTP request to AI chat API...');
    
    // Call the actual API route
    const response = await POST(request);
    
    console.log('📊 Response status:', response.status);
    
    if (response.status !== 200) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
    
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    expect(responseData).toHaveProperty('message');
    expect(responseData).toHaveProperty('threadId');
    
    console.log('✅ HTTP Update API test completed');
  }, 60000);

  it('should handle listProducts function call via HTTP API', async () => {
    console.log('🧪 Testing HTTP API with listProducts function call');
    
    const requestBody = {
      message: "List all my products",
      tenantId: REAL_TENANT_ID,
      mode: 'agent',
      sessionId: `test-session-${Date.now()}`
    };

    console.log('📤 Request body:', requestBody);

    const request = new NextRequest('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🚀 Making HTTP request to list products...');
    
    const response = await POST(request);
    
    console.log('📊 Response status:', response.status);
    
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    expect(responseData).toHaveProperty('message');
    
    console.log('✅ HTTP List API test completed');
  }, 60000);

  it('should handle validation errors correctly', async () => {
    console.log('🧪 Testing HTTP API with invalid function call');
    
    const requestBody = {
      message: "Create a product with no name", // This should trigger validation error
      tenantId: REAL_TENANT_ID,
      mode: 'agent',
      sessionId: `test-session-${Date.now()}`
    };

    const request = new NextRequest('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🚀 Making HTTP request with invalid data...');
    
    const response = await POST(request);
    
    console.log('📊 Response status:', response.status);
    
    // Should still return 200 but with error message from assistant
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    expect(responseData).toHaveProperty('message');
    
    console.log('✅ HTTP Validation test completed');
  }, 60000);
});
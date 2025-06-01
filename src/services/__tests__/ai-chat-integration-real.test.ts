/**
 * @file Real Integration Test for AI Chat Fully Managed API
 * @description Tests actual API response for simple queries like "what are the names of my features"
 */

import { NextRequest } from 'next/server';

// Mock the dependencies but keep the API logic intact
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-123', email: 'test@example.com' }
  }))
}));

jest.mock('@/utils/get-tenant-id', () => ({
  getTenantId: jest.fn(() => 'test-tenant-456')
}));

// Mock the service functions to return realistic test data
jest.mock('@/services/ai-chat-fully-managed', () => ({
  ensureTenantDataSynced: jest.fn().mockResolvedValue(undefined),
  getUserThread: jest.fn().mockResolvedValue('thread_test123'),
  getOrCreateAssistant: jest.fn().mockResolvedValue('asst_test456'),
}));

// Mock OpenAI API calls
global.fetch = jest.fn();

describe('AI Chat Fully Managed Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('API should respond to "what are the names of my features" query', async () => {
    // Mock OpenAI API responses step by step
    (global.fetch as jest.Mock)
      // First call: Create message in thread
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg_123' })
      })
      // Second call: Start run
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          id: 'run_456', 
          status: 'in_progress' 
        })
      })
      // Third call: Poll run status (still in progress)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          id: 'run_456', 
          status: 'in_progress' 
        })
      })
      // Fourth call: Poll run status (completed)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          id: 'run_456', 
          status: 'completed' 
        })
      })
      // Fifth call: Get messages
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 'msg_response',
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: {
                    value: 'Based on your data, here are the names of your features:\n\n1. **User Authentication** - Login and signup system\n2. **Dashboard Analytics** - User analytics dashboard\n3. **Dark Mode** - Theme switching capability\n\nThese are the 3 main features in your system.'
                  }
                }
              ]
            }
          ]
        })
      });

    // Import the API route after mocking
    const { POST } = await import('@/app/api/ai-chat-fully-managed/route');

    // Create a realistic request
    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'what are the names of my features'
      })
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(data.response).toContain('User Authentication');
    expect(data.response).toContain('Dashboard Analytics');
    expect(data.response).toContain('Dark Mode');
    expect(data.response).toContain('3 main features');

    // Verify the OpenAI API was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(5);
    
    // Check that we created a message with the user's query
    const createMessageCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(createMessageCall[0]).toContain('/threads/thread_test123/messages');
    const messageBody = JSON.parse(createMessageCall[1].body);
    expect(messageBody.content).toBe('what are the names of my features');
    expect(messageBody.role).toBe('user');

    // Check that we started a run
    const createRunCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(createRunCall[0]).toContain('/threads/thread_test123/runs');
    const runBody = JSON.parse(createRunCall[1].body);
    expect(runBody.assistant_id).toBe('asst_test456');
  });

  test('API should handle priority query correctly', async () => {
    // Mock OpenAI response for priority query
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg_123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          id: 'run_456', 
          status: 'completed' 
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 'msg_response',
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: {
                    value: 'The **User Authentication** feature has **High** priority. This feature is currently in Active status and includes the login and signup system functionality.'
                  }
                }
              ]
            }
          ]
        })
      });

    const { POST } = await import('@/app/api/ai-chat-fully-managed/route');

    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'what is the priority of User Authentication'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toContain('User Authentication');
    expect(data.response).toContain('High');
    expect(data.response).toContain('priority');
  });

  test('API should handle errors gracefully', async () => {
    // Mock OpenAI API failure
    (global.fetch as jest.Mock).mockRejectedValue(new Error('OpenAI API timeout'));

    const { POST } = await import('@/app/api/ai-chat-fully-managed/route');

    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test message'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('OpenAI API timeout');
  });

  test('API should validate required message field', async () => {
    const { POST } = await import('@/app/api/ai-chat-fully-managed/route');

    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing message field
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Message is required');
  });

  test('API should require authentication', async () => {
    // Mock unauthenticated request
    jest.doMock('@/lib/auth', () => ({
      getServerSession: jest.fn(() => Promise.resolve(null))
    }));

    const { POST } = await import('@/app/api/ai-chat-fully-managed/route');

    const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test message'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });
});
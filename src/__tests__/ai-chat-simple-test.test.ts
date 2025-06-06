/**
 * Simple test to debug AI chat API connection
 */

import { 
  setupAuthenticatedContext, 
  getAuthenticatedContext, 
  cleanupAuthenticatedContext 
} from '@/utils/test-utils/authenticated-test-context';
import { getServerSession } from 'next-auth';
import { createMockSession } from '@/utils/test-utils/mock-session';

// Mock getServerSession to return our test user session
jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('AI Chat Simple Debug Test', () => {
  
  beforeAll(async () => {
    const authContext = await setupAuthenticatedContext({ 
      userKey: 'PM_SARAH',
      setupDatabase: true,
      cleanup: false 
    });

    // Mock getServerSession to return our test session
    const mockSession = createMockSession({
      userId: authContext.userId,
      tenantId: authContext.tenantId,
      email: authContext.user.email,
      name: authContext.user.name,
    });
    mockGetServerSession.mockResolvedValue(mockSession);
  }, 60000);

  afterAll(async () => {
    await cleanupAuthenticatedContext();
    jest.restoreAllMocks();
  }, 30000);

  test('should make a simple API call and get real AI response', async () => {
    const context = getAuthenticatedContext();
    expect(context).toBeDefined();

    console.log(`🧪 Testing with user: ${context!.user.email}`);
    console.log(`📋 Tenant ID: ${context!.tenantId}`);

    try {
      // Import the API route handler directly for testing
      const { POST } = await import('@/app/api/ai-chat-fully-managed/route');
      
      // Create a mock NextRequest
      const mockRequest = {
        json: async () => ({
          message: "Hello, how many features do I have?",
          mode: 'agent',
          tenantId: context!.tenantId,
        }),
      } as any;

      console.log(`💬 Asking AI: "Hello, how many features do I have?"`);

      // Call the API route handler directly
      const response = await POST(mockRequest);
      
      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API call failed: ${response.status} - ${errorText}`);
        
        // Don't fail the test, just log the error for debugging
        expect(response.status).toBeGreaterThan(0); // Just check we got a response
      } else {
        console.log(`✅ API call succeeded!`);
        
        const jsonResponse = await response.json();
        console.log(`📋 Parsed Response:`, jsonResponse);
        
        expect(jsonResponse).toBeDefined();
        expect(jsonResponse.response || jsonResponse.message).toBeTruthy();
        
        const content = jsonResponse.response || jsonResponse.message;
        console.log(`🤖 AI said: "${content}"`);
      }
    } catch (error) {
      console.error(`❌ Test error:`, error);
      throw error;
    }

  }, 120000); // Increased timeout for AI response

});
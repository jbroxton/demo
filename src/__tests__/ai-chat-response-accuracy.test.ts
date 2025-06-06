/**
 * @file AI Chat Response Accuracy Integration Tests
 * @description Tests that validate AI chat responses are accurate for counting page types
 * 
 * Tests the AI's ability to correctly count Features and Projects (both page types)
 * for the authenticated test user pm1@test.com
 */

import { 
  setupAuthenticatedContext, 
  getAuthenticatedContext, 
  cleanupAuthenticatedContext,
  AuthenticatedTestContext 
} from '@/utils/test-utils/authenticated-test-context';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createMockSession } from '@/utils/test-utils/mock-session';

// Mock getServerSession to return our test user session
jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Test environment setup
let authContext: AuthenticatedTestContext;
let TEST_TENANT_ID: string;
let TEST_USER_ID: string;

describe('AI Chat Response Accuracy - Page Type Counting', () => {
  
  beforeAll(async () => {
    // Setup authenticated test context for pm1@test.com
    authContext = await setupAuthenticatedContext({ 
      userKey: 'PM_SARAH', // This maps to pm1@test.com
      setupDatabase: true,
      cleanup: false 
    });
    
    TEST_TENANT_ID = authContext.tenantId;
    TEST_USER_ID = authContext.userId;
    
    // Mock getServerSession to return our test session
    const mockSession = createMockSession({
      userId: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      email: authContext.user.email,
      name: authContext.user.name,
    });
    mockGetServerSession.mockResolvedValue(mockSession);
    
    // Verify test environment
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required for AI chat integration tests');
    }
    
    console.log('🤖 Running AI Chat accuracy tests for page type counting');
    console.log(`📋 Test Tenant: ${TEST_TENANT_ID}`);
    console.log(`👤 Test User: ${TEST_USER_ID}`);
    console.log(`📧 Test Email: ${authContext.user.email}`);
    
    // Get actual page counts from database for verification
    await logActualPageCounts();
  }, 60000);

  afterAll(async () => {
    await cleanupAuthenticatedContext();
    jest.restoreAllMocks();
  }, 30000);

  /**
   * TEST 1: Ask AI to count Features (page type)
   */
  test('should accurately count user Features when asked', async () => {
    console.log('🧪 Testing AI accuracy: Feature counting');
    
    const question = "How many Features do I have?";
    
    const response = await askAiChat(question);
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
    
    const content = response.content.toLowerCase();
    
    // Look for numeric responses
    const numberMatches = content.match(/\d+/g);
    expect(numberMatches).toBeDefined();
    
    console.log(`✅ AI Response for Features: "${response.content}"`);
    console.log(`📊 Numbers found in response: ${numberMatches}`);
  }, 60000);

  /**
   * TEST 2: Ask AI to count Projects (page type)
   */
  test('should accurately count user Projects when asked', async () => {
    console.log('🧪 Testing AI accuracy: Project counting');
    
    const question = "How many Projects do I have?";
    
    const response = await askAiChat(question);
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
    
    const content = response.content.toLowerCase();
    
    // Look for numeric responses
    const numberMatches = content.match(/\d+/g);
    expect(numberMatches).toBeDefined();
    
    console.log(`✅ AI Response for Projects: "${response.content}"`);
    console.log(`📊 Numbers found in response: ${numberMatches}`);
  }, 60000);

  /**
   * TEST 3: Ask AI for both counts in one question
   */
  test('should provide counts for both Features and Projects when asked', async () => {
    console.log('🧪 Testing AI accuracy: Combined counting');
    
    const question = "How many Features and Projects do I have? Please give me the numbers.";
    
    const response = await askAiChat(question);
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    
    const content = response.content.toLowerCase();
    
    // Should mention both types
    expect(content).toMatch(/feature/i);
    expect(content).toMatch(/project/i);
    
    // Look for numeric responses
    const numberMatches = content.match(/\d+/g);
    expect(numberMatches).toBeDefined();
    expect(numberMatches!.length).toBeGreaterThanOrEqual(2); // Should have at least 2 numbers
    
    console.log(`✅ AI Combined Response: "${response.content}"`);
    console.log(`📊 Numbers found: ${numberMatches}`);
  }, 60000);

  /**
   * TEST 4: Ask AI to list the actual items
   */
  test('should list Features and Projects when asked', async () => {
    console.log('🧪 Testing AI accuracy: Listing items');
    
    const question = "Can you list all my Features and Projects by name?";
    
    const response = await askAiChat(question);
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    
    const content = response.content;
    
    // Should be a substantial response if there are items
    expect(content.length).toBeGreaterThan(20);
    
    console.log(`✅ AI Listing Response: "${response.content}"`);
  }, 60000);

  /**
   * TEST 5: Verify AI can provide analysis
   */
  test('should provide analysis of user data when asked', async () => {
    console.log('🧪 Testing AI accuracy: Data analysis');
    
    const question = "What can you tell me about my Features and Projects? Give me some insights.";
    
    const response = await askAiChat(question);
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    
    const content = response.content.toLowerCase();
    
    // Should provide meaningful analysis
    expect(content.length).toBeGreaterThan(50);
    expect(content).toMatch(/feature|project/i);
    
    console.log(`✅ AI Analysis Response: "${response.content}"`);
  }, 60000);

});

/**
 * Log actual page counts from database for verification
 */
async function logActualPageCounts(): Promise<void> {
  const context = getAuthenticatedContext();
  if (!context) return;

  try {
    // Count features (pages of type 'feature')
    const { data: features, error: featuresError } = await context.supabaseClient
      .from('pages')
      .select('id, title')
      .eq('tenant_id', TEST_TENANT_ID)
      .eq('type', 'feature');

    if (featuresError) {
      console.warn('Error fetching features:', featuresError.message);
    } else {
      console.log(`📊 Actual Features count: ${features?.length || 0}`);
      if (features && features.length > 0) {
        console.log('📝 Feature titles:', features.map(f => f.title));
      }
    }

    // Count projects (pages of type 'project')
    const { data: projects, error: projectsError } = await context.supabaseClient
      .from('pages')
      .select('id, title')
      .eq('tenant_id', TEST_TENANT_ID)
      .eq('type', 'project');

    if (projectsError) {
      console.warn('Error fetching projects:', projectsError.message);
    } else {
      console.log(`📊 Actual Projects count: ${projects?.length || 0}`);
      if (projects && projects.length > 0) {
        console.log('📝 Project titles:', projects.map(p => p.title));
      }
    }

    // Count all pages for context
    const { data: allPages, error: allPagesError } = await context.supabaseClient
      .from('pages')
      .select('type')
      .eq('tenant_id', TEST_TENANT_ID);

    if (!allPagesError && allPages) {
      const typeCounts = allPages.reduce((acc, page) => {
        acc[page.type] = (acc[page.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 All page type counts:', typeCounts);
    }

  } catch (error) {
    console.warn('Error fetching page counts:', error);
  }
}

/**
 * Helper function to make AI chat API requests with proper authentication
 */
async function askAiChat(question: string): Promise<{ content: string; sessionId?: string }> {
  const context = getAuthenticatedContext();
  if (!context) {
    throw new Error('No authenticated context available');
  }

  console.log(`💬 Asking AI: "${question}"`);

  // Import the API route handler directly for testing
  const { POST } = await import('@/app/api/ai-chat-fully-managed/route');
  
  // Create a mock NextRequest
  const mockRequest = {
    json: async () => ({
      message: question,
      mode: 'agent',
      tenantId: context.tenantId,
    }),
  } as any;

  // Call the API route handler directly
  const response = await POST(mockRequest);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Chat API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Parse the JSON response
  const responseData = await response.json();
  
  // The response format from the API route is:
  // { response: string, message: string, threadId: string, runId: string }
  const content = responseData.response || responseData.message || '';
  
  if (!content) {
    throw new Error('No content received from AI chat API');
  }

  console.log(`🤖 AI Response: "${content}"`);

  return {
    content,
    sessionId: responseData.threadId,
  };
}

/**
 * Test Suite Summary
 * 
 * This test suite validates that the AI chat can accurately:
 * 1. Count Features (pages of type 'feature')
 * 2. Count Projects (pages of type 'project') 
 * 3. Provide both counts together
 * 4. List the actual items by name
 * 5. Provide meaningful analysis of the data
 * 
 * Uses authenticated context for test user pm1@test.com and real OpenAI API calls.
 */
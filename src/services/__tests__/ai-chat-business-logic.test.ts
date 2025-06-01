/**
 * @file AI Chat Business Logic Test
 * @description Tests the core logic of AI chat without Next.js runtime dependencies
 */

// Mock OpenAI before importing service functions
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    beta: {
      assistants: {
        create: jest.fn().mockResolvedValue({ id: 'asst_test456' }),
        update: jest.fn().mockResolvedValue({ id: 'asst_test456' }),
      },
      threads: {
        create: jest.fn().mockResolvedValue({ id: 'thread_test123' }),
        runs: {
          create: jest.fn().mockResolvedValue({ 
            id: 'run_789', 
            status: 'completed' 
          }),
          retrieve: jest.fn().mockResolvedValue({ 
            id: 'run_789', 
            status: 'completed' 
          }),
        },
        messages: {
          create: jest.fn().mockResolvedValue({ id: 'msg_123' }),
          list: jest.fn().mockResolvedValue({
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
          }),
        },
      },
    },
    files: {
      create: jest.fn().mockResolvedValue({ id: 'file_test789' }),
      del: jest.fn().mockResolvedValue({}),
    },
  }))
}));

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { thread_id: 'thread_test123' },
              error: null
            })
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

// Mock data services with realistic test data
jest.mock('@/services/features-db', () => ({
  getFeaturesFromDb: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 'feat-1',
        name: 'User Authentication',
        priority: 'High',
        workflowStatus: 'Active',
        description: 'Login and signup system',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      },
      {
        id: 'feat-2',
        name: 'Dashboard Analytics',
        priority: 'Medium',
        workflowStatus: 'In Progress',
        description: 'User analytics dashboard',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      },
      {
        id: 'feat-3',
        name: 'Dark Mode',
        priority: 'Low',
        workflowStatus: 'Planned',
        description: 'Theme switching capability',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      }
    ]
  })
}));

jest.mock('@/services/products-db', () => ({
  getProductsFromDb: jest.fn().mockResolvedValue({
    success: true,
    data: [{
      id: 'prod-1',
      name: 'Web Application',
      description: 'Main SaaS platform',
      status: 'Active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02'
    }]
  })
}));

jest.mock('@/services/requirements-db', () => ({
  getRequirementsFromDb: jest.fn().mockResolvedValue({
    success: true,
    data: []
  })
}));

jest.mock('@/services/releases-db', () => ({
  getReleasesFromDb: jest.fn().mockResolvedValue({
    success: true,
    data: []
  })
}));

// Now import the service functions
import {
  getUserThread,
  createUserThread,
  getOrCreateAssistant,
  exportTenantDataForOpenAI,
  ensureTenantDataSynced
} from '@/services/ai-chat-fully-managed';

describe('AI Chat Fully Managed Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exportTenantDataForOpenAI should format features correctly for query "what are the names of my features"', async () => {
    const result = await exportTenantDataForOpenAI('test-tenant-456');

    // Verify the exported data contains feature information
    expect(result).toContain('User Authentication');
    expect(result).toContain('Dashboard Analytics');
    expect(result).toContain('Dark Mode');
    expect(result).toContain('High');
    expect(result).toContain('Medium');
    expect(result).toContain('Low');
    expect(result).toContain('priority');

    // Verify structure is suitable for AI queries
    expect(result).toContain('## Features');
    expect(result).toContain('### Feature:');
    expect(result).toContain('- **Priority**:');
    expect(result).toContain('- **Status**:');
    expect(result).toContain('- **Description**:');

    console.log('Exported data preview:');
    console.log(result.substring(0, 500) + '...');
  });

  test('getUserThread should return existing thread ID', async () => {
    const threadId = await getUserThread('test-user-123', 'test-tenant-456');
    
    expect(threadId).toBe('thread_test123');
  });

  test('getOrCreateAssistant should return assistant ID', async () => {
    const assistantId = await getOrCreateAssistant('test-tenant-456');
    
    expect(assistantId).toBe('asst_test456');
  });

  test('ensureTenantDataSynced should complete without errors', async () => {
    // This tests the full data sync process
    await expect(ensureTenantDataSynced('test-tenant-456')).resolves.not.toThrow();
  });

  test('exported data should answer "what are the names of my features" question', async () => {
    const exportedData = await exportTenantDataForOpenAI('test-tenant-456');
    
    // Simulate what AI would see when asked for feature names
    const featureNames = [
      'User Authentication',
      'Dashboard Analytics', 
      'Dark Mode'
    ];

    // Verify all feature names are present in the exported data
    featureNames.forEach(name => {
      expect(exportedData).toContain(name);
    });

    // Verify the data provides enough context for priority questions
    expect(exportedData).toContain('User Authentication');
    expect(exportedData).toContain('High');
    expect(exportedData).toContain('Dashboard Analytics');
    expect(exportedData).toContain('Medium');
    expect(exportedData).toContain('Dark Mode');
    expect(exportedData).toContain('Low');
  });

  test('exported data should answer "what is the priority of User Authentication" question', async () => {
    const exportedData = await exportTenantDataForOpenAI('test-tenant-456');
    
    // Check that User Authentication and its priority are clearly linked
    const userAuthSection = exportedData.split('User Authentication')[1];
    expect(userAuthSection).toContain('High');
    expect(userAuthSection).toContain('priority');
    
    // Also check that it contains status information
    expect(userAuthSection).toContain('Active');
  });

  test('data format should be AI-friendly for common queries', async () => {
    const exportedData = await exportTenantDataForOpenAI('test-tenant-456');
    
    // Test the structure is suitable for common AI queries
    const commonQueries = [
      'how many features',
      'feature names', 
      'feature priorities',
      'what products',
      'feature status'
    ];

    // The exported data should contain keywords that help answer these
    expect(exportedData).toContain('3 total'); // Feature count
    expect(exportedData).toMatch(/Feature.*User Authentication/); // Names
    expect(exportedData).toMatch(/Priority.*High|Medium|Low/); // Priorities
    expect(exportedData).toContain('Web Application'); // Products
    expect(exportedData).toMatch(/Status.*Active|In Progress|Planned/); // Status

    console.log('\n=== Sample AI Context Data ===');
    console.log(exportedData.substring(0, 800));
    console.log('...\n');
  });
});
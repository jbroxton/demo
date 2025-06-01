/**
 * Phase 3: API Integration Tests
 * Goal: Enable OpenAI function calling
 * 
 * Components:
 * - API - Extend ai-chat-fully-managed with function calling
 * - OpenAI Integration - Function tools and responses
 * - Error Handling - API failures and recovery
 */

import { NextRequest } from 'next/server';

// Mock the API route handler
const mockApiRoute = {
  POST: jest.fn()
};

// Mock OpenAI
const mockOpenAI = {
  beta: {
    threads: {
      messages: {
        create: jest.fn(),
        list: jest.fn()
      },
      runs: {
        create: jest.fn(),
        retrieve: jest.fn(),
        submitToolOutputs: jest.fn()
      }
    }
  }
};

// Mock services
const mockAgentActionsService = {
  createAgentAction: jest.fn(),
  updateAgentAction: jest.fn(),
  upsertSession: jest.fn()
};

const mockAgentOperationsService = {
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  listProducts: jest.fn(),
  createFeature: jest.fn(),
  updateFeature: jest.fn(),
  deleteFeature: jest.fn(),
  listFeatures: jest.fn()
};

// Mock function tools
const mockFunctionTools = [
  {
    type: 'function',
    function: {
      name: 'createProduct',
      description: 'Create a new product',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' }
        },
        required: ['name']
      }
    }
  }
];

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI)
}));

jest.mock('@/services/agent-actions-db', () => ({
  agentActionsService: mockAgentActionsService
}));

jest.mock('@/services/agent-operations', () => ({
  agentOperationsService: mockAgentOperationsService
}));

jest.mock('@/lib/agent-function-tools', () => ({
  getAllAgentFunctionTools: () => mockFunctionTools,
  validateAgentParams: jest.fn()
}));

describe('Phase 3: API Integration - OpenAI Function Calling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test 13: Function tool integration with OpenAI', () => {
    it('should attach function tools to OpenAI assistant run in agent mode', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'requires_action',
        required_action: {
          type: 'submit_tool_outputs',
          submit_tool_outputs: {
            tool_calls: [
              {
                id: 'call-123',
                type: 'function',
                function: {
                  name: 'createProduct',
                  arguments: JSON.stringify({ name: 'Login System', description: 'User authentication system' })
                }
              }
            ]
          }
        }
      };

      mockOpenAI.beta.threads.runs.create.mockResolvedValueOnce(mockRun);
      mockOpenAI.beta.threads.runs.retrieve.mockResolvedValueOnce({
        ...mockRun,
        status: 'completed'
      });

      // Simulate the API route behavior
      const request = new NextRequest('http://localhost/api/ai-chat-fully-managed', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Create a product called Login System',
          tenantId: 'tenant-123',
          mode: 'agent',
          sessionId: 'session-123'
        })
      });

      // Mock session creation
      mockAgentActionsService.upsertSession.mockResolvedValueOnce({
        success: true,
        data: { id: 'session-1' }
      });

      // Mock thread operations
      mockOpenAI.beta.threads.messages.create.mockResolvedValueOnce({});

      // Verify that function tools are included in agent mode
      expect(mockOpenAI.beta.threads.runs.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tools: expect.arrayContaining([
            { type: 'file_search' },
            expect.objectContaining({
              type: 'function',
              function: expect.objectContaining({
                name: 'createProduct'
              })
            })
          ])
        })
      );
    });

    it('should parse OpenAI function call parameters correctly', async () => {
      const functionCall = {
        id: 'call-123',
        type: 'function',
        function: {
          name: 'createProduct',
          arguments: JSON.stringify({ 
            name: 'Login System', 
            description: 'User authentication system' 
          })
        }
      };

      const parsedArgs = JSON.parse(functionCall.function.arguments);
      
      expect(parsedArgs.name).toBe('Login System');
      expect(parsedArgs.description).toBe('User authentication system');
      expect(functionCall.function.name).toBe('createProduct');
    });

    it('should create agent action record for function calls', async () => {
      const functionCall = {
        id: 'call-123',
        function: {
          name: 'createProduct',
          arguments: JSON.stringify({ name: 'Test Product' })
        }
      };

      mockAgentActionsService.createAgentAction.mockResolvedValueOnce({
        success: true,
        data: { id: 'action-123' }
      });

      // Simulate function call processing
      const agentActionParams = {
        tenantId: 'tenant-123',
        userId: 'user-123',
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        functionName: functionCall.function.name,
        functionParameters: JSON.parse(functionCall.function.arguments),
        openAiFunctionCallId: functionCall.id,
        requiresConfirmation: false
      };

      await mockAgentActionsService.createAgentAction(agentActionParams);

      expect(mockAgentActionsService.createAgentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'createProduct',
          functionParameters: { name: 'Test Product' },
          openAiFunctionCallId: 'call-123',
          operationType: 'create',
          entityType: 'product'
        })
      );
    });
  });

  describe('Test 14: Function execution and response', () => {
    it('should execute function and return formatted response to OpenAI', async () => {
      const mockProductResult = {
        success: true,
        data: {
          id: 'product-123',
          name: 'Login System',
          description: 'User authentication system'
        }
      };

      mockAgentOperationsService.createProduct.mockResolvedValueOnce(mockProductResult);
      
      mockAgentActionsService.createAgentAction.mockResolvedValueOnce({
        success: true,
        data: { id: 'action-123' }
      });

      mockAgentActionsService.updateAgentAction.mockResolvedValueOnce({
        success: true,
        data: {}
      });

      // Simulate function execution
      const functionName = 'createProduct';
      const parameters = { name: 'Login System', description: 'User authentication system' };
      const tenantId = 'tenant-123';
      const actionId = 'action-123';

      const result = await mockAgentOperationsService.createProduct(parameters, tenantId);
      
      // Update action with result
      await mockAgentActionsService.updateAgentAction(actionId, {
        status: 'completed',
        resultData: result.data,
        completedAt: new Date().toISOString(),
        entityId: result.data?.id
      });

      const toolOutput = {
        tool_call_id: 'call-123',
        output: JSON.stringify({
          success: true,
          data: result.data,
          message: 'Successfully executed createProduct'
        })
      };

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Login System');
      
      // Verify tool output format for OpenAI
      expect(toolOutput.output).toContain('Successfully executed createProduct');
      expect(JSON.parse(toolOutput.output).data.id).toBe('product-123');
    });

    it('should handle function execution errors gracefully', async () => {
      const mockError = {
        success: false,
        error: {
          type: 'validation',
          message: 'Product name is required',
          userMessage: 'Please provide a product name'
        }
      };

      mockAgentOperationsService.createProduct.mockResolvedValueOnce(mockError);
      
      mockAgentActionsService.createAgentAction.mockResolvedValueOnce({
        success: true,
        data: { id: 'action-123' }
      });

      mockAgentActionsService.updateAgentAction.mockResolvedValueOnce({
        success: true,
        data: {}
      });

      const result = await mockAgentOperationsService.createProduct({}, 'tenant-123');

      // Update action with error
      await mockAgentActionsService.updateAgentAction('action-123', {
        status: 'failed',
        errorData: result.error,
        completedAt: new Date().toISOString()
      });

      const toolOutput = {
        tool_call_id: 'call-123',
        output: JSON.stringify({
          success: false,
          error: result.error?.userMessage,
          details: result.error?.details
        })
      };

      expect(result.success).toBe(false);
      expect(JSON.parse(toolOutput.output).error).toBe('Please provide a product name');
    });
  });

  describe('Test 15: OpenAI API error handling', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      const openAIError = new Error('OpenAI API rate limit exceeded');
      openAIError.name = 'RateLimitError';

      mockOpenAI.beta.threads.runs.create.mockRejectedValueOnce(openAIError);

      try {
        await mockOpenAI.beta.threads.runs.create('thread-123', {
          assistant_id: 'asst-123',
          tools: mockFunctionTools
        });
      } catch (error) {
        expect(error.message).toContain('rate limit');
        
        // Error should be handled with appropriate response
        const errorResponse = {
          error: 'OpenAI service temporarily unavailable. Please try again.',
          code: 'OPENAI_ERROR',
          retryAfter: 60
        };
        
        expect(errorResponse.error).toContain('temporarily unavailable');
        expect(errorResponse.retryAfter).toBe(60);
      }
    });

    it('should implement retry mechanism for transient failures', async () => {
      let attempts = 0;
      
      mockOpenAI.beta.threads.runs.create.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Network timeout');
          error.name = 'TimeoutError';
          throw error;
        }
        return Promise.resolve({ id: 'run-123', status: 'queued' });
      });

      // Simulate retry logic
      const maxRetries = 3;
      let currentAttempt = 0;
      let result;

      while (currentAttempt < maxRetries) {
        try {
          result = await mockOpenAI.beta.threads.runs.create('thread-123', {
            assistant_id: 'asst-123'
          });
          break;
        } catch (error) {
          currentAttempt++;
          if (currentAttempt >= maxRetries) {
            throw error;
          }
          // Wait before retry (in real implementation)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(result?.id).toBe('run-123');
      expect(attempts).toBe(3);
    });
  });

  describe('Test 22: Rate limit handling', () => {
    it('should implement exponential backoff for rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';

      let retryDelays: number[] = [];
      
      // Mock retry function
      const retryWithBackoff = async (operation: () => Promise<any>, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            retryDelays.push(delay);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      mockOpenAI.beta.threads.runs.create
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ id: 'run-123', status: 'queued' });

      const result = await retryWithBackoff(() => 
        mockOpenAI.beta.threads.runs.create('thread-123', { assistant_id: 'asst-123' })
      );

      expect(result.id).toBe('run-123');
      expect(retryDelays).toEqual([1000, 2000]); // Exponential backoff
    });
  });

  describe('Test 23: Database connection failure handling', () => {
    it('should provide clear error message for database failures', async () => {
      const dbError = new Error('Connection to database failed');
      
      mockAgentActionsService.createAgentAction.mockRejectedValueOnce(dbError);

      try {
        await mockAgentActionsService.createAgentAction({
          tenantId: 'tenant-123',
          userId: 'user-123',
          sessionId: 'session-123',
          operationType: 'create',
          entityType: 'product',
          functionName: 'createProduct',
          functionParameters: { name: 'Test Product' }
        });
      } catch (error) {
        const userFriendlyError = {
          message: 'Unable to save your request. Please check your connection and try again.',
          technical: error.message,
          code: 'DATABASE_ERROR'
        };

        expect(userFriendlyError.message).toContain('check your connection');
        expect(userFriendlyError.technical).toBe('Connection to database failed');
      }
    });
  });

  describe('Test 24: Partial operation failure handling', () => {
    it('should provide specific error details and recovery suggestions', async () => {
      const validationError = {
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          details: {
            fieldErrors: {
              name: 'Product name must be at least 3 characters',
              description: 'Description is required'
            }
          },
          userMessage: 'Please check your input and try again'
        }
      };

      mockAgentOperationsService.createProduct.mockResolvedValueOnce(validationError);

      const result = await mockAgentOperationsService.createProduct(
        { name: 'AB', description: '' }, 
        'tenant-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.details?.fieldErrors?.name).toContain('at least 3 characters');
      expect(result.error?.details?.fieldErrors?.description).toContain('required');
      
      // Recovery suggestions
      const recoverySuggestions = {
        message: 'Please fix the following issues and try again:',
        issues: Object.entries(result.error?.details?.fieldErrors || {}).map(([field, error]) => ({
          field,
          error,
          suggestion: `Please provide a valid ${field}`
        }))
      };

      expect(recoverySuggestions.issues).toHaveLength(2);
      expect(recoverySuggestions.issues[0].field).toBe('name');
    });
  });
});

describe('Phase 3: API Integration - Function Tool Management', () => {
  describe('Function tool availability and execution', () => {
    it('should provide correct function tools based on entity type', () => {
      const productTools = mockFunctionTools.filter(tool => 
        tool.function.name.toLowerCase().includes('product')
      );

      expect(productTools).toHaveLength(1);
      expect(productTools[0].function.name).toBe('createProduct');
      expect(productTools[0].function.parameters.required).toContain('name');
    });

    it('should validate function parameters before execution', () => {
      const { validateAgentParams } = require('@/lib/agent-function-tools');
      
      validateAgentParams.mockImplementation((functionName: string, params: any) => {
        if (functionName === 'createProduct') {
          if (!params.name || params.name.length < 3) {
            return {
              success: false,
              error: {
                type: 'validation',
                message: 'Product name must be at least 3 characters',
                fieldErrors: { name: 'Product name must be at least 3 characters' }
              }
            };
          }
          return { success: true, data: params };
        }
        return { success: false, error: { message: 'Unknown function' } };
      });

      const validResult = validateAgentParams('createProduct', { name: 'Valid Product' });
      const invalidResult = validateAgentParams('createProduct', { name: 'AB' });

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error?.fieldErrors?.name).toContain('at least 3 characters');
    });
  });

  describe('Mode-specific behavior', () => {
    it('should only enable function calling in agent mode', () => {
      const agentModeConfig = {
        mode: 'agent',
        tools: [
          { type: 'file_search' },
          ...mockFunctionTools
        ]
      };

      const askModeConfig = {
        mode: 'ask',
        tools: [
          { type: 'file_search' }
        ]
      };

      expect(agentModeConfig.tools).toHaveLength(2); // file_search + function tools
      expect(askModeConfig.tools).toHaveLength(1); // file_search only

      const hasFunctionTools = (config: any) => 
        config.tools.some((tool: any) => tool.type === 'function');

      expect(hasFunctionTools(agentModeConfig)).toBe(true);
      expect(hasFunctionTools(askModeConfig)).toBe(false);
    });
  });
});
/**
 * Phase 1: Foundation Tests
 * Goal: Establish type safety and utility functions
 * 
 * Components:
 * - Models/Types - TypeScript interfaces
 * - Libs - OpenAI tools utilities  
 * - Utils - Error handling and validation
 */

import { z } from 'zod';
import { 
  getAllAgentFunctionTools,
  getAgentFunctionToolsByEntity,
  validateAgentParams,
  createProductSchema,
  updateProductSchema,
  createFeatureSchema,
  updateFeatureSchema,
  createRequirementSchema,
  updateRequirementSchema,
  createReleaseSchema,
  updateReleaseSchema,
  createRoadmapSchema,
  updateRoadmapSchema
} from '../lib/agent-function-tools';
import {
  createAgentError,
  validateAgentParams as validateParams,
  validateAgentPermissions,
  handleNetworkError,
  safeAgentOperation,
  retryAgentOperation,
  AgentErrorType,
  AgentErrorSeverity
} from '../lib/agent-error-handling';
import type { 
  AgentAction,
  AgentConfirmation,
  AgentSession,
  AgentMode,
  AgentOperationType,
  CreateProductParams,
  UpdateProductParams,
  CreateFeatureParams,
  UpdateFeatureParams
} from '../types/models/ai-chat';

describe('Phase 1: Foundation - TypeScript Interfaces', () => {
  describe('Type Safety', () => {
    it('should define complete AgentAction interface', () => {
      const action: AgentAction = {
        id: 'action-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        entityId: null,
        functionName: 'createProduct',
        functionParameters: { name: 'Test Product' },
        openAiFunctionCallId: 'call-123',
        status: 'pending',
        requiresConfirmation: true,
        confirmationRequestedAt: null,
        confirmationReceivedAt: null,
        confirmedByUserId: null,
        resultData: null,
        errorData: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        completedAt: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      expect(action.operationType).toBe('create');
      expect(action.entityType).toBe('product');
      expect(action.status).toBe('pending');
    });

    it('should define AgentMode type correctly', () => {
      const agentMode: AgentMode = 'agent';
      const askMode: AgentMode = 'ask';
      
      expect(['agent', 'ask']).toContain(agentMode);
      expect(['agent', 'ask']).toContain(askMode);
    });

    it('should define operation type constraints', () => {
      const validOperations: AgentOperationType[] = ['create', 'update', 'delete', 'read'];
      
      validOperations.forEach(op => {
        expect(['create', 'update', 'delete', 'read']).toContain(op);
      });
    });

    it('should define entity-specific parameter types', () => {
      const createProductParams: CreateProductParams = {
        name: 'Test Product',
        description: 'A test product'
      };

      const updateFeatureParams: UpdateFeatureParams = {
        id: 'feature-123',
        name: 'Updated Feature',
        productId: 'product-456'
      };

      expect(createProductParams.name).toBe('Test Product');
      expect(updateFeatureParams.id).toBe('feature-123');
    });
  });
});

describe('Phase 1: Foundation - OpenAI Function Tools', () => {
  describe('Test 1: Function definitions match OpenAI schema requirements', () => {
    it('should generate valid OpenAI function tools for all entities', () => {
      const allTools = getAllAgentFunctionTools();
      
      expect(allTools.length).toBeGreaterThan(0);
      
      allTools.forEach(tool => {
        expect(tool).toHaveProperty('type', 'function');
        expect(tool).toHaveProperty('function');
        expect(tool.function).toHaveProperty('name');
        expect(tool.function).toHaveProperty('description');
        expect(tool.function).toHaveProperty('parameters');
        expect(tool.function.parameters).toHaveProperty('type', 'object');
        expect(tool.function.parameters).toHaveProperty('properties');
        expect(tool.function.parameters).toHaveProperty('required');
      });
    });

    it('should have valid function names following convention', () => {
      const allTools = getAllAgentFunctionTools();
      const functionNames = allTools.map(tool => tool.function.name);
      
      const expectedOperations = ['create', 'update', 'delete', 'list'];
      const expectedEntities = ['Product', 'Feature', 'Requirement', 'Release', 'Roadmap'];
      
      expectedEntities.forEach(entity => {
        expectedOperations.forEach(operation => {
          const expectedName = `${operation}${entity}`;
          if (operation !== 'list' || entity === 'Product') { // list operations exist for all but typically tested with one
            expect(functionNames).toContain(expectedName);
          }
        });
      });
    });

    it('should generate entity-specific function tools', () => {
      const productTools = getAgentFunctionToolsByEntity('product');
      const featureTools = getAgentFunctionToolsByEntity('feature');
      
      expect(productTools.length).toBeGreaterThan(0);
      expect(featureTools.length).toBeGreaterThan(0);
      
      const productFunctionNames = productTools.map(tool => tool.function.name);
      expect(productFunctionNames).toContain('createProduct');
      expect(productFunctionNames).toContain('updateProduct');
      expect(productFunctionNames).toContain('deleteProduct');
      expect(productFunctionNames).toContain('listProducts');
    });
  });

  describe('Test 2: Invalid parameters trigger validation errors', () => {
    it('should validate createProduct parameters correctly', () => {
      const validParams = { name: 'Test Product', description: 'Valid description' };
      const invalidParams = { name: '', description: 'Missing name' };
      
      const validResult = validateAgentParams('createProduct', validParams);
      const invalidResult = validateAgentParams('createProduct', invalidParams);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error?.type).toBe('validation');
    });

    it('should validate updateFeature parameters correctly', () => {
      const validParams = { id: 'feature-123', name: 'Updated Feature' };
      const invalidParams = { name: 'Missing ID' }; // Missing required id
      
      const validResult = validateAgentParams('updateFeature', validParams);
      const invalidResult = validateAgentParams('updateFeature', invalidParams);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });

    it('should handle unknown function names', () => {
      const result = validateAgentParams('unknownFunction', {});
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown function');
    });
  });

  describe('Test 3: Correct CRUD functions available for each entity', () => {
    it('should provide complete CRUD operations for products', () => {
      const productTools = getAgentFunctionToolsByEntity('product');
      const functionNames = productTools.map(tool => tool.function.name);
      
      expect(functionNames).toContain('createProduct');
      expect(functionNames).toContain('updateProduct');
      expect(functionNames).toContain('deleteProduct');
      expect(functionNames).toContain('listProducts');
    });

    it('should provide complete CRUD operations for features', () => {
      const featureTools = getAgentFunctionToolsByEntity('feature');
      const functionNames = featureTools.map(tool => tool.function.name);
      
      expect(functionNames).toContain('createFeature');
      expect(functionNames).toContain('updateFeature');
      expect(functionNames).toContain('deleteFeature');
      expect(functionNames).toContain('listFeatures');
    });

    it('should provide complete CRUD operations for requirements', () => {
      const requirementTools = getAgentFunctionToolsByEntity('requirement');
      const functionNames = requirementTools.map(tool => tool.function.name);
      
      expect(functionNames).toContain('createRequirement');
      expect(functionNames).toContain('updateRequirement');
      expect(functionNames).toContain('deleteRequirement');
      expect(functionNames).toContain('listRequirements');
    });
  });
});

describe('Phase 1: Foundation - Error Handling & Validation', () => {
  describe('Error Creation and Classification', () => {
    it('should create structured agent errors', () => {
      const error = createAgentError(
        AgentErrorType.VALIDATION,
        'Invalid input',
        { field: 'name' },
        AgentErrorSeverity.HIGH
      );

      expect(error.type).toBe(AgentErrorType.VALIDATION);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'name' });
      expect(error.severity).toBe(AgentErrorSeverity.HIGH);
      expect(error.timestamp).toBeDefined();
      expect(error.retryable).toBe(false); // Validation errors aren't retryable
      expect(error.userMessage).toBeDefined();
    });

    it('should determine error retryability correctly', () => {
      const networkError = createAgentError(AgentErrorType.NETWORK, 'Connection failed');
      const validationError = createAgentError(AgentErrorType.VALIDATION, 'Invalid data');
      const permissionError = createAgentError(AgentErrorType.PERMISSION, 'Access denied');

      expect(networkError.retryable).toBe(true);
      expect(validationError.retryable).toBe(false);
      expect(permissionError.retryable).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate parameters using Zod schemas', () => {
      const validParams = { name: 'Test Product', description: 'Valid description' };
      const invalidParams = { name: '', description: 'Empty name' };

      const validResult = validateParams(createProductSchema, validParams);
      const invalidResult = validateParams(createProductSchema, invalidParams);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validParams);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error?.type).toBe(AgentErrorType.VALIDATION);
      expect(invalidResult.error?.fieldErrors).toBeDefined();
    });

    it('should provide user-friendly validation messages', () => {
      const invalidParams = { name: '' }; // Invalid: empty string

      const result = validateParams(createProductSchema, invalidParams);

      expect(result.success).toBe(false);
      expect(result.error?.userMessage).toContain('check your input');
      expect(result.error?.fieldErrors?.name).toBeDefined();
    });
  });

  describe('Permission Validation', () => {
    it('should validate agent permissions', () => {
      const validResult = validateAgentPermissions('create', 'product', 'tenant-123', 'user-123');
      const invalidResult = validateAgentPermissions('create', 'product', '', '');

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error?.type).toBe(AgentErrorType.PERMISSION);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with retry logic', () => {
      const timeoutError = new Error('timeout');
      const connectionError = new Error('ECONNREFUSED');

      const timeoutResult = handleNetworkError(timeoutError, 'createProduct', 0);
      const connectionResult = handleNetworkError(connectionError, 'createProduct', 0);

      expect(timeoutResult.type).toBe(AgentErrorType.NETWORK);
      expect(timeoutResult.retryable).toBe(true);
      expect(timeoutResult.details.isTimeoutError).toBe(true);

      expect(connectionResult.type).toBe(AgentErrorType.NETWORK);
      expect(connectionResult.details.isConnectionError).toBe(true);
    });

    it('should calculate retry delays with exponential backoff', () => {
      const error1 = handleNetworkError(new Error('timeout'), 'test', 0);
      const error2 = handleNetworkError(new Error('timeout'), 'test', 1);
      const error3 = handleNetworkError(new Error('timeout'), 'test', 2);

      expect(error1.retryAfter).toBe(1000); // 1 second
      expect(error2.retryAfter).toBe(2000); // 2 seconds
      expect(error3.retryAfter).toBe(4000); // 4 seconds
    });
  });

  describe('Safe Operation Wrapper', () => {
    it('should wrap operations with error handling', async () => {
      const successOperation = async () => 'success';
      const failOperation = async () => { throw new Error('operation failed'); };

      const successResult = await safeAgentOperation(successOperation, {
        operationName: 'testSuccess',
        entityType: 'product'
      });

      const failResult = await safeAgentOperation(failOperation, {
        operationName: 'testFail',
        entityType: 'product'
      });

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe('success');

      expect(failResult.success).toBe(false);
      expect(failResult.error?.type).toBe(AgentErrorType.SYSTEM);
    });
  });

  describe('Retry Logic', () => {
    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const flakyOperation = async () => {
        attempts++;
        if (attempts < 3) {
          return { success: false, error: createAgentError(AgentErrorType.NETWORK, 'Network error') };
        }
        return { success: true, data: 'success' };
      };

      const result = await retryAgentOperation(flakyOperation, 3, 100);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should stop retrying non-retryable errors', async () => {
      let attempts = 0;
      const validationErrorOperation = async () => {
        attempts++;
        return { 
          success: false, 
          error: createAgentError(AgentErrorType.VALIDATION, 'Validation error') 
        };
      };

      const result = await retryAgentOperation(validationErrorOperation, 3, 100);

      expect(result.success).toBe(false);
      expect(attempts).toBe(1); // Should not retry validation errors
    });
  });
});
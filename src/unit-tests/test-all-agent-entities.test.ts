/**
 * Comprehensive test for all agent entities
 * Tests the exact flow: UI -> Validation -> Agent Operations -> Database -> Response
 */

import { agentOperationsService } from '../services/agent-operations';
import { validateAgentParams } from '../lib/agent-function-tools';

describe('All Agent Entities Test', () => {
  const REAL_USER_ID = process.env.USER_ID!;
  const REAL_TENANT_ID = process.env.TENANT_ID!;

  describe('Product Operations', () => {
    it('should create product via agent', async () => {
      console.log('🧪 Testing Product Creation');
      
      const functionName = 'createProduct';
      const functionArguments = {
        name: '[AGENT TEST] Smart Lighting System',
        description: 'Intelligent lighting control system with automated scheduling'
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.createProduct(validationResult.data, REAL_TENANT_ID);
      
      console.log('✅ Product created:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
    });

    it('should update product via agent', async () => {
      console.log('🧪 Testing Product Update');
      
      // First create a product to update
      const createResult = await agentOperationsService.createProduct({
        name: 'Update Test Product',
        description: 'Product to be updated'
      }, REAL_TENANT_ID);
      
      expect(createResult.success).toBe(true);
      const productId = createResult.data.id;

      const functionName = 'updateProduct';
      const functionArguments = {
        id: productId,
        name: '[AGENT UPDATED] Updated Product Name',
        description: 'Updated description by agent'
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.updateProduct(
        validationResult.data.id,
        validationResult.data,
        REAL_TENANT_ID
      );
      
      console.log('✅ Product updated:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
    });

    it('should list products via agent', async () => {
      console.log('🧪 Testing Product List');
      
      const functionName = 'listProducts';
      const functionArguments = {};

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.listProducts(REAL_TENANT_ID);
      
      console.log('✅ Products listed:', result.data?.length, 'products');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Feature Operations', () => {
    let testInterfaceId: string;

    beforeAll(async () => {
      // Get an interface ID for feature creation
      const interfaces = await agentOperationsService.listInterfaces(REAL_TENANT_ID);
      if (interfaces.success && interfaces.data.length > 0) {
        testInterfaceId = interfaces.data[0].id;
        console.log('🔧 Using interface ID for tests:', testInterfaceId);
      }
    });

    it('should create feature via agent', async () => {
      if (!testInterfaceId) {
        console.log('⚠️ Skipping feature creation - no interface available');
        return;
      }

      console.log('🧪 Testing Feature Creation');
      
      const functionName = 'createFeature';
      const functionArguments = {
        name: '[AGENT TEST] Voice Commands',
        description: 'Voice control functionality for smart devices',
        priority: 'High' as const,
        interfaceId: testInterfaceId
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.createFeature(validationResult.data, REAL_TENANT_ID);
      
      console.log('✅ Feature created:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
      expect(result.data.priority).toBe(functionArguments.priority);
    });

    it('should update feature via agent', async () => {
      console.log('🧪 Testing Feature Update');
      
      const featureId = '40000000-0000-0000-0000-000000000003'; // Known feature ID

      const functionName = 'updateFeature';
      const functionArguments = {
        id: featureId,
        name: '[AGENT UPDATED] Enhanced Checkout',
        description: 'Updated checkout with new payment methods'
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.updateFeature(
        validationResult.data.id,
        validationResult.data,
        REAL_TENANT_ID
      );
      
      console.log('✅ Feature updated:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
    });

    it('should list features via agent', async () => {
      console.log('🧪 Testing Feature List');
      
      const functionName = 'listFeatures';
      const functionArguments = {};

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.listFeatures(REAL_TENANT_ID);
      
      console.log('✅ Features listed:', result.data?.length, 'features');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Requirement Operations', () => {
    let testFeatureId: string;

    beforeAll(async () => {
      // Get a feature ID for requirement creation
      const features = await agentOperationsService.listFeatures(REAL_TENANT_ID);
      if (features.success && features.data.length > 0) {
        testFeatureId = features.data[0].id;
        console.log('🔧 Using feature ID for tests:', testFeatureId);
      }
    });

    it('should create requirement via agent', async () => {
      if (!testFeatureId) {
        console.log('⚠️ Skipping requirement creation - no feature available');
        return;
      }

      console.log('🧪 Testing Requirement Creation');
      
      const functionName = 'createRequirement';
      const functionArguments = {
        name: '[AGENT TEST] User Authentication', // Fixed: use 'name' not 'title'
        description: 'Secure user login and authentication system',
        priority: 'High' as const,
        featureId: testFeatureId
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.createRequirement(validationResult.data, REAL_TENANT_ID);
      
      console.log('✅ Requirement created:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
      expect(result.data.priority).toBe(functionArguments.priority);
    });

    it('should list requirements via agent', async () => {
      console.log('🧪 Testing Requirement List');
      
      const functionName = 'listRequirements';
      const functionArguments = {};

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.listRequirements(REAL_TENANT_ID);
      
      console.log('✅ Requirements listed:', result.data?.length, 'requirements');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Release Operations', () => {
    let testProductId: string;

    beforeAll(async () => {
      // Get a product ID for release creation
      const products = await agentOperationsService.listProducts(REAL_TENANT_ID);
      if (products.success && products.data.length > 0) {
        testProductId = products.data[0].id;
        console.log('🔧 Using product ID for tests:', testProductId);
      }
    });

    it('should create release via agent', async () => {
      if (!testProductId) {
        console.log('⚠️ Skipping release creation - no product available');
        return;
      }

      console.log('🧪 Testing Release Creation');
      
      const functionName = 'createRelease';
      const functionArguments = {
        name: '[AGENT TEST] v2.1.0',
        description: 'Major feature release with voice controls',
        version: '2.1.0',
        targetDate: '2024-06-01',
        productId: testProductId
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.createRelease(validationResult.data, REAL_TENANT_ID);
      
      console.log('✅ Release created:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
      expect(result.data.version).toBe(functionArguments.version);
    });

    it('should list releases via agent', async () => {
      console.log('🧪 Testing Release List');
      
      const functionName = 'listReleases';
      const functionArguments = {};

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.listReleases(REAL_TENANT_ID);
      
      console.log('✅ Releases listed:', result.data?.length, 'releases');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Roadmap Operations', () => {
    let testProductId: string;

    beforeAll(async () => {
      // Get a product ID for roadmap creation
      const products = await agentOperationsService.listProducts(REAL_TENANT_ID);
      if (products.success && products.data.length > 0) {
        testProductId = products.data[0].id;
        console.log('🔧 Using product ID for tests:', testProductId);
      }
    });

    it('should create roadmap via agent', async () => {
      if (!testProductId) {
        console.log('⚠️ Skipping roadmap creation - no product available');
        return;
      }

      console.log('🧪 Testing Roadmap Creation');
      
      const functionName = 'createRoadmap';
      const functionArguments = {
        name: '[AGENT TEST] Q2 2024 Roadmap',
        description: 'Second quarter development roadmap',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        productId: testProductId
      };

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.createRoadmap(validationResult.data, REAL_TENANT_ID);
      
      console.log('✅ Roadmap created:', result.data?.name);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(functionArguments.name);
    });

    it('should list roadmaps via agent', async () => {
      console.log('🧪 Testing Roadmap List');
      
      const functionName = 'listRoadmaps';
      const functionArguments = {};

      const validationResult = validateAgentParams(functionName, functionArguments);
      expect(validationResult.success).toBe(true);

      const result = await agentOperationsService.listRoadmaps(REAL_TENANT_ID);
      
      console.log('✅ Roadmaps listed:', result.data?.length, 'roadmaps');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle missing required fields', async () => {
      console.log('🧪 Testing Validation Errors');
      
      const testCases = [
        { functionName: 'createProduct', args: { description: 'Missing name' } },
        { functionName: 'updateProduct', args: { name: 'Missing ID' } },
        { functionName: 'createFeature', args: { description: 'Missing name and interfaceId' } },
        { functionName: 'createRequirement', args: { description: 'Missing title and featureId' } },
      ];

      for (const testCase of testCases) {
        console.log(`🔍 Testing ${testCase.functionName} validation error`);
        
        const validationResult = validateAgentParams(testCase.functionName, testCase.args);
        
        expect(validationResult.success).toBe(false);
        expect(validationResult.error).toBeDefined();
        expect(validationResult.error.type).toBe('validation');
        
        console.log(`✅ ${testCase.functionName} correctly failed validation`);
      }
    });
  });

  describe('Function Tool Coverage', () => {
    it('should have all required function tools available', async () => {
      console.log('🧪 Testing Function Tool Coverage');
      
      const expectedFunctions = [
        'createProduct', 'updateProduct', 'deleteProduct', 'listProducts', 'listProduct',
        'createFeature', 'updateFeature', 'deleteFeature', 'listFeatures',
        'createRequirement', 'updateRequirement', 'deleteRequirement', 'listRequirements',
        'createRelease', 'updateRelease', 'deleteRelease', 'listReleases',
        'createRoadmap', 'updateRoadmap', 'deleteRoadmap', 'listRoadmaps',
      ];

      for (const functionName of expectedFunctions) {
        // Test that validation schema exists (empty args should either pass for list functions or fail with specific errors)
        const validationResult = validateAgentParams(functionName, {});
        
        if (functionName.startsWith('list')) {
          // List functions should pass with empty args
          expect(validationResult.success).toBe(true);
          console.log(`✅ ${functionName} validation schema exists (list function)`);
        } else {
          // Create/Update functions should fail with validation errors (not unknown function)
          expect(validationResult.success).toBe(false);
          expect(validationResult.error.type).toBe('validation');
          expect(validationResult.error.message).not.toContain('Unknown function');
          console.log(`✅ ${functionName} validation schema exists (CRUD function)`);
        }
      }
    });
  });
});
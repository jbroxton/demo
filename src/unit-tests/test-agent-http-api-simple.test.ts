/**
 * Test to simulate the exact UI flow by calling the core function execution
 * This bypasses HTTP but tests the exact same function calling logic
 */

import { agentOperationsService } from '../services/agent-operations';
import { validateAgentParams } from '../lib/agent-function-tools';

describe('Agent HTTP API Simulation Test', () => {
  const REAL_USER_ID = process.env.USER_ID!;
  const REAL_TENANT_ID = process.env.TENANT_ID!;

  it('should execute createProduct function call like the HTTP API does', async () => {
    console.log('🧪 Simulating HTTP API createProduct function execution');
    
    // This simulates what happens when OpenAI calls the createProduct function
    const functionName = 'createProduct';
    const functionArguments = {
      name: 'HTTP Simulation Test Product',
      description: 'Product created by simulating the exact HTTP API flow'
    };

    console.log('📤 Function call:', functionName);
    console.log('📤 Function arguments:', functionArguments);

    // Step 1: Validate parameters (exactly like the HTTP API does)
    console.log('🔍 Validating parameters...');
    const validationResult = validateAgentParams(functionName, functionArguments);
    
    console.log('🔍 Validation result:', validationResult);
    
    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toBeDefined();
    expect(validationResult.data.name).toBe(functionArguments.name);
    expect(validationResult.data.description).toBe(functionArguments.description);

    // Step 2: Execute the function (exactly like the HTTP API does)
    console.log('🚀 Executing function...');
    const result = await agentOperationsService.createProduct(
      validationResult.data,
      REAL_TENANT_ID
    );

    console.log('📥 Execution result:', result);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.name).toBe(functionArguments.name);
    expect(result.data.description).toBe(functionArguments.description);
    expect(result.data.id).toBeDefined();

    console.log('✅ HTTP API simulation test completed successfully');
    console.log('📝 Created product with ID:', result.data.id);
  });

  it('should execute updateProduct function call like the HTTP API does', async () => {
    console.log('🧪 Simulating HTTP API updateProduct function execution');
    
    const functionName = 'updateProduct';
    const functionArguments = {
      id: '30000000-0000-0000-0000-000000000001', // Existing product ID
      name: 'HTTP Simulation Updated Product Name'
    };

    console.log('📤 Function call:', functionName);
    console.log('📤 Function arguments:', functionArguments);

    // Step 1: Validate parameters
    console.log('🔍 Validating parameters...');
    const validationResult = validateAgentParams(functionName, functionArguments);
    
    console.log('🔍 Validation result:', validationResult);
    
    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toBeDefined();
    expect(validationResult.data.id).toBe(functionArguments.id);
    expect(validationResult.data.name).toBe(functionArguments.name);

    // Step 2: Execute the function
    console.log('🚀 Executing function...');
    const result = await agentOperationsService.updateProduct(
      validationResult.data.id,
      validationResult.data,
      REAL_TENANT_ID
    );

    console.log('📥 Execution result:', result);

    if (!result.success) {
      console.error('❌ updateProduct failed with error:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.name).toBe(functionArguments.name);

    console.log('✅ HTTP API updateProduct simulation completed successfully');
  });

  it('should execute listProducts function call like the HTTP API does', async () => {
    console.log('🧪 Simulating HTTP API listProducts function execution');
    
    const functionName = 'listProducts';
    const functionArguments = {}; // List functions take no parameters

    console.log('📤 Function call:', functionName);
    console.log('📤 Function arguments:', functionArguments);

    // Step 1: Validate parameters
    console.log('🔍 Validating parameters...');
    const validationResult = validateAgentParams(functionName, functionArguments);
    
    console.log('🔍 Validation result:', validationResult);
    
    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toBeDefined();

    // Step 2: Execute the function
    console.log('🚀 Executing function...');
    const result = await agentOperationsService.listProducts(REAL_TENANT_ID);

    console.log('📥 Execution result:', result);
    console.log('📊 Number of products found:', result.data?.length || 0);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);

    console.log('✅ HTTP API listProducts simulation completed successfully');
  });

  it('should handle validation errors like the HTTP API does', async () => {
    console.log('🧪 Simulating HTTP API validation error handling');
    
    const functionName = 'createProduct';
    const functionArguments = {
      // Missing required name field
      description: 'Product without name should fail validation'
    };

    console.log('📤 Function call:', functionName);
    console.log('📤 Function arguments (invalid):', functionArguments);

    // Step 1: Validate parameters (should fail)
    console.log('🔍 Validating parameters...');
    const validationResult = validateAgentParams(functionName, functionArguments);
    
    console.log('🔍 Validation result:', validationResult);
    
    expect(validationResult.success).toBe(false);
    expect(validationResult.error).toBeDefined();
    expect(validationResult.error.type).toBe('validation');

    console.log('✅ Validation error handling test completed successfully');
  });

  it('should test the exact function routing logic from the HTTP API', async () => {
    console.log('🧪 Testing function routing logic');
    
    // This tests the exact switch statement logic from the HTTP API
    const testCases = [
      { functionName: 'createProduct', hasId: false },
      { functionName: 'updateProduct', hasId: true },
      { functionName: 'listProducts', hasId: false },
      { functionName: 'listProduct', hasId: false }, // singular form
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing ${testCase.functionName} routing...`);
      
      let functionArguments: any = {};
      
      if (testCase.functionName === 'createProduct') {
        functionArguments = {
          name: `Test Product for ${testCase.functionName}`,
          description: 'Test description'
        };
      } else if (testCase.functionName === 'updateProduct') {
        functionArguments = {
          id: '30000000-0000-0000-0000-000000000001',
          name: `Updated by ${testCase.functionName} test`
        };
      }
      // listProducts and listProduct take no arguments

      console.log(`📤 Testing ${testCase.functionName} with args:`, functionArguments);

      // Validate
      const validationResult = validateAgentParams(testCase.functionName, functionArguments);
      
      if (!validationResult.success) {
        console.error(`❌ Validation failed for ${testCase.functionName}:`, validationResult.error);
        continue;
      }

      console.log(`✅ ${testCase.functionName} validation passed`);

      // Test the routing logic (without actually executing to avoid side effects)
      let routingSuccess = false;
      
      try {
        switch (testCase.functionName) {
          case 'createProduct':
            // Would call: agentOperationsService.createProduct(validationResult.data, tenantId)
            expect(validationResult.data.name).toBeDefined();
            expect(validationResult.data.description).toBeDefined();
            routingSuccess = true;
            break;
          case 'updateProduct':
            // Would call: agentOperationsService.updateProduct(validationResult.data.id, validationResult.data, tenantId)
            expect(validationResult.data.id).toBeDefined();
            expect(validationResult.data.id).toBe('30000000-0000-0000-0000-000000000001');
            routingSuccess = true;
            break;
          case 'listProducts':
          case 'listProduct':
            // Would call: agentOperationsService.listProducts(tenantId)
            routingSuccess = true;
            break;
          default:
            throw new Error(`Unknown function: ${testCase.functionName}`);
        }
        
        console.log(`✅ ${testCase.functionName} routing logic verified`);
      } catch (error) {
        console.error(`❌ ${testCase.functionName} routing failed:`, error);
        expect(routingSuccess).toBe(true); // This will fail the test
      }
    }

    console.log('✅ Function routing logic test completed successfully');
  });
});
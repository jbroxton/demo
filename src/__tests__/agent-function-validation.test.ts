/**
 * Agent Function Validation Test
 * Tests the function validation and execution logic that the UI uses
 */

import { 
  validateAgentParams,
  getAllAgentFunctionTools 
} from '@/lib/agent-function-tools';
import { AgentOperationsService } from '@/services/agent-operations';

describe('Agent Function Validation & Execution', () => {
  const agentOps = new AgentOperationsService();
  const testTenantId = '22222222-2222-2222-2222-222222222222';
  const testFeatureId = '40000000-0000-0000-0000-000000000001';

  it('should validate createRelease parameters correctly', () => {
    console.log('📋 Testing createRelease validation...');
    
    // Valid parameters
    const validParams = {
      name: 'Test Release v1.0',
      description: 'Test description',
      targetDate: '2024-08-15',
      priority: 'High',
      featureId: testFeatureId
    };

    const validResult = validateAgentParams('createRelease', validParams);
    console.log('Valid params result:', validResult);
    
    expect(validResult.success).toBe(true);
    expect(validResult.data).toEqual(validParams);
    
    // Invalid parameters - missing required fields
    const invalidParams = {
      name: 'Test Release',
      // Missing targetDate and featureId
    };

    const invalidResult = validateAgentParams('createRelease', invalidParams);
    console.log('Invalid params result:', invalidResult);
    
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBeDefined();
    
    console.log('✅ CreateRelease validation working correctly');
  });

  it('should validate updateRelease parameters correctly', () => {
    console.log('✏️ Testing updateRelease validation...');
    
    // Valid update parameters
    const validUpdateParams = {
      id: 'test-release-id',
      name: 'Updated Release Name',
      targetDate: '2024-09-01',
      priority: 'Med'
    };

    const validResult = validateAgentParams('updateRelease', validUpdateParams);
    console.log('Valid update params result:', validResult);
    
    expect(validResult.success).toBe(true);
    expect(validResult.data).toEqual(validUpdateParams);
    
    // Invalid parameters - missing required ID
    const invalidParams = {
      name: 'Updated Release',
      // Missing id
    };

    const invalidResult = validateAgentParams('updateRelease', invalidParams);
    console.log('Invalid update params result:', invalidResult);
    
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBeDefined();
    
    console.log('✅ UpdateRelease validation working correctly');
  });

  it('should have correct function tool definitions', () => {
    console.log('🔧 Testing function tool definitions...');
    
    const allTools = getAllAgentFunctionTools();
    console.log(`Found ${allTools.length} function tools`);
    
    // Find release-related tools
    const createReleaseTool = allTools.find(tool => tool.function.name === 'createRelease');
    const updateReleaseTool = allTools.find(tool => tool.function.name === 'updateRelease');
    
    expect(createReleaseTool).toBeDefined();
    expect(updateReleaseTool).toBeDefined();
    
    console.log('CreateRelease tool:', JSON.stringify(createReleaseTool, null, 2));
    console.log('UpdateRelease tool:', JSON.stringify(updateReleaseTool, null, 2));
    
    // Check that createRelease has correct required fields
    expect(createReleaseTool!.function.parameters.required).toContain('name');
    expect(createReleaseTool!.function.parameters.required).toContain('targetDate');
    expect(createReleaseTool!.function.parameters.required).toContain('featureId');
    
    // Check that updateRelease has correct required fields
    expect(updateReleaseTool!.function.parameters.required).toContain('id');
    
    console.log('✅ Function tool definitions are correct');
  });

  it('should execute createRelease through service', async () => {
    console.log('🚀 Testing createRelease execution...');
    
    const createParams = {
      name: '[VALIDATION TEST] Release',
      description: 'Testing through validation layer',
      targetDate: '2024-10-01',
      priority: 'Med' as const,
      featureId: testFeatureId
    };

    const result = await agentOps.createRelease(createParams, testTenantId);
    console.log('Create result:', result);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.name).toBe(createParams.name);
    
    // Clean up
    if (result.success && result.data) {
      await agentOps.deleteRelease(result.data.id, testTenantId);
      console.log('✅ Cleaned up test release');
    }
    
    console.log('✅ CreateRelease execution working correctly');
  });

  it('should simulate complete UI function calling workflow', async () => {
    console.log('🔄 Simulating complete UI workflow...');
    
    // Step 1: Validate parameters (as UI would do)
    const functionName = 'createRelease';
    const parameters = {
      name: '[UI SIMULATION] Test Release',
      description: 'Simulating UI function call',
      targetDate: '2024-11-15',
      priority: 'High',
      featureId: testFeatureId
    };

    console.log('Step 1: Validating parameters...');
    const validationResult = validateAgentParams(functionName, parameters);
    expect(validationResult.success).toBe(true);
    console.log('✅ Parameters validated');

    // Step 2: Execute function (as API route would do)
    console.log('Step 2: Executing function...');
    const executionResult = await agentOps.createRelease(validationResult.data!, testTenantId);
    expect(executionResult.success).toBe(true);
    console.log('✅ Function executed successfully');

    // Step 3: Format response (as UI would receive)
    const uiResponse = {
      success: executionResult.success,
      data: executionResult.data,
      message: executionResult.success 
        ? `Successfully created release: ${executionResult.data!.name}`
        : `Failed to create release: ${executionResult.error}`
    };

    console.log('Step 3: UI Response:', uiResponse);
    expect(uiResponse.success).toBe(true);
    expect(uiResponse.message).toContain('Successfully created');

    // Clean up
    if (executionResult.success && executionResult.data) {
      await agentOps.deleteRelease(executionResult.data.id, testTenantId);
      console.log('✅ Cleaned up test release');
    }

    console.log('🎉 Complete UI workflow simulation successful!');
  });
});
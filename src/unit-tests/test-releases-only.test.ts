/**
 * Focused test for releases to diagnose and fix issues
 */

import { agentOperationsService } from '../services/agent-operations';
import { validateAgentParams } from '../lib/agent-function-tools';

describe('Releases Only Test', () => {
  const REAL_TENANT_ID = process.env.TENANT_ID!;

  it('should debug release creation step by step', async () => {
    console.log('🔍 DEBUGGING RELEASE CREATION STEP BY STEP');
    
    // Get a product ID for release creation
    const products = await agentOperationsService.listProducts(REAL_TENANT_ID);
    if (!products.success || products.data.length === 0) {
      console.log('❌ No products available for release test');
      return;
    }
    
    const testProductId = products.data[0].id;
    console.log('🔧 Using product ID:', testProductId);

    const functionName = 'createRelease';
    const functionArguments = {
      name: '[AGENT TEST] v2.1.0',
      description: 'Major feature release with voice controls',
      version: '2.1.0',
      targetDate: '2024-06-01',
      productId: testProductId
    };

    console.log('Step 1: Function arguments:', functionArguments);

    // Step 1: Validate
    const validationResult = validateAgentParams(functionName, functionArguments);
    console.log('Step 2: Validation result:', JSON.stringify(validationResult, null, 2));
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return;
    }

    console.log('Step 3: About to call createRelease with validated data:', validationResult.data);

    // Step 2: Execute
    try {
      const result = await agentOperationsService.createRelease(
        validationResult.data,
        REAL_TENANT_ID
      );

      console.log('Step 4: Result:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('❌ createRelease failed with error:', result.error);
        console.error('❌ Error details:', JSON.stringify(result.error, null, 2));
      } else {
        console.log('✅ createRelease succeeded');
        console.log('✅ Created release:', result.data);
      }

    } catch (error) {
      console.error('❌ Exception during createRelease:', error);
    }
  });

  it('should test release update', async () => {
    console.log('🔍 TESTING RELEASE UPDATE');
    
    // First create a release to update
    const products = await agentOperationsService.listProducts(REAL_TENANT_ID);
    if (!products.success || products.data.length === 0) {
      console.log('❌ No products available');
      return;
    }
    
    const testProductId = products.data[0].id;
    
    // Create a release first
    const createResult = await agentOperationsService.createRelease({
      name: 'Update Test Release',
      description: 'Release to be updated',
      version: '1.0.0',
      targetDate: '2024-05-01',
      productId: testProductId
    }, REAL_TENANT_ID);
    
    if (!createResult.success) {
      console.log('❌ Could not create release for update test:', createResult.error);
      return;
    }
    
    console.log('✅ Created release for update test:', createResult.data.id);
    
    const functionName = 'updateRelease';
    const functionArguments = {
      id: createResult.data.id,
      name: '[AGENT UPDATED] Updated Release Name',
      version: '1.1.0'
    };

    const validationResult = validateAgentParams(functionName, functionArguments);
    console.log('Update validation result:', validationResult);
    
    if (!validationResult.success) {
      console.error('❌ Update validation failed:', validationResult.error);
      return;
    }

    const result = await agentOperationsService.updateRelease(
      validationResult.data.id,
      validationResult.data,
      REAL_TENANT_ID
    );

    console.log('Update result:', result);
    
    if (result.success) {
      console.log('✅ Release update succeeded');
    } else {
      console.error('❌ Release update failed:', result.error);
    }
  });
});
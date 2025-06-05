/**
 * Simple test to verify AI chat now uses pages API instead of legacy features API
 * This directly tests the agent operations service
 */

// This test verifies the implementation change
async function testAIFeaturesQuery() {
  console.log('🧪 Testing AI Features Query - Pages vs Legacy');
  
  try {
    // Import the agent operations service instance
    const { agentOperationsService } = await import('./src/services/agent-operations.ts');
    
    // Use the singleton instance
    const agentOps = agentOperationsService;
    
    // Test tenant ID (using existing test tenant)
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    console.log('📊 Calling listFeatures with test tenant...');
    
    // Call the listFeatures function (now should use pages API)
    const result = await agentOps.listFeatures(testTenantId);
    
    if (!result.success) {
      console.error('❌ listFeatures failed:', result.error);
      return;
    }
    
    const features = result.data;
    console.log(`✅ Success! Found ${features.length} features`);
    
    // Verify these are Page objects, not Feature objects
    if (features.length > 0) {
      const firstFeature = features[0];
      console.log('📝 First feature structure:');
      console.log('- ID:', firstFeature.id);
      console.log('- Type:', firstFeature.type);
      console.log('- Title:', firstFeature.title);
      console.log('- Has properties:', !!firstFeature.properties);
      console.log('- Has blocks:', !!firstFeature.blocks);
      console.log('- Has tenant_id:', !!firstFeature.tenant_id);
      
      // Verify this is a Page object (has type, properties, blocks)
      if (firstFeature.type === 'feature' && firstFeature.properties && firstFeature.blocks !== undefined) {
        console.log('✅ CONFIRMED: Using Page objects (not legacy Feature objects)');
        console.log(`📈 Expected count from pages table: ~127, Actual: ${features.length}`);
        
        if (features.length > 100) {
          console.log('🎉 SUCCESS: AI is now querying pages table instead of legacy features!');
        } else {
          console.log('⚠️  Warning: Count seems low, may still be using legacy API');
        }
      } else {
        console.log('❌ FAILURE: Still returning legacy Feature objects');
      }
    } else {
      console.log('ℹ️  No features found for this tenant');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAIFeaturesQuery();
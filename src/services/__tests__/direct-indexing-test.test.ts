/**
 * Test indexing function directly with real data
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { indexFeature } from '@/services/ai-service';
import { supabase } from '@/services/supabase';

const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('Direct Indexing Test', () => {
  let testFeature: any = null;

  beforeAll(async () => {
    // Get a real feature from the database
    const { data: features, error } = await supabase
      .from('features')
      .select('*')
      .eq('tenant_id', realTenantId)
      .limit(1);
      
    if (!error && features && features.length > 0) {
      testFeature = features[0];
      console.log(`✅ Found test feature: ${testFeature.name} (ID: ${testFeature.id})`);
    } else {
      console.log('⚠️  No features found for testing');
    }
  });

  test('should index a real feature successfully', async () => {
    if (!testFeature) {
      console.log('⏭️  Skipping test - no test feature available');
      return;
    }

    console.log('🧪 Testing indexFeature function...');
    console.log(`🔄 Attempting to index feature: ${testFeature.name}`);
    
    try {
      const result = await indexFeature(testFeature, realTenantId);
      
      console.log('✅ Indexing successful!');
      console.log(`📊 Result ID: ${result.id}`);
      console.log(`🎯 Entity type: ${result.entity_type}`);
      console.log(`📝 Content length: ${result.content?.length}`);
      console.log(`🧮 Embedding length: ${result.embedding?.length}`);
      
      expect(result).toBeDefined();
      expect(result.entity_type).toBe('feature');
      expect(result.entity_id).toBe(testFeature.id);
      expect(result.tenant_id).toBe(realTenantId);
      expect(result.embedding).toHaveLength(1536);
      expect(result.content).toContain(testFeature.name);
      
      // Verify it was stored in database
      const { data: verification, error: verifyError } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', testFeature.id);
        
      if (verifyError) {
        console.error('❌ Error verifying storage:', verifyError);
        expect(verifyError).toBeNull();
      } else {
        console.log(`✅ Verification: ${verification?.length || 0} embeddings found for this feature`);
        expect(verification?.length).toBeGreaterThan(0);
      }
      
    } catch (error) {
      console.error('💥 Error during indexing:', error);
      throw error;
    }
  });

  test('should check what features are available for indexing', async () => {
    console.log('🔍 Checking features available for indexing...');
    
    const { data: features, error } = await supabase
      .from('features')
      .select('id, name, description, priority')
      .eq('tenant_id', realTenantId)
      .limit(5);
      
    if (error) {
      console.error('❌ Error querying features:', error);
      expect(error).toBeNull();
    } else {
      console.log(`📋 Features found: ${features?.length || 0}`);
      if (features && features.length > 0) {
        console.log('   Available features:');
        features.forEach((f, idx) => {
          console.log(`     ${idx + 1}. ${f.name} (ID: ${f.id})`);
          console.log(`        Priority: ${f.priority || 'Not set'}`);
          console.log(`        Description: ${f.description?.substring(0, 50) || 'No description'}...`);
        });
      }
      expect(features).toBeDefined();
    }
  });

  // Cleanup after test
  afterEach(async () => {
    if (testFeature) {
      try {
        await supabase
          .from('ai_embeddings')
          .delete()
          .eq('entity_id', testFeature.id);
        console.log('🧹 Cleaned up test embeddings');
      } catch (error) {
        console.warn('⚠️  Cleanup warning:', error);
      }
    }
  });
});
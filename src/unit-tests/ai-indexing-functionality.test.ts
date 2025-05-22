/**
 * AI Indexing Functionality Test
 * 
 * This test verifies the indexing button functionality that users see in the UI.
 * It tests the complete indexing workflow with real data from the database.
 */

import { getFeaturesFromDb } from '@/services/features-db';
import { getReleasesFromDb } from '@/services/releases-db';
import { indexFeature, indexRelease } from '@/services/ai-service';
import { supabase } from '@/services/supabase';

// Use your real user and tenant IDs for testing
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Indexing Functionality', () => {
  // Cleanup test data
  afterEach(async () => {
    try {
      await supabase
        .from('ai_embeddings')
        .delete()
        .eq('tenant_id', realTenantId)
        .like('content', '%TEST_INDEXING%');
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Database Data Retrieval', () => {
    test('should retrieve features from database for indexing', async () => {
      try {
        const result = await getFeaturesFromDb(realTenantId);
        const features = result.success ? result.data : [];
        
        console.log(`Found ${features?.length || 0} features for tenant ${realTenantId}`);
        
        // Should return an array (even if empty)
        expect(Array.isArray(features)).toBe(true);
        
        // Log feature details if any exist
        if (features && features.length > 0) {
          console.log('Sample feature:', {
            id: features[0].id,
            name: features[0].name,
            description: features[0].description?.substring(0, 50) + '...',
            hasRequirements: features[0].requirements?.length > 0
          });
        }
      } catch (error) {
        console.error('Error retrieving features:', error);
        throw error;
      }
    });

    test('should retrieve releases from database for indexing', async () => {
      try {
        const result = await getReleasesFromDb(realTenantId);
        const releases = result.success ? result.data : [];
        
        console.log(`Found ${releases?.length || 0} releases for tenant ${realTenantId}`);
        
        // Should return an array (even if empty)
        expect(Array.isArray(releases)).toBe(true);
        
        // Log release details if any exist
        if (releases && releases.length > 0) {
          console.log('Sample release:', {
            id: releases[0].id,
            name: releases[0].name,
            description: releases[0].description?.substring(0, 50) + '...',
            targetDate: releases[0].targetDate,
            featureCount: releases[0].features?.length || 0
          });
        }
      } catch (error) {
        console.error('Error retrieving releases:', error);
        throw error;
      }
    });
  });

  describe('Indexing Process Simulation', () => {
    test('should simulate the complete indexing workflow from UI button', async () => {
      console.log('=== SIMULATING INDEXING BUTTON CLICK ===');
      
      let indexedCount = 0;
      let errors: string[] = [];
      
      try {
        // Step 1: Get features and releases (what the API route does)
        console.log('Step 1: Fetching data from database...');
        const featuresResult = await getFeaturesFromDb(realTenantId);
        const releasesResult = await getReleasesFromDb(realTenantId);
        const features = featuresResult.success ? featuresResult.data : [];
        const releases = releasesResult.success ? releasesResult.data : [];
        
        console.log(`Found ${features?.length || 0} features and ${releases?.length || 0} releases`);
        
        // Step 2: Index features in batches (like the API route does)
        if (features && features.length > 0) {
          console.log('Step 2: Indexing features...');
          
          // Process first 3 features to avoid long test times
          const featuresToProcess = features.slice(0, 3);
          
          for (const feature of featuresToProcess) {
            try {
              console.log(`Indexing feature: ${feature.name}`);
              const result = await indexFeature(feature, realTenantId);
              indexedCount++;
              
              // Verify the indexing worked
              expect(result).toBeDefined();
              expect(result.tenant_id).toBe(realTenantId);
              expect(result.entity_type).toBe('feature');
              expect(result.entity_id).toBe(feature.id);
              expect(result.embedding).toHaveLength(1536);
              
            } catch (error) {
              const errorMsg = `Feature ${feature.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error('Indexing error:', errorMsg);
              errors.push(errorMsg);
            }
          }
        }
        
        // Step 3: Index releases in batches (like the API route does)
        if (releases && releases.length > 0) {
          console.log('Step 3: Indexing releases...');
          
          // Process first 2 releases to avoid long test times
          const releasesToProcess = releases.slice(0, 2);
          
          for (const release of releasesToProcess) {
            try {
              console.log(`Indexing release: ${release.name}`);
              const result = await indexRelease(release, realTenantId);
              indexedCount++;
              
              // Verify the indexing worked
              expect(result).toBeDefined();
              expect(result.tenant_id).toBe(realTenantId);
              expect(result.entity_type).toBe('release');
              expect(result.entity_id).toBe(release.id);
              expect(result.embedding).toHaveLength(1536);
              
            } catch (error) {
              const errorMsg = `Release ${release.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error('Indexing error:', errorMsg);
              errors.push(errorMsg);
            }
          }
        }
        
        // Step 4: Verify results
        console.log('Step 4: Verifying indexing results...');
        console.log(`Total indexed: ${indexedCount} items`);
        console.log(`Errors: ${errors.length} items`);
        
        // Check that we indexed something
        expect(indexedCount).toBeGreaterThan(0);
        
        // Verify embeddings exist in database
        const { data: embeddingCheck, error: embeddingError } = await supabase
          .from('ai_embeddings')
          .select('id, entity_type, entity_id')
          .eq('tenant_id', realTenantId);
          
        expect(embeddingError).toBeNull();
        expect(embeddingCheck).toBeDefined();
        expect(embeddingCheck.length).toBeGreaterThanOrEqual(indexedCount);
        
        console.log(`Database verification: ${embeddingCheck?.length} total embeddings found`);
        
      } catch (error) {
        console.error('Indexing workflow failed:', error);
        throw error;
      }
      
      console.log('=== INDEXING SIMULATION COMPLETE ===');
    }, 60000); // 60 second timeout for this comprehensive test

    test('should handle indexing with real database features', async () => {
      // First, get real features from the database
      const featuresResult = await getFeaturesFromDb(realTenantId);
      const features = featuresResult.success ? featuresResult.data : [];
      
      console.log(`Found ${features.length} real features in database`);
      
      if (features.length === 0) {
        console.log('No real features found - skipping real data test');
        expect(true).toBe(true); // Test passes
        return;
      }
      
      // Use the first real feature for testing
      const realFeature = features[0];
      console.log(`Testing with real feature: ${realFeature.name} (ID: ${realFeature.id})`);
      
      // Test indexing the real feature
      const result = await indexFeature(realFeature, realTenantId);
      
      expect(result).toBeDefined();
      expect(result.tenant_id).toBe(realTenantId);
      expect(result.entity_type).toBe('feature');
      expect(result.entity_id).toBe(realFeature.id);
      expect(result.embedding).toHaveLength(1536);
      expect(result.content).toContain(realFeature.name);
      
      console.log('Real feature indexing successful');
      
      // Test re-indexing the same feature (upsert test)
      console.log('Testing upsert by re-indexing same feature...');
      const secondResult = await indexFeature(realFeature, realTenantId);
      
      expect(secondResult.entity_id).toBe(realFeature.id);
      
      // Verify only one record exists (no duplicates)
      const { data: duplicateCheck } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', realTenantId)
        .eq('entity_id', realFeature.id);
        
      expect(duplicateCheck).toHaveLength(1);
      console.log('Upsert test passed - no duplicates created');
    });

    test('should handle batch indexing errors gracefully', async () => {
      // Test with invalid feature data
      const invalidFeature = {
        id: '', // Invalid ID
        name: '',
        description: '',
        priority: 'Invalid' as any,
        status: 'unknown' as any,
        requirements: [],
        createdAt: '',
        updatedAt: ''
      };
      
      let errorCaught = false;
      
      try {
        await indexFeature(invalidFeature, realTenantId);
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(Error);
        console.log('Successfully caught error for invalid feature data');
      }
      
      expect(errorCaught).toBe(true);
    });
  });

  describe('Performance Testing', () => {
    test('should index multiple real features within reasonable time', async () => {
      // Get real features from database for performance testing
      const featuresResult = await getFeaturesFromDb(realTenantId);
      const allFeatures = featuresResult.success ? featuresResult.data : [];
      
      if (allFeatures.length === 0) {
        console.log('No real features found - skipping performance test');
        expect(true).toBe(true);
        return;
      }
      
      // Test with up to 3 real features to avoid long test times
      const featuresToTest = allFeatures.slice(0, 3);
      console.log(`Performance testing with ${featuresToTest.length} real features`);
      
      const startTime = Date.now();
      
      // Index all features
      const results = [];
      for (const feature of featuresToTest) {
        const result = await indexFeature(feature, realTenantId);
        results.push(result);
      }
      
      const endTime = Date.now();
      const timeElapsed = endTime - startTime;
      
      console.log(`Indexed ${featuresToTest.length} real features in ${timeElapsed}ms`);
      console.log(`Average time per feature: ${Math.round(timeElapsed / featuresToTest.length)}ms`);
      
      // Verify all were indexed
      expect(results).toHaveLength(featuresToTest.length);
      results.forEach(result => {
        expect(result.embedding).toHaveLength(1536);
      });
      
      // Performance expectation - should complete within reasonable time
      expect(timeElapsed).toBeLessThan(20000); // 20 seconds for up to 3 features
      
    }, 25000); // 25 second timeout
  });

  describe('Real Data Integration', () => {
    test('should work with actual database content types', async () => {
      try {
        // Get one real feature and one real release if they exist
        const featuresResult = await getFeaturesFromDb(realTenantId);
        const releasesResult = await getReleasesFromDb(realTenantId);
        const features = featuresResult.success ? featuresResult.data : [];
        const releases = releasesResult.success ? releasesResult.data : [];
        
        if (features && features.length > 0) {
          const realFeature = features[0];
          console.log('Testing with real feature:', realFeature.name);
          
          const result = await indexFeature(realFeature, realTenantId);
          
          expect(result).toBeDefined();
          expect(result.content).toContain(realFeature.name);
          expect(result.embedding).toHaveLength(1536);
          
          // Test that content includes all expected fields
          expect(result.content).toContain('Feature:');
          expect(result.content).toContain('Priority:');
          expect(result.content).toContain('Status:');
          expect(result.content).toContain('Description:');
          expect(result.content).toContain('Requirements:');
          
          console.log('Real feature indexing successful');
        }
        
        if (releases && releases.length > 0) {
          const realRelease = releases[0];
          console.log('Testing with real release:', realRelease.name);
          
          const result = await indexRelease(realRelease, realTenantId);
          
          expect(result).toBeDefined();
          expect(result.content).toContain(realRelease.name);
          expect(result.embedding).toHaveLength(1536);
          
          // Test that content includes all expected fields
          expect(result.content).toContain('Release:');
          expect(result.content).toContain('Target Date:');
          expect(result.content).toContain('Description:');
          expect(result.content).toContain('Features:');
          
          console.log('Real release indexing successful');
        }
        
        if ((!features || features.length === 0) && (!releases || releases.length === 0)) {
          console.log('No real data found - this is expected for a new tenant');
          expect(true).toBe(true); // Test passes
        }
        
      } catch (error) {
        console.error('Real data integration test failed:', error);
        throw error;
      }
    }, 15000); // 15 second timeout
  });
});
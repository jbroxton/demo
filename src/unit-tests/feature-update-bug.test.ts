/**
 * Test for Feature Update Bug
 * Testing the specific issue where updating a feature does not work
 */

import { updateFeatureInDb, getFeatureFromDb } from '../services/features-db';

// Use real test data from env.local
const REAL_USER_ID = process.env.USER_ID!;
const REAL_TENANT_ID = process.env.TENANT_ID!;

describe('Feature Update Bug Investigation', () => {
  let testFeatureId: string;

  beforeAll(async () => {
    // Find an existing feature to test with
    // Look for "AR Product Review" feature
    try {
      // We'll need to find this feature ID from the database
      // For now, let's use a placeholder and update it with actual ID if found
      testFeatureId = 'feature-test-id';
    } catch (error) {
      console.log('Could not find test feature, will skip tests requiring existing feature');
    }
  });

  describe('Feature Update Functionality', () => {
    it('should successfully update a feature name', async () => {
      const originalName = 'AR Product Review';
      const updatedName = '[test] AR Product Review';

      // First, let's try to find the feature by name
      // Since we don't have a getFeatureByName function, we'll need to check if the feature exists
      
      const updateParams = {
        name: updatedName,
        description: 'Updated description for testing',
        priority: 'High' as const,
        // Include tenant context
        tenant_id: REAL_TENANT_ID,
        updated_by: REAL_USER_ID,
        updated_at: new Date().toISOString()
      };

      // Skip if we don't have a real feature ID
      if (!testFeatureId || testFeatureId === 'feature-test-id') {
        console.log('Skipping test - no valid feature ID found');
        return;
      }

      const result = await updateFeatureInDb(testFeatureId, updateParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe(updatedName);
      } else {
        console.error('Update failed:', result.error);
        fail(`Feature update failed: ${result.error}`);
      }
    });

    it('should validate required fields when updating feature', async () => {
      const invalidParams = {
        name: '', // Empty name should fail validation
        tenant_id: REAL_TENANT_ID,
        updated_by: REAL_USER_ID,
        updated_at: new Date().toISOString()
      };

      if (!testFeatureId || testFeatureId === 'feature-test-id') {
        console.log('Skipping test - no valid feature ID found');
        return;
      }

      const result = await updateFeatureInDb(testFeatureId, invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('name');
    });

    it('should handle non-existent feature ID gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateParams = {
        name: 'Test Update',
        description: 'Test description',
        priority: 'Med' as const,
        tenant_id: REAL_TENANT_ID,
        updated_by: REAL_USER_ID,
        updated_at: new Date().toISOString()
      };

      const result = await updateFeatureInDb(nonExistentId, updateParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should preserve unchanged fields when updating feature', async () => {
      if (!testFeatureId || testFeatureId === 'feature-test-id') {
        console.log('Skipping test - no valid feature ID found');
        return;
      }

      // First get the current feature data
      const currentFeature = await getFeatureFromDb(testFeatureId);
      
      if (!currentFeature.success) {
        console.log('Could not retrieve current feature data');
        return;
      }

      // Update only the name
      const updateParams = {
        name: '[test2] Updated Name Only',
        tenant_id: REAL_TENANT_ID,
        updated_by: REAL_USER_ID,
        updated_at: new Date().toISOString()
      };

      const result = await updateFeatureInDb(testFeatureId, updateParams);

      expect(result.success).toBe(true);
      if (result.success && currentFeature.success) {
        expect(result.data.name).toBe('[test2] Updated Name Only');
        // Other fields should remain unchanged
        expect(result.data.description).toBe(currentFeature.data.description);
        expect(result.data.priority).toBe(currentFeature.data.priority);
      }
    });
  });

  describe('Debug Feature Update Process', () => {
    it('should show what happens during feature update', async () => {
      console.log('=== DEBUGGING FEATURE UPDATE ===');
      console.log('Real User ID:', REAL_USER_ID);
      console.log('Real Tenant ID:', REAL_TENANT_ID);
      
      if (!testFeatureId || testFeatureId === 'feature-test-id') {
        console.log('No valid test feature ID available');
        
        // Let's try to find any feature in the database for this tenant
        try {
          // We'll need to implement a way to list features for debugging
          console.log('Would need to implement feature listing to find test subjects');
        } catch (error) {
          console.log('Could not list features:', error);
        }
        return;
      }

      console.log('Test Feature ID:', testFeatureId);

      // Try to get the current feature first
      console.log('--- Getting current feature data ---');
      const currentFeature = await getFeatureFromDb(testFeatureId);
      console.log('Current feature result:', currentFeature);

      if (currentFeature.success) {
        console.log('Current feature data:', currentFeature.data);
        
        // Now try to update it
        console.log('--- Attempting to update feature ---');
        const updateParams = {
          name: '[DEBUG TEST] ' + currentFeature.data.name,
          description: currentFeature.data.description + ' [UPDATED]',
          priority: currentFeature.data.priority,
          tenant_id: REAL_TENANT_ID,
          updated_by: REAL_USER_ID,
          updated_at: new Date().toISOString()
        };

        console.log('Update parameters:', updateParams);
        
        const updateResult = await updateFeatureInDb(testFeatureId, updateParams);
        console.log('Update result:', updateResult);

        if (!updateResult.success) {
          console.error('Update failed with error:', updateResult.error);
        }
      } else {
        console.error('Could not get current feature:', currentFeature.error);
      }
    });
  });
});
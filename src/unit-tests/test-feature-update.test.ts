/**
 * Test to verify feature update functionality works
 * This test will find a real feature and update it to "[test] AR Product Review"
 */

import { getFeaturesFromDb, updateFeatureInDb } from '../services/features-db';

// Use real test data from env.local
const REAL_USER_ID = process.env.USER_ID!;
const REAL_TENANT_ID = process.env.TENANT_ID!;

describe('Feature Update Functionality Test', () => {
  it('should find and update a feature to add [test] prefix', async () => {
    console.log('=== TESTING FEATURE UPDATE ===');
    console.log('Tenant ID:', REAL_TENANT_ID);
    
    // First, get all features for this tenant
    const featuresResult = await getFeaturesFromDb(REAL_TENANT_ID);
    
    expect(featuresResult.success).toBe(true);
    
    if (!featuresResult.success) {
      console.error('Failed to get features:', featuresResult.error);
      return;
    }
    
    console.log('Found features:', featuresResult.data.length);
    
    if (featuresResult.data.length === 0) {
      console.log('No features found to test with');
      return;
    }
    
    // Find a feature that contains "AR Product Review"
    let targetFeature = featuresResult.data.find(f => 
      f.name.includes('AR Product Review') && !f.name.includes('[test]')
    );
    
    // If not found, use the first feature
    if (!targetFeature) {
      targetFeature = featuresResult.data[0];
      console.log('AR Product Review not found, using first feature:', targetFeature.name);
    } else {
      console.log('Found AR Product Review feature:', targetFeature.name);
    }
    
    const originalName = targetFeature.name;
    const newName = originalName.includes('[test]') ? originalName : `[test] ${originalName}`;
    
    console.log('Updating feature from:', originalName);
    console.log('Updating feature to:', newName);
    
    // Update the feature
    const updateResult = await updateFeatureInDb(
      targetFeature.id,
      {
        name: newName,
        description: targetFeature.description + ' [UPDATED BY TEST]',
        priority: targetFeature.priority,
        tenant_id: REAL_TENANT_ID
      }
    );
    
    console.log('Update result:', updateResult);
    
    expect(updateResult.success).toBe(true);
    
    if (updateResult.success) {
      expect(updateResult.data.name).toBe(newName);
      expect(updateResult.data.description).toContain('[UPDATED BY TEST]');
      console.log('✅ Feature updated successfully!');
      console.log('New name:', updateResult.data.name);
      console.log('New description:', updateResult.data.description);
    } else {
      console.error('❌ Feature update failed:', updateResult.error);
      fail('Feature update should have succeeded');
    }
  });
  
  it('should handle validation errors properly', async () => {
    console.log('=== TESTING VALIDATION ===');
    
    // Try to update with invalid data
    const invalidUpdateResult = await updateFeatureInDb(
      '00000000-0000-0000-0000-000000000000', // Non-existent ID
      {
        name: 'Test Name',
        tenant_id: REAL_TENANT_ID
      }
    );
    
    expect(invalidUpdateResult.success).toBe(false);
    expect(invalidUpdateResult.error).toContain('not found');
    console.log('✅ Validation working - non-existent feature rejected');
  });
});
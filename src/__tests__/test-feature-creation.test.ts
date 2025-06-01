/**
 * Test to verify feature creation functionality works
 * This test will create a new feature and verify it's properly stored
 */

import { createFeatureInDb, getFeaturesFromDb } from '../services/features-db';
import { getInterfacesFromDb } from '../services/interfaces-db';

// Use real test data from env.local
const REAL_USER_ID = process.env.USER_ID!;
const REAL_TENANT_ID = process.env.TENANT_ID!;

describe('Feature Creation Functionality Test', () => {
  let testInterfaceId: string;

  beforeAll(async () => {
    // Get an existing interface to create the feature under
    const interfacesResult = await getInterfacesFromDb(REAL_TENANT_ID);
    
    if (interfacesResult.success && interfacesResult.data.length > 0) {
      testInterfaceId = interfacesResult.data[0].id;
      console.log('Using interface:', interfacesResult.data[0].name, 'ID:', testInterfaceId);
    } else {
      console.log('No interfaces found - will skip tests requiring interface');
    }
  });

  it('should successfully create a new feature', async () => {
    if (!testInterfaceId) {
      console.log('Skipping test - no interface available');
      return;
    }

    console.log('=== TESTING FEATURE CREATION ===');
    console.log('Tenant ID:', REAL_TENANT_ID);
    console.log('Interface ID:', testInterfaceId);
    
    const newFeature = {
      name: '[TEST] AI-Powered Product Recommendations',
      description: 'Machine learning-driven product recommendations based on user behavior, purchase history, and browsing patterns. This feature will increase user engagement and sales conversion rates.',
      priority: 'High' as const,
      interfaceId: testInterfaceId,
      isSaved: false,
      savedAt: null
    };
    
    console.log('Creating feature:', newFeature.name);
    
    // Create the feature
    const createResult = await createFeatureInDb(newFeature, REAL_TENANT_ID);
    
    console.log('Create result:', createResult);
    
    expect(createResult.success).toBe(true);
    
    if (createResult.success) {
      expect(createResult.data).toBeDefined();
      expect(createResult.data.name).toBe(newFeature.name);
      expect(createResult.data.description).toBe(newFeature.description);
      expect(createResult.data.priority).toBe(newFeature.priority);
      expect(createResult.data.interfaceId).toBe(newFeature.interfaceId);
      expect(createResult.data.tenantId).toBe(REAL_TENANT_ID);
      expect(createResult.data.id).toBeDefined();
      
      console.log('✅ Feature created successfully!');
      console.log('New feature ID:', createResult.data.id);
      console.log('Name:', createResult.data.name);
      console.log('Description length:', createResult.data.description.length);
      console.log('Priority:', createResult.data.priority);
      console.log('Interface ID:', createResult.data.interfaceId);
      
      // Verify the feature appears in the features list
      const featuresResult = await getFeaturesFromDb(REAL_TENANT_ID);
      expect(featuresResult.success).toBe(true);
      
      if (featuresResult.success) {
        const createdFeature = featuresResult.data.find(f => f.id === createResult.data.id);
        expect(createdFeature).toBeDefined();
        console.log('✅ Feature found in features list');
      }
    } else {
      console.error('❌ Feature creation failed:', createResult.error);
      fail('Feature creation should have succeeded');
    }
  });

  it('should create another feature with different priority', async () => {
    if (!testInterfaceId) {
      console.log('Skipping test - no interface available');
      return;
    }

    const newFeature = {
      name: '[TEST] Advanced Search Filters',
      description: 'Enhanced search functionality with multiple filter options including price range, brand, ratings, availability, and custom attributes. Improves user experience and helps customers find products faster.',
      priority: 'Med' as const,
      interfaceId: testInterfaceId,
      isSaved: false,
      savedAt: null
    };
    
    console.log('Creating second feature:', newFeature.name);
    
    const createResult = await createFeatureInDb(newFeature, REAL_TENANT_ID);
    
    expect(createResult.success).toBe(true);
    
    if (createResult.success) {
      console.log('✅ Second feature created successfully!');
      console.log('Feature ID:', createResult.data.id);
      console.log('Priority:', createResult.data.priority);
    }
  });

  it('should create a low priority feature', async () => {
    if (!testInterfaceId) {
      console.log('Skipping test - no interface available');
      return;
    }

    const newFeature = {
      name: '[TEST] Social Media Integration',
      description: 'Integration with social media platforms to allow users to share products, reviews, and wishlist items. Includes share buttons, social login options, and social proof features.',
      priority: 'Low' as const,
      interfaceId: testInterfaceId,
      isSaved: false,
      savedAt: null
    };
    
    console.log('Creating third feature:', newFeature.name);
    
    const createResult = await createFeatureInDb(newFeature, REAL_TENANT_ID);
    
    expect(createResult.success).toBe(true);
    
    if (createResult.success) {
      console.log('✅ Third feature created successfully!');
      console.log('Feature ID:', createResult.data.id);
      console.log('Priority:', createResult.data.priority);
    }
  });

  it('should validate required fields when creating feature', async () => {
    console.log('=== TESTING VALIDATION ===');
    
    // Try to create feature without required fields
    const invalidFeature = {
      name: '', // Empty name should fail
      description: 'Test description',
      priority: 'High' as const,
      interfaceId: testInterfaceId || 'test-id',
      isSaved: false,
      savedAt: null
    };

    const result = await createFeatureInDb(invalidFeature, REAL_TENANT_ID);
    
    // Should fail due to empty name
    expect(result.success).toBe(false);
    console.log('✅ Validation working - empty name rejected');
  });

  it('should validate interface exists', async () => {
    const featureWithInvalidInterface = {
      name: 'Test Feature',
      description: 'Test description',
      priority: 'High' as const,
      interfaceId: '00000000-0000-0000-0000-000000000000', // Non-existent interface
      isSaved: false,
      savedAt: null
    };

    const result = await createFeatureInDb(featureWithInvalidInterface, REAL_TENANT_ID);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Interface not found');
    console.log('✅ Interface validation working - non-existent interface rejected');
  });

  afterAll(async () => {
    // Get final count of features
    const finalFeatures = await getFeaturesFromDb(REAL_TENANT_ID);
    if (finalFeatures.success) {
      console.log(`\n📊 Total features after test: ${finalFeatures.data.length}`);
      
      // Show all test features created
      const testFeatures = finalFeatures.data.filter(f => f.name.includes('[TEST]'));
      console.log(`🧪 Test features created: ${testFeatures.length}`);
      testFeatures.forEach(f => {
        console.log(`  - ${f.name} (${f.priority})`);
      });
    }
  });
});
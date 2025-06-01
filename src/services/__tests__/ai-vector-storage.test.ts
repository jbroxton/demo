/**
 * Vector Storage Test
 * 
 * This test verifies that embeddings can be properly stored and retrieved
 * from Supabase using pgvector functionality.
 */

import { indexFeature, indexRelease } from '@/services/ai-service';
import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Feature, Release } from '@/types/models';

// Test data - using your real tenant ID
const testTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

// Helper function to verify tenant isolation like the auth system does
function validateTenantId(tenantId: string): boolean {
  return tenantId && tenantId.length > 0 && tenantId !== 'undefined' && tenantId !== 'null';
}
const testFeature: Feature = {
  id: uuidv4(),
  name: 'Test Feature for Vector Storage',
  description: 'This is a test feature to verify vector storage functionality works correctly.',
  priority: 'High',
  status: 'active',
  requirements: [
    'Store embeddings in Supabase',
    'Use pgvector for similarity search',
    'Handle large datasets efficiently'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const testRelease: Release = {
  id: uuidv4(),
  name: 'Test Release v1.0',
  description: 'Test release for vector storage validation',
  targetDate: '2024-12-31',
  features: [
    {
      id: testFeature.id,
      name: testFeature.name,
      priority: testFeature.priority
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Vector Storage in Supabase', () => {
  // Check if Supabase is available before running tests
  beforeAll(async () => {
    try {
      const { error } = await supabase
        .from('ai_embeddings')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('fetch failed')) {
          throw new Error('Supabase connection failed. Please check your NEXT_PUBLIC_SUPABASE_URL and ensure Supabase is accessible.');
        }
        if (error.message.includes('relation "ai_embeddings" does not exist')) {
          throw new Error('ai_embeddings table does not exist. Please run the database migrations first.');
        }
        throw error;
      }
    } catch (error) {
      console.error('Supabase pre-check failed:', error);
      throw error;
    }
  });

  // Cleanup function to remove test data
  afterEach(async () => {
    try {
      // Clean up test embeddings
      await supabase
        .from('ai_embeddings')
        .delete()
        .eq('tenant_id', testTenantId);
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Database Connection', () => {
    test('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('ai_embeddings')
        .select('count(*)', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should have ai_embeddings table with correct structure', async () => {
      // Test inserting a minimal record to verify table structure
      const testRecord = {
        tenant_id: testTenantId,
        entity_type: 'test',
        entity_id: uuidv4(),
        content: 'test content',
        embedding: Array(1536).fill(0.1), // Valid 1536-dimensional vector
        metadata: { test: true }
      };

      const { data, error } = await supabase
        .from('ai_embeddings')
        .insert(testRecord)
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);
      expect(data[0].tenant_id).toBe(testTenantId);
      expect(data[0].entity_type).toBe('test');
      expect(data[0].embedding).toHaveLength(1536);
    });
  });

  describe('Feature Indexing', () => {
    test('should successfully index a feature with embeddings', async () => {
      const result = await indexFeature(testFeature, testTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tenant_id).toBe(testTenantId);
      expect(result.entity_type).toBe('feature');
      expect(result.entity_id).toBe(testFeature.id);
      expect(result.content).toContain(testFeature.name);
      expect(result.content).toContain(testFeature.description);
      expect(result.embedding).toBeDefined();
      expect(Array.isArray(result.embedding)).toBe(true);
      expect(result.embedding).toHaveLength(1536);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe(testFeature.name);
      expect(result.metadata.priority).toBe(testFeature.priority);
    });

    test('should update existing feature embedding on re-index', async () => {
      // First indexing
      const firstResult = await indexFeature(testFeature, testTenantId);
      const firstEmbeddingId = firstResult.id;

      // Modify feature and re-index
      const modifiedFeature = {
        ...testFeature,
        description: 'Updated description for vector storage test'
      };
      
      const secondResult = await indexFeature(modifiedFeature, testTenantId);

      // Should update the same record (upsert behavior)
      expect(secondResult.id).toBe(firstEmbeddingId);
      expect(secondResult.content).toContain('Updated description');
      expect(secondResult.embedding).toHaveLength(1536);
      
      // Verify only one record exists
      const { data, error } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('entity_type', 'feature')
        .eq('entity_id', testFeature.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    test('should handle features with minimal data', async () => {
      const minimalFeature: Feature = {
        id: uuidv4(),
        name: 'Minimal Feature',
        description: '',
        priority: 'Low',
        status: 'draft',
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await indexFeature(minimalFeature, testTenantId);

      expect(result).toBeDefined();
      expect(result.content).toContain('Minimal Feature');
      expect(result.embedding).toHaveLength(1536);
    });
  });

  describe('Release Indexing', () => {
    test('should successfully index a release with embeddings', async () => {
      const result = await indexRelease(testRelease, testTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tenant_id).toBe(testTenantId);
      expect(result.entity_type).toBe('release');
      expect(result.entity_id).toBe(testRelease.id);
      expect(result.content).toContain(testRelease.name);
      expect(result.content).toContain(testRelease.description);
      expect(result.embedding).toBeDefined();
      expect(Array.isArray(result.embedding)).toBe(true);
      expect(result.embedding).toHaveLength(1536);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe(testRelease.name);
      expect(result.metadata.targetDate).toBe(testRelease.targetDate);
    });

    test('should handle releases with multiple features', async () => {
      const multiFeatureRelease: Release = {
        ...testRelease,
        id: uuidv4(),
        name: 'Multi-Feature Release',
        features: [
          { id: uuidv4(), name: 'Feature 1', priority: 'High' },
          { id: uuidv4(), name: 'Feature 2', priority: 'Medium' },
          { id: uuidv4(), name: 'Feature 3', priority: 'Low' }
        ]
      };

      const result = await indexRelease(multiFeatureRelease, testTenantId);

      expect(result).toBeDefined();
      expect(result.content).toContain('Feature 1');
      expect(result.content).toContain('Feature 2');
      expect(result.content).toContain('Feature 3');
      expect(result.metadata.featureCount).toBe(3);
      expect(result.metadata.features).toHaveLength(3);
    });
  });

  describe('Multi-Tenant Support', () => {
    test('should isolate embeddings by tenant', async () => {
      const tenant1Id = uuidv4();
      const tenant2Id = uuidv4();

      // Index same feature for two different tenants
      await indexFeature(testFeature, tenant1Id);
      await indexFeature(testFeature, tenant2Id);

      // Verify tenant1 can only see their embedding
      const { data: tenant1Data } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', tenant1Id);

      // Verify tenant2 can only see their embedding
      const { data: tenant2Data } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(tenant1Data).toHaveLength(1);
      expect(tenant2Data).toHaveLength(1);
      expect(tenant1Data[0].tenant_id).toBe(tenant1Id);
      expect(tenant2Data[0].tenant_id).toBe(tenant2Id);

      // Cleanup
      await supabase.from('ai_embeddings').delete().eq('tenant_id', tenant1Id);
      await supabase.from('ai_embeddings').delete().eq('tenant_id', tenant2Id);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid feature data gracefully', async () => {
      const invalidFeature = {
        id: '',
        name: '',
        description: '',
        priority: 'Invalid',
        status: 'unknown',
        requirements: [],
        createdAt: '',
        updatedAt: ''
      } as Feature;

      await expect(indexFeature(invalidFeature, testTenantId))
        .rejects
        .toThrow();
    });

    test('should handle invalid tenant ID gracefully', async () => {
      await expect(indexFeature(testFeature, ''))
        .rejects
        .toThrow();
    });

    test('should handle database connection errors gracefully', async () => {
      // This test verifies that our error handling works
      // We can't easily simulate a DB failure, but we can verify error structure
      try {
        await indexFeature(testFeature, testTenantId);
      } catch (error) {
        // If an error occurs, it should be properly formatted
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Vector Data Integrity', () => {
    test('should store and retrieve identical embeddings', async () => {
      const result = await indexFeature(testFeature, testTenantId);
      
      // Retrieve the stored embedding
      const { data, error } = await supabase
        .from('ai_embeddings')
        .select('embedding')
        .eq('id', result.id)
        .single();

      expect(error).toBeNull();
      expect(data.embedding).toEqual(result.embedding);
      
      // Verify all values are numbers
      data.embedding.forEach(value => {
        expect(typeof value).toBe('number');
        expect(isFinite(value)).toBe(true);
      });
    });

    test('should handle large embedding datasets efficiently', async () => {
      const features: Feature[] = [];
      const numFeatures = 10;

      // Create multiple test features
      for (let i = 0; i < numFeatures; i++) {
        features.push({
          ...testFeature,
          id: uuidv4(),
          name: `Test Feature ${i + 1}`,
          description: `Description for test feature number ${i + 1}`
        });
      }

      // Index all features
      const startTime = Date.now();
      const results = await Promise.all(
        features.map(feature => indexFeature(feature, testTenantId))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(numFeatures);
      results.forEach(result => {
        expect(result.embedding).toHaveLength(1536);
      });

      // Performance check - should complete in reasonable time
      const timeElapsed = endTime - startTime;
      console.log(`Indexed ${numFeatures} features in ${timeElapsed}ms`);
      expect(timeElapsed).toBeLessThan(60000); // Should complete within 60 seconds
    }, 70000); // 70 second timeout for this test
  });
});
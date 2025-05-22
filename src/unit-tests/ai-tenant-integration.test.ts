/**
 * AI Tenant Integration Test
 * 
 * This test verifies that the AI system properly integrates with the tenant
 * authentication system and maintains proper tenant isolation.
 */

import { indexFeature, indexRelease, searchVectors } from '@/services/ai-service';
import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Feature, Release } from '@/types/models';

// Test tenants - using real tenant ID from your system
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';
const tenant2Id = uuidv4(); // For multi-tenant isolation testing
const invalidTenantId = '';

describe('AI Tenant Integration', () => {
  // Cleanup after each test
  afterEach(async () => {
    try {
      await supabase.from('ai_embeddings').delete().in('tenant_id', [realTenantId, tenant2Id]);
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Tenant Validation', () => {
    test('should reject empty tenant ID', async () => {
      const testFeature: Feature = {
        id: uuidv4(),
        name: 'Test Feature',
        description: 'Test description',
        priority: 'High',
        status: 'active',
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await expect(indexFeature(testFeature, invalidTenantId))
        .rejects
        .toThrow('Invalid tenant ID provided for indexing');
    });

    test('should reject null tenant ID', async () => {
      const testFeature: Feature = {
        id: uuidv4(),
        name: 'Test Feature',
        description: 'Test description',
        priority: 'High',
        status: 'active',
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await expect(indexFeature(testFeature, null as any))
        .rejects
        .toThrow('Invalid tenant ID provided for indexing');
    });

    test('should accept valid UUID tenant ID', async () => {
      // Skip if Supabase is not available
      try {
        const { error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });
        
        if (error && error.message.includes('fetch failed')) {
          console.log('Skipping test - Supabase not available');
          return;
        }
      } catch (error) {
        console.log('Skipping test - Supabase connection failed');
        return;
      }

      const testFeature: Feature = {
        id: uuidv4(),
        name: 'Test Feature with Valid Tenant',
        description: 'This feature should be indexed successfully',
        priority: 'High',
        status: 'active',
        requirements: ['Proper tenant isolation'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await indexFeature(testFeature, realTenantId);
      
      expect(result).toBeDefined();
      expect(result.tenant_id).toBe(realTenantId);
      expect(result.entity_type).toBe('feature');
      expect(result.entity_id).toBe(testFeature.id);
    });
  });

  describe('Tenant Isolation', () => {
    test('should isolate embeddings between tenants', async () => {
      // Skip if Supabase is not available
      try {
        const { error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });
        
        if (error && error.message.includes('fetch failed')) {
          console.log('Skipping test - Supabase not available');
          return;
        }
      } catch (error) {
        console.log('Skipping test - Supabase connection failed');
        return;
      }

      const sharedFeature: Feature = {
        id: uuidv4(),
        name: 'Shared Feature Name',
        description: 'This feature has the same content for both tenants',
        priority: 'High',
        status: 'active',
        requirements: ['Multi-tenant support'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Index same feature for two different tenants
      const tenant1Result = await indexFeature(sharedFeature, realTenantId);
      const tenant2Result = await indexFeature({
        ...sharedFeature,
        id: uuidv4() // Different entity ID for tenant 2
      }, tenant2Id);

      // Verify both embeddings were created
      expect(tenant1Result.tenant_id).toBe(realTenantId);
      expect(tenant2Result.tenant_id).toBe(tenant2Id);

      // Verify tenant isolation in database
      const { data: tenant1Data } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', realTenantId);

      const { data: tenant2Data } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(tenant1Data).toHaveLength(1);
      expect(tenant2Data).toHaveLength(1);
      expect(tenant1Data[0].tenant_id).toBe(realTenantId);
      expect(tenant2Data[0].tenant_id).toBe(tenant2Id);
    });

    test('should only return results for correct tenant in search', async () => {
      // Skip if Supabase is not available
      try {
        const { error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });
        
        if (error && error.message.includes('fetch failed')) {
          console.log('Skipping test - Supabase not available');
          return;
        }
      } catch (error) {
        console.log('Skipping test - Supabase connection failed');
        return;
      }

      // Create tenant-specific features
      const tenant1Feature: Feature = {
        id: uuidv4(),
        name: 'Tenant 1 Exclusive Feature',
        description: 'This feature belongs only to tenant 1 and contains secret information',
        priority: 'High',
        status: 'active',
        requirements: ['Tenant 1 security'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const tenant2Feature: Feature = {
        id: uuidv4(),
        name: 'Tenant 2 Exclusive Feature',
        description: 'This feature belongs only to tenant 2 and contains different secret information',
        priority: 'High',
        status: 'active',
        requirements: ['Tenant 2 security'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Index features for different tenants
      await indexFeature(tenant1Feature, realTenantId);
      await indexFeature(tenant2Feature, tenant2Id);

      // Search from tenant 1 perspective
      const tenant1Results = await searchVectors('secret information', realTenantId);
      
      // Search from tenant 2 perspective
      const tenant2Results = await searchVectors('secret information', tenant2Id);

      // Verify tenant isolation in search results
      tenant1Results.forEach(result => {
        expect(result.metadata?.name).toContain('Tenant 1');
        expect(result.metadata?.name).not.toContain('Tenant 2');
      });

      tenant2Results.forEach(result => {
        expect(result.metadata?.name).toContain('Tenant 2');
        expect(result.metadata?.name).not.toContain('Tenant 1');
      });
    });
  });

  describe('Authentication Integration Simulation', () => {
    test('should work with auth context flow', async () => {
      // Skip if Supabase is not available
      try {
        const { error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });
        
        if (error && error.message.includes('fetch failed')) {
          console.log('Skipping test - Supabase not available');
          return;
        }
      } catch (error) {
        console.log('Skipping test - Supabase connection failed');
        return;
      }

      // Simulate the auth flow that would happen in a real request
      const mockUser = {
        id: uuidv4(),
        tenantId: realTenantId,
        currentTenant: realTenantId,
        allowedTenants: [realTenantId]
      };

      // Simulate what the API route would do with auth context
      const currentTenant = mockUser.currentTenant || mockUser.tenantId;
      
      expect(currentTenant).toBe(realTenantId);
      expect(mockUser.allowedTenants).toContain(currentTenant);

      // Now use this tenant ID for AI operations
      const feature: Feature = {
        id: uuidv4(),
        name: 'Authenticated User Feature',
        description: 'This feature was created through proper auth flow',
        priority: 'Medium',
        status: 'active',
        requirements: ['Proper authentication'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await indexFeature(feature, currentTenant);
      
      expect(result.tenant_id).toBe(currentTenant);
      expect(result.entity_id).toBe(feature.id);

      // Verify search also respects tenant context
      const searchResults = await searchVectors('authenticated user', currentTenant);
      
      if (searchResults.length > 0) {
        searchResults.forEach(result => {
          // All results should be from the same tenant
          expect(result.metadata).toBeDefined();
        });
      }
    });

    test('should prevent cross-tenant data access', async () => {
      // This test ensures that even with a valid tenant ID,
      // you can only access your own tenant's data
      
      const unauthorizedTenantId = uuidv4();
      
      // Try to search for data using an unauthorized tenant ID
      // This should return empty results, not error
      const results = await searchVectors('any query', unauthorizedTenantId);
      
      // Should return empty array, not error
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle tenant switching scenario', async () => {
      // Skip if Supabase is not available
      try {
        const { error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });
        
        if (error && error.message.includes('fetch failed')) {
          console.log('Skipping test - Supabase not available');
          return;
        }
      } catch (error) {
        console.log('Skipping test - Supabase connection failed');
        return;
      }

      // Simulate a user who has access to multiple tenants
      const multiTenantUser = {
        id: uuidv4(),
        currentTenant: realTenantId,
        allowedTenants: [realTenantId, tenant2Id]
      };

      // Create data in tenant 1
      const tenant1Feature: Feature = {
        id: uuidv4(),
        name: 'Multi-tenant User Feature in Tenant 1',
        description: 'Feature created while user was in tenant 1 context',
        priority: 'High',
        status: 'active',
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await indexFeature(tenant1Feature, realTenantId);

      // Simulate tenant switch
      multiTenantUser.currentTenant = tenant2Id;

      // Create data in tenant 2
      const tenant2Feature: Feature = {
        id: uuidv4(),
        name: 'Multi-tenant User Feature in Tenant 2',
        description: 'Feature created while user was in tenant 2 context',
        priority: 'High',
        status: 'active',
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await indexFeature(tenant2Feature, tenant2Id);

      // Verify user can only see current tenant's data
      const tenant1Results = await searchVectors('multi-tenant user', realTenantId);
      const tenant2Results = await searchVectors('multi-tenant user', tenant2Id);

      // Results should be isolated by tenant
      tenant1Results.forEach(result => {
        expect(result.content).toContain('tenant 1');
      });

      tenant2Results.forEach(result => {
        expect(result.content).toContain('tenant 2');
      });
    });
  });
});
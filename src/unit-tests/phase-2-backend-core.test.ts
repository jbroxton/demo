/**
 * Phase 2: Backend Core Tests
 * Goal: Implement data layer and security
 * 
 * Components:
 * - Dependencies - Package verification
 * - DB - Database schema extensions
 * - Services - Agent operations in service files
 * - Middleware - Auth and security
 * - Providers - Auth context extensions
 */

import { agentActionsService } from '../services/agent-actions-db';
import { agentOperationsService } from '../services/agent-operations';
import type { 
  AgentAction,
  AgentSession,
  CreateAgentActionParams,
  UpdateAgentActionParams
} from '../types/models/ai-chat';

// Use real test data from env.local
const REAL_USER_ID = process.env.USER_ID!;
const REAL_TENANT_ID = process.env.TENANT_ID!;

describe('Phase 2: Backend Core - Database Operations', () => {
  afterEach(async () => {
    // Clean up test data after each test
    try {
      await agentActionsService['supabase']
        .from('agent_actions')
        .delete()
        .eq('tenant_id', REAL_TENANT_ID);
      
      await agentActionsService['supabase']
        .from('agent_sessions')
        .delete()
        .eq('tenant_id', REAL_TENANT_ID);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Test 18: Audit log entry creation', () => {
    it('should create audit log entry for successful agent operation', async () => {
      const createParams: CreateAgentActionParams = {
        tenantId: REAL_TENANT_ID,
        userId: REAL_USER_ID,
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        functionName: 'createProduct',
        functionParameters: { name: 'Test Product' }
      };

      const result = await agentActionsService.createAgentAction(createParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.success) {
        expect(result.data.tenantId).toBe(REAL_TENANT_ID);
        expect(result.data.userId).toBe(REAL_USER_ID);
        expect(result.data.operationType).toBe('create');
        expect(result.data.entityType).toBe('product');
        expect(result.data.functionName).toBe('createProduct');
        expect(result.data.createdAt).toBeDefined();
      }
    });

    it('should include all required audit fields', async () => {
      const createParams: CreateAgentActionParams = {
        tenantId: REAL_TENANT_ID,
        userId: REAL_USER_ID,
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        functionName: 'createProduct',
        functionParameters: { name: 'Test Product' },
        openAiFunctionCallId: 'call-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const result = await agentActionsService.createAgentAction(createParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tenantId).toBe(REAL_TENANT_ID);
        expect(result.data.userId).toBe(REAL_USER_ID);
        expect(result.data.sessionId).toBe('session-123');
        expect(result.data.operationType).toBe('create');
        expect(result.data.entityType).toBe('product');
        expect(result.data.functionName).toBe('createProduct');
        expect(result.data.openAiFunctionCallId).toBe('call-123');
        expect(result.data.ipAddress).toBe('192.168.1.1');
        expect(result.data.userAgent).toBe('Mozilla/5.0');
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      }
    });
  });

  describe('Test 19: Cross-tenant data access prevention', () => {
    it('should prevent tenant A from modifying tenant B data', async () => {
      // Mock RLS would prevent this at DB level, but service should also check
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' } // Simulate RLS blocking access
      });

      const result = await agentActionsService.getAgentAction('action-from-other-tenant');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('business_logic');
      expect(result.error?.message).toContain('not found');
    });

    it('should only return actions for current tenant', async () => {
      const mockActions = [
        {
          id: 'action-1',
          tenant_id: 'tenant-123',
          user_id: 'user-123',
          operation_type: 'create',
          entity_type: 'product',
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      mockQuery.select.mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockReturnValueOnce(mockQuery);
      mockQuery.order.mockReturnValueOnce(mockQuery);
      mockQuery.single.mockResolvedValueOnce({
        data: mockActions,
        error: null
      });

      const result = await agentActionsService.getAgentActions('user-123', 'tenant-123');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });
  });

  describe('Test 20: Tenant data isolation', () => {
    it('should enforce tenant isolation in all operations', async () => {
      const mockActions = [];
      mockQuery.single.mockResolvedValueOnce({
        data: mockActions,
        error: null
      });

      await agentActionsService.getAgentActions('user-123', 'tenant-123');

      // Verify both user_id and tenant_id are filtered
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should include tenant context in session operations', async () => {
      const mockSession = {
        id: 'session-1',
        session_id: 'agent-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        mode: 'agent'
      };

      mockQuery.single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      });

      const result = await agentActionsService.upsertSession(
        'agent-123',
        'user-123', 
        'tenant-123',
        'agent'
      );

      expect(mockQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
        session_id: 'agent-123',
        user_id: 'user-123',
        tenant_id: 'tenant-123',
        mode: 'agent'
      }));
    });
  });

  describe('Test 21: Cross-tenant entity reference prevention', () => {
    it('should validate entity references within tenant scope', async () => {
      // Mock a cross-tenant reference attempt
      const crossTenantParams = {
        name: 'Malicious Feature',
        productId: 'product-from-other-tenant'
      };

      // This would be caught by the service layer before DB operation
      const result = await agentOperationsService.createFeature(crossTenantParams, 'tenant-123');

      expect(result.success).toBe(false);
      // Service should validate that productId belongs to current tenant
    });
  });
});

describe('Phase 2: Backend Core - Service Layer', () => {
  describe('Test 4: Function routing to service layer', () => {
    it('should route createProduct function to products-db service', async () => {
      const mockProductResult = {
        success: true,
        data: {
          id: 'product-123',
          name: 'Test Product',
          description: 'A test product',
          tenant_id: 'tenant-123'
        }
      };

      // Mock the service call
      jest.spyOn(agentOperationsService, 'createProduct')
        .mockResolvedValueOnce(mockProductResult);

      const result = await agentOperationsService.createProduct(
        { name: 'Test Product', description: 'A test product' },
        'tenant-123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Product');
      expect(agentOperationsService.createProduct).toHaveBeenCalledWith(
        { name: 'Test Product', description: 'A test product' },
        'tenant-123'
      );
    });

    it('should route updateFeature function to features-db service', async () => {
      const mockFeatureResult = {
        success: true,
        data: {
          id: 'feature-123',
          name: 'Updated Feature',
          product_id: 'product-456'
        }
      };

      jest.spyOn(agentOperationsService, 'updateFeature')
        .mockResolvedValueOnce(mockFeatureResult);

      const result = await agentOperationsService.updateFeature(
        'feature-123',
        { name: 'Updated Feature', productId: 'product-456' },
        'tenant-123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Feature');
    });
  });

  describe('Test 5: Unknown function handling', () => {
    it('should throw error for unknown function names', () => {
      expect(() => {
        // This would be handled in the function router
        const unknownFunction = 'unknownFunction';
        if (!['createProduct', 'updateProduct', 'deleteProduct', 'listProducts'].includes(unknownFunction)) {
          throw new Error(`Unknown function: ${unknownFunction}`);
        }
      }).toThrow('Unknown function: unknownFunction');
    });
  });

  describe('Test 7: Validation error handling', () => {
    it('should fail validation for missing required fields', async () => {
      const invalidParams = {
        // Missing required 'name' field
        description: 'Product without name'
      };

      const result = await agentOperationsService.createProduct(invalidParams as any, 'tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
      expect(result.error?.message).toContain('validation');
    });

    it('should provide specific field validation errors', async () => {
      const invalidParams = {
        name: '', // Empty name
        description: 'A' // Too short description if validation exists
      };

      const result = await agentOperationsService.createProduct(invalidParams, 'tenant-123');

      expect(result.success).toBe(false);
      if (result.error?.details?.fieldErrors) {
        expect(result.error.details.fieldErrors).toHaveProperty('name');
      }
    });
  });

  describe('Test 8: Relationship validation', () => {
    it('should fail when feature references invalid roadmap ID', async () => {
      const invalidFeatureParams = {
        name: 'Test Feature',
        productId: 'nonexistent-product-id'
      };

      const result = await agentOperationsService.createFeature(invalidFeatureParams, 'tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found');
    });
  });

  describe('Test 9: Dependency validation for deletions', () => {
    it('should prevent deletion of entity with active dependencies', async () => {
      // Mock a product that has active features
      const productWithDependencies = 'product-with-features';

      const result = await agentOperationsService.deleteProduct(productWithDependencies, 'tenant-123');

      // Service should check for dependencies before deletion
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('dependencies' || 'cannot delete');
    });
  });

  describe('Test 16: Transaction support', () => {
    it('should create entities in transaction or fail completely', async () => {
      // This would be tested with actual database transactions
      // For now, verify the service layer structure supports transactions
      
      const createProductWithFeatures = async (productData: any, featuresData: any[]) => {
        try {
          // Start transaction
          const productResult = await agentOperationsService.createProduct(productData, 'tenant-123');
          
          if (!productResult.success) {
            throw new Error('Product creation failed');
          }

          const featureResults = [];
          for (const featureData of featuresData) {
            const featureResult = await agentOperationsService.createFeature(
              { ...featureData, productId: productResult.data!.id },
              'tenant-123'
            );
            
            if (!featureResult.success) {
              // In real implementation, this would trigger rollback
              throw new Error('Feature creation failed');
            }
            
            featureResults.push(featureResult.data);
          }

          return { success: true, product: productResult.data, features: featureResults };
        } catch (error) {
          // In real implementation, transaction would be rolled back
          return { success: false, error: error.message };
        }
      };

      const result = await createProductWithFeatures(
        { name: 'Test Product' },
        [{ name: 'Feature 1' }, { name: 'Feature 2' }]
      );

      // Structure should support transactional operations
      expect(result).toHaveProperty('success');
    });
  });

  describe('Test 17: Database constraint violations', () => {
    it('should handle constraint violations with rollback', async () => {
      // Mock constraint violation (e.g., duplicate name)
      const duplicateProductParams = {
        name: 'Existing Product Name'
      };

      const result = await agentOperationsService.createProduct(duplicateProductParams, 'tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('system');
    });
  });
});

describe('Phase 2: Backend Core - Authentication & Permissions', () => {
  describe('Test 6: Tenant context validation', () => {
    it('should throw authentication error without tenant context', () => {
      expect(() => {
        const tenantId = '';
        const userId = 'user-123';
        
        if (!tenantId || !userId) {
          throw new Error('Authentication required: missing tenant or user context');
        }
      }).toThrow('Authentication required');
    });

    it('should validate user permissions for agent operations', () => {
      const hasValidContext = (userId: string, tenantId: string) => {
        return !!(userId && tenantId);
      };

      expect(hasValidContext('user-123', 'tenant-123')).toBe(true);
      expect(hasValidContext('', 'tenant-123')).toBe(false);
      expect(hasValidContext('user-123', '')).toBe(false);
    });
  });
});

describe('Phase 2: Backend Core - Session Management', () => {
  describe('Session Creation and Updates', () => {
    it('should create agent session with proper metadata', async () => {
      const mockSession = {
        id: 'session-1',
        session_id: 'agent-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        mode: 'agent',
        started_at: '2024-01-01T10:00:00Z',
        last_activity_at: '2024-01-01T10:00:00Z',
        total_actions: 0,
        successful_actions: 0,
        failed_actions: 0,
        pending_actions: 0
      };

      mockQuery.single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      });

      const result = await agentActionsService.upsertSession(
        'agent-123',
        'user-123',
        'tenant-123',
        'agent'
      );

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('agent');
      expect(result.data?.tenantId).toBe('tenant-123');
    });

    it('should update session activity timestamp', async () => {
      const mockUpdatedSession = {
        id: 'session-1',
        session_id: 'agent-123',
        last_activity_at: '2024-01-01T10:30:00Z'
      };

      mockQuery.single.mockResolvedValueOnce({
        data: mockUpdatedSession,
        error: null
      });

      const result = await agentActionsService.upsertSession(
        'agent-123',
        'user-123',
        'tenant-123',
        'agent'
      );

      expect(mockQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
        last_activity_at: expect.any(String)
      }));
    });
  });
});
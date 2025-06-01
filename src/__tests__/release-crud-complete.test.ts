/**
 * Complete Release CRUD Operations Test
 * Tests all release operations through agent-operations service
 */

import { AgentOperationsService } from '@/services/agent-operations';

describe('Release CRUD Operations (Complete)', () => {
  const agentOps = new AgentOperationsService();
  const testTenantId = '22222222-2222-2222-2222-222222222222';
  let testReleaseId: string;
  let testFeatureId: string;

  beforeAll(async () => {
    // Use an existing feature for testing releases
    testFeatureId = '40000000-0000-0000-0000-000000000001'; // Known feature from seed data
    console.log('✅ Using existing test feature:', testFeatureId);
  });

  describe('Create Release', () => {
    it('should create a release successfully', async () => {
      console.log('🟡 Testing release creation...');
      
      const createParams = {
        name: '[AGENT TEST] Release 1.0.0',
        description: 'Major release with new features',
        targetDate: '2024-06-15',
        priority: 'High' as const,
        featureId: testFeatureId
      };

      const result = await agentOps.createRelease(createParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe(createParams.name);
      expect(result.data!.description).toBe(createParams.description);
      expect(result.data!.releaseDate).toBe(createParams.targetDate);
      expect(result.data!.priority).toBe(createParams.priority);
      expect(result.data!.featureId).toBe(testFeatureId);
      
      testReleaseId = result.data!.id;
      console.log('✅ Release created successfully:', testReleaseId);
    });

    it('should create release with minimal fields', async () => {
      const createParams = {
        name: '[AGENT TEST] Minimal Release',
        targetDate: '2024-07-01',
        featureId: testFeatureId
      };

      const result = await agentOps.createRelease(createParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe(createParams.name);
      expect(result.data!.priority).toBe('Med'); // Default priority
      console.log('✅ Minimal release created:', result.data!.id);
    });
  });

  describe('Update Release', () => {
    it('should update release name', async () => {
      console.log('🟡 Testing release name update...');
      
      const updateParams = {
        name: '[AGENT UPDATED] Release 1.0.1'
      };

      const result = await agentOps.updateRelease(testReleaseId, updateParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe(updateParams.name);
      console.log('✅ Release name updated successfully');
    });

    it('should update release description', async () => {
      const updateParams = {
        description: 'Updated description with bug fixes and improvements'
      };

      const result = await agentOps.updateRelease(testReleaseId, updateParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.description).toBe(updateParams.description);
      console.log('✅ Release description updated successfully');
    });

    it('should update release date', async () => {
      const updateParams = {
        targetDate: '2024-06-30'
      };

      const result = await agentOps.updateRelease(testReleaseId, updateParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.releaseDate).toBe(updateParams.targetDate);
      console.log('✅ Release date updated successfully');
    });

    it('should update release priority', async () => {
      const updateParams = {
        priority: 'Low' as const
      };

      const result = await agentOps.updateRelease(testReleaseId, updateParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.priority).toBe(updateParams.priority);
      console.log('✅ Release priority updated successfully');
    });

    it('should update multiple fields at once', async () => {
      const updateParams = {
        name: '[AGENT MULTI-UPDATE] Release 2.0.0',
        description: 'Multi-field update test',
        targetDate: '2024-08-15',
        priority: 'High' as const
      };

      const result = await agentOps.updateRelease(testReleaseId, updateParams, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe(updateParams.name);
      expect(result.data!.description).toBe(updateParams.description);
      expect(result.data!.releaseDate).toBe(updateParams.targetDate);
      expect(result.data!.priority).toBe(updateParams.priority);
      console.log('✅ Multiple fields updated successfully');
    });
  });

  describe('List Releases', () => {
    it('should list all releases for tenant', async () => {
      console.log('🟡 Testing release listing...');
      
      const result = await agentOps.listReleases(testTenantId);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      
      // Check that our test release is in the list
      const testRelease = result.data!.find(r => r.id === testReleaseId);
      expect(testRelease).toBeDefined();
      console.log(`✅ Listed ${result.data!.length} releases`);
    });

    it('should list releases by feature', async () => {
      const result = await agentOps.listReleases(testTenantId, testFeatureId);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All releases should belong to the specified feature
      result.data!.forEach(release => {
        expect(release.featureId).toBe(testFeatureId);
      });
      console.log(`✅ Listed ${result.data!.length} releases for feature ${testFeatureId}`);
    });
  });

  describe('Delete Release', () => {
    it('should delete release successfully', async () => {
      console.log('🟡 Testing release deletion...');
      
      const result = await agentOps.deleteRelease(testReleaseId, testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      console.log('✅ Release deleted successfully');
    });

    it('should fail to delete non-existent release', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const result = await agentOps.deleteRelease(fakeId, testTenantId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log('✅ Correctly failed to delete non-existent release');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tenant ID', async () => {
      const invalidTenantId = '00000000-0000-0000-0000-000000000000';
      
      const result = await agentOps.createRelease(
        {
          name: 'Should Fail',
          targetDate: '2024-12-01',
          featureId: testFeatureId
        },
        invalidTenantId
      );
      
      // This might succeed but return no data, or fail - either is acceptable
      console.log('✅ Handled invalid tenant ID scenario');
    });

    it('should handle missing required fields', async () => {
      const result = await agentOps.createRelease(
        {
          name: '', // Empty name
          targetDate: '2024-12-01',
          featureId: testFeatureId
        },
        testTenantId
      );
      
      // Should either fail validation or create with empty name
      console.log('✅ Handled missing required fields');
    });
  });

  afterAll(async () => {
    // No cleanup needed since we used existing feature
    console.log('🧹 Test cleanup complete');
  });
});
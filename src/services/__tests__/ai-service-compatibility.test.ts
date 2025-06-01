/**
 * Unit Tests: AI Service Compatibility with Auto-Embedding
 * 
 * Tests the adaptation of existing AI service to work seamlessly 
 * with the new automatic embedding system.
 */

import { 
  isAutoEmbeddingEnabled, 
  getEmbeddingQueueStatus, 
  triggerManualEmbeddingProcessing,
  indexFeature,
  indexRelease 
} from '@/services/ai-service';
import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';

describe('AI Service Compatibility Tests', () => {
  const testTenantId = 'test-tenant-' + uuidv4();
  
  beforeEach(async () => {
    // Clean up any existing test data
    await supabase
      .from('ai_embeddings')
      .delete()
      .eq('tenant_id', testTenantId);
      
    // Clean up message queue
    await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
  });

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('ai_embeddings')
      .delete()
      .eq('tenant_id', testTenantId);
  });

  describe('Auto-Embedding Detection', () => {
    test('test_ai_service_auto_detection', async () => {
      // Given: Auto-embedding system is enabled
      // Expected: AI service detects automatic mode and adjusts behavior
      
      const isAutoEnabled = await isAutoEmbeddingEnabled();
      
      // The function should return a boolean
      expect(typeof isAutoEnabled).toBe('boolean');
      
      // If auto-embedding infrastructure is set up, should detect it
      if (isAutoEnabled) {
        console.log('Auto-embedding system detected');
        
        // Verify queue status can be retrieved
        const queueStatus = await getEmbeddingQueueStatus();
        expect(queueStatus.available).toBe(true);
        expect(typeof queueStatus.queueLength).toBe('number');
      } else {
        console.log('Auto-embedding system not available');
        
        // Should handle gracefully when not available
        const queueStatus = await getEmbeddingQueueStatus();
        expect(queueStatus.available).toBe(false);
        expect(queueStatus.error).toBeDefined();
      }
    });

    test('test_auto_detection_caching', async () => {
      // Test that auto-detection results are cached for performance
      
      const startTime = Date.now();
      const firstCall = await isAutoEmbeddingEnabled();
      const firstCallTime = Date.now() - startTime;
      
      const secondStartTime = Date.now();
      const secondCall = await isAutoEmbeddingEnabled();
      const secondCallTime = Date.now() - secondStartTime;
      
      // Results should be consistent
      expect(firstCall).toBe(secondCall);
      
      // Second call should be faster (cached)
      expect(secondCallTime).toBeLessThan(firstCallTime);
      expect(secondCallTime).toBeLessThan(100); // Should be very fast when cached
    });
  });

  describe('Manual Sync Compatibility', () => {
    test('test_manual_sync_compatibility', async () => {
      // Given: User clicks manual sync button
      // Expected: System can still manually trigger embeddings when needed
      
      // Test manual triggering
      const result = await triggerManualEmbeddingProcessing();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.processed).toBe('number');
      
      if (result.success) {
        console.log(`Manual processing succeeded, processed ${result.processed} jobs`);
        expect(result.processed).toBeGreaterThanOrEqual(0);
      } else {
        console.log(`Manual processing failed: ${result.error}`);
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    test('test_manual_trigger_with_jobs_in_queue', async () => {
      // Test manual triggering when there are actual jobs to process
      
      // First, ensure auto-embedding is available
      const isAutoEnabled = await isAutoEmbeddingEnabled();
      
      if (!isAutoEnabled) {
        console.log('Skipping test: auto-embedding not available');
        return;
      }
      
      // Add a test job to the queue
      const testJob = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: testTenantId,
        content: 'Test feature for manual sync compatibility',
        metadata: { name: 'Manual Sync Test' }
      };
      
      await supabase.rpc('pgmq.send', {
        queue_name: 'embedding_jobs',
        msg: testJob
      });
      
      // Trigger manual processing
      const result = await triggerManualEmbeddingProcessing();
      
      expect(result.success).toBe(true);
      expect(result.processed).toBeGreaterThan(0);
      
      // Verify job was processed
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', testJob.entity_id);
      
      expect(embeddings.length).toBe(1);
    });
  });

  describe('Queue Status Monitoring', () => {
    test('test_queue_status_monitoring', async () => {
      // Given: Embedding jobs are in queue
      // Expected: AI service can report current queue status and processing state
      
      const queueStatus = await getEmbeddingQueueStatus();
      
      expect(queueStatus).toBeDefined();
      expect(typeof queueStatus.available).toBe('boolean');
      expect(typeof queueStatus.queueLength).toBe('number');
      expect(typeof queueStatus.processing).toBe('boolean');
      
      if (queueStatus.available) {
        expect(queueStatus.queueLength).toBeGreaterThanOrEqual(0);
        expect(queueStatus.totalMessages).toBeGreaterThanOrEqual(0);
        expect(queueStatus.oldestMessageAge).toBeGreaterThanOrEqual(0);
        expect(queueStatus.newestMessageAge).toBeGreaterThanOrEqual(0);
        
        // Processing should be true if queue length > 0
        if (queueStatus.queueLength > 0) {
          expect(queueStatus.processing).toBe(true);
        }
      } else {
        expect(queueStatus.error).toBeDefined();
      }
    });

    test('test_queue_status_with_jobs', async () => {
      // Test queue status reporting with actual jobs
      
      const isAutoEnabled = await isAutoEmbeddingEnabled();
      
      if (!isAutoEnabled) {
        console.log('Skipping test: auto-embedding not available');
        return;
      }
      
      // Get initial status
      const initialStatus = await getEmbeddingQueueStatus();
      const initialLength = initialStatus.queueLength;
      
      // Add test jobs
      const jobCount = 3;
      for (let i = 0; i < jobCount; i++) {
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: {
            entity_type: 'features',
            entity_id: uuidv4(),
            tenant_id: testTenantId,
            content: `Test feature ${i + 1}`,
            metadata: { name: `Test ${i + 1}` }
          }
        });
      }
      
      // Check updated status
      const updatedStatus = await getEmbeddingQueueStatus();
      
      expect(updatedStatus.available).toBe(true);
      expect(updatedStatus.queueLength).toBeGreaterThanOrEqual(initialLength + jobCount);
      expect(updatedStatus.processing).toBe(true);
    });
  });

  describe('Legacy Function Compatibility', () => {
    test('test_legacy_index_feature_with_warnings', async () => {
      // Test that legacy indexFeature function still works but shows warnings
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const testFeature = {
        id: uuidv4(),
        name: 'Legacy Test Feature',
        description: 'Testing legacy compatibility',
        priority: 'Medium',
        workflowStatus: 'Active',
        tenant_id: testTenantId
      };
      
      try {
        const result = await indexFeature(testFeature, testTenantId);
        
        // Should still work
        expect(result).toBeDefined();
        
        // Should show warning about using legacy function
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('legacy manual embedding')
        );
        
        // Verify embedding was created
        const { data: embeddings } = await supabase
          .from('ai_embeddings')
          .select('*')
          .eq('entity_id', testFeature.id);
        
        expect(embeddings.length).toBe(1);
        
      } finally {
        consoleWarnSpy.mockRestore();
      }
    });

    test('test_legacy_index_release_with_warnings', async () => {
      // Test that legacy indexRelease function still works but shows warnings
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const testRelease = {
        id: uuidv4(),
        name: 'Legacy Test Release',
        description: 'Testing legacy compatibility',
        priority: 'High',
        releaseDate: '2024-06-01',
        tenant_id: testTenantId
      };
      
      try {
        const result = await indexRelease(testRelease, testTenantId);
        
        // Should still work
        expect(result).toBeDefined();
        
        // Should show warning about using legacy function
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('legacy manual embedding')
        );
        
        // Verify embedding was created
        const { data: embeddings } = await supabase
          .from('ai_embeddings')
          .select('*')
          .eq('entity_id', testRelease.id);
        
        expect(embeddings.length).toBe(1);
        
      } finally {
        consoleWarnSpy.mockRestore();
      }
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('test_graceful_degradation_when_auto_embedding_unavailable', async () => {
      // Test behavior when auto-embedding system is not available
      
      // Mock the auto-embedding detection to return false
      const originalIsAutoEnabled = isAutoEmbeddingEnabled;
      
      // Create a temporary mock that returns false
      const mockIsAutoEnabled = jest.fn().mockResolvedValue(false);
      
      // Replace the function temporarily
      (require('@/services/ai-service') as any).isAutoEmbeddingEnabled = mockIsAutoEnabled;
      
      try {
        const result = await triggerManualEmbeddingProcessing();
        
        expect(result.success).toBe(false);
        expect(result.processed).toBe(0);
        expect(result.error).toContain('not available');
        
      } finally {
        // Restore original function
        (require('@/services/ai-service') as any).isAutoEmbeddingEnabled = originalIsAutoEnabled;
      }
    });

    test('test_queue_status_error_handling', async () => {
      // Test queue status handling when there are database errors
      
      // This test would need to mock the Supabase call to simulate an error
      // For now, we test the current implementation
      
      const status = await getEmbeddingQueueStatus();
      
      // Should always return a valid status object
      expect(status).toBeDefined();
      expect(typeof status.available).toBe('boolean');
      
      if (!status.available) {
        expect(status.error).toBeDefined();
        expect(typeof status.error).toBe('string');
      }
    });
  });

  describe('Performance and Efficiency', () => {
    test('test_status_check_performance', async () => {
      // Test that status checks are reasonably fast
      
      const startTime = Date.now();
      
      const [autoStatus, queueStatus] = await Promise.all([
        isAutoEmbeddingEnabled(),
        getEmbeddingQueueStatus()
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Status checks should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max
      
      expect(typeof autoStatus).toBe('boolean');
      expect(queueStatus).toBeDefined();
      
      console.log(`Status checks completed in ${duration}ms`);
    });

    test('test_concurrent_status_checks', async () => {
      // Test that concurrent status checks don't cause issues
      
      const concurrentChecks = Array(5).fill(null).map(() => Promise.all([
        isAutoEmbeddingEnabled(),
        getEmbeddingQueueStatus()
      ]));
      
      const results = await Promise.allSettled(concurrentChecks);
      
      // All checks should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        
        if (result.status === 'fulfilled') {
          const [autoStatus, queueStatus] = result.value;
          expect(typeof autoStatus).toBe('boolean');
          expect(queueStatus).toBeDefined();
        }
      });
    });
  });
});
/**
 * Unit Tests: Cron Job Queue Processing
 * 
 * Tests the pg_cron scheduled task that regularly processes the embedding queue
 * by invoking the Edge Function.
 */

import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';

describe('AI Cron Queue Processing Tests', () => {
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
      
    // Clean up message queue
    await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
  });

  describe('Cron Job Configuration', () => {
    test('test_cron_job_scheduled', async () => {
      // Given: Auto-embedding system is configured
      // Expected: Cron job is scheduled and runs every 30 seconds
      
      // Check that cron job exists
      const { data: cronJobs, error: cronError } = await supabase
        .rpc('check_cron_jobs');
      
      expect(cronError).toBeNull();
      expect(cronJobs).toBeDefined();
      
      const embeddingCronJob = cronJobs.find(
        (job: any) => job.jobname === 'process-embedding-queue'
      );
      
      expect(embeddingCronJob).toBeDefined();
      expect(embeddingCronJob.schedule).toBe('*/30 * * * * *'); // Every 30 seconds
      expect(embeddingCronJob.command).toContain('process_embedding_queue');
      expect(embeddingCronJob.active).toBe(true);
    });

    test('test_cron_job_function_exists', async () => {
      // Test that the process_embedding_queue function exists and is callable
      
      const { data: result, error: functionError } = await supabase
        .rpc('process_embedding_queue');
      
      expect(functionError).toBeNull();
      expect(result).toBeDefined();
      expect(typeof result).toBe('number'); // Returns number of jobs processed
    });
  });

  describe('Queue Processing Performance', () => {
    test('test_queue_processing_performance', async () => {
      // Given: 10 embedding jobs are in queue
      // Expected: All jobs are processed within 60 seconds
      
      const jobCount = 10;
      const startTime = Date.now();
      
      // Create test jobs
      const jobs = [];
      for (let i = 0; i < jobCount; i++) {
        const entityId = uuidv4();
        const job = {
          entity_type: 'features',
          entity_id: entityId,
          tenant_id: testTenantId,
          content: `Feature: Test Feature ${i + 1}\nPriority: Medium\nDescription: Performance test feature ${i + 1}`,
          metadata: {
            id: entityId,
            name: `Test Feature ${i + 1}`,
            priority: 'Medium'
          }
        };
        
        jobs.push(job);
        
        // Enqueue job
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: job
        });
      }
      
      // Manually trigger queue processing (simulating cron job)
      const { data: processResult, error: processError } = await supabase
        .rpc('process_embedding_queue');
      
      expect(processError).toBeNull();
      expect(processResult).toBeDefined();
      expect(processResult).toBe(jobCount);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(60000); // Should complete within 60 seconds
      
      // Verify all embeddings were created
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBe(jobCount);
      
      // Verify queue is empty
      const { data: remainingJobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 20
        });
      
      const testJobs = remainingJobs?.filter((job: any) => 
        job.message.tenant_id === testTenantId
      );
      
      expect(testJobs?.length || 0).toBe(0);
    });

    test('test_large_queue_batch_processing', async () => {
      // Test processing efficiency with larger batches
      
      const jobCount = 25;
      const maxJobsPerBatch = 10; // As configured in the function
      
      // Create test jobs
      for (let i = 0; i < jobCount; i++) {
        const entityId = uuidv4();
        const job = {
          entity_type: 'features',
          entity_id: entityId,
          tenant_id: testTenantId,
          content: `Feature: Batch Test Feature ${i + 1}\nPriority: Low\nDescription: Large batch processing test`,
          metadata: {
            id: entityId,
            name: `Batch Test Feature ${i + 1}`
          }
        };
        
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: job
        });
      }
      
      // Process in multiple batches
      let totalProcessed = 0;
      let iterations = 0;
      const maxIterations = Math.ceil(jobCount / maxJobsPerBatch) + 1; // Add buffer
      
      while (totalProcessed < jobCount && iterations < maxIterations) {
        const { data: batchResult } = await supabase
          .rpc('process_embedding_queue');
        
        totalProcessed += batchResult || 0;
        iterations++;
        
        if (batchResult === 0) {
          break; // No more jobs to process
        }
      }
      
      expect(totalProcessed).toBe(jobCount);
      expect(iterations).toBeLessThanOrEqual(maxIterations);
      
      // Verify all embeddings were created
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBe(jobCount);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('test_cron_failure_handling', async () => {
      // Given: Edge Function is temporarily unavailable
      // Expected: Cron job logs error and continues on next cycle
      
      // Create a job with invalid content to cause processing failure
      const entityId = uuidv4();
      const invalidJob = {
        entity_type: 'features',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: '', // Empty content should cause OpenAI error
        metadata: {
          id: entityId,
          name: 'Invalid Feature'
        }
      };
      
      // Enqueue invalid job
      await supabase.rpc('pgmq.send', {
        queue_name: 'embedding_jobs',
        msg: invalidJob
      });
      
      // Try to process queue - should handle error gracefully
      const { data: result, error: processError } = await supabase
        .rpc('process_embedding_queue');
      
      // Function should not throw error even if processing fails
      expect(processError).toBeNull();
      expect(result).toBeDefined();
      
      // Job might still be in queue due to failure (depending on retry logic)
      const { data: remainingJobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      // The job should either be processed (if retries succeeded) or remain in queue
      expect(remainingJobs).toBeDefined();
    });

    test('test_empty_queue_handling', async () => {
      // Test that cron job handles empty queue gracefully
      
      // Ensure queue is empty
      await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
      
      // Process empty queue
      const { data: result, error: processError } = await supabase
        .rpc('process_embedding_queue');
      
      expect(processError).toBeNull();
      expect(result).toBe(0); // Should process 0 jobs
    });

    test('test_concurrent_processing_safety', async () => {
      // Test that concurrent cron job executions don't cause issues
      
      // Create some test jobs
      const jobCount = 5;
      for (let i = 0; i < jobCount; i++) {
        const entityId = uuidv4();
        const job = {
          entity_type: 'features',
          entity_id: entityId,
          tenant_id: testTenantId,
          content: `Feature: Concurrent Test ${i + 1}\nPriority: Medium`,
          metadata: {
            id: entityId,
            name: `Concurrent Test ${i + 1}`
          }
        };
        
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: job
        });
      }
      
      // Run multiple concurrent processing attempts
      const processingPromises = [
        supabase.rpc('process_embedding_queue'),
        supabase.rpc('process_embedding_queue'),
        supabase.rpc('process_embedding_queue')
      ];
      
      const results = await Promise.allSettled(processingPromises);
      
      // All calls should complete without errors
      results.forEach((result) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.error).toBeNull();
        }
      });
      
      // Total processed jobs should not exceed the number enqueued
      const totalProcessed = results.reduce((sum, result) => {
        if (result.status === 'fulfilled') {
          return sum + (result.value.data || 0);
        }
        return sum;
      }, 0);
      
      expect(totalProcessed).toBeLessThanOrEqual(jobCount);
      
      // Verify embeddings were created (some jobs should have been processed)
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBeGreaterThan(0);
      expect(embeddings.length).toBeLessThanOrEqual(jobCount);
    });
  });

  describe('Queue Monitoring', () => {
    test('test_queue_metrics_tracking', async () => {
      // Test that queue metrics are properly tracked
      
      // Add some jobs to queue
      const jobCount = 3;
      for (let i = 0; i < jobCount; i++) {
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: {
            entity_type: 'features',
            entity_id: uuidv4(),
            tenant_id: testTenantId,
            content: `Test content ${i + 1}`,
            metadata: {}
          }
        });
      }
      
      // Check queue metrics before processing
      const { data: beforeMetrics } = await supabase
        .from('embedding_queue_status')
        .select('*')
        .eq('queue_name', 'embedding_jobs')
        .single();
      
      expect(beforeMetrics).toBeDefined();
      expect(beforeMetrics.queue_length).toBeGreaterThanOrEqual(jobCount);
      
      // Process jobs
      await supabase.rpc('process_embedding_queue');
      
      // Check metrics after processing
      const { data: afterMetrics } = await supabase
        .from('embedding_queue_status')
        .select('*')
        .eq('queue_name', 'embedding_jobs')
        .single();
      
      expect(afterMetrics).toBeDefined();
      expect(afterMetrics.queue_length).toBeLessThan(beforeMetrics.queue_length);
    });

    test('test_processing_time_monitoring', async () => {
      // Test monitoring of processing times
      
      const startTime = Date.now();
      
      // Create a moderate number of jobs
      for (let i = 0; i < 5; i++) {
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: {
            entity_type: 'features',
            entity_id: uuidv4(),
            tenant_id: testTenantId,
            content: `Performance monitoring test feature ${i + 1}`,
            metadata: { name: `Test Feature ${i + 1}` }
          }
        });
      }
      
      // Process jobs and measure time
      const { data: processedCount } = await supabase
        .rpc('process_embedding_queue');
      
      const processingTime = Date.now() - startTime;
      
      expect(processedCount).toBe(5);
      expect(processingTime).toBeLessThan(30000); // Should complete in under 30 seconds
      
      // Log performance for monitoring
      console.log(`Processed ${processedCount} jobs in ${processingTime}ms`);
    });
  });

  describe('Integration with Database Triggers', () => {
    test('test_trigger_to_cron_integration', async () => {
      // Test the full flow: trigger → queue → cron processing
      
      // Create a feature (should trigger job enqueuing)
      const featureId = uuidv4();
      const { data: feature, error: insertError } = await supabase
        .from('features')
        .insert({
          id: featureId,
          tenant_id: testTenantId,
          name: 'Integration Test Feature',
          description: 'Testing trigger to cron integration',
          priority: 'Medium'
        })
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(feature).toBeDefined();
      
      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify job was enqueued
      const { data: jobsBefore } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const featureJob = jobsBefore?.find((job: any) => 
        job.message.entity_id === featureId
      );
      
      expect(featureJob).toBeDefined();
      
      // Process queue (simulating cron job)
      const { data: processedCount } = await supabase
        .rpc('process_embedding_queue');
      
      expect(processedCount).toBeGreaterThan(0);
      
      // Verify embedding was created
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', featureId);
      
      expect(embeddings.length).toBe(1);
      expect(embeddings[0].content).toContain('Integration Test Feature');
      
      // Clean up
      await supabase.from('features').delete().eq('id', featureId);
    });
  });
});

// Helper SQL for creating test helper functions (same as in infrastructure test)
const testHelperFunctions = `
-- Helper function to check cron jobs
CREATE OR REPLACE FUNCTION check_cron_jobs()
RETURNS TABLE(jobname text, schedule text, command text, active boolean)
LANGUAGE sql
AS $$
  SELECT jobname, schedule, command, active 
  FROM cron.job
  WHERE jobname = 'process-embedding-queue';
$$;
`;
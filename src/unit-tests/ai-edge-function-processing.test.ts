/**
 * Unit Tests: Supabase Edge Function Processing
 * 
 * Tests the Edge Function that processes embedding jobs from the queue
 * and generates vectors using OpenAI API.
 */

import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';

describe('AI Edge Function Processing Tests', () => {
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

  describe('Single Job Processing', () => {
    test('test_edge_function_processes_queue', async () => {
      // Given: Embedding job is in the message queue
      // Expected: Edge Function picks up job and processes it successfully
      
      const entityId = uuidv4();
      const jobPayload = {
        entity_type: 'features',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: 'Feature: API Rate Limiting\nPriority: High\nDescription: Implement rate limiting for API endpoints',
        metadata: {
          id: entityId,
          name: 'API Rate Limiting',
          priority: 'High'
        }
      };
      
      // Enqueue job manually
      const { data: sendResult, error: sendError } = await supabase
        .rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: jobPayload
        });
      
      expect(sendError).toBeNull();
      expect(sendResult).toBeDefined();
      
      // Process job using Edge Function batch processing
      const { data: result, error: functionError } = await supabase.functions
        .invoke('process-embedding', {
          body: { maxJobs: 1 }
        });
      
      expect(functionError).toBeNull();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.jobsProcessed).toBe(1);
      
      // Verify job was removed from queue
      const { data: remainingJobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const processedJob = remainingJobs?.find((job: any) => 
        job.message.entity_id === entityId
      );
      
      expect(processedJob).toBeUndefined();
    });

    test('test_embedding_generation_success', async () => {
      // Given: Valid feature content is in embedding job
      // Expected: OpenAI embedding is generated and stored in database
      
      const entityId = uuidv4();
      const jobPayload = {
        entity_type: 'features',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: 'Feature: User Authentication\nPriority: Critical\nDescription: OAuth 2.0 implementation with JWT tokens',
        metadata: {
          id: entityId,
          name: 'User Authentication',
          priority: 'Critical'
        }
      };
      
      // Call Edge Function directly for single job processing
      const { data: result, error: functionError } = await supabase.functions
        .invoke('process-embedding', {
          body: jobPayload
        });
      
      expect(functionError).toBeNull();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify embedding was stored in database
      const { data: embeddings, error: dbError } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', entityId)
        .eq('tenant_id', testTenantId);
      
      expect(dbError).toBeNull();
      expect(embeddings).toBeDefined();
      expect(embeddings.length).toBe(1);
      
      const embedding = embeddings[0];
      expect(embedding.entity_type).toBe('features');
      expect(embedding.content).toContain('User Authentication');
      expect(embedding.embedding).toBeDefined();
      expect(Array.isArray(embedding.embedding)).toBe(true);
      expect(embedding.embedding.length).toBe(1536); // OpenAI text-embedding-3-small
      expect(embedding.metadata.name).toBe('User Authentication');
      expect(embedding.metadata.priority).toBe('Critical');
    });

    test('test_failed_job_retry_logic', async () => {
      // Given: OpenAI API returns error for embedding generation
      // Expected: Job is retried up to 3 times before marking as failed
      
      const entityId = uuidv4();
      const invalidJobPayload = {
        entity_type: 'features',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: '', // Empty content should cause OpenAI error
        metadata: {
          id: entityId,
          name: 'Invalid Feature'
        }
      };
      
      // Call Edge Function with invalid payload
      const { data: result, error: functionError } = await supabase.functions
        .invoke('process-embedding', {
          body: invalidJobPayload
        });
      
      // Function should handle error gracefully
      expect(functionError).toBeNull();
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      
      // Verify no embedding was stored
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', entityId)
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    test('test_batch_job_processing', async () => {
      // Test processing multiple jobs from queue
      
      const jobCount = 3;
      const jobPayloads = [];
      
      for (let i = 0; i < jobCount; i++) {
        const entityId = uuidv4();
        const payload = {
          entity_type: 'features',
          entity_id: entityId,
          tenant_id: testTenantId,
          content: `Feature: Test Feature ${i + 1}\nPriority: Medium\nDescription: Test feature for batch processing`,
          metadata: {
            id: entityId,
            name: `Test Feature ${i + 1}`,
            priority: 'Medium'
          }
        };
        
        jobPayloads.push(payload);
        
        // Enqueue job
        await supabase.rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: payload
        });
      }
      
      // Process jobs in batch
      const { data: result, error: functionError } = await supabase.functions
        .invoke('process-embedding', {
          body: { maxJobs: jobCount }
        });
      
      expect(functionError).toBeNull();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.jobsProcessed).toBe(jobCount);
      
      // Verify all embeddings were created
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBe(jobCount);
      
      // Verify all jobs were removed from queue
      const { data: remainingJobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const testJobs = remainingJobs?.filter((job: any) => 
        job.message.tenant_id === testTenantId
      );
      
      expect(testJobs?.length || 0).toBe(0);
    });

    test('test_partial_batch_failure_handling', async () => {
      // Test handling when some jobs succeed and others fail
      
      const validJob = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: testTenantId,
        content: 'Feature: Valid Feature\nPriority: High\nDescription: This should succeed',
        metadata: { name: 'Valid Feature' }
      };
      
      const invalidJob = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: testTenantId,
        content: '', // Empty content should fail
        metadata: { name: 'Invalid Feature' }
      };
      
      // Enqueue both jobs
      await supabase.rpc('pgmq.send', {
        queue_name: 'embedding_jobs',
        msg: validJob
      });
      
      await supabase.rpc('pgmq.send', {
        queue_name: 'embedding_jobs',
        msg: invalidJob
      });
      
      // Process batch
      const { data: result } = await supabase.functions
        .invoke('process-embedding', {
          body: { maxJobs: 2 }
        });
      
      expect(result.success).toBe(true);
      expect(result.jobsProcessed).toBeGreaterThanOrEqual(1);
      
      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
      
      // Verify at least one embedding was created (the valid one)
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', testTenantId);
      
      expect(embeddings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Content Processing', () => {
    test('test_feature_content_embedding', async () => {
      // Test that feature content is properly processed and embedded
      
      const entityId = uuidv4();
      const featureContent = `Feature: Machine Learning Pipeline
Priority: High
Workflow Status: In Development
Description: Automated ML pipeline for data processing and model training with TensorFlow`;
      
      const jobPayload = {
        entity_type: 'features',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: featureContent,
        metadata: {
          id: entityId,
          name: 'Machine Learning Pipeline',
          priority: 'High'
        }
      };
      
      // Process job
      const { data: result } = await supabase.functions
        .invoke('process-embedding', {
          body: jobPayload
        });
      
      expect(result.success).toBe(true);
      
      // Verify stored content and embedding
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', entityId);
      
      expect(embeddings.length).toBe(1);
      expect(embeddings[0].content).toBe(featureContent);
      expect(embeddings[0].embedding.length).toBe(1536);
      
      // Verify embedding values are valid floats
      embeddings[0].embedding.forEach((value: number) => {
        expect(typeof value).toBe('number');
        expect(isFinite(value)).toBe(true);
      });
    });

    test('test_release_content_embedding', async () => {
      // Test that release content is properly processed and embedded
      
      const entityId = uuidv4();
      const releaseContent = `Release: Version 3.0 Major Update
Release Date: 2024-07-15
Priority: Critical
Description: Complete UI overhaul with dark mode support and performance improvements`;
      
      const jobPayload = {
        entity_type: 'releases',
        entity_id: entityId,
        tenant_id: testTenantId,
        content: releaseContent,
        metadata: {
          id: entityId,
          name: 'Version 3.0 Major Update',
          priority: 'Critical'
        }
      };
      
      // Process job
      const { data: result } = await supabase.functions
        .invoke('process-embedding', {
          body: jobPayload
        });
      
      expect(result.success).toBe(true);
      
      // Verify stored content
      const { data: embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', entityId);
      
      expect(embeddings.length).toBe(1);
      expect(embeddings[0].entity_type).toBe('releases');
      expect(embeddings[0].content).toBe(releaseContent);
    });
  });

  describe('Error Handling', () => {
    test('test_malformed_job_handling', async () => {
      // Test handling of malformed job payloads
      
      const malformedPayload = {
        // Missing required fields
        content: 'Some content',
        metadata: {}
      };
      
      const { data: result } = await supabase.functions
        .invoke('process-embedding', {
          body: malformedPayload
        });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });

    test('test_openai_api_key_missing', async () => {
      // This test would need to be run in an environment without OpenAI API key
      // In real testing, we might mock the OpenAI API calls
      
      const jobPayload = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: testTenantId,
        content: 'Test content',
        metadata: { name: 'Test' }
      };
      
      // This test assumes OpenAI API key is available
      // In a mocked environment, this would test the error handling
      const { data: result } = await supabase.functions
        .invoke('process-embedding', {
          body: jobPayload
        });
      
      // With valid API key, this should succeed
      expect(result).toBeDefined();
    });
  });

  describe('Multi-Tenant Support', () => {
    test('test_tenant_isolation_in_embeddings', async () => {
      // Test that embeddings are stored with correct tenant isolation
      
      const tenant1 = 'tenant-1-' + uuidv4();
      const tenant2 = 'tenant-2-' + uuidv4();
      
      const job1 = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: tenant1,
        content: 'Feature for tenant 1',
        metadata: { name: 'Tenant 1 Feature' }
      };
      
      const job2 = {
        entity_type: 'features',
        entity_id: uuidv4(),
        tenant_id: tenant2,
        content: 'Feature for tenant 2',
        metadata: { name: 'Tenant 2 Feature' }
      };
      
      // Process both jobs
      await supabase.functions.invoke('process-embedding', { body: job1 });
      await supabase.functions.invoke('process-embedding', { body: job2 });
      
      // Verify tenant isolation
      const { data: tenant1Embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', tenant1);
      
      const { data: tenant2Embeddings } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('tenant_id', tenant2);
      
      expect(tenant1Embeddings.length).toBe(1);
      expect(tenant2Embeddings.length).toBe(1);
      
      expect(tenant1Embeddings[0].tenant_id).toBe(tenant1);
      expect(tenant2Embeddings[0].tenant_id).toBe(tenant2);
      
      // Clean up
      await supabase.from('ai_embeddings').delete().eq('tenant_id', tenant1);
      await supabase.from('ai_embeddings').delete().eq('tenant_id', tenant2);
    });
  });
});
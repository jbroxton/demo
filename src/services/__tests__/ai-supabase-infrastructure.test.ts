/**
 * Unit Tests: Supabase Auto-Embedding Infrastructure
 * 
 * Tests the PostgreSQL extensions, message queue, and utility functions
 * required for Supabase's native automatic embeddings system.
 */

import { supabase } from '@/services/supabase';

describe('AI Supabase Infrastructure Tests', () => {
  
  describe('PostgreSQL Extensions', () => {
    test('test_postgres_extensions_enabled', async () => {
      // Given: Auto-embedding setup is run
      // Expected: All required extensions (pgvector, pgmq, pg_net, pg_cron) are enabled
      
      const { data: extensions, error } = await supabase
        .rpc('check_extensions_enabled');
      
      expect(error).toBeNull();
      expect(extensions).toBeDefined();
      
      // Check for required extensions
      const requiredExtensions = ['vector', 'pgmq', 'pg_net', 'pg_cron'];
      const enabledExtensions = extensions.map((ext: any) => ext.extname);
      
      for (const requiredExt of requiredExtensions) {
        expect(enabledExtensions).toContain(requiredExt);
      }
    });
  });

  describe('Message Queue Infrastructure', () => {
    test('test_message_queue_created', async () => {
      // Given: Auto-embedding infrastructure is set up
      // Expected: Message queue table exists and can store embedding jobs
      
      // Check if embedding_jobs queue exists
      const { data: queues, error: queueError } = await supabase
        .rpc('pgmq.list_queues');
      
      expect(queueError).toBeNull();
      expect(queues).toBeDefined();
      expect(queues.map((q: any) => q.queue_name)).toContain('embedding_jobs');
      
      // Test sending a message to the queue
      const testJob = {
        entity_type: 'features',
        entity_id: 'test-feature-id',
        tenant_id: 'test-tenant',
        content: 'Test feature content',
        metadata: { test: true }
      };
      
      const { data: sendResult, error: sendError } = await supabase
        .rpc('pgmq.send', {
          queue_name: 'embedding_jobs',
          msg: testJob
        });
      
      expect(sendError).toBeNull();
      expect(sendResult).toBeDefined();
      
      // Read the message back to verify it was stored correctly
      const { data: messages, error: readError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 1
        });
      
      expect(readError).toBeNull();
      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].message).toMatchObject(testJob);
      
      // Clean up: delete the test message
      if (messages.length > 0) {
        await supabase.rpc('pgmq.delete', {
          queue_name: 'embedding_jobs',
          msg_id: messages[0].msg_id
        });
      }
    });
  });

  describe('Edge Function Integration', () => {
    test('test_edge_function_deployment', async () => {
      // Given: Edge Function is deployed to Supabase
      // Expected: Function can be invoked and generates embeddings successfully
      
      const testPayload = {
        entity_type: 'features',
        entity_id: 'test-feature-edge',
        tenant_id: 'test-tenant',
        content: 'Test feature for edge function processing',
        metadata: {
          id: 'test-feature-edge',
          name: 'Test Feature',
          priority: 'Medium'
        }
      };
      
      // Test direct edge function invocation
      const { data: functionResult, error: functionError } = await supabase.functions
        .invoke('process-embedding', {
          body: testPayload
        });
      
      expect(functionError).toBeNull();
      expect(functionResult).toBeDefined();
      expect(functionResult.success).toBe(true);
      
      // Verify embedding was stored in database
      const { data: embeddings, error: embeddingError } = await supabase
        .from('ai_embeddings')
        .select('*')
        .eq('entity_id', 'test-feature-edge')
        .eq('tenant_id', 'test-tenant');
      
      expect(embeddingError).toBeNull();
      expect(embeddings).toBeDefined();
      expect(embeddings.length).toBe(1);
      expect(embeddings[0].entity_type).toBe('features');
      expect(embeddings[0].embedding).toBeDefined();
      expect(Array.isArray(embeddings[0].embedding)).toBe(true);
      expect(embeddings[0].embedding.length).toBe(1536); // OpenAI text-embedding-3-small dimension
      
      // Clean up: delete test embedding
      await supabase
        .from('ai_embeddings')
        .delete()
        .eq('entity_id', 'test-feature-edge')
        .eq('tenant_id', 'test-tenant');
    });
  });

  describe('Utility Functions', () => {
    test('test_utility_functions_available', async () => {
      // Test that required utility functions are created and accessible
      
      // Test get_project_url function
      const { data: projectUrl, error: urlError } = await supabase
        .rpc('get_project_url');
      
      expect(urlError).toBeNull();
      expect(projectUrl).toBeDefined();
      expect(typeof projectUrl).toBe('string');
      
      // Test invoke_edge_function utility
      const { data: invokeResult, error: invokeError } = await supabase
        .rpc('invoke_edge_function', {
          function_name: 'process-embedding',
          payload: { test: true }
        });
      
      expect(invokeError).toBeNull();
      expect(typeof invokeResult).toBe('boolean');
    });

    test('test_embedding_queue_status_view', async () => {
      // Test that monitoring view is available and functional
      
      const { data: queueStatus, error: statusError } = await supabase
        .from('embedding_queue_status')
        .select('*');
      
      expect(statusError).toBeNull();
      expect(queueStatus).toBeDefined();
      expect(Array.isArray(queueStatus)).toBe(true);
      
      // Should have at least one row for the embedding_jobs queue
      const embeddingQueueStatus = queueStatus.find(
        (status: any) => status.queue_name === 'embedding_jobs'
      );
      
      expect(embeddingQueueStatus).toBeDefined();
      expect(embeddingQueueStatus).toHaveProperty('queue_length');
      expect(embeddingQueueStatus).toHaveProperty('total_messages');
    });
  });

  describe('Database Triggers Setup', () => {
    test('test_trigger_functions_created', async () => {
      // Test that trigger functions are properly created
      
      const { data: functions, error: functionError } = await supabase
        .rpc('check_trigger_functions');
      
      expect(functionError).toBeNull();
      expect(functions).toBeDefined();
      
      const functionNames = functions.map((f: any) => f.proname);
      expect(functionNames).toContain('enqueue_embedding_job');
      expect(functionNames).toContain('clear_embedding_on_update');
      expect(functionNames).toContain('process_embedding_queue');
    });

    test('test_triggers_attached_to_tables', async () => {
      // Test that triggers are properly attached to features and releases tables
      
      const { data: triggers, error: triggerError } = await supabase
        .rpc('check_table_triggers');
      
      expect(triggerError).toBeNull();
      expect(triggers).toBeDefined();
      
      const triggerNames = triggers.map((t: any) => t.trigger_name);
      
      // Check features table triggers
      expect(triggerNames).toContain('features_enqueue_embedding_trigger');
      expect(triggerNames).toContain('features_clear_embedding_trigger');
      
      // Check releases table triggers
      expect(triggerNames).toContain('releases_enqueue_embedding_trigger');
      expect(triggerNames).toContain('releases_clear_embedding_trigger');
    });
  });

  describe('Cron Job Configuration', () => {
    test('test_cron_job_scheduled', async () => {
      // Test that cron job is properly scheduled
      
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
    });
  });

  describe('Performance Indexes', () => {
    test('test_performance_indexes_created', async () => {
      // Test that performance indexes are created for ai_embeddings table
      
      const { data: indexes, error: indexError } = await supabase
        .rpc('check_table_indexes', { table_name: 'ai_embeddings' });
      
      expect(indexError).toBeNull();
      expect(indexes).toBeDefined();
      
      const indexNames = indexes.map((idx: any) => idx.indexname);
      
      // Check for tenant/entity index
      expect(indexNames.some((name: string) => 
        name.includes('tenant') && name.includes('entity')
      )).toBe(true);
      
      // Check for vector search index
      expect(indexNames.some((name: string) => 
        name.includes('embedding') && name.includes('ivfflat')
      )).toBe(true);
    });
  });
});

// Helper functions for SQL RPC calls that might not exist yet
// These would be created as part of the migration for testing purposes

const testHelperFunctions = `
-- Helper function to check enabled extensions
CREATE OR REPLACE FUNCTION check_extensions_enabled()
RETURNS TABLE(extname text)
LANGUAGE sql
AS $$
  SELECT extname FROM pg_extension 
  WHERE extname IN ('vector', 'pgmq', 'pg_net', 'pg_cron');
$$;

-- Helper function to check trigger functions
CREATE OR REPLACE FUNCTION check_trigger_functions()
RETURNS TABLE(proname text)
LANGUAGE sql
AS $$
  SELECT proname FROM pg_proc 
  WHERE proname IN ('enqueue_embedding_job', 'clear_embedding_on_update', 'process_embedding_queue');
$$;

-- Helper function to check table triggers
CREATE OR REPLACE FUNCTION check_table_triggers()
RETURNS TABLE(trigger_name text, table_name text)
LANGUAGE sql
AS $$
  SELECT tgname, relname FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE tgname LIKE '%embedding%';
$$;

-- Helper function to check cron jobs
CREATE OR REPLACE FUNCTION check_cron_jobs()
RETURNS TABLE(jobname text, schedule text, command text)
LANGUAGE sql
AS $$
  SELECT jobname, schedule, command FROM cron.job
  WHERE jobname = 'process-embedding-queue';
$$;

-- Helper function to check table indexes
CREATE OR REPLACE FUNCTION check_table_indexes(table_name text)
RETURNS TABLE(indexname text, indexdef text)
LANGUAGE sql
AS $$
  SELECT indexname, indexdef FROM pg_indexes
  WHERE tablename = table_name;
$$;
`;
/**
 * Unit Tests: Database Triggers for Auto-Embedding
 * 
 * Tests PostgreSQL triggers that automatically detect changes in Features/Releases
 * and enqueue embedding jobs in the message queue.
 */

import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';

describe('AI Database Triggers Tests', () => {
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
      .from('features')
      .delete()
      .eq('tenant_id', testTenantId);
      
    await supabase
      .from('releases')
      .delete()
      .eq('tenant_id', testTenantId);
      
    await supabase
      .from('ai_embeddings')
      .delete()
      .eq('tenant_id', testTenantId);
  });

  describe('Feature Triggers', () => {
    test('test_feature_insert_enqueues_job', async () => {
      // Given: A new feature is created via API
      // Expected: Embedding job is automatically enqueued in message queue
      
      const featureId = uuidv4();
      const testFeature = {
        id: featureId,
        tenant_id: testTenantId,
        name: 'Test Authentication Feature',
        description: 'OAuth integration with social login',
        priority: 'High',
        workflow_status: 'Active'
      };
      
      // Insert feature
      const { data: feature, error: insertError } = await supabase
        .from('features')
        .insert(testFeature)
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(feature).toBeDefined();
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that embedding job was enqueued
      const { data: jobs, error: queueError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      expect(queueError).toBeNull();
      expect(jobs).toBeDefined();
      
      // Find the job for our feature
      const featureJob = jobs.find((job: any) => 
        job.message.entity_id === featureId &&
        job.message.entity_type === 'features'
      );
      
      expect(featureJob).toBeDefined();
      expect(featureJob.message.tenant_id).toBe(testTenantId);
      expect(featureJob.message.content).toContain('Test Authentication Feature');
      expect(featureJob.message.content).toContain('High');
      expect(featureJob.message.content).toContain('OAuth integration');
      expect(featureJob.message.metadata.name).toBe('Test Authentication Feature');
      
      // Clean up job
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: featureJob.msg_id
      });
    });

    test('test_feature_update_conditional_enqueue', async () => {
      // Given: Feature is updated but only updated_at changes
      // Expected: No embedding job is enqueued (content unchanged)
      
      const featureId = uuidv4();
      const testFeature = {
        id: featureId,
        tenant_id: testTenantId,
        name: 'Stable Feature',
        description: 'This feature will not change content',
        priority: 'Medium'
      };
      
      // Insert feature
      await supabase
        .from('features')
        .insert(testFeature);
      
      // Wait and clear any initial jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
      
      // Update only non-content field (updated_at will change automatically)
      const { error: updateError } = await supabase
        .from('features')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', featureId);
      
      expect(updateError).toBeNull();
      
      // Wait for potential trigger execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that no new jobs were enqueued
      const { data: jobs, error: queueError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      expect(queueError).toBeNull();
      expect(jobs).toBeDefined();
      
      // Should find no jobs for this feature
      const featureJobs = jobs.filter((job: any) => 
        job.message.entity_id === featureId
      );
      
      expect(featureJobs.length).toBe(0);
    });

    test('test_content_change_enqueues_job', async () => {
      // Given: Feature description is updated from "Auth system" to "Authentication module"
      // Expected: Embedding job is enqueued with new content
      
      const featureId = uuidv4();
      const testFeature = {
        id: featureId,
        tenant_id: testTenantId,
        name: 'Auth Feature',
        description: 'Auth system',
        priority: 'High'
      };
      
      // Insert feature
      await supabase
        .from('features')
        .insert(testFeature);
      
      // Wait and clear initial jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
      
      // Update content (description)
      const { error: updateError } = await supabase
        .from('features')
        .update({ description: 'Authentication module' })
        .eq('id', featureId);
      
      expect(updateError).toBeNull();
      
      // Wait for trigger execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that new job was enqueued
      const { data: jobs, error: queueError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      expect(queueError).toBeNull();
      expect(jobs).toBeDefined();
      
      const featureJob = jobs.find((job: any) => 
        job.message.entity_id === featureId
      );
      
      expect(featureJob).toBeDefined();
      expect(featureJob.message.content).toContain('Authentication module');
      expect(featureJob.message.content).not.toContain('Auth system');
      
      // Clean up job
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: featureJob.msg_id
      });
    });
  });

  describe('Release Triggers', () => {
    test('test_release_insert_enqueues_job', async () => {
      // Given: A new release is created via API
      // Expected: Embedding job is automatically enqueued in message queue
      
      const releaseId = uuidv4();
      const testRelease = {
        id: releaseId,
        tenant_id: testTenantId,
        name: 'Version 2.0 Release',
        description: 'Major feature update with new authentication',
        priority: 'Critical',
        release_date: '2024-06-01'
      };
      
      // Insert release
      const { data: release, error: insertError } = await supabase
        .from('releases')
        .insert(testRelease)
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(release).toBeDefined();
      
      // Wait for trigger execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that embedding job was enqueued
      const { data: jobs, error: queueError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      expect(queueError).toBeNull();
      expect(jobs).toBeDefined();
      
      const releaseJob = jobs.find((job: any) => 
        job.message.entity_id === releaseId &&
        job.message.entity_type === 'releases'
      );
      
      expect(releaseJob).toBeDefined();
      expect(releaseJob.message.tenant_id).toBe(testTenantId);
      expect(releaseJob.message.content).toContain('Version 2.0 Release');
      expect(releaseJob.message.content).toContain('Critical');
      expect(releaseJob.message.content).toContain('2024-06-01');
      expect(releaseJob.message.metadata.name).toBe('Version 2.0 Release');
      
      // Clean up job
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: releaseJob.msg_id
      });
    });

    test('test_release_name_change_enqueues_job', async () => {
      // Given: Release name is updated
      // Expected: Embedding job is enqueued with new content
      
      const releaseId = uuidv4();
      const testRelease = {
        id: releaseId,
        tenant_id: testTenantId,
        name: 'Beta Release',
        description: 'Pre-release version',
        priority: 'Medium'
      };
      
      // Insert release
      await supabase
        .from('releases')
        .insert(testRelease);
      
      // Wait and clear initial jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.rpc('pgmq.purge', { queue_name: 'embedding_jobs' });
      
      // Update name
      const { error: updateError } = await supabase
        .from('releases')
        .update({ name: 'Production Release' })
        .eq('id', releaseId);
      
      expect(updateError).toBeNull();
      
      // Wait for trigger execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that new job was enqueued
      const { data: jobs, error: queueError } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      expect(queueError).toBeNull();
      expect(jobs).toBeDefined();
      
      const releaseJob = jobs.find((job: any) => 
        job.message.entity_id === releaseId
      );
      
      expect(releaseJob).toBeDefined();
      expect(releaseJob.message.content).toContain('Production Release');
      expect(releaseJob.message.content).not.toContain('Beta Release');
      
      // Clean up job
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: releaseJob.msg_id
      });
    });
  });

  describe('Trigger Content Formatting', () => {
    test('test_feature_content_format', async () => {
      // Test that trigger formats feature content correctly for embedding
      
      const featureId = uuidv4();
      const testFeature = {
        id: featureId,
        tenant_id: testTenantId,
        name: 'Payment Processing',
        description: 'Stripe integration for payments',
        priority: 'High',
        workflow_status: 'In Progress'
      };
      
      await supabase
        .from('features')
        .insert(testFeature);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: jobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const featureJob = jobs.find((job: any) => 
        job.message.entity_id === featureId
      );
      
      expect(featureJob).toBeDefined();
      
      const content = featureJob.message.content;
      expect(content).toMatch(/Feature:\s*Payment Processing/);
      expect(content).toMatch(/Priority:\s*High/);
      expect(content).toMatch(/Workflow Status:\s*In Progress/);
      expect(content).toMatch(/Description:\s*Stripe integration for payments/);
      
      // Clean up
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: featureJob.msg_id
      });
    });

    test('test_release_content_format', async () => {
      // Test that trigger formats release content correctly for embedding
      
      const releaseId = uuidv4();
      const testRelease = {
        id: releaseId,
        tenant_id: testTenantId,
        name: 'Q2 2024 Release',
        description: 'Quarterly feature rollout',
        priority: 'High',
        release_date: '2024-06-30'
      };
      
      await supabase
        .from('releases')
        .insert(testRelease);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: jobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const releaseJob = jobs.find((job: any) => 
        job.message.entity_id === releaseId
      );
      
      expect(releaseJob).toBeDefined();
      
      const content = releaseJob.message.content;
      expect(content).toMatch(/Release:\s*Q2 2024 Release/);
      expect(content).toMatch(/Priority:\s*High/);
      expect(content).toMatch(/Release Date:\s*2024-06-30/);
      expect(content).toMatch(/Description:\s*Quarterly feature rollout/);
      
      // Clean up
      await supabase.rpc('pgmq.delete', {
        queue_name: 'embedding_jobs',
        msg_id: releaseJob.msg_id
      });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    test('test_tenant_isolation_in_jobs', async () => {
      // Test that jobs include correct tenant_id for isolation
      
      const tenant1 = 'tenant-1-' + uuidv4();
      const tenant2 = 'tenant-2-' + uuidv4();
      
      const feature1 = {
        id: uuidv4(),
        tenant_id: tenant1,
        name: 'Tenant 1 Feature',
        description: 'Feature for tenant 1'
      };
      
      const feature2 = {
        id: uuidv4(),
        tenant_id: tenant2,
        name: 'Tenant 2 Feature',
        description: 'Feature for tenant 2'
      };
      
      // Insert features for both tenants
      await supabase.from('features').insert([feature1, feature2]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: jobs } = await supabase
        .rpc('pgmq.read', {
          queue_name: 'embedding_jobs',
          vt: 10,
          qty: 10
        });
      
      const tenant1Job = jobs.find((job: any) => 
        job.message.entity_id === feature1.id
      );
      const tenant2Job = jobs.find((job: any) => 
        job.message.entity_id === feature2.id
      );
      
      expect(tenant1Job).toBeDefined();
      expect(tenant1Job.message.tenant_id).toBe(tenant1);
      
      expect(tenant2Job).toBeDefined();
      expect(tenant2Job.message.tenant_id).toBe(tenant2);
      
      // Clean up
      await supabase.from('features').delete().eq('tenant_id', tenant1);
      await supabase.from('features').delete().eq('tenant_id', tenant2);
      
      for (const job of jobs) {
        await supabase.rpc('pgmq.delete', {
          queue_name: 'embedding_jobs',
          msg_id: job.msg_id
        });
      }
    });
  });
});
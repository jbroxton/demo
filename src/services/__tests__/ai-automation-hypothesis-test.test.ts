/// <reference types="jest" />

/**
 * Unit Test: AI Auto-Embedding Automation Hypothesis Validation
 * 
 * Purpose: Test hypothesis about why auto-embedding automation is not working
 * 
 * Hypothesis: Edge Functions service requires manual startup in local development,
 * preventing fully automated embedding generation despite all infrastructure being in place.
 */

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('AI Auto-Embedding Automation Hypothesis Test', () => {
  let testFeatureId: string;

  /**
   * Helper function to make API calls
   */
  async function apiCall(endpoint: string, options: any = {}) {
    const url = `${SUPABASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  }

  beforeAll(async () => {
    // Ensure clean test environment
    console.log('Setting up automation hypothesis test...');
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (testFeatureId) {
      await apiCall(`/rest/v1/features?id=eq.${testFeatureId}`, { method: 'DELETE' });
    }
  });

  /**
   * Test 1: Verify Infrastructure Components Are Present
   * Tests that all required components for automation exist
   */
  it('should verify all infrastructure components exist', async () => {
    // Test 1a: Check if database triggers exist
    const { response: triggerResponse, data: triggers } = await apiCall(
      `/rest/v1/rpc/check_triggers`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    
    expect(triggerResponse.ok).toBe(true);
    // Should have features_enqueue_embedding_trigger and features_clear_embedding_trigger
    
    // Test 1b: Check if cron job exists
    const { response: cronResponse, data: cronJobs } = await apiCall(
      `/rest/v1/rpc/check_cron_jobs`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    
    expect(cronResponse.ok).toBe(true);
    // Should have process-embedding-queue job scheduled
    
    // Test 1c: Check if message queue exists
    const { response: queueResponse, data: queueStatus } = await apiCall(
      `/rest/v1/embedding_queue_status`
    );
    
    expect(queueResponse.ok).toBe(true);
    expect(queueStatus).toBeDefined();
  });

  /**
   * Test 2: Test Edge Function Availability (Core Hypothesis)
   * This tests the main hypothesis: Edge Functions service must be manually started
   */
  it('should test Edge Function service availability', async () => {
    // Test direct Edge Function call
    const testPayload = {
      entity_type: 'feature',
      entity_id: 'test-feature-id',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      content: 'Test feature for automation validation',
      metadata: { name: 'Test Feature', priority: 'high' }
    };

    const { response: edgeResponse, data: edgeResult } = await apiCall(
      '/functions/v1/process-embedding',
      {
        method: 'POST',
        body: JSON.stringify(testPayload)
      }
    );

    // HYPOTHESIS: This will fail if Edge Functions service is not running
    // SUCCESS: Edge Functions service is available and processing requests
    // FAILURE: Edge Functions service is not started (validates hypothesis)
    
    if (!edgeResponse.ok) {
      console.log('HYPOTHESIS CONFIRMED: Edge Function service not available');
      console.log('Response status:', edgeResponse.status);
      console.log('Error:', edgeResult);
      
      // This confirms our hypothesis
      expect(edgeResponse.status).toBe(404); // Service not found/available
    } else {
      console.log('HYPOTHESIS REJECTED: Edge Function service is available');
      expect(edgeResponse.ok).toBe(true);
      expect(edgeResult.success).toBeDefined();
    }
  });

  /**
   * Test 3: Test Full Automation Pipeline
   * Create a feature and verify if it gets automatically processed
   */
  it('should test complete automation pipeline end-to-end', async () => {
    // Step 1: Create a test feature
    const testFeature = {
      tenant_id: '22222222-2222-2222-2222-222222222222',
      interface_id: '35000000-0000-0000-0000-000000000001',
      name: `AUTOMATION TEST ${Date.now()}`,
      description: 'Testing full automation pipeline for hypothesis validation',
      priority: 'high'
    };

    const { response: createResponse, data: createdFeature } = await apiCall(
      '/rest/v1/features',
      {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(testFeature)
      }
    );

    expect(createResponse.ok).toBe(true);
    expect(createdFeature[0]).toBeDefined();
    testFeatureId = createdFeature[0].id;

    // Step 2: Wait for trigger to enqueue job (immediate)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check if job was queued
    const { response: queueResponse, data: queueJobs } = await apiCall(
      '/rest/v1/rpc/pgmq_read',
      {
        method: 'POST',
        body: JSON.stringify({
          queue_name: 'embedding_jobs',
          vt: 1,
          qty: 10
        })
      }
    );

    expect(queueResponse.ok).toBe(true);
    
    const ourJob = queueJobs.find((job: any) => 
      job.message && job.message.entity_id === testFeatureId
    );

    if (ourJob) {
      console.log('✅ Job successfully queued by trigger');
      
      // Step 4: Wait for cron job to process (up to 60 seconds)
      let embeddingCreated = false;
      let attempts = 0;
      const maxAttempts = 6; // 60 seconds / 10 second intervals

      while (!embeddingCreated && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;

        const { response: embeddingResponse, data: embeddings } = await apiCall(
          `/rest/v1/ai_embeddings?select=id,created_at&entity_id=eq.${testFeatureId}`
        );

        if (embeddingResponse.ok && embeddings && embeddings.length > 0) {
          embeddingCreated = true;
          console.log('✅ AUTOMATION SUCCESSFUL: Embedding created automatically');
        } else {
          console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Waiting for automation...`);
        }
      }

      if (!embeddingCreated) {
        console.log('❌ AUTOMATION FAILED: Embedding not created after 60 seconds');
        console.log('HYPOTHESIS: Edge Functions service not running or container networking issue');
        
        // Check if job is still in queue (indicates cron job can't reach Edge Function)
        const { response: finalQueueResponse, data: finalQueueJobs } = await apiCall(
          '/rest/v1/rpc/pgmq_read',
          {
            method: 'POST',
            body: JSON.stringify({
              queue_name: 'embedding_jobs',
              vt: 1,
              qty: 10
            })
          }
        );

        const stillInQueue = finalQueueJobs.find((job: any) => 
          job.message && job.message.entity_id === testFeatureId
        );

        if (stillInQueue) {
          console.log(`Job still in queue with read_ct: ${stillInQueue.read_ct}`);
          console.log('CONFIRMED HYPOTHESIS: Cron job running but cannot reach Edge Function');
          expect(stillInQueue.read_ct).toBeGreaterThan(1); // Job attempted multiple times
        }
      }

      expect(embeddingCreated).toBe(true);
    } else {
      console.log('❌ Job not queued - trigger issue');
      expect(ourJob).toBeDefined();
    }
  });

  /**
   * Test 4: Test Manual Trigger vs Automatic Trigger
   * Compare manual processing vs automatic processing
   */
  it('should compare manual vs automatic processing', async () => {
    // Test manual processing (should work if Edge Functions are running)
    const { response: manualResponse, data: manualResult } = await apiCall(
      '/rest/v1/rpc/process_embedding_queue',
      { method: 'POST', body: JSON.stringify({}) }
    );

    expect(manualResponse.ok).toBe(true);
    console.log(`Manual processing result: processed ${manualResult} jobs`);

    if (manualResult > 0) {
      console.log('✅ Manual processing works - Edge Functions are available');
      console.log('❌ Automatic processing fails - likely cron job networking issue');
    } else {
      console.log('ℹ️ No jobs in queue for manual processing');
    }

    // The difference between manual success and automatic failure indicates
    // the issue is in the cron job's ability to reach the Edge Function,
    // not in the Edge Function itself
  });

  /**
   * Test 5: Validate Environment Configuration
   * Check if Edge Function has required environment variables
   */
  it('should validate Edge Function environment configuration', async () => {
    const testPayload = {
      entity_type: 'feature',
      entity_id: 'env-test-feature-id',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      content: 'Environment validation test',
      metadata: { name: 'Env Test', priority: 'low' }
    };

    const { response, data } = await apiCall(
      '/functions/v1/process-embedding',
      {
        method: 'POST',
        body: JSON.stringify(testPayload)
      }
    );

    if (response.ok) {
      // Check if the response indicates OpenAI API key issues
      if (data.success && data.success.error && data.success.error.includes('OpenAI API key')) {
        console.log('❌ CONFIGURATION ISSUE: OpenAI API key not available to Edge Function');
        console.log('SOLUTION: Restart Edge Functions with --env-file supabase/.env');
        expect(data.success.error).toContain('OpenAI API key');
      } else if (data.success && data.success.success === true) {
        console.log('✅ Environment properly configured');
        expect(data.success.success).toBe(true);
      }
    }
  });
});

/**
 * EXPECTED OUTCOMES AND HYPOTHESIS VALIDATION:
 * 
 * If Edge Functions service is NOT running:
 * - Test 2 will fail with 404/connection error
 * - Test 3 will show jobs queued but never processed
 * - Test 4 will show manual processing fails
 * - HYPOTHESIS CONFIRMED: Manual service startup required
 * 
 * If Edge Functions service IS running but environment not configured:
 * - Test 2 will succeed but return OpenAI API key error
 * - Test 5 will detect configuration issue
 * - HYPOTHESIS: Service available but environment loading issue
 * 
 * If Edge Functions service IS running and properly configured:
 * - All tests should pass
 * - HYPOTHESIS REJECTED: Automation should be working
 * - Look for other issues (cron job configuration, networking)
 * 
 * If Cron job cannot reach Edge Functions (networking):
 * - Test 2 (direct call) succeeds
 * - Test 3 shows jobs queued but not processed automatically  
 * - Test 4 manual processing succeeds
 * - HYPOTHESIS: Container networking issue between database and Edge Functions
 */
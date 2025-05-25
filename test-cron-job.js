#!/usr/bin/env node

/**
 * Unit Tests for Cron Job Auto-Embedding Pipeline
 * 
 * This script tests the complete cron job automation:
 * 1. Create a feature (triggers database trigger)
 * 2. Verify job is queued
 * 3. Wait for cron job to process (30 seconds)
 * 4. Verify job is removed from queue
 * 5. Verify embedding is created in database
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🕐 Cron Job Auto-Embedding Pipeline Tests');
console.log('==========================================\n');

/**
 * Helper function to make API calls
 */
async function apiCall(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

/**
 * Test 1: Create Feature and Verify Queue Trigger
 */
async function testFeatureCreationAndQueue() {
  console.log('📝 Test 1: Feature Creation → Queue Trigger');
  
  // Create a unique test feature
  const testFeature = {
    tenant_id: '22222222-2222-2222-2222-222222222222',
    interface_id: '35000000-0000-0000-0000-000000000001',
    name: `CRON TEST ${Date.now()}`,
    description: 'Testing cron job automation pipeline end-to-end',
    priority: 'high'
  };
  
  console.log(`   Creating feature: ${testFeature.name}`);
  
  // Create the feature
  const { response: createResponse, data: createdFeature } = await apiCall('/rest/v1/features', {
    method: 'POST',
    headers: { 
      'Prefer': 'return=representation',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testFeature)
  });
  
  if (!createResponse.ok || !createdFeature[0]) {
    console.log('   ❌ FAIL - Could not create feature');
    console.log(`   Error: ${JSON.stringify(createdFeature)}`);
    return null;
  }
  
  const feature = createdFeature[0];
  console.log(`   ✅ Feature created with ID: ${feature.id}`);
  
  // Check if job was queued (wait a moment for trigger to execute)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { response: queueResponse, data: queueJobs } = await apiCall('/rest/v1/rpc/pgmq_read', {
    method: 'POST',
    body: JSON.stringify({
      queue_name: 'embedding_jobs',
      vt: 1,
      qty: 10
    })
  });
  
  if (!queueResponse.ok) {
    console.log('   ❌ FAIL - Could not check queue');
    return null;
  }
  
  // Look for our specific feature in the queue
  const ourJob = queueJobs.find(job => 
    job.message && job.message.entity_id === feature.id
  );
  
  if (ourJob) {
    console.log(`   ✅ Job queued successfully with msg_id: ${ourJob.msg_id}`);
    console.log(`   📄 Job content: ${ourJob.message.content.substring(0, 50)}...`);
    return { feature, job: ourJob };
  } else {
    console.log('   ❌ FAIL - Job not found in queue');
    console.log(`   Available jobs: ${queueJobs.length}`);
    return null;
  }
}

/**
 * Test 2: Wait for Cron Job Processing
 */
async function testCronJobProcessing(featureId, jobId) {
  console.log('\n⏱️  Test 2: Cron Job Processing (waiting 35 seconds)');
  console.log(`   Monitoring feature: ${featureId}`);
  console.log(`   Monitoring job: ${jobId}`);
  
  // Wait for cron job to run (30 seconds interval + buffer)
  console.log('   Waiting for cron job to process...');
  
  for (let i = 35; i > 0; i--) {
    process.stdout.write(`\r   ⏳ ${i} seconds remaining...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n   ✅ Wait complete - checking results...');
  return true;
}

/**
 * Test 3: Verify Job Removal from Queue
 */
async function testJobRemoval(originalJobId) {
  console.log('\n🗑️  Test 3: Job Removal from Queue');
  
  const { response, data: queueJobs } = await apiCall('/rest/v1/rpc/pgmq_read', {
    method: 'POST',
    body: JSON.stringify({
      queue_name: 'embedding_jobs',
      vt: 1,
      qty: 10
    })
  });
  
  if (!response.ok) {
    console.log('   ❌ FAIL - Could not check queue');
    return false;
  }
  
  // Check if our job is still in the queue
  const stillInQueue = queueJobs.find(job => job.msg_id === originalJobId);
  
  if (stillInQueue) {
    console.log(`   ❌ FAIL - Job ${originalJobId} still in queue`);
    console.log(`   Job read count: ${stillInQueue.read_ct}`);
    console.log(`   This suggests cron job failed to process it`);
    return false;
  } else {
    console.log(`   ✅ PASS - Job ${originalJobId} removed from queue`);
    console.log(`   Queue now contains ${queueJobs.length} jobs`);
    return true;
  }
}

/**
 * Test 4: Verify Embedding Creation
 */
async function testEmbeddingCreation(featureId) {
  console.log('\n💾 Test 4: Embedding Storage Verification');
  
  const { response, data: embeddings } = await apiCall(
    `/rest/v1/ai_embeddings?select=id,entity_id,content,created_at&entity_id=eq.${featureId}`
  );
  
  if (!response.ok) {
    console.log('   ❌ FAIL - Could not check embeddings table');
    return false;
  }
  
  if (embeddings && embeddings.length > 0) {
    const embedding = embeddings[0];
    console.log(`   ✅ PASS - Embedding created successfully`);
    console.log(`   📄 Embedding ID: ${embedding.id}`);
    console.log(`   📄 Content: ${embedding.content.substring(0, 50)}...`);
    console.log(`   📄 Created: ${embedding.created_at}`);
    return true;
  } else {
    console.log('   ❌ FAIL - No embedding found for feature');
    console.log(`   Feature ID searched: ${featureId}`);
    return false;
  }
}

/**
 * Test 5: Verify Cron Job Status
 */
async function testCronJobStatus() {
  console.log('\n⚙️  Test 5: Cron Job Status Check');
  
  try {
    // Test manual queue processing to verify the function works
    const { response, data: result } = await apiCall('/rest/v1/rpc/process_embedding_queue', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      console.log(`   ✅ Queue processing function works`);
      console.log(`   📊 Processed ${result} jobs when called manually`);
      return true;
    } else {
      console.log('   ❌ FAIL - Queue processing function error');
      console.log(`   Error: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ FAIL - Could not test queue processing function');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: End-to-End Performance Test
 */
async function testEndToEndPerformance() {
  console.log('\n🚀 Test 6: End-to-End Performance Timing');
  
  const startTime = Date.now();
  
  // Create feature
  const testFeature = {
    tenant_id: '22222222-2222-2222-2222-222222222222',
    interface_id: '35000000-0000-0000-0000-000000000001',
    name: `PERFORMANCE TEST ${Date.now()}`,
    description: 'Testing end-to-end performance of automated embedding pipeline',
    priority: 'medium'
  };
  
  console.log('   Creating feature...');
  const { response: createResponse, data: createdFeature } = await apiCall('/rest/v1/features', {
    method: 'POST',
    headers: { 
      'Prefer': 'return=representation',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testFeature)
  });
  
  if (!createResponse.ok) {
    console.log('   ❌ FAIL - Could not create performance test feature');
    return false;
  }
  
  const feature = createdFeature[0];
  const featureCreatedTime = Date.now();
  
  // Wait and check for embedding creation
  console.log('   Waiting for automated processing...');
  let embeddingFound = false;
  let checkCount = 0;
  const maxChecks = 12; // Check for 2 minutes (12 * 10 seconds)
  
  while (!embeddingFound && checkCount < maxChecks) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    checkCount++;
    
    const { response, data: embeddings } = await apiCall(
      `/rest/v1/ai_embeddings?select=id,created_at&entity_id=eq.${feature.id}`
    );
    
    if (response.ok && embeddings && embeddings.length > 0) {
      embeddingFound = true;
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const processingTime = endTime - featureCreatedTime;
      
      console.log(`   ✅ PASS - End-to-end automation successful`);
      console.log(`   ⏱️  Total time: ${totalTime}ms (${Math.round(totalTime/1000)}s)`);
      console.log(`   ⏱️  Processing time: ${processingTime}ms (${Math.round(processingTime/1000)}s)`);
      console.log(`   🔄 Checks performed: ${checkCount}`);
      return true;
    }
    
    process.stdout.write(`\r   ⏳ Check ${checkCount}/${maxChecks} - waiting...`);
  }
  
  if (!embeddingFound) {
    console.log('\n   ❌ FAIL - Embedding not created within 2 minutes');
    console.log(`   Feature ID: ${feature.id}`);
    return false;
  }
}

/**
 * Run All Cron Tests
 */
async function runAllCronTests() {
  console.log('Starting Cron Job Auto-Embedding Tests...\n');
  
  let overallResults = {
    passed: 0,
    total: 0,
    details: []
  };
  
  // Test 1: Feature Creation and Queue
  console.log('='.repeat(50));
  const featureData = await testFeatureCreationAndQueue();
  overallResults.total++;
  if (featureData) {
    overallResults.passed++;
    overallResults.details.push({ name: 'Feature Creation → Queue', passed: true });
    
    // Test 2: Wait for Processing
    await testCronJobProcessing(featureData.feature.id, featureData.job.msg_id);
    
    // Test 3: Job Removal
    console.log('='.repeat(50));
    const jobRemoved = await testJobRemoval(featureData.job.msg_id);
    overallResults.total++;
    if (jobRemoved) overallResults.passed++;
    overallResults.details.push({ name: 'Job Removal from Queue', passed: jobRemoved });
    
    // Test 4: Embedding Creation
    console.log('='.repeat(50));
    const embeddingCreated = await testEmbeddingCreation(featureData.feature.id);
    overallResults.total++;
    if (embeddingCreated) overallResults.passed++;
    overallResults.details.push({ name: 'Embedding Creation', passed: embeddingCreated });
  } else {
    overallResults.details.push({ name: 'Feature Creation → Queue', passed: false });
  }
  
  // Test 5: Cron Job Status
  console.log('='.repeat(50));
  const cronStatus = await testCronJobStatus();
  overallResults.total++;
  if (cronStatus) overallResults.passed++;
  overallResults.details.push({ name: 'Cron Job Function Status', passed: cronStatus });
  
  // Test 6: Performance Test
  console.log('='.repeat(50));
  const performanceTest = await testEndToEndPerformance();
  overallResults.total++;
  if (performanceTest) overallResults.passed++;
  overallResults.details.push({ name: 'End-to-End Performance', passed: performanceTest });
  
  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 CRON JOB TEST RESULTS');
  console.log('='.repeat(50));
  
  overallResults.details.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${overallResults.passed}/${overallResults.total} tests passed`);
  
  if (overallResults.passed === overallResults.total) {
    console.log('🎉 ALL TESTS PASSED! Cron job automation is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. The automation pipeline needs debugging.');
  }
  
  return overallResults;
}

// Run tests if called directly
if (require.main === module) {
  runAllCronTests().catch(console.error);
}

module.exports = { runAllCronTests };
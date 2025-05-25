#!/usr/bin/env node

/**
 * Unit Tests for process-embedding Edge Function
 * 
 * This script tests the Edge Function step by step to isolate issues:
 * 1. Environment variables availability
 * 2. OpenAI API connectivity 
 * 3. Supabase client connection
 * 4. Embedding generation
 * 5. Database storage
 * 6. End-to-end pipeline
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/process-embedding`;

console.log('🧪 Edge Function Unit Tests');
console.log('===========================\n');

/**
 * Test 1: Environment Variables
 */
async function testEnvironmentVariables() {
  console.log('📋 Test 1: Environment Variables');
  
  const tests = [
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: SUPABASE_SERVICE_ROLE_KEY },
    { name: 'SUPABASE_URL', value: SUPABASE_URL },
  ];
  
  let passed = 0;
  tests.forEach(test => {
    const status = test.value ? '✅ PASS' : '❌ FAIL';
    const display = test.value ? 'Available' : 'Missing';
    console.log(`   ${test.name}: ${status} (${display})`);
    if (test.value) passed++;
  });
  
  console.log(`   Result: ${passed}/${tests.length} tests passed\n`);
  return passed === tests.length;
}

/**
 * Test 2: Edge Function Basic Connectivity  
 */
async function testEdgeFunctionConnectivity() {
  console.log('🌐 Test 2: Edge Function Connectivity');
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true,
        entity_type: 'test',
        entity_id: 'test-connectivity-123',
        tenant_id: '22222222-2222-2222-2222-222222222222',
        content: 'Test connectivity',
        metadata: { test: true }
      })
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (response.ok) {
      console.log('   Result: ✅ PASS - Edge Function is reachable\n');
      return true;
    } else {
      console.log('   Result: ❌ FAIL - Edge Function returned error\n');
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAIL - Could not reach Edge Function\n');
    return false;
  }
}

/**
 * Test 3: OpenAI API Connectivity
 */
async function testOpenAIConnectivity() {
  console.log('🤖 Test 3: OpenAI API Connectivity');
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: 'Test connectivity to OpenAI',
        model: 'text-embedding-3-small'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.data && result.data[0] && result.data[0].embedding) {
      console.log(`   Status: ${response.status}`);
      console.log(`   Embedding dimensions: ${result.data[0].embedding.length}`);
      console.log('   Result: ✅ PASS - OpenAI API working\n');
      return true;
    } else {
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(result, null, 2)}`);
      console.log('   Result: ❌ FAIL - OpenAI API error\n');
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAIL - Could not reach OpenAI API\n');
    return false;
  }
}

/**
 * Test 4: Supabase Database Connectivity
 */
async function testSupabaseConnectivity() {
  console.log('🗄️  Test 4: Supabase Database Connectivity');
  
  try {
    // Test simple query
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ai_embeddings?select=count&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Database accessible: Yes`);
      console.log('   Result: ✅ PASS - Supabase database reachable\n');
      return true;
    } else {
      console.log(`   Status: ${response.status}`);
      console.log('   Result: ❌ FAIL - Cannot reach Supabase database\n');
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAIL - Database connection error\n');
    return false;
  }
}

/**
 * Test 5: Edge Function with Valid Payload
 */
async function testEdgeFunctionWithValidPayload() {
  console.log('🎯 Test 5: Edge Function with Valid Payload');
  
  const testPayload = {
    entity_type: 'features',
    entity_id: 'test-unit-' + Date.now(),
    tenant_id: '22222222-2222-2222-2222-222222222222',
    content: 'Unit test feature for Edge Function validation',
    metadata: {
      name: 'Unit Test Feature',
      priority: 'high',
      test: true
    }
  };
  
  try {
    console.log(`   Test payload: ${JSON.stringify(testPayload, null, 2)}`);
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.log('   Result: ❌ FAIL - Invalid JSON response\n');
      return false;
    }
    
    if (response.ok && result.success) {
      console.log('   Result: ✅ PASS - Edge Function processed payload successfully');
      
      // Check if embedding was actually stored
      console.log('   Checking database for stored embedding...');
      
      // Wait a moment for async processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/ai_embeddings?select=id,entity_id,content&entity_id=eq.${testPayload.entity_id}`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      
      const embeddings = await checkResponse.json();
      
      if (embeddings && embeddings.length > 0) {
        console.log(`   ✅ CONFIRMED - Embedding stored in database with ID: ${embeddings[0].id}`);
        console.log('   Result: ✅ PASS - End-to-end pipeline working\n');
        return true;
      } else {
        console.log('   ❌ WARNING - Edge Function succeeded but no embedding found in database');
        console.log('   Result: ⚠️  PARTIAL - Function works but storage may be failing\n');
        return false;
      }
    } else {
      console.log('   Result: ❌ FAIL - Edge Function returned error\n');
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAIL - Request failed\n');
    return false;
  }
}

/**
 * Test 6: Queue Message Format Validation
 */
async function testQueueMessageFormat() {
  console.log('📋 Test 6: Queue Message Format Validation');
  
  // Get an actual message from the queue to test format compatibility
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgmq_read`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queue_name: 'embedding_jobs',
        vt: 1,
        qty: 1
      })
    });
    
    const queueData = await response.json();
    
    if (queueData && queueData.length > 0) {
      const queueMessage = queueData[0].message;
      console.log(`   Queue message format: ${JSON.stringify(queueMessage, null, 2)}`);
      
      // Test Edge Function with queue message format
      const edgeResponse = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queueMessage)
      });
      
      const edgeResult = await edgeResponse.text();
      console.log(`   Edge Function response: ${edgeResult}`);
      
      if (edgeResponse.ok) {
        console.log('   Result: ✅ PASS - Queue message format compatible\n');
        return true;
      } else {
        console.log('   Result: ❌ FAIL - Queue message format incompatible\n');
        return false;
      }
    } else {
      console.log('   No messages in queue to test');
      console.log('   Result: ⚠️  SKIP - No queue messages available\n');
      return true;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAIL - Queue message test failed\n');
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('Starting Edge Function Unit Tests...\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Edge Function Connectivity', fn: testEdgeFunctionConnectivity },
    { name: 'OpenAI API Connectivity', fn: testOpenAIConnectivity },
    { name: 'Supabase Database Connectivity', fn: testSupabaseConnectivity },
    { name: 'Edge Function with Valid Payload', fn: testEdgeFunctionWithValidPayload },
    { name: 'Queue Message Format Validation', fn: testQueueMessageFormat },
  ];
  
  let passed = 0;
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
    if (result) passed++;
  }
  
  console.log('📊 FINAL RESULTS');
  console.log('=================');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Edge Function is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the details above for debugging.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testEnvironmentVariables,
  testEdgeFunctionConnectivity,
  testOpenAIConnectivity,
  testSupabaseConnectivity,
  testEdgeFunctionWithValidPayload,
  testQueueMessageFormat
};
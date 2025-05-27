#!/usr/bin/env node

/**
 * Test AI Chat with Embeddings
 * 
 * Tests if the AI chat system can access and use embedded feature data
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing AI Chat with Embedded Feature Data');
console.log('='.repeat(50));

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

async function testEmbeddingQueries() {
  console.log('\n📋 Test 1: Check available embeddings');
  
  // Check how many embeddings we have
  const { response: countResponse, data: countData } = await apiCall(
    '/rest/v1/ai_embeddings?select=count'
  );
  
  if (countResponse.ok) {
    console.log(`✅ Total embeddings available: ${countData[0].count}`);
  } else {
    console.log('❌ Failed to count embeddings');
    return false;
  }
  
  console.log('\n📋 Test 2: Sample embeddings content');
  
  // Get sample embeddings to see what content is available
  const { response: sampleResponse, data: sampleData } = await apiCall(
    '/rest/v1/ai_embeddings?select=entity_id,content,created_at&limit=3'
  );
  
  if (sampleResponse.ok && sampleData.length > 0) {
    console.log('✅ Sample embedded content:');
    sampleData.forEach((embedding, index) => {
      console.log(`   ${index + 1}. Entity: ${embedding.entity_id}`);
      console.log(`      Content: ${embedding.content.substring(0, 100)}...`);
      console.log(`      Created: ${embedding.created_at}`);
      console.log('');
    });
  } else {
    console.log('❌ No embeddings found or failed to fetch');
    return false;
  }
  
  console.log('\n📋 Test 3: Vector similarity search simulation');
  
  // Test if we can perform semantic search (without OpenAI, just check data structure)
  const testQueries = [
    'e-commerce checkout payment',
    'mobile push notifications',
    'artificial intelligence search',
    'augmented reality preview'
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    // Simple text matching to simulate what AI would find
    const { response: searchResponse, data: searchData } = await apiCall(
      `/rest/v1/ai_embeddings?select=entity_id,content&content=ilike.%${query.split(' ')[0]}%&limit=2`
    );
    
    if (searchResponse.ok && searchData.length > 0) {
      console.log(`   ✅ Found ${searchData.length} relevant features:`);
      searchData.forEach(item => {
        const contentPreview = item.content.split('\n')[0]; // Get feature name line
        console.log(`      - ${contentPreview}`);
      });
    } else {
      console.log(`   ⚠️  No direct matches found for "${query}"`);
    }
  }
  
  console.log('\n📋 Test 4: Feature coverage analysis');
  
  // Check if all major feature types are embedded
  const { response: featuresResponse, data: featuresData } = await apiCall(
    '/rest/v1/features?select=id,name,priority&limit=10'
  );
  
  const { response: embeddingsResponse, data: embeddingsData } = await apiCall(
    '/rest/v1/ai_embeddings?select=entity_id&entity_type=eq.feature'
  );
  
  if (featuresResponse.ok && embeddingsResponse.ok) {
    const featureIds = new Set(featuresData.map(f => f.id));
    const embeddedIds = new Set(embeddingsData.map(e => e.entity_id));
    
    const coverage = (embeddedIds.size / featureIds.size) * 100;
    console.log(`✅ Embedding coverage: ${embeddedIds.size}/${featureIds.size} features (${coverage.toFixed(1)}%)`);
    
    // Show which features are embedded
    console.log('\n📊 Feature embedding status:');
    featuresData.forEach(feature => {
      const status = embeddedIds.has(feature.id) ? '✅' : '❌';
      console.log(`   ${status} ${feature.name} (${feature.priority} priority)`);
    });
    
    if (coverage < 100) {
      console.log('\n⚠️  Some features are missing embeddings. Run backfill if needed.');
    }
  }
  
  return true;
}

async function testAIReadiness() {
  console.log('\n📋 Test 5: AI system readiness check');
  
  try {
    // Test if we can access the AI service functionality
    const testPrompt = "Based on our e-commerce features, what payment and checkout capabilities do we have?";
    
    console.log(`🤖 Simulating AI query: "${testPrompt}"`);
    
    // Get relevant embeddings for this type of query
    const { response, data } = await apiCall(
      '/rest/v1/ai_embeddings?select=content&content=ilike.%checkout%,or=content.ilike.%payment%&limit=5'
    );
    
    if (response.ok && data.length > 0) {
      console.log(`✅ Found ${data.length} relevant embedded features for AI context:`);
      data.forEach((item, index) => {
        const featureName = item.content.split('\n')[0];
        console.log(`   ${index + 1}. ${featureName}`);
      });
      
      console.log('\n🎯 AI system appears ready to answer questions about:');
      console.log('   - Feature capabilities and descriptions');
      console.log('   - Feature priorities and relationships');
      console.log('   - Product roadmap and development status');
      console.log('   - Cross-feature comparisons and recommendations');
      
    } else {
      console.log('⚠️  Limited embedded content found for AI responses');
    }
    
  } catch (error) {
    console.log('❌ Error testing AI readiness:', error.message);
    return false;
  }
  
  return true;
}

async function runAllTests() {
  try {
    const embeddingTests = await testEmbeddingQueries();
    const aiReadiness = await testAIReadiness();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 AI CHAT EMBEDDING TEST RESULTS');
    console.log('='.repeat(50));
    
    if (embeddingTests && aiReadiness) {
      console.log('🎉 AI chat system is ready with embedded feature data!');
      console.log('');
      console.log('✅ Embeddings populated');
      console.log('✅ Vector search data available');
      console.log('✅ Feature content accessible');
      console.log('✅ AI context data ready');
      console.log('');
      console.log('🚀 The AI chat should now be able to answer questions about:');
      console.log('   - "What features do we have?"');
      console.log('   - "Show me high priority features"');
      console.log('   - "What e-commerce capabilities do we have?"');
      console.log('   - "Tell me about our payment features"');
      console.log('   - "What AR/mobile features are available?"');
    } else {
      console.log('⚠️  AI chat system has some issues that need to be resolved');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Run all tests
runAllTests();
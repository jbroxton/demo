#!/usr/bin/env node

/**
 * Comprehensive unit test for vector search functionality
 * Tests each component in isolation to identify the exact issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TEST_TENANT_ID = '22222222-2222-2222-2222-222222222222';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runVectorSearchTests() {
  console.log('🧪 Vector Search Unit Tests\n');
  
  // Test 1: Environment Setup
  console.log('1. Testing Environment Setup...');
  const envTest = testEnvironment();
  if (!envTest.success) {
    console.error('❌ Environment test failed:', envTest.error);
    return;
  }
  console.log('✅ Environment setup OK\n');

  // Test 2: Database Connection
  console.log('2. Testing Database Connection...');
  const dbTest = await testDatabaseConnection();
  if (!dbTest.success) {
    console.error('❌ Database connection failed:', dbTest.error);
    return;
  }
  console.log('✅ Database connection OK\n');

  // Test 3: Embeddings Exist
  console.log('3. Testing Embeddings Data...');
  const dataTest = await testEmbeddingsData();
  if (!dataTest.success) {
    console.error('❌ Embeddings data test failed:', dataTest.error);
    return;
  }
  console.log('✅ Embeddings data OK:', dataTest.data, '\n');

  // Test 4: match_documents Function
  console.log('4. Testing match_documents Function...');
  const functionTest = await testMatchDocumentsFunction();
  if (!functionTest.success) {
    console.error('❌ match_documents function failed:', functionTest.error);
    return;
  }
  console.log('✅ match_documents function OK:', functionTest.data, '\n');

  // Test 5: OpenAI API
  console.log('5. Testing OpenAI API...');
  const openaiTest = await testOpenAIAPI();
  if (!openaiTest.success) {
    console.error('❌ OpenAI API test failed:', openaiTest.error);
    return;
  }
  console.log('✅ OpenAI API OK:', openaiTest.data, '\n');

  // Test 6: End-to-End Vector Search
  console.log('6. Testing End-to-End Vector Search...');
  const e2eTest = await testEndToEndVectorSearch();
  if (!e2eTest.success) {
    console.error('❌ End-to-end vector search failed:', e2eTest.error);
    console.error('Details:', e2eTest.details);
    return;
  }
  console.log('✅ End-to-end vector search OK:', e2eTest.data, '\n');

  console.log('🎉 All tests passed! Vector search is working correctly.');
}

function testEnvironment() {
  try {
    const missing = [];
    
    if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY'); 
    if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
    
    if (missing.length > 0) {
      return { success: false, error: `Missing environment variables: ${missing.join(', ')}` };
    }
    
    return { 
      success: true, 
      data: {
        supabaseUrl: SUPABASE_URL,
        hasKeys: { anon: !!SUPABASE_ANON_KEY, openai: !!OPENAI_API_KEY }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('ai_embeddings')
      .select('count')
      .limit(1);
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: 'Connected successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testEmbeddingsData() {
  try {
    const { data, error } = await supabase
      .from('ai_embeddings')
      .select('id, content, metadata')
      .eq('tenant_id', TEST_TENANT_ID)
      .limit(5);
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    const socialCommerceMatch = data.find(item => 
      item.content && item.content.toLowerCase().includes('social commerce')
    );
    
    return { 
      success: true, 
      data: {
        totalCount: data.length,
        hasSocialCommerce: !!socialCommerceMatch,
        sampleContent: data[0]?.content?.substring(0, 100) + '...'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testMatchDocumentsFunction() {
  try {
    // Get a real embedding to test with
    const { data: sampleData, error: sampleError } = await supabase
      .from('ai_embeddings')
      .select('embedding')
      .eq('tenant_id', TEST_TENANT_ID)
      .limit(1);
      
    if (sampleError || !sampleData || sampleData.length === 0) {
      return { success: false, error: 'Could not get sample embedding' };
    }
    
    const sampleEmbedding = sampleData[0].embedding;
    
    // Test the function with the sample embedding
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: sampleEmbedding,
      match_threshold: 0.1,
      match_count: 5,
      tenant_filter: TEST_TENANT_ID
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: {
        resultCount: data.length,
        sampleResult: data[0] ? {
          id: data[0].id,
          similarity: data[0].similarity,
          contentPreview: data[0].content?.substring(0, 50) + '...'
        } : null
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testOpenAIAPI() {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: 'social commerce integration test query',
        model: 'text-embedding-3-small'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const result = await response.json();
    
    return { 
      success: true, 
      data: {
        embeddingLength: result.data[0].embedding.length,
        firstFewValues: result.data[0].embedding.slice(0, 3)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testEndToEndVectorSearch() {
  try {
    // Step 1: Generate embedding for test query
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: 'social commerce integration',
        model: 'text-embedding-3-small'
      })
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to generate test embedding' };
    }
    
    const embeddingResult = await response.json();
    const embedding = embeddingResult.data[0].embedding;
    
    // Step 2: Test different array formats
    const formats = [
      { name: 'Plain Array', value: embedding },
      { name: 'String Array', value: `[${embedding.join(',')}]` },
      { name: 'JSON String', value: JSON.stringify(embedding) }
    ];
    
    const results = {};
    
    for (const format of formats) {
      try {
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: format.value,
          match_threshold: 0.1,
          match_count: 5,
          tenant_filter: TEST_TENANT_ID
        });
        
        if (error) {
          results[format.name] = { success: false, error: error.message };
        } else {
          results[format.name] = { 
            success: true, 
            count: data.length,
            hasSocialCommerce: data.some(item => 
              item.content && item.content.toLowerCase().includes('social commerce')
            )
          };
        }
      } catch (err) {
        results[format.name] = { success: false, error: err.message };
      }
    }
    
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message, details: error.stack };
  }
}

// Run the tests
runVectorSearchTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
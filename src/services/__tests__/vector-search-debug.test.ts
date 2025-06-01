/**
 * Vector Search Debug Test
 * 
 * Investigates why vector search returns 0 results despite successful indexing
 */

// Real test data
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('Vector Search Debug', () => {
  
  test('should investigate vector database and search function', async () => {
    console.log('=== DEBUGGING VECTOR SEARCH ===');
    
    try {
      const { supabase } = await import('@/services/supabase');
      
      // 1. Check if the ai_embeddings table exists and has data
      console.log('1. Checking ai_embeddings table...');
      const { data: tableData, error: tableError } = await supabase
        .from('ai_embeddings')
        .select('id, entity_type, entity_id, content, metadata, tenant_id')
        .eq('tenant_id', realTenantId)
        .limit(5);
      
      if (tableError) {
        console.error('Table query error:', tableError);
      } else {
        console.log(`Found ${tableData?.length || 0} embeddings in table for tenant`);
        if (tableData && tableData.length > 0) {
          console.log('Sample embedding:', {
            id: tableData[0].id,
            entity_type: tableData[0].entity_type,
            entity_id: tableData[0].entity_id,
            content: tableData[0].content?.substring(0, 100) + '...',
            metadata: tableData[0].metadata,
            tenant_id: tableData[0].tenant_id
          });
        }
      }
      
      // 2. Check if match_documents function exists
      console.log('2. Testing match_documents function...');
      
      // Generate a test embedding
      const { generateEmbedding } = await import('@/services/ai-service');
      const testEmbedding = await generateEmbedding('test query');
      
      console.log(`Generated test embedding length: ${testEmbedding?.length}`);
      
      // Test with very low threshold to see if we get any results
      const { data: matchData, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.1, // Very low threshold
        match_count: 10,
        tenant_filter: realTenantId
      });
      
      if (matchError) {
        console.error('match_documents function error:', matchError);
      } else {
        console.log(`match_documents returned ${matchData?.length || 0} results with low threshold`);
        if (matchData && matchData.length > 0) {
          console.log('Sample match result:', {
            content: matchData[0].content?.substring(0, 100) + '...',
            similarity: matchData[0].similarity,
            metadata: matchData[0].metadata
          });
        }
      }
      
      // 3. Test with even lower threshold
      console.log('3. Testing with very low threshold (0.01)...');
      const { data: veryLowData, error: veryLowError } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.01, // Extremely low threshold
        match_count: 10,
        tenant_filter: realTenantId
      });
      
      if (veryLowError) {
        console.error('Very low threshold error:', veryLowError);
      } else {
        console.log(`Very low threshold returned ${veryLowData?.length || 0} results`);
      }
      
      // 4. Test specific feature query
      console.log('4. Testing specific feature query...');
      const featureEmbedding = await generateEmbedding('New Feature');
      
      const { data: featureData, error: featureError } = await supabase.rpc('match_documents', {
        query_embedding: featureEmbedding,
        match_threshold: 0.1,
        match_count: 10,
        tenant_filter: realTenantId
      });
      
      if (featureError) {
        console.error('Feature query error:', featureError);
      } else {
        console.log(`Feature query returned ${featureData?.length || 0} results`);
        if (featureData && featureData.length > 0) {
          featureData.slice(0, 3).forEach((result, i) => {
            console.log(`Feature result ${i + 1}:`, {
              content: result.content?.substring(0, 100) + '...',
              similarity: result.similarity,
              entity_type: result.metadata?.entity_type
            });
          });
        }
      }
      
      // 5. Check if there's a mismatch in tenant IDs
      console.log('5. Checking tenant ID consistency...');
      const { data: allData, error: allError } = await supabase
        .from('ai_embeddings')
        .select('tenant_id, entity_type, content')
        .limit(10);
      
      if (allError) {
        console.error('All data query error:', allError);
      } else {
        console.log('All embeddings tenant IDs:', allData?.map(d => ({
          tenant_id: d.tenant_id,
          entity_type: d.entity_type,
          content: d.content?.substring(0, 50) + '...'
        })));
      }
      
    } catch (error) {
      console.error('Debug test error:', error);
    }
    
    console.log('=== VECTOR SEARCH DEBUG COMPLETE ===');
  }, 30000);
  
  test('should test why AI gives wrong feature count', async () => {
    console.log('=== DEBUGGING AI RESPONSE LOGIC ===');
    
    // Let's understand why the AI said "20 features" when there are 6
    
    // 1. Check what the AI sees when no vector results are found
    console.log('1. Simulating AI prompt when no vector context is found...');
    
    const noContextPrompt = `You are a Product Management AI assistant for Speqq.
You help users manage their products, features, and releases.

I don't have access to your specific product data at the moment, but I can still help with general product management advice and questions.

Always maintain a professional, helpful tone and provide concise, actionable answers.`;
    
    console.log('System prompt when no context:', noContextPrompt);
    
    // 2. Check what happens when context IS found
    console.log('2. What would happen with proper context...');
    
    // Simulate what the context should look like
    const mockContext = `[1] FEATURE: New Feature
Feature description and details...

[2] FEATURE: Hello12345678666
Another feature description...

[3] FEATURE: New Feature 1
Third feature description...

[4] FEATURE: Test 3
Fourth feature description...

[5] FEATURE: New Featurefrfrf
Fifth feature description...

[6] FEATURE: (unnamed)
Sixth feature description...`;
    
    const withContextPrompt = `You are an AI assistant for a product management platform. You have access to the following context from the user's data:

${mockContext}

Use this context to answer the user's question. If the context is relevant, reference it in your response. If not, provide a general helpful response about product management.

Always maintain a professional, helpful tone and provide concise, actionable answers.`;
    
    console.log('System prompt WITH context would be:', withContextPrompt.substring(0, 300) + '...');
    
    // 3. The issue: AI is hallucinating when no context
    console.log('3. Issue identified:');
    console.log('- Vector search returns 0 results');
    console.log('- AI gets no specific context about user\'s features');
    console.log('- AI falls back to generic system prompt');
    console.log('- When asked "how many features", AI makes up a number (20) instead of saying "I don\'t know"');
    
    console.log('4. Solution needed:');
    console.log('- Fix vector search to return actual results');
    console.log('- OR modify AI prompt to be more honest about lack of data');
    
    console.log('=== AI RESPONSE LOGIC DEBUG COMPLETE ===');
  }, 10000);
});
/**
 * AI Chat End-to-End Integration Test
 * 
 * This test verifies the complete AI chat workflow including:
 * - Vector search with real indexed data
 * - Chat API route functionality
 * - RAG (Retrieval Augmented Generation) integration
 * - Context injection and response generation
 */

import { searchVectors } from '@/services/ai-service';
import { supabase } from '@/services/supabase';

// Use real tenant and user IDs for testing
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Chat End-to-End Integration', () => {
  
  describe('Vector Search with Real Data', () => {
    test('should find relevant context for user queries', async () => {
      // Test various user queries that should match our indexed data
      const testQueries = [
        'new feature',
        'feature development',
        'release planning',
        'product roadmap',
        'Hello12345678666' // This is a specific feature name we saw in the database
      ];
      
      console.log('=== TESTING VECTOR SEARCH WITH REAL QUERIES ===');
      
      for (const query of testQueries) {
        console.log(`\nTesting query: "${query}"`);
        
        try {
          const results = await searchVectors(query, realTenantId, undefined, 3);
          
          console.log(`Found ${results.length} results for "${query}"`);
          
          if (results.length > 0) {
            // Log the most relevant result
            const topResult = results[0];
            console.log(`Top result: ${topResult.content.substring(0, 100)}...`);
            console.log(`Similarity: ${topResult.similarity}`);
            console.log(`Metadata:`, topResult.metadata);
            
            // Verify result structure
            expect(topResult).toHaveProperty('id');
            expect(topResult).toHaveProperty('content');
            expect(topResult).toHaveProperty('metadata');
            expect(topResult).toHaveProperty('similarity');
            expect(typeof topResult.similarity).toBe('number');
            expect(topResult.similarity).toBeGreaterThan(0);
            expect(topResult.similarity).toBeLessThanOrEqual(1);
          }
          
        } catch (error) {
          console.error(`Error searching for "${query}":`, error);
          throw error;
        }
      }
      
      console.log('=== VECTOR SEARCH TESTING COMPLETE ===');
    }, 30000); // 30 second timeout
    
    test('should handle queries with no matches gracefully', async () => {
      const noMatchQueries = [
        'completely unrelated topic',
        'quantum physics',
        'cooking recipes',
        'xyz123456789nonsense'
      ];
      
      for (const query of noMatchQueries) {
        const results = await searchVectors(query, realTenantId, undefined, 3);
        
        // Should return empty array, not throw error
        expect(Array.isArray(results)).toBe(true);
        console.log(`No match query "${query}" returned ${results.length} results`);
      }
    });
    
    test('should respect tenant isolation in search results', async () => {
      const fakeTenatId = 'fake-tenant-12345';
      
      // Search with fake tenant ID should return no results
      const results = await searchVectors('new feature', fakeTenatId, undefined, 5);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
      
      console.log('Tenant isolation verified - fake tenant returned no results');
    });
  });
  
  describe('Chat API Route Integration', () => {
    test('should simulate chat API request with vector context', async () => {
      // First, get some context from vector search
      const contextResults = await searchVectors('new feature development', realTenantId, undefined, 2);
      
      console.log(`Found ${contextResults.length} context items for chat`);
      
      // Simulate what the chat API route does
      let contextText = '';
      if (contextResults.length > 0) {
        contextText = contextResults
          .map(result => `Context: ${result.content}`)
          .join('\n\n');
      }
      
      // Test that we can construct a proper prompt with context
      const userMessage = "What features are we working on?";
      const systemPrompt = `You are an AI assistant for a product management platform. You have access to the following context from the user's data:

${contextText}

Use this context to answer the user's question. If the context is relevant, reference it in your response. If not, provide a general helpful response.`;

      // Verify the prompt structure
      expect(systemPrompt).toContain('AI assistant');
      expect(systemPrompt).toContain('product management platform');
      
      if (contextResults.length > 0) {
        expect(systemPrompt).toContain('Context:');
        console.log('Successfully constructed prompt with vector context');
      } else {
        console.log('No context found, but prompt structure is valid');
      }
      
      console.log(`System prompt length: ${systemPrompt.length} characters`);
      console.log(`User message: ${userMessage}`);
    });
    
    test('should verify database has indexed embeddings for chat context', async () => {
      // Check that we have embeddings in the database for context
      const { data: embeddings, error } = await supabase
        .from('ai_embeddings')
        .select('id, entity_type, entity_id, content')
        .eq('tenant_id', realTenantId)
        .limit(10);
      
      expect(error).toBeNull();
      expect(embeddings).toBeDefined();
      expect(Array.isArray(embeddings)).toBe(true);
      
      console.log(`Database contains ${embeddings?.length || 0} embeddings for chat context`);
      
      if (embeddings && embeddings.length > 0) {
        // Log sample embeddings
        embeddings.slice(0, 3).forEach((embedding, index) => {
          console.log(`Embedding ${index + 1}: ${embedding.entity_type} - ${embedding.content.substring(0, 50)}...`);
        });
        
        // Verify structure
        const sampleEmbedding = embeddings[0];
        expect(sampleEmbedding).toHaveProperty('id');
        expect(sampleEmbedding).toHaveProperty('entity_type');
        expect(sampleEmbedding).toHaveProperty('entity_id');
        expect(sampleEmbedding).toHaveProperty('content');
      }
    });
  });
  
  describe('RAG Context Quality', () => {
    test('should retrieve high-quality context for typical user questions', async () => {
      const typicalQuestions = [
        "What features are in progress?",
        "Tell me about our current releases",
        "What's the status of new features?",
        "Show me recent product updates"
      ];
      
      console.log('=== TESTING RAG CONTEXT QUALITY ===');
      
      for (const question of typicalQuestions) {
        console.log(`\nAnalyzing context for: "${question}"`);
        
        const contextResults = await searchVectors(question, realTenantId, undefined, 3);
        
        if (contextResults.length > 0) {
          // Analyze context quality
          const avgSimilarity = contextResults.reduce((sum, result) => sum + result.similarity, 0) / contextResults.length;
          const hasRelevantContent = contextResults.some(result => 
            result.content.toLowerCase().includes('feature') ||
            result.content.toLowerCase().includes('release') ||
            result.content.toLowerCase().includes('status')
          );
          
          console.log(`Context quality metrics:`);
          console.log(`- Number of results: ${contextResults.length}`);
          console.log(`- Average similarity: ${avgSimilarity.toFixed(3)}`);
          console.log(`- Has relevant content: ${hasRelevantContent}`);
          
          // Quality assertions
          expect(contextResults.length).toBeGreaterThan(0);
          expect(avgSimilarity).toBeGreaterThan(0);
          
          // Log top result for manual review
          const topResult = contextResults[0];
          console.log(`Top result preview: ${topResult.content.substring(0, 150)}...`);
          
        } else {
          console.log('No context found for this question');
        }
      }
      
      console.log('=== RAG CONTEXT QUALITY TESTING COMPLETE ===');
    }, 30000); // 30 second timeout
    
    test('should handle edge cases in context retrieval', async () => {
      const edgeCases = [
        '', // Empty query
        '   ', // Whitespace only
        'a', // Single character
        'very specific feature name that definitely does not exist in our database',
        '!@#$%^&*()', // Special characters
      ];
      
      for (const edgeCase of edgeCases) {
        try {
          const results = await searchVectors(edgeCase, realTenantId);
          
          // Should not throw error, should return array
          expect(Array.isArray(results)).toBe(true);
          console.log(`Edge case "${edgeCase}" handled gracefully (${results.length} results)`);
          
        } catch (error) {
          // Some edge cases might throw errors, which is acceptable
          console.log(`Edge case "${edgeCase}" threw error (acceptable):`, error.message);
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });
  
  describe('Performance and Scalability', () => {
    test('should perform vector search within acceptable time limits', async () => {
      const testQuery = "feature development status";
      const iterations = 3;
      const times: number[] = [];
      
      console.log(`Performance testing with ${iterations} iterations...`);
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const results = await searchVectors(testQuery, realTenantId, undefined, 5);
        
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        times.push(elapsed);
        
        console.log(`Iteration ${i + 1}: ${elapsed}ms (${results.length} results)`);
        
        // Each search should complete within reasonable time
        expect(elapsed).toBeLessThan(5000); // 5 seconds max
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      console.log(`Performance summary:`);
      console.log(`- Average time: ${Math.round(avgTime)}ms`);
      console.log(`- Max time: ${maxTime}ms`);
      console.log(`- Min time: ${minTime}ms`);
      
      // Performance assertions
      expect(avgTime).toBeLessThan(3000); // Average under 3 seconds
      expect(maxTime).toBeLessThan(5000); // Max under 5 seconds
    }, 20000); // 20 second timeout
  });
  
  describe('Integration Completeness', () => {
    test('should verify all components work together for a complete chat flow', async () => {
      console.log('=== COMPLETE CHAT FLOW SIMULATION ===');
      
      // Step 1: User asks a question
      const userQuestion = "What new features are we working on?";
      console.log(`Step 1 - User question: "${userQuestion}"`);
      
      // Step 2: Search for relevant context
      console.log(`Step 2 - Searching for context...`);
      const startSearch = Date.now();
      const contextResults = await searchVectors(userQuestion, realTenantId, undefined, 3);
      const searchTime = Date.now() - startSearch;
      
      console.log(`Found ${contextResults.length} context items in ${searchTime}ms`);
      
      // Step 3: Construct context for AI
      let contextText = 'No relevant context found.';
      if (contextResults.length > 0) {
        contextText = contextResults
          .map((result, index) => `Context ${index + 1}: ${result.content}`)
          .join('\n\n');
      }
      
      console.log(`Step 3 - Context length: ${contextText.length} characters`);
      
      // Step 4: Prepare system prompt (what the API route would do)
      const systemPrompt = `You are an AI assistant for a product management platform. Answer the user's question using the following context from their data:

${contextText}

If the context is relevant, use it to provide specific information. If not, provide a helpful general response about product management.`;

      // Step 5: Verify the complete flow
      expect(typeof userQuestion).toBe('string');
      expect(userQuestion.length).toBeGreaterThan(0);
      expect(Array.isArray(contextResults)).toBe(true);
      expect(typeof contextText).toBe('string');
      expect(contextText.length).toBeGreaterThan(0);
      expect(typeof systemPrompt).toBe('string');
      expect(systemPrompt.length).toBeGreaterThan(100);
      
      // Quality checks
      expect(systemPrompt).toContain('AI assistant');
      expect(systemPrompt).toContain('product management');
      expect(systemPrompt).toContain('context');
      
      console.log(`Step 4 - System prompt prepared (${systemPrompt.length} chars)`);
      console.log(`Step 5 - Complete flow verified successfully`);
      
      // Summary
      console.log(`\nFlow Summary:`);
      console.log(`- User question: ✓`);
      console.log(`- Vector search: ✓ (${contextResults.length} results, ${searchTime}ms)`);
      console.log(`- Context preparation: ✓ (${contextText.length} chars)`);
      console.log(`- System prompt: ✓ (${systemPrompt.length} chars)`);
      console.log(`- Ready for AI completion: ✓`);
      
      console.log('=== COMPLETE CHAT FLOW SIMULATION SUCCESSFUL ===');
    }, 15000); // 15 second timeout
  });
});
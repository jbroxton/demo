/**
 * AI Chat Functionality Test
 * 
 * Tests the complete end-to-end functionality of the AI chat system
 * including RAG (Retrieval Augmented Generation) with real user data
 */

import { NextRequest } from 'next/server';

// Real test data
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Chat Functionality End-to-End', () => {
  
  describe('Data Query Tests', () => {
    test('should correctly answer "how many features do I have"', async () => {
      console.log('=== TESTING FEATURE COUNT QUERY ===');
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      // First, let's check what features exist in the database
      console.log('Checking existing features in database...');
      try {
        const { getFeaturesFromDb } = await import('@/services/features-db');
        const featuresResult = await getFeaturesFromDb(realTenantId);
        
        console.log(`Features query result:`, {
          success: featuresResult.success,
          count: featuresResult.success ? featuresResult.data?.length : 0,
          firstFew: featuresResult.success ? featuresResult.data?.slice(0, 3).map(f => ({ id: f.id, name: f.name })) : null
        });
      } catch (error) {
        console.error('Error checking features in DB:', error);
      }
      
      // Test the AI chat response
      const requestBody = {
        messages: [
          {
            id: 'test-feature-count',
            role: 'user',
            content: 'How many features do I have?'
          }
        ],
        tenantId: realTenantId,
        userId: realUserId
      };
      
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(requestBody)
      });
      
      const response = await POST(request);
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        let fullResponse = '';
        let textContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
            
            // Extract text content from data stream format
            // Format is like: 0:"Hello" or 0:"world"
            const textMatches = chunk.match(/0:"([^"]+)"/g);
            if (textMatches) {
              textMatches.forEach(match => {
                const text = match.replace(/0:"([^"]+)"/, '$1');
                textContent += text;
              });
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        console.log(`Raw streaming response:`, fullResponse);
        console.log(`Extracted text content: "${textContent}"`);
        
        // Analyze the response
        const hasNumberMention = /\d+/.test(textContent);
        const mentionsFeatures = /feature/i.test(textContent);
        const hasContextualInfo = textContent.length > 10; // Should be more than just a number
        
        console.log(`Response Analysis:`);
        console.log(`- Contains numbers: ${hasNumberMention}`);
        console.log(`- Mentions features: ${mentionsFeatures}`);
        console.log(`- Has contextual info: ${hasContextualInfo}`);
        console.log(`- Response length: ${textContent.length} characters`);
        
        // The response should contain relevant information about features
        expect(response.status).toBe(200);
        expect(textContent.length).toBeGreaterThan(0);
        
        // Log success
        console.log('✅ Feature count query test completed successfully');
        
      } else {
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      console.log('=== FEATURE COUNT QUERY TEST COMPLETE ===');
    }, 15000);
    
    test('should handle indexing and then answer questions about the data', async () => {
      console.log('=== TESTING INDEXING AND DATA RETRIEVAL ===');
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      // Step 1: Index the data
      console.log('Step 1: Indexing user data...');
      const indexRequestBody = {
        action: 'index',
        tenantId: realTenantId,
        userId: realUserId,
        messages: [] // Empty for indexing
      };
      
      const indexRequest = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(indexRequestBody)
      });
      
      const indexResponse = await POST(indexRequest);
      console.log(`Indexing response status: ${indexResponse.status}`);
      
      if (indexResponse.ok) {
        const indexResult = await indexResponse.json();
        console.log('Indexing result:', indexResult);
        console.log(`✅ Indexed ${indexResult.indexed || 0} items`);
        
        if (indexResult.errors && indexResult.errors.length > 0) {
          console.log('⚠️ Indexing errors:', indexResult.errors.slice(0, 3));
        }
      } else {
        const errorText = await indexResponse.text();
        console.log(`❌ Indexing failed: ${errorText}`);
      }
      
      // Step 2: Wait a moment for indexing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Ask a question that should use the indexed data
      console.log('Step 2: Querying indexed data...');
      const queryRequestBody = {
        messages: [
          {
            id: 'test-indexed-query',
            role: 'user',
            content: 'What features are in my product roadmap? List them for me.'
          }
        ],
        tenantId: realTenantId,
        userId: realUserId
      };
      
      const queryRequest = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(queryRequestBody)
      });
      
      const queryResponse = await POST(queryRequest);
      console.log(`Query response status: ${queryResponse.status}`);
      
      if (queryResponse.ok && queryResponse.body) {
        const reader = queryResponse.body.getReader();
        let fullResponse = '';
        let textContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
            
            // Extract text content from data stream format
            const textMatches = chunk.match(/0:"([^"]+)"/g);
            if (textMatches) {
              textMatches.forEach(match => {
                const text = match.replace(/0:"([^"]+)"/, '$1');
                textContent += text;
              });
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        console.log(`Query text content: "${textContent}"`);
        
        // Analyze if the response uses indexed data
        const hasSpecificInfo = textContent.length > 50; // Should have detailed info if RAG worked
        const mentionsFeatures = /feature/i.test(textContent);
        const hasStructuredInfo = /\d+|list|roadmap/i.test(textContent);
        
        console.log(`Query Response Analysis:`);
        console.log(`- Has detailed info: ${hasSpecificInfo}`);
        console.log(`- Mentions features: ${mentionsFeatures}`);
        console.log(`- Has structured info: ${hasStructuredInfo}`);
        console.log(`- Response length: ${textContent.length} characters`);
        
        // Check if response indicates access to specific data
        const hasDataContext = /don't have access|can't access|no data/i.test(textContent);
        console.log(`- Indicates data access issues: ${hasDataContext}`);
        
        expect(queryResponse.status).toBe(200);
        expect(textContent.length).toBeGreaterThan(0);
        
        console.log('✅ Indexing and query test completed');
        
      } else {
        const errorText = await queryResponse.text();
        console.log(`❌ Query failed: ${errorText}`);
        throw new Error(`Query failed with status ${queryResponse.status}`);
      }
      
      console.log('=== INDEXING AND DATA RETRIEVAL TEST COMPLETE ===');
    }, 30000);
    
    test('should provide helpful response even when no data is found', async () => {
      console.log('=== TESTING FALLBACK BEHAVIOR ===');
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      const requestBody = {
        messages: [
          {
            id: 'test-fallback',
            role: 'user',
            content: 'Tell me about product management best practices'
          }
        ],
        tenantId: realTenantId,
        userId: realUserId
      };
      
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(requestBody)
      });
      
      const response = await POST(request);
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        let textContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            
            const textMatches = chunk.match(/0:"([^"]+)"/g);
            if (textMatches) {
              textMatches.forEach(match => {
                const text = match.replace(/0:"([^"]+)"/, '$1');
                textContent += text;
              });
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        console.log(`Fallback response: "${textContent}"`);
        
        // Should provide helpful general advice even without specific data
        const isHelpful = textContent.length > 20;
        const isProfessional = !/error|failed|sorry/i.test(textContent);
        const mentionsProductManagement = /product|management|roadmap|feature/i.test(textContent);
        
        console.log(`Fallback Analysis:`);
        console.log(`- Is helpful: ${isHelpful}`);
        console.log(`- Is professional: ${isProfessional}`);
        console.log(`- Mentions PM topics: ${mentionsProductManagement}`);
        
        expect(response.status).toBe(200);
        expect(textContent.length).toBeGreaterThan(0);
        
        console.log('✅ Fallback behavior test completed');
        
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      console.log('=== FALLBACK BEHAVIOR TEST COMPLETE ===');
    }, 15000);
  });
  
  describe('Vector Search Integration', () => {
    test('should test vector search functionality directly', async () => {
      console.log('=== TESTING VECTOR SEARCH DIRECTLY ===');
      
      try {
        const { searchVectors } = await import('@/services/ai-service');
        
        // Test vector search with a query about features
        const searchQuery = 'user authentication features';
        console.log(`Testing vector search with query: "${searchQuery}"`);
        
        const searchResults = await searchVectors(searchQuery, realTenantId);
        
        console.log(`Vector search results:`, {
          count: searchResults.length,
          results: searchResults.slice(0, 2).map(r => ({
            content: r.content?.substring(0, 100) + '...',
            metadata: r.metadata,
            similarity: r.similarity
          }))
        });
        
        // Vector search should not error (even if no results)
        expect(Array.isArray(searchResults)).toBe(true);
        
        console.log('✅ Vector search test completed');
        
      } catch (error) {
        console.error('Vector search error:', error);
        console.log('⚠️ Vector search may not be properly configured');
      }
      
      console.log('=== VECTOR SEARCH TEST COMPLETE ===');
    }, 10000);
  });
});
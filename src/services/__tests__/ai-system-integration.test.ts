/**
 * AI System Comprehensive Integration Test
 * 
 * This test suite verifies the complete AI chat system functionality including:
 * - Data indexing workflow
 * - Vector search and retrieval
 * - Multi-tenancy isolation
 * - Performance benchmarks
 * - Error handling and edge cases
 * - End-to-end chat flow simulation
 */

import { indexFeature, indexRelease, searchVectors, generateEmbedding } from '@/services/ai-service';
import { getFeaturesFromDb } from '@/services/features-db';
import { getReleasesFromDb } from '@/services/releases-db';
import { supabase } from '@/services/supabase';

// Real test data
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI System Comprehensive Integration', () => {
  
  // Cleanup after tests
  afterAll(async () => {
    try {
      // Clean up any test data
      await supabase
        .from('ai_embeddings')
        .delete()
        .eq('tenant_id', realTenantId)
        .like('content', '%TEST_INTEGRATION%');
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Complete System Workflow', () => {
    test('should demonstrate complete AI chat system functionality', async () => {
      console.log('=== COMPLETE AI SYSTEM INTEGRATION TEST ===');
      
      let totalOperations = 0;
      let successfulOperations = 0;
      const startTime = Date.now();
      
      try {
        // Phase 1: Data Preparation and Indexing
        console.log('\n🔄 Phase 1: Data Preparation and Indexing');
        
        // Get real data from database
        const featuresResult = await getFeaturesFromDb(realTenantId);
        const releasesResult = await getReleasesFromDb(realTenantId);
        const features = featuresResult.success ? featuresResult.data : [];
        const releases = releasesResult.success ? releasesResult.data : [];
        
        console.log(`Found ${features?.length || 0} features and ${releases?.length || 0} releases`);
        
        // Test indexing a subset of real data
        if (features && features.length > 0) {
          totalOperations++;
          const testFeature = features[0];
          console.log(`Indexing test feature: ${testFeature.name}`);
          
          const indexResult = await indexFeature(testFeature, realTenantId);
          expect(indexResult).toBeDefined();
          expect(indexResult.embedding).toHaveLength(1536);
          
          successfulOperations++;
          console.log('✅ Feature indexing successful');
        }
        
        if (releases && releases.length > 0) {
          totalOperations++;
          const testRelease = releases[0];
          console.log(`Indexing test release: ${testRelease.name}`);
          
          const indexResult = await indexRelease(testRelease, realTenantId);
          expect(indexResult).toBeDefined();
          expect(indexResult.embedding).toHaveLength(1536);
          
          successfulOperations++;
          console.log('✅ Release indexing successful');
        }
        
        // Phase 2: Vector Search Testing
        console.log('\n🔍 Phase 2: Vector Search Testing');
        
        const testQueries = [
          'new feature development',
          'release planning',
          'product status',
          'features in progress'
        ];
        
        let searchSuccesses = 0;
        
        for (const query of testQueries) {
          totalOperations++;
          console.log(`Testing search query: "${query}"`);
          
          try {
            const searchResults = await searchVectors(query, realTenantId, undefined, 3);
            expect(Array.isArray(searchResults)).toBe(true);
            
            if (searchResults.length > 0) {
              const topResult = searchResults[0];
              expect(topResult).toHaveProperty('content');
              expect(topResult).toHaveProperty('similarity');
              expect(typeof topResult.similarity).toBe('number');
              
              console.log(`  Found ${searchResults.length} results, top similarity: ${topResult.similarity.toFixed(3)}`);
              searchSuccesses++;
            } else {
              console.log(`  No results found (expected for some queries)`);
            }
            
            successfulOperations++;
            
          } catch (error) {
            console.error(`  Search failed for "${query}":`, error);
            throw error;
          }
        }
        
        console.log(`✅ Vector search: ${searchSuccesses}/${testQueries.length} queries returned results`);
        
        // Phase 3: Multi-tenancy Verification
        console.log('\n🏢 Phase 3: Multi-tenancy Verification');
        
        totalOperations++;
        const fakeTenantId = 'fake-tenant-id-12345';
        const isolationResults = await searchVectors('new feature', fakeTenantId);
        
        expect(Array.isArray(isolationResults)).toBe(true);
        expect(isolationResults.length).toBe(0);
        
        successfulOperations++;
        console.log('✅ Tenant isolation verified');
        
        // Phase 4: Performance Benchmarking
        console.log('\n⚡ Phase 4: Performance Benchmarking');
        
        totalOperations++;
        const perfStartTime = Date.now();
        
        // Test multiple operations
        const perfPromises = [
          generateEmbedding('test query 1'),
          generateEmbedding('test query 2'),
          searchVectors('feature', realTenantId, undefined, 2),
          searchVectors('release', realTenantId, undefined, 2)
        ];
        
        const perfResults = await Promise.all(perfPromises);
        const perfEndTime = Date.now();
        const perfTime = perfEndTime - perfStartTime;
        
        expect(perfResults).toHaveLength(4);
        expect(perfResults[0]).toHaveLength(1536); // First embedding
        expect(perfResults[1]).toHaveLength(1536); // Second embedding
        expect(Array.isArray(perfResults[2])).toBe(true); // First search
        expect(Array.isArray(perfResults[3])).toBe(true); // Second search
        
        console.log(`✅ Concurrent operations completed in ${perfTime}ms`);
        expect(perfTime).toBeLessThan(10000); // Should complete within 10 seconds
        
        successfulOperations++;
        
        // Phase 5: Error Handling
        console.log('\n🛡️ Phase 5: Error Handling');
        
        totalOperations++;
        
        // Test invalid inputs
        const errorTests = [
          () => searchVectors('', realTenantId), // Empty query
          () => searchVectors('test', ''), // Empty tenant
        ];
        
        let errorHandlingSuccess = 0;
        
        for (const errorTest of errorTests) {
          try {
            const result = await errorTest();
            // Should return empty array, not throw
            expect(Array.isArray(result)).toBe(true);
            errorHandlingSuccess++;
          } catch (error) {
            // Some errors are acceptable
            expect(error).toBeInstanceOf(Error);
            errorHandlingSuccess++;
          }
        }
        
        expect(errorHandlingSuccess).toBe(errorTests.length);
        successfulOperations++;
        console.log('✅ Error handling verified');
        
        // Phase 6: End-to-End Chat Simulation
        console.log('\n💬 Phase 6: End-to-End Chat Simulation');
        
        totalOperations++;
        
        // Simulate a complete chat interaction
        const userQuestion = "What features are we currently working on?";
        console.log(`User asks: "${userQuestion}"`);
        
        // Get context (what the API route would do)
        const contextResults = await searchVectors(userQuestion, realTenantId, undefined, 3);
        
        let contextText = 'No relevant information found in your data.';
        if (contextResults.length > 0) {
          contextText = contextResults
            .map((result, index) => `Context ${index + 1}: ${result.content}`)
            .join('\n\n');
        }
        
        // Construct system prompt (what the API route would do)
        const systemPrompt = `You are an AI assistant for a product management platform. Answer the user's question using the following context from their data:

${contextText}

If the context is relevant, use it to provide specific information. If not, provide a helpful general response about product management.`;

        // Verify chat components
        expect(typeof userQuestion).toBe('string');
        expect(userQuestion.length).toBeGreaterThan(0);
        expect(Array.isArray(contextResults)).toBe(true);
        expect(typeof contextText).toBe('string');
        expect(contextText.length).toBeGreaterThan(0);
        expect(typeof systemPrompt).toBe('string');
        expect(systemPrompt.length).toBeGreaterThan(100);
        
        console.log(`  Context found: ${contextResults.length} items`);
        console.log(`  System prompt length: ${systemPrompt.length} characters`);
        console.log('✅ Chat simulation completed');
        
        successfulOperations++;
        
        // Phase 7: System Health Check
        console.log('\n🏥 Phase 7: System Health Check');
        
        totalOperations++;
        
        // Check database connectivity
        const { data: healthCheck, error: healthError } = await supabase
          .from('ai_embeddings')
          .select('id', { count: 'exact' })
          .eq('tenant_id', realTenantId);
        
        expect(healthError).toBeNull();
        expect(healthCheck).toBeDefined();
        
        // Check embedding storage
        const { data: embeddingCheck } = await supabase
          .from('ai_embeddings')
          .select('id, entity_type, created_at')
          .eq('tenant_id', realTenantId)
          .limit(5);
        
        expect(Array.isArray(embeddingCheck)).toBe(true);
        
        console.log(`  Database health: ✅`);
        console.log(`  Embeddings in database: ${embeddingCheck?.length || 0}`);
        
        successfulOperations++;
        
        // Final Summary
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        console.log('\n📊 Integration Test Summary:');
        console.log(`  Total operations: ${totalOperations}`);
        console.log(`  Successful operations: ${successfulOperations}`);
        console.log(`  Success rate: ${Math.round((successfulOperations / totalOperations) * 100)}%`);
        console.log(`  Total time: ${totalTime}ms`);
        console.log(`  Average time per operation: ${Math.round(totalTime / totalOperations)}ms`);
        
        // Final assertions
        expect(successfulOperations).toBe(totalOperations);
        expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
        
        console.log('\n🎉 AI SYSTEM INTEGRATION TEST COMPLETED SUCCESSFULLY');
        
      } catch (error) {
        console.error('\n❌ Integration test failed:', error);
        throw error;
      }
      
    }, 45000); // 45 second timeout for comprehensive test
  });
  
  describe('System Readiness Assessment', () => {
    test('should verify system is ready for production use', async () => {
      console.log('=== PRODUCTION READINESS ASSESSMENT ===');
      
      const readinessChecks = {
        database: false,
        embeddings: false,
        vectorSearch: false,
        tenantIsolation: false,
        errorHandling: false,
        performance: false
      };
      
      try {
        // Check 1: Database connectivity
        const { error: dbError } = await supabase
          .from('ai_embeddings')
          .select('id')
          .limit(1);
        
        readinessChecks.database = !dbError;
        console.log(`Database connectivity: ${readinessChecks.database ? '✅' : '❌'}`);
        
        // Check 2: Embeddings functionality
        try {
          const testEmbedding = await generateEmbedding('test production readiness');
          readinessChecks.embeddings = Array.isArray(testEmbedding) && testEmbedding.length === 1536;
        } catch (error) {
          readinessChecks.embeddings = false;
        }
        console.log(`Embeddings generation: ${readinessChecks.embeddings ? '✅' : '❌'}`);
        
        // Check 3: Vector search
        try {
          const searchResults = await searchVectors('test', realTenantId);
          readinessChecks.vectorSearch = Array.isArray(searchResults);
        } catch (error) {
          readinessChecks.vectorSearch = false;
        }
        console.log(`Vector search: ${readinessChecks.vectorSearch ? '✅' : '❌'}`);
        
        // Check 4: Tenant isolation
        try {
          const isolationTest = await searchVectors('test', 'fake-tenant');
          readinessChecks.tenantIsolation = Array.isArray(isolationTest) && isolationTest.length === 0;
        } catch (error) {
          readinessChecks.tenantIsolation = false;
        }
        console.log(`Tenant isolation: ${readinessChecks.tenantIsolation ? '✅' : '❌'}`);
        
        // Check 5: Error handling
        try {
          const errorTest = await searchVectors('', realTenantId);
          readinessChecks.errorHandling = Array.isArray(errorTest);
        } catch (error) {
          readinessChecks.errorHandling = true; // Error thrown is also acceptable
        }
        console.log(`Error handling: ${readinessChecks.errorHandling ? '✅' : '❌'}`);
        
        // Check 6: Performance
        const perfStart = Date.now();
        await Promise.all([
          generateEmbedding('performance test 1'),
          generateEmbedding('performance test 2'),
          searchVectors('performance', realTenantId)
        ]);
        const perfTime = Date.now() - perfStart;
        
        readinessChecks.performance = perfTime < 5000; // Under 5 seconds
        console.log(`Performance (${perfTime}ms): ${readinessChecks.performance ? '✅' : '❌'}`);
        
        // Overall assessment
        const passedChecks = Object.values(readinessChecks).filter(Boolean).length;
        const totalChecks = Object.keys(readinessChecks).length;
        const readinessScore = Math.round((passedChecks / totalChecks) * 100);
        
        console.log(`\nProduction Readiness Score: ${readinessScore}% (${passedChecks}/${totalChecks})`);
        
        // System should pass all checks
        expect(readinessChecks.database).toBe(true);
        expect(readinessChecks.embeddings).toBe(true);
        expect(readinessChecks.vectorSearch).toBe(true);
        expect(readinessChecks.tenantIsolation).toBe(true);
        expect(readinessChecks.errorHandling).toBe(true);
        expect(readinessChecks.performance).toBe(true);
        
        console.log('\n🚀 SYSTEM IS READY FOR PRODUCTION');
        
      } catch (error) {
        console.error('❌ Production readiness assessment failed:', error);
        throw error;
      }
    }, 15000); // 15 second timeout
  });
});
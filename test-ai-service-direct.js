#!/usr/bin/env node

/**
 * Test the AI service searchVectors function directly
 * to see if the issue is in the service layer
 */

require('dotenv').config({ path: '.env.local' });

async function testAIServiceDirect() {
  console.log('🔍 Testing AI Service searchVectors function directly...\n');
  
  try {
    // Import the AI service (need to handle ES modules in CommonJS)
    const { searchVectors } = await import('./src/services/ai-service.ts');
    
    const testQueries = [
      'features',
      'social commerce',
      'How many features do I have?',
      'AI-Powered Search'
    ];
    
    const tenantId = '22222222-2222-2222-2222-222222222222';
    
    for (const query of testQueries) {
      console.log(`Testing query: "${query}"`);
      
      try {
        const results = await searchVectors(query, tenantId);
        
        console.log(`✅ Results: ${results.length} matches`);
        
        if (results.length > 0) {
          console.log('📋 Sample result:');
          console.log('  - ID:', results[0].id);
          console.log('  - Similarity:', results[0].similarity);
          console.log('  - Content preview:', results[0].content?.substring(0, 100) + '...');
          
          const hasRelevantMatch = results.some(r => 
            r.content && r.content.toLowerCase().includes(query.toLowerCase().split(' ')[0])
          );
          console.log('  - Has relevant match:', hasRelevantMatch);
        }
        
      } catch (error) {
        console.error(`❌ Error for "${query}":`, error.message);
      }
      
      console.log('---');
    }
    
  } catch (error) {
    console.error('💥 Failed to import AI service:', error.message);
    console.log('\nThis might be due to ES modules. Let\'s test the API endpoint directly instead.\n');
    
    // Fallback: test API endpoint directly
    await testAPIEndpointDirect();
  }
}

async function testAPIEndpointDirect() {
  console.log('🌐 Testing API endpoint directly with simple queries...\n');
  
  const testQueries = [
    'list features',
    'show me features', 
    'what features exist'
  ];
  
  for (const query of testQueries) {
    console.log(`Testing: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:3001/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '22222222-2222-2222-2222-222222222222'
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: query,
            id: `test-${Date.now()}`
          }],
          tenantId: '22222222-2222-2222-2222-222222222222',
          userId: '20000000-0000-0000-0000-000000000001'
        })
      });
      
      if (response.ok) {
        const text = await response.text();
        const hasContextReference = text.includes('I don\'t see') || text.includes('Based on') || text.includes('context');
        const isGenericResponse = text.includes('features for a product') || text.includes('When considering');
        
        console.log(`✅ Response received`);
        console.log(`📊 Analysis:`);
        console.log(`  - Has context reference: ${hasContextReference}`);
        console.log(`  - Is generic response: ${isGenericResponse}`);
        console.log(`  - First 100 chars: ${text.substring(0, 100)}...`);
      } else {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Request failed:`, error.message);
    }
    
    console.log('---');
  }
}

testAIServiceDirect().catch(console.error);
#!/usr/bin/env node

// Test vector search functionality directly
const { searchVectors } = require('./src/services/ai-service.ts');

async function testVectorSearch() {
  console.log('Testing vector search...');
  
  try {
    console.log('Environment check:');
    console.log('OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const results = await searchVectors(
      'social commerce integration',
      '22222222-2222-2222-2222-222222222222'
    );
    
    console.log('Search results:', {
      count: results.length,
      results: results.map(r => ({
        id: r.id,
        similarity: r.similarity,
        content: r.content?.substring(0, 100) + '...'
      }))
    });
    
  } catch (error) {
    console.error('Vector search failed:', error.message);
    console.error('Full error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testVectorSearch().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
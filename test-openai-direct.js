#!/usr/bin/env node

// Test OpenAI API directly from Node.js environment
require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  console.log('Testing OpenAI API access...');
  console.log('Environment check:');
  console.log('OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('First 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'none');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('No OpenAI API key found in environment');
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: 'social commerce integration test',
        model: 'text-embedding-3-small'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('OpenAI API test successful!');
    console.log('Embedding dimensions:', result.data[0].embedding.length);
    console.log('First 5 values:', result.data[0].embedding.slice(0, 5));
    
  } catch (error) {
    console.error('OpenAI API test failed:', error.message);
  }
}

testOpenAI();
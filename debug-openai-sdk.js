/**
 * Debug OpenAI SDK to see what methods are available
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

console.log('🔑 API Key status:', process.env.OPENAI_API_KEY ? 'Available' : 'Missing');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔍 Debugging OpenAI SDK');
console.log('='.repeat(40));

console.log('OpenAI instance:', typeof openai);
console.log('OpenAI.beta:', typeof openai.beta);

if (openai.beta) {
  console.log('beta.assistants:', typeof openai.beta.assistants);
  console.log('beta.vectorStores:', typeof openai.beta.vectorStores);
  
  if (openai.beta.vectorStores) {
    console.log('beta.vectorStores.create:', typeof openai.beta.vectorStores.create);
    console.log('beta.vectorStores.fileBatches:', typeof openai.beta.vectorStores.fileBatches);
    
    if (openai.beta.vectorStores.fileBatches) {
      console.log('beta.vectorStores.fileBatches.uploadAndPoll:', typeof openai.beta.vectorStores.fileBatches.uploadAndPoll);
    }
  }
  
  if (openai.beta.assistants) {
    console.log('beta.assistants.create:', typeof openai.beta.assistants.create);
    console.log('beta.assistants.retrieve:', typeof openai.beta.assistants.retrieve);
  }
} else {
  console.log('❌ openai.beta is not available');
}

console.log('');
console.log('📦 Available methods:');
console.log('openai.files:', typeof openai.files);
if (openai.files) {
  console.log('openai.files.create:', typeof openai.files.create);
}

// Check SDK version
try {
  const packageInfo = await import('./package.json', { assert: { type: 'json' } });
  const openaiVersion = packageInfo.default.dependencies?.openai || 'unknown';
  console.log('');
  console.log('📋 Package info:');
  console.log('OpenAI SDK version:', openaiVersion);
} catch (error) {
  console.log('Could not read package.json');
}

console.log('');
console.log('🎯 SDK Status Summary:');
console.log('✅ Basic OpenAI client available:', !!openai);
console.log('✅ Beta features available:', !!openai.beta);
console.log('✅ Vector stores available:', !!openai.beta?.vectorStores);
console.log('✅ Upload and poll available:', !!openai.beta?.vectorStores?.fileBatches?.uploadAndPoll);

console.log('');
console.log('🔍 Exploring beta object:');
if (openai.beta) {
  console.log('Beta keys:', Object.keys(openai.beta));
  
  // Check for different possible names
  console.log('beta.vector_stores:', typeof openai.beta.vector_stores);
  console.log('beta.vectorstore:', typeof openai.beta.vectorstore);
  
  // Check if it's under threads
  if (openai.beta.threads) {
    console.log('beta.threads keys:', Object.keys(openai.beta.threads));
  }
  
  // Try a real API call to see what's supported
  console.log('');
  console.log('🧪 Testing real API call...');
  
  try {
    const assistants = await openai.beta.assistants.list({ limit: 1 });
    console.log('✅ Assistants API working, found', assistants.data.length, 'assistants');
  } catch (error) {
    console.log('❌ Assistants API error:', error.message);
  }
  
  // Try vector stores via REST API
  console.log('');
  console.log('🔄 Testing vector stores via REST API...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/vector_stores?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Vector stores REST API working, found', data.data?.length || 0, 'vector stores');
    } else {
      console.log('❌ Vector stores REST API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Vector stores REST API error:', error.message);
  }
}
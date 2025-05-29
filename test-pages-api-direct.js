/**
 * Quick test to check Pages API directly
 * Run with: node test-pages-api-direct.js
 */

const fetch = require('node-fetch');

async function testPagesAPI() {
  try {
    console.log('🔍 Testing Pages API directly...');
    
    // Test without authentication first
    const response = await fetch('http://localhost:3001/api/pages-db');
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('📡 Response body:', result);
    
    if (response.status === 401) {
      console.log('❌ API requires authentication (expected)');
    } else if (response.status === 200) {
      console.log('✅ API responding, but no auth check');
    } else {
      console.log('⚠️  Unexpected status code');
    }
    
  } catch (error) {
    console.error('💥 Error testing API:', error.message);
  }
}

testPagesAPI();
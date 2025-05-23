/**
 * Test the indexing API endpoint directly
 */

const fetch = require('node-fetch');

const tenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

async function testIndexingAPI() {
  console.log('🔄 Testing indexing API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        action: 'index',
        tenantId: tenantId,
        messages: [] // Required for schema validation
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    
    const textResponse = await response.text();
    console.log('📝 Raw response:', textResponse);
    
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('✅ Parsed response:', data);
      
      if (data.success) {
        console.log(`🎉 Success! Indexed ${data.indexed} items`);
        if (data.errors && data.errors.length > 0) {
          console.log(`⚠️  Errors: ${data.errors.length}`);
          data.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else {
        console.error('❌ Indexing failed:', data.error);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response');
      console.log('Raw text was:', textResponse.substring(0, 200));
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testIndexingAPI();
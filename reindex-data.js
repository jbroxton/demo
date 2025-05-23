/**
 * Script to re-index all user data for AI chat
 */

const fetch = require('node-fetch');

const tenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

async function reindexData() {
  console.log('🔄 Starting data re-indexing...');
  
  try {
    const response = await fetch('http://localhost:3001/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        action: 'index',
        tenantId: tenantId
      })
    });
    
    const textResponse = await response.text();
    console.log('📝 Raw response:', textResponse.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON');
      return;
    }
    
    if (response.ok && data.success) {
      console.log('✅ Indexing completed successfully!');
      console.log(`📊 Indexed: ${data.indexed || 0} items`);
      
      if (data.errors?.length > 0) {
        console.log(`⚠️  Errors: ${data.errors.length} items had issues`);
        data.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.error('❌ Indexing failed:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

reindexData();
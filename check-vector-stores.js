const https = require('https');
require('dotenv').config({ path: '.env.local' });

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, error: e });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function checkVectorStores() {
  console.log('🔍 Checking vector stores in OpenAI API...');
  
  try {
    const response = await makeRequest('https://api.openai.com/v1/vector_stores');
    
    if (response.status !== 200) {
      console.error('❌ Failed to fetch vector stores:', response.status, response.data);
      return;
    }
    
    const vectorStores = response.data.data || [];
    
    console.log(`📊 Found ${vectorStores.length} vector stores in OpenAI:`);
    
    vectorStores.forEach((vs, index) => {
      console.log(`  ${index + 1}. ${vs.name || 'Unnamed'} (${vs.id})`);
      console.log(`     Status: ${vs.status}`);
      console.log(`     File counts: ${JSON.stringify(vs.file_counts)}`);
      console.log(`     Created: ${new Date(vs.created_at * 1000).toISOString()}`);
      console.log(`     Last active: ${vs.last_active_at ? new Date(vs.last_active_at * 1000).toISOString() : 'Never'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking vector stores:', error.message);
  }
}

async function checkAssistants() {
  console.log('🤖 Checking assistant configurations...');
  
  try {
    const response = await makeRequest('https://api.openai.com/v1/assistants');
    
    if (response.status !== 200) {
      console.error('❌ Failed to fetch assistants:', response.status, response.data);
      return;
    }
    
    const assistants = response.data.data || [];
    
    console.log(`📊 Found ${assistants.length} assistants in OpenAI:`);
    
    assistants.forEach((assistant, index) => {
      console.log(`  ${index + 1}. ${assistant.name || 'Unnamed'} (${assistant.id})`);
      console.log(`     Model: ${assistant.model}`);
      console.log(`     Tools: ${assistant.tools.map(t => t.type).join(', ')}`);
      
      if (assistant.tool_resources?.file_search?.vector_store_ids) {
        console.log(`     Vector Stores: ${assistant.tool_resources.file_search.vector_store_ids.join(', ')}`);
      } else {
        console.log(`     Vector Stores: None attached`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking assistants:', error.message);
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    process.exit(1);
  }
  
  await checkVectorStores();
  console.log('---');
  await checkAssistants();
}

main().catch(console.error);
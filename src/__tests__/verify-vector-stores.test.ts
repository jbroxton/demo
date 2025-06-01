/**
 * @file Verify Vector Stores Creation Test
 * @description Check if vector stores are being created in OpenAI API
 */

describe('Vector Store Verification', () => {
  test('should list vector stores via direct API call', async () => {
    console.log('🔍 Checking vector stores in OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/vector_stores', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch vector stores:', response.status, response.statusText);
      throw new Error(`Failed to fetch vector stores: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Found ${data.data.length} vector stores in OpenAI:`);
    
    data.data.forEach((vs: any, index: number) => {
      console.log(`  ${index + 1}. ${vs.name || 'Unnamed'} (${vs.id})`);
      console.log(`     Status: ${vs.status}`);
      console.log(`     File counts: ${JSON.stringify(vs.file_counts)}`);
      console.log(`     Created: ${new Date(vs.created_at * 1000).toISOString()}`);
      console.log(`     Last active: ${vs.last_active_at ? new Date(vs.last_active_at * 1000).toISOString() : 'Never'}`);
      console.log('');
    });
    
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should check assistant configuration', async () => {
    console.log('🤖 Checking assistant configurations...');
    
    const response = await fetch('https://api.openai.com/v1/assistants', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch assistants:', response.status, response.statusText);
      throw new Error(`Failed to fetch assistants: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Found ${data.data.length} assistants in OpenAI:`);
    
    data.data.forEach((assistant: any, index: number) => {
      console.log(`  ${index + 1}. ${assistant.name || 'Unnamed'} (${assistant.id})`);
      console.log(`     Model: ${assistant.model}`);
      console.log(`     Tools: ${assistant.tools.map((t: any) => t.type).join(', ')}`);
      
      if (assistant.tool_resources?.file_search?.vector_store_ids) {
        console.log(`     Vector Stores: ${assistant.tool_resources.file_search.vector_store_ids.join(', ')}`);
      } else {
        console.log(`     Vector Stores: None attached`);
      }
      console.log('');
    });
    
    expect(data.data).toBeDefined();
  });
});
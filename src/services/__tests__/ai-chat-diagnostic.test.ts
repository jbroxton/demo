/**
 * @file AI Chat Diagnostic Tests
 * @description Quick diagnostic tests to check current OpenAI integration status
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

describe('AI Chat Diagnostic Tests', () => {
  test('should verify OpenAI API connection', async () => {
    console.log('🔌 Testing OpenAI API connection...');
    
    // Test basic API access
    const models = await openai.models.list();
    expect(models.data).toBeDefined();
    expect(models.data.length).toBeGreaterThan(0);
    
    console.log('✅ OpenAI API connection working');
  });

  test('should check if vector stores API is available', async () => {
    console.log('🔍 Checking vector stores API availability...');
    
    expect(openai.beta).toBeDefined();
    expect(openai.beta.vectorStores).toBeDefined();
    expect(typeof openai.beta.vectorStores.create).toBe('function');
    expect(typeof openai.beta.vectorStores.list).toBe('function');
    
    console.log('✅ Vector stores API is available');
  });

  test('should list current files in OpenAI', async () => {
    console.log('📁 Listing current files in OpenAI...');
    
    const files = await openai.files.list({ purpose: 'assistants' });
    
    console.log(`📊 Found ${files.data.length} files in OpenAI:`);
    files.data.forEach(file => {
      console.log(`  - ${file.filename} (${file.id}) - ${file.status} - ${new Date(file.created_at * 1000).toISOString()}`);
    });
    
    expect(files.data).toBeDefined();
  });

  test('should list current vector stores in OpenAI', async () => {
    console.log('🗂️ Listing current vector stores in OpenAI...');
    
    const vectorStores = await openai.beta.vectorStores.list();
    
    console.log(`📊 Found ${vectorStores.data.length} vector stores in OpenAI:`);
    vectorStores.data.forEach(vs => {
      console.log(`  - ${vs.name} (${vs.id}) - ${vs.status} - Files: ${JSON.stringify(vs.file_counts)}`);
    });
    
    expect(vectorStores.data).toBeDefined();
  });

  test('should list current assistants in OpenAI', async () => {
    console.log('🤖 Listing current assistants in OpenAI...');
    
    const assistants = await openai.beta.assistants.list();
    
    console.log(`📊 Found ${assistants.data.length} assistants in OpenAI:`);
    assistants.data.forEach(assistant => {
      console.log(`  - ${assistant.name} (${assistant.id}) - Model: ${assistant.model}`);
      console.log(`    Tools: ${assistant.tools.map(t => t.type).join(', ')}`);
      if (assistant.tool_resources?.file_search?.vector_store_ids) {
        console.log(`    Vector Stores: ${assistant.tool_resources.file_search.vector_store_ids.join(', ')}`);
      }
    });
    
    expect(assistants.data).toBeDefined();
  });

  test('should test creating a simple vector store', async () => {
    console.log('🧪 Testing simple vector store creation...');
    
    const testContent = "# Diagnostic Test\n\nThis is a diagnostic test file.";
    
    // Create test file
    const file = await openai.files.create({
      file: new File([testContent], 'diagnostic-test.txt', { type: 'text/plain' }),
      purpose: 'assistants'
    });
    
    console.log(`✅ Created test file: ${file.id}`);
    
    // Create vector store
    const vectorStore = await openai.beta.vectorStores.create({
      name: 'Diagnostic Test Vector Store',
      file_ids: [file.id]
    });
    
    console.log(`✅ Created test vector store: ${vectorStore.id}`);
    console.log(`📊 Status: ${vectorStore.status}, File counts: ${JSON.stringify(vectorStore.file_counts)}`);
    
    // Cleanup
    await openai.beta.vectorStores.del(vectorStore.id);
    await openai.files.del(file.id);
    
    console.log(`🧹 Cleaned up test resources`);
    
    expect(vectorStore.id).toBeDefined();
    expect(vectorStore.status).toBeDefined();
  });
});
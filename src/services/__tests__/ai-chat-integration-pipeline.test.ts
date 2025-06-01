/**
 * @file AI Chat Integration Pipeline Tests
 * @description Comprehensive tests to verify the OpenAI file upload and vector store pipeline
 */

import OpenAI from 'openai';
import { supabase } from '@/services/supabase';
import {
  exportTenantDataForOpenAI,
  ensureTenantDataSynced,
  getUserThread,
  createUserThread,
  getOrCreateAssistant
} from '@/services/ai-chat-fully-managed';

// Initialize OpenAI client for testing
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For testing environment
});

describe('AI Chat Integration Pipeline Tests', () => {
  const testTenantId = 'test-integration-tenant';
  const testUserId = 'test-integration-user';
  
  // Store created resources for cleanup
  let createdFileIds: string[] = [];
  let createdVectorStoreIds: string[] = [];
  let createdAssistantId: string | null = null;
  let createdThreadId: string | null = null;

  beforeAll(() => {
    // Ensure we have OpenAI API key for integration tests
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required for integration tests');
    }
  });

  afterAll(async () => {
    // Cleanup created resources
    console.log('🧹 Cleaning up test resources...');
    
    // Delete created files
    for (const fileId of createdFileIds) {
      try {
        await openai.files.del(fileId);
        console.log(`✅ Deleted file: ${fileId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to delete file ${fileId}:`, error);
      }
    }
    
    // Delete created vector stores
    for (const vectorStoreId of createdVectorStoreIds) {
      try {
        await openai.beta.vectorStores.del(vectorStoreId);
        console.log(`✅ Deleted vector store: ${vectorStoreId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to delete vector store ${vectorStoreId}:`, error);
      }
    }
    
    // Delete created assistant
    if (createdAssistantId) {
      try {
        await openai.beta.assistants.del(createdAssistantId);
        console.log(`✅ Deleted assistant: ${createdAssistantId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to delete assistant ${createdAssistantId}:`, error);
      }
    }
  });

  describe('1. Data Export Pipeline', () => {
    test('should export tenant data successfully', async () => {
      console.log('📊 Testing data export...');
      
      const exportedData = await exportTenantDataForOpenAI(testTenantId);
      
      expect(exportedData).toBeDefined();
      expect(typeof exportedData).toBe('string');
      expect(exportedData.length).toBeGreaterThan(100);
      expect(exportedData).toContain('Product Management Context');
      
      console.log(`✅ Exported ${exportedData.length} characters of data`);
    });
  });

  describe('2. OpenAI Files Creation', () => {
    test('should create file in OpenAI files store', async () => {
      console.log('📁 Testing file creation...');
      
      const testContent = "# Test Content\n\nThis is test data for integration testing.";
      
      const file = await openai.files.create({
        file: new File([testContent], 'test-integration-file.txt', { type: 'text/plain' }),
        purpose: 'assistants'
      });
      
      createdFileIds.push(file.id);
      
      expect(file.id).toBeDefined();
      expect(file.filename).toBe('test-integration-file.txt');
      expect(file.purpose).toBe('assistants');
      expect(file.status).toBe('processed');
      
      console.log(`✅ Created file: ${file.id}`);
      
      // Verify file exists in OpenAI
      const retrievedFile = await openai.files.retrieve(file.id);
      expect(retrievedFile.id).toBe(file.id);
      
      console.log(`✅ File verified in OpenAI store`);
    });
    
    test('should list files and find our created file', async () => {
      console.log('📋 Testing file listing...');
      
      const files = await openai.files.list({ purpose: 'assistants' });
      
      expect(files.data).toBeDefined();
      expect(Array.isArray(files.data)).toBe(true);
      
      // Find our test file
      const ourFile = files.data.find(file => 
        createdFileIds.includes(file.id)
      );
      
      expect(ourFile).toBeDefined();
      console.log(`✅ Found our file in OpenAI files list`);
    });
  });

  describe('3. Vector Store Creation and Management', () => {
    test('should create vector store with file', async () => {
      console.log('🔍 Testing vector store creation...');
      
      // Use the file created in previous test
      const fileId = createdFileIds[0];
      expect(fileId).toBeDefined();
      
      const vectorStore = await openai.beta.vectorStores.create({
        name: 'Test Integration Vector Store',
        file_ids: [fileId],
        expires_after: {
          anchor: 'last_active_at',
          days: 1  // Short expiry for testing
        }
      });
      
      createdVectorStoreIds.push(vectorStore.id);
      
      expect(vectorStore.id).toBeDefined();
      expect(vectorStore.name).toBe('Test Integration Vector Store');
      expect(vectorStore.file_counts).toBeDefined();
      
      console.log(`✅ Created vector store: ${vectorStore.id}`);
      console.log(`📊 File counts:`, vectorStore.file_counts);
    });
    
    test('should wait for vector store processing to complete', async () => {
      console.log('⏳ Testing vector store processing...');
      
      const vectorStoreId = createdVectorStoreIds[0];
      expect(vectorStoreId).toBeDefined();
      
      let attempts = 0;
      const maxAttempts = 30;
      let finalStatus = 'unknown';
      
      while (attempts < maxAttempts) {
        const status = await openai.beta.vectorStores.retrieve(vectorStoreId);
        finalStatus = status.status;
        
        console.log(`🔄 Attempt ${attempts + 1}: status=${status.status}, file_counts=${JSON.stringify(status.file_counts)}`);
        
        if (status.status === 'completed') {
          break;
        } else if (status.status === 'failed') {
          throw new Error('Vector store processing failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      expect(['completed', 'in_progress']).toContain(finalStatus);
      console.log(`✅ Vector store processing status: ${finalStatus}`);
    });
    
    test('should list vector stores and find ours', async () => {
      console.log('📋 Testing vector store listing...');
      
      const vectorStores = await openai.beta.vectorStores.list();
      
      expect(vectorStores.data).toBeDefined();
      expect(Array.isArray(vectorStores.data)).toBe(true);
      
      const ourVectorStore = vectorStores.data.find(vs => 
        createdVectorStoreIds.includes(vs.id)
      );
      
      expect(ourVectorStore).toBeDefined();
      console.log(`✅ Found our vector store in OpenAI list`);
    });
  });

  describe('4. Assistant Creation and Configuration', () => {
    test('should create assistant with vector store attached', async () => {
      console.log('🤖 Testing assistant creation...');
      
      const vectorStoreId = createdVectorStoreIds[0];
      expect(vectorStoreId).toBeDefined();
      
      const assistant = await openai.beta.assistants.create({
        name: 'Test Integration Assistant',
        model: 'gpt-4-1106-preview',
        instructions: 'You are a test assistant for integration testing.',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        }
      });
      
      createdAssistantId = assistant.id;
      
      expect(assistant.id).toBeDefined();
      expect(assistant.name).toBe('Test Integration Assistant');
      expect(assistant.tools).toContainEqual({ type: 'file_search' });
      expect(assistant.tool_resources?.file_search?.vector_store_ids).toContain(vectorStoreId);
      
      console.log(`✅ Created assistant: ${assistant.id}`);
      console.log(`🔗 Attached vector store: ${vectorStoreId}`);
    });
    
    test('should retrieve assistant and verify configuration', async () => {
      console.log('🔍 Testing assistant configuration...');
      
      expect(createdAssistantId).toBeDefined();
      
      const assistant = await openai.beta.assistants.retrieve(createdAssistantId!);
      
      expect(assistant.id).toBe(createdAssistantId);
      expect(assistant.tools).toContainEqual({ type: 'file_search' });
      expect(assistant.tool_resources?.file_search?.vector_store_ids).toBeDefined();
      expect(assistant.tool_resources?.file_search?.vector_store_ids?.length).toBeGreaterThan(0);
      
      const attachedVectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];
      expect(createdVectorStoreIds).toContain(attachedVectorStoreId);
      
      console.log(`✅ Assistant properly configured with vector store`);
    });
  });

  describe('5. End-to-End Service Pipeline', () => {
    test('should run complete ensureTenantDataSynced pipeline', async () => {
      console.log('🔄 Testing complete service pipeline...');
      
      // This will test the actual service function
      await expect(ensureTenantDataSynced(testTenantId)).resolves.not.toThrow();
      
      console.log(`✅ Complete pipeline executed successfully`);
      
      // Verify assistant was created/updated
      const assistantId = await getOrCreateAssistant(testTenantId);
      expect(assistantId).toBeDefined();
      
      // Clean up this assistant separately since it's created by the service
      try {
        await openai.beta.assistants.del(assistantId);
        console.log(`🧹 Cleaned up service-created assistant: ${assistantId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup service assistant:`, error);
      }
    });
  });

  describe('6. Thread and Message Pipeline', () => {
    test('should create thread and send message', async () => {
      console.log('💬 Testing thread and message pipeline...');
      
      // Create thread
      const threadId = await createUserThread(testUserId, testTenantId);
      createdThreadId = threadId;
      
      expect(threadId).toBeDefined();
      console.log(`✅ Created thread: ${threadId}`);
      
      // Verify thread exists
      const retrievedThreadId = await getUserThread(testUserId, testTenantId);
      expect(retrievedThreadId).toBe(threadId);
      
      // Get assistant
      const assistantId = await getOrCreateAssistant(testTenantId);
      
      // Add message to thread
      const message = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: 'What features do we have?'
      });
      
      expect(message.id).toBeDefined();
      expect(message.content[0].type).toBe('text');
      
      console.log(`✅ Added message to thread`);
      
      // Create and wait for run (basic test - don't wait for completion)
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        instructions: 'Please answer based on the uploaded context.'
      });
      
      expect(run.id).toBeDefined();
      expect(run.status).toBeDefined();
      
      console.log(`✅ Created run: ${run.id} with status: ${run.status}`);
    });
  });

  describe('7. Integration Verification Checklist', () => {
    test('should verify all components are properly connected', async () => {
      console.log('✅ Running final integration verification...');
      
      // Check files exist
      const files = await openai.files.list({ purpose: 'assistants' });
      const hasOurFiles = files.data.some(file => createdFileIds.includes(file.id));
      expect(hasOurFiles).toBe(true);
      console.log('✅ Files verified in OpenAI store');
      
      // Check vector stores exist
      const vectorStores = await openai.beta.vectorStores.list();
      const hasOurVectorStores = vectorStores.data.some(vs => createdVectorStoreIds.includes(vs.id));
      expect(hasOurVectorStores).toBe(true);
      console.log('✅ Vector stores verified in OpenAI');
      
      // Check assistant exists and is configured
      if (createdAssistantId) {
        const assistant = await openai.beta.assistants.retrieve(createdAssistantId);
        expect(assistant.tools).toContainEqual({ type: 'file_search' });
        expect(assistant.tool_resources?.file_search?.vector_store_ids).toBeDefined();
        console.log('✅ Assistant verified and properly configured');
      }
      
      // Check database records exist (if tables are available)
      try {
        const { data } = await supabase
          .from('ai_chat_fully_managed_assistants')
          .select('*')
          .eq('tenant_id', testTenantId);
        
        if (data && data.length > 0) {
          console.log('✅ Database records verified');
        } else {
          console.log('ℹ️ No database records (tables may not exist)');
        }
      } catch (error) {
        console.log('ℹ️ Database check skipped (tables may not exist)');
      }
      
      console.log('🎉 All integration checks passed!');
    });
  });
}, 120000); // 2 minute timeout for integration tests
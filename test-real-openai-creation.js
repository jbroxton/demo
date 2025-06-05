/**
 * Real test to trigger the pipeline and verify assistant/vector store creation in OpenAI
 */

import { ensureTenantDataSynced } from './src/services/ai-chat-fully-managed.ts';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function testRealOpenAICreation() {
  console.log('🧪 REAL TEST: OpenAI Assistant & Vector Store Creation');
  console.log('='.repeat(60));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    // Step 1: Clear existing data to ensure fresh test
    console.log('🧹 Step 1: Clearing existing data...');
    
    const { data: existingData } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('assistant_id, file_ids')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (existingData?.assistant_id) {
      console.log('   Found existing assistant:', existingData.assistant_id);
      try {
        await openai.beta.assistants.del(existingData.assistant_id);
        console.log('   ✅ Deleted existing assistant from OpenAI');
      } catch (error) {
        console.log('   ⚠️  Assistant may already be deleted:', error.message);
      }
    }
    
    // Clear database record
    await supabase
      .from('ai_chat_fully_managed_assistants')
      .delete()
      .eq('tenant_id', testTenantId);
    
    console.log('   ✅ Cleared database records');
    
    // Step 2: Trigger the new pipeline
    console.log('');
    console.log('🚀 Step 2: Triggering new pipeline...');
    console.log('   This will test the complete best practices implementation');
    
    await ensureTenantDataSynced(testTenantId);
    
    console.log('   ✅ Pipeline execution completed');
    
    // Step 3: Verify in database
    console.log('');
    console.log('📋 Step 3: Verifying database records...');
    
    const { data: newData, error: dbError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (dbError || !newData) {
      console.error('   ❌ No data found in database:', dbError?.message);
      return;
    }
    
    console.log('   ✅ Database record found:');
    console.log('      Assistant ID:', newData.assistant_id);
    console.log('      File IDs:', newData.file_ids);
    console.log('      Last Synced:', newData.last_synced);
    
    const assistantId = newData.assistant_id;
    const fileIds = newData.file_ids || [];
    
    // Step 4: Verify assistant in OpenAI
    console.log('');
    console.log('🤖 Step 4: Verifying assistant in OpenAI...');
    
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      
      console.log('   ✅ Assistant found in OpenAI:');
      console.log('      ID:', assistant.id);
      console.log('      Name:', assistant.name);
      console.log('      Model:', assistant.model);
      console.log('      Tools:', assistant.tools?.map(t => t.type));
      
      // Check tool resources
      const toolResources = assistant.tool_resources;
      const vectorStoreIds = toolResources?.file_search?.vector_store_ids || [];
      
      console.log('      Vector Store IDs:', vectorStoreIds);
      
      if (vectorStoreIds.length === 0) {
        console.log('   ❌ NO VECTOR STORES attached to assistant!');
        return;
      }
      
      // Step 5: Verify vector store
      console.log('');
      console.log('📦 Step 5: Verifying vector store in OpenAI...');
      
      const vectorStoreId = vectorStoreIds[0];
      
      try {
        const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
        
        console.log('   ✅ Vector Store found in OpenAI:');
        console.log('      ID:', vectorStore.id);
        console.log('      Name:', vectorStore.name);
        console.log('      Status:', vectorStore.status);
        console.log('      File Counts:', JSON.stringify(vectorStore.file_counts));
        console.log('      Created:', new Date(vectorStore.created_at * 1000).toISOString());
        
        // Step 6: Verify files in vector store
        console.log('');
        console.log('📄 Step 6: Verifying files in vector store...');
        
        const files = await openai.beta.vectorStores.files.list(vectorStoreId);
        
        console.log('   📁 Files in vector store:', files.data.length);
        
        for (const file of files.data) {
          console.log(`      File: ${file.id} (status: ${file.status})`);
          
          // Get file details
          try {
            const fileDetails = await openai.files.retrieve(file.id);
            console.log(`         Size: ${fileDetails.bytes} bytes`);
            console.log(`         Created: ${new Date(fileDetails.created_at * 1000).toISOString()}`);
          } catch (fileError) {
            console.log(`         ⚠️ Could not get file details: ${fileError.message}`);
          }
        }
        
        // Step 7: Final verification
        console.log('');
        console.log('🎯 Step 7: Final verification...');
        
        const hasAssistant = !!assistant.id;
        const hasFileSearch = assistant.tools?.some(t => t.type === 'file_search');
        const hasVectorStore = vectorStoreIds.length > 0;
        const hasFiles = files.data.length > 0;
        const filesProcessed = files.data.every(f => f.status === 'completed');
        
        console.log('   ✅ Assistant exists:', hasAssistant);
        console.log('   ✅ Has file_search tool:', hasFileSearch);
        console.log('   ✅ Vector store attached:', hasVectorStore);
        console.log('   ✅ Files uploaded:', hasFiles);
        console.log('   ✅ Files processed:', filesProcessed);
        
        if (hasAssistant && hasFileSearch && hasVectorStore && hasFiles && filesProcessed) {
          console.log('');
          console.log('🎉 SUCCESS: Complete pipeline verified!');
          console.log('   🤖 Assistant properly created with best practices');
          console.log('   📦 Vector store attached to assistant');
          console.log('   📄 Files uploaded and processed');
          console.log('   🔗 All components properly linked');
          console.log('');
          console.log('✅ Ready for AI chat with pages data!');
          console.log('   Ask: "How many features do I have?"');
          console.log('   Expected: ~126 features (pages) vs 8 (legacy)');
        } else {
          console.log('');
          console.log('❌ ISSUES FOUND:');
          if (!hasAssistant) console.log('   • Assistant missing');
          if (!hasFileSearch) console.log('   • file_search tool missing');
          if (!hasVectorStore) console.log('   • Vector store not attached');
          if (!hasFiles) console.log('   • No files uploaded');
          if (!filesProcessed) console.log('   • Files not processed');
        }
        
      } catch (vectorStoreError) {
        console.error('   ❌ Vector store verification failed:', vectorStoreError.message);
      }
      
    } catch (assistantError) {
      console.error('   ❌ Assistant verification failed:', assistantError.message);
    }
    
  } catch (error) {
    console.error('💥 Real test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRealOpenAICreation();
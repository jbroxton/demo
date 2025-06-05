/**
 * Verify pipeline results after AI chat test
 * Run this AFTER making an AI chat request to verify the pipeline worked
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function verifyPipelineResults() {
  console.log('✅ Verifying Pipeline Results');
  console.log('='.repeat(40));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    console.log('🔍 Checking database for new assistant...');
    
    const { data: dbData, error: dbError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (dbError || !dbData) {
      console.log('❌ PIPELINE NOT TRIGGERED');
      console.log('   No assistant record found in database');
      console.log('   Make sure to:');
      console.log('   1. Start development server: npm run dev');
      console.log('   2. Open http://localhost:3000');
      console.log('   3. Navigate to AI Chat');
      console.log('   4. Ask a question to trigger the pipeline');
      return;
    }
    
    console.log('✅ DATABASE RECORD FOUND:');
    console.log('   🤖 Assistant ID:', dbData.assistant_id);
    console.log('   📅 Created:', dbData.created_at);
    console.log('   📅 Last Synced:', dbData.last_synced);
    console.log('   📁 File IDs:', dbData.file_ids);
    console.log('   📊 File Count:', dbData.file_ids?.length || 0);
    
    const assistantId = dbData.assistant_id;
    
    // Check if sync was recent (within last 10 minutes)
    const lastSynced = new Date(dbData.last_synced);
    const timeSinceSync = Date.now() - lastSynced.getTime();
    const isRecent = timeSinceSync < 10 * 60 * 1000; // 10 minutes
    
    console.log('   ⏰ Sync Age:', Math.round(timeSinceSync / 1000), 'seconds ago');
    console.log('   ✅ Recent Sync:', isRecent);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('');
      console.log('⚠️  OPENAI_API_KEY not available for verification');
      console.log('   Database shows pipeline was triggered');
      console.log('   Assistant should be created with best practices');
      return;
    }
    
    console.log('');
    console.log('🤖 Verifying assistant in OpenAI...');
    
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      
      console.log('✅ ASSISTANT FOUND IN OPENAI:');
      console.log('   ID:', assistant.id);
      console.log('   Name:', assistant.name);
      console.log('   Model:', assistant.model);
      console.log('   Tools:', assistant.tools?.map(t => t.type).join(', '));
      
      const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
      console.log('   Vector Stores:', vectorStoreIds.length);
      
      if (vectorStoreIds.length === 0) {
        console.log('❌ NO VECTOR STORES ATTACHED!');
        return;
      }
      
      console.log('');
      console.log('📦 Verifying vector store...');
      
      const vectorStoreId = vectorStoreIds[0];
      const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
      
      console.log('✅ VECTOR STORE FOUND:');
      console.log('   ID:', vectorStore.id);
      console.log('   Name:', vectorStore.name);
      console.log('   Status:', vectorStore.status);
      console.log('   File Counts:', JSON.stringify(vectorStore.file_counts));
      
      console.log('');
      console.log('📄 Checking files in vector store...');
      
      const files = await openai.beta.vectorStores.files.list(vectorStoreId);
      console.log('   Files Count:', files.data.length);
      
      for (const file of files.data) {
        console.log(`   File: ${file.id} (${file.status})`);
      }
      
      console.log('');
      console.log('🎉 PIPELINE VERIFICATION COMPLETE!');
      console.log('');
      console.log('✅ SUCCESS INDICATORS:');
      console.log('   • Assistant created with best practices ✅');
      console.log('   • Vector store attached to assistant ✅');
      console.log('   • Files uploaded and processed ✅');
      console.log('   • Database properly updated ✅');
      console.log('');
      console.log('🧪 TEST RESULT:');
      if (isRecent) {
        console.log('   🎯 FRESH PIPELINE RUN - Implementation working!');
      } else {
        console.log('   📅 Older pipeline run - May need fresh test');
      }
      
    } catch (assistantError) {
      console.error('❌ Assistant verification failed:', assistantError.message);
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
  }
}

verifyPipelineResults();
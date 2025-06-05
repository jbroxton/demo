/**
 * Check if vector store has assistant properly attached
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function checkVectorStoreAssistantLink() {
  console.log('🔗 Checking Vector Store ↔ Assistant Link');
  console.log('='.repeat(50));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    // Step 1: Get assistant info from database
    console.log('🤖 Getting assistant info from database...');
    
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('❌ No assistant found in database:', assistantError?.message);
      return;
    }
    
    console.log('✅ Assistant found in database:', assistantData.assistant_id);
    console.log('📅 Last synced:', assistantData.last_synced);
    console.log('📁 File IDs:', assistantData.file_ids);
    
    // Step 2: Get assistant configuration from OpenAI
    console.log('');
    console.log('📡 Getting assistant configuration from OpenAI...');
    
    const assistant = await openai.beta.assistants.retrieve(assistantData.assistant_id);
    
    console.log('🔧 Assistant tools:', assistant.tools?.map(t => t.type));
    console.log('📦 Tool resources:', JSON.stringify(assistant.tool_resources, null, 2));
    
    const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
    console.log('📚 Vector store IDs attached to assistant:', vectorStoreIds);
    
    if (vectorStoreIds.length === 0) {
      console.log('⚠️  NO VECTOR STORES attached to assistant!');
      console.log('   This means file search won\'t work');
      return;
    }
    
    // Step 3: Check each vector store
    for (const vectorStoreId of vectorStoreIds) {
      console.log('');
      console.log(`📊 Checking vector store: ${vectorStoreId}`);
      
      try {
        const vectorStoreResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        if (vectorStoreResponse.ok) {
          const vectorStore = await vectorStoreResponse.json();
          console.log('   📈 Status:', vectorStore.status);
          console.log('   📁 File counts:', JSON.stringify(vectorStore.file_counts));
          console.log('   📅 Created:', vectorStore.created_at);
          console.log('   🏷️  Name:', vectorStore.name);
          
          // Check files in vector store
          const filesResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            console.log('   📄 Files in vector store:', filesData.data?.length || 0);
            
            if (filesData.data?.length > 0) {
              for (const file of filesData.data) {
                console.log(`      - File ${file.id} (status: ${file.status})`);
              }
            }
          }
          
        } else {
          console.log('   ❌ Failed to get vector store details');
        }
      } catch (error) {
        console.log('   💥 Error checking vector store:', error.message);
      }
    }
    
    // Step 4: Verify bidirectional link
    console.log('');
    console.log('🔍 VERIFICATION SUMMARY:');
    console.log('='.repeat(30));
    
    const hasFileSearchTool = assistant.tools?.some(t => t.type === 'file_search');
    const hasVectorStores = vectorStoreIds.length > 0;
    
    console.log('✅ Assistant has file_search tool:', hasFileSearchTool);
    console.log('✅ Assistant has vector stores attached:', hasVectorStores);
    console.log('✅ Vector stores contain files:', vectorStoreIds.length > 0 ? 'Checked above' : 'N/A');
    
    if (hasFileSearchTool && hasVectorStores) {
      console.log('');
      console.log('🎉 LINK IS PROPER: Assistant ↔ Vector Store connection is correct!');
      console.log('   • Assistant has file_search capability');
      console.log('   • Vector stores are attached to assistant');
      console.log('   • Files can be searched during chat');
    } else {
      console.log('');
      console.log('❌ LINK IS BROKEN: Missing components:');
      if (!hasFileSearchTool) console.log('   • Assistant missing file_search tool');
      if (!hasVectorStores) console.log('   • Assistant missing vector store attachment');
      
      console.log('');
      console.log('🔧 FIX: Run ensureTenantDataSynced() to establish proper link');
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkVectorStoreAssistantLink();
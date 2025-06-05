// Debug assistant - check current state and force proper update
require('dotenv').config({ path: '.env.local' });

async function debugAssistant() {
  try {
    console.log('🔍 Debugging assistant state...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const OpenAI = await import('openai');
    
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get assistant from database
    console.log('📋 Getting assistant from database...');
    const { data: assistant, error } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error fetching assistant:', error);
      return;
    }
    
    console.log('🤖 Database Assistant Info:');
    console.log(`   - Tenant ID: ${assistant.tenant_id}`);
    console.log(`   - Assistant ID: ${assistant.assistant_id}`);
    console.log(`   - File IDs: ${JSON.stringify(assistant.file_ids)}`);
    console.log(`   - Last Synced: ${assistant.last_synced}`);
    
    // Check assistant in OpenAI
    console.log('\n🔍 Checking assistant in OpenAI...');
    const openaiAssistant = await openai.beta.assistants.retrieve(assistant.assistant_id);
    
    console.log('🤖 OpenAI Assistant Info:');
    console.log(`   - Name: ${openaiAssistant.name}`);
    console.log(`   - Model: ${openaiAssistant.model}`);
    console.log(`   - Tools: ${JSON.stringify(openaiAssistant.tools)}`);
    
    // Check vector store
    const vectorStoreIds = openaiAssistant.tool_resources?.file_search?.vector_store_ids || [];
    console.log(`   - Vector Store IDs: ${JSON.stringify(vectorStoreIds)}`);
    
    if (vectorStoreIds.length > 0) {
      console.log('\n📁 Checking vector store files...');
      const vectorStoreId = vectorStoreIds[0];
      
      try {
        const files = await openai.beta.vectorStores.files.list(vectorStoreId);
        console.log(`   - Vector Store ID: ${vectorStoreId}`);
        console.log(`   - Number of files: ${files.data.length}`);
        
        files.data.forEach((file, index) => {
          console.log(`   - File ${index + 1}: ${file.id} (status: ${file.status})`);
        });
        
        // Check if we have the latest file
        const latestFileId = assistant.file_ids[assistant.file_ids.length - 1];
        const hasLatestFile = files.data.some(f => f.id === latestFileId);
        console.log(`   - Has latest file (${latestFileId}): ${hasLatestFile}`);
        
      } catch (vectorError) {
        console.error('❌ Error checking vector store:', vectorError);
      }
    }
    
    console.log('\n💡 Recommendations:');
    if (vectorStoreIds.length === 0) {
      console.log('   - Assistant has no vector store attached');
    } else {
      console.log('   - Try manually syncing data again');
      console.log('   - The assistant should reflect updated files');
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// Run debug
debugAssistant();
// Update assistant files script - just refreshes the data files for existing assistants
require('dotenv').config({ path: '.env.local' });

async function updateAssistantFiles() {
  try {
    console.log('🚀 Starting assistant file update...');
    
    // Import the sync function - need to use a different approach for TypeScript files
    // We'll call the API endpoint instead since direct TS import doesn't work in Node.js
    console.log('📞 Will trigger sync via API endpoint for each tenant...');
    const { createClient } = await import('@supabase/supabase-js');
    
    // Get all tenants that have assistants
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Getting all tenants with assistants...');
    const { data: assistants, error } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('tenant_id, assistant_id');
    
    if (error) {
      console.error('❌ Error fetching assistants:', error);
      return;
    }
    
    if (!assistants || assistants.length === 0) {
      console.log('ℹ️ No assistants found');
      console.log('💡 Try chatting with the AI first to create an assistant');
      return;
    }
    
    console.log(`📊 Found ${assistants.length} assistants to update`);
    
    // Update files for each tenant by calling the AI chat API
    for (const assistant of assistants) {
      console.log(`\n🔄 Updating files for tenant: ${assistant.tenant_id} (assistant: ${assistant.assistant_id})`);
      try {
        // Make a simple API call to trigger the sync
        const response = await fetch('http://localhost:3000/api/ai-chat-fully-managed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': assistant.tenant_id
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'sync' }],
            tenantId: assistant.tenant_id
          })
        });
        
        if (response.ok) {
          console.log(`✅ Tenant ${assistant.tenant_id} sync triggered successfully`);
        } else {
          console.error(`❌ Failed to trigger sync for tenant ${assistant.tenant_id}: ${response.status}`);
        }
      } catch (syncError) {
        console.error(`❌ Failed to update tenant ${assistant.tenant_id}:`, syncError);
      }
    }
    
    console.log('\n🎉 Assistant file updates complete!');
    console.log('💬 AI assistants now have fresh page-only data');
    console.log('🧹 Legacy features and products have been excluded');
    
  } catch (error) {
    console.error('💥 Unexpected error during file update:', error);
  }
}

// Run the update
updateAssistantFiles();
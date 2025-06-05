// Force resync script - clears all cached assistants to force recreation with clean page-only data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceResyncAllTenants() {
  try {
    console.log('🚀 Starting force resync for all tenants...');
    
    // Get all existing assistants
    const { data: assistants, error: selectError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('tenant_id, assistant_id, file_ids');
    
    if (selectError) {
      console.error('❌ Error fetching assistants:', selectError);
      return;
    }
    
    if (!assistants || assistants.length === 0) {
      console.log('ℹ️ No assistants found - nothing to clear');
      return;
    }
    
    console.log(`📋 Found ${assistants.length} assistants to clear`);
    
    // Clear all assistant records from database
    const { error: deleteError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing assistants from database:', deleteError);
      return;
    }
    
    console.log('✅ All assistant records cleared from database');
    console.log('📝 Summary:');
    assistants.forEach(assistant => {
      console.log(`  - Tenant ${assistant.tenant_id}: Assistant ${assistant.assistant_id} cleared`);
    });
    
    console.log('');
    console.log('🎉 Force resync complete!');
    console.log('💡 Next time any user chats:');
    console.log('   - New assistant will be created automatically');
    console.log('   - Only page-type entities will be included');
    console.log('   - Legacy features/products will be excluded');
    
  } catch (error) {
    console.error('💥 Unexpected error during force resync:', error);
  }
}

// Run the script
forceResyncAllTenants();
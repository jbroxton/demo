// Simple sync - just reduce the sync interval to force immediate sync on next chat
require('dotenv').config({ path: '.env.local' });

async function triggerImmediateSync() {
  try {
    console.log('🚀 Setting up immediate sync...');
    
    const { createClient } = await import('@supabase/supabase-js');
    
    // Update last_synced to force sync on next chat
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Getting all assistants...');
    const { data: assistants, error } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('tenant_id, assistant_id, last_synced');
    
    if (error) {
      console.error('❌ Error fetching assistants:', error);
      return;
    }
    
    if (!assistants || assistants.length === 0) {
      console.log('ℹ️ No assistants found');
      return;
    }
    
    console.log(`📊 Found ${assistants.length} assistants`);
    
    // Set last_synced to null to force sync on next chat
    const { error: updateError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .update({ last_synced: null })
      .not('tenant_id', 'is', null);
    
    if (updateError) {
      console.error('❌ Error updating sync timestamps:', updateError);
      return;
    }
    
    console.log('✅ Sync timestamps cleared');
    console.log('');
    console.log('🎉 Setup complete!');
    console.log('💡 Next time you chat with the AI:');
    console.log('   - It will automatically sync with fresh page-only data');
    console.log('   - Legacy features and products will be excluded');
    console.log('   - The sync will happen in the background');
    
    assistants.forEach(assistant => {
      console.log(`   📋 Tenant ${assistant.tenant_id}: Assistant ${assistant.assistant_id} ready for sync`);
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the setup
triggerImmediateSync();
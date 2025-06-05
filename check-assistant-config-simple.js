/**
 * Simple check of assistant configuration in database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkAssistantConfig() {
  console.log('🔍 Checking Assistant Configuration in Database');
  console.log('='.repeat(50));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    // Get assistant info from database
    console.log('🗄️  Querying assistant data...');
    
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('❌ No assistant found:', assistantError?.message);
      return;
    }
    
    console.log('✅ Assistant Configuration Found:');
    console.log('   🤖 Assistant ID:', assistantData.assistant_id);
    console.log('   🏢 Tenant ID:', assistantData.tenant_id);
    console.log('   📅 Created:', assistantData.created_at);
    console.log('   🔄 Last Synced:', assistantData.last_synced || 'Never');
    console.log('   📁 File IDs:', assistantData.file_ids || []);
    console.log('   📊 File Count:', (assistantData.file_ids || []).length);
    
    // Analysis
    console.log('');
    console.log('📊 CONFIGURATION ANALYSIS:');
    console.log('='.repeat(30));
    
    const hasAssistant = !!assistantData.assistant_id;
    const hasFiles = assistantData.file_ids && assistantData.file_ids.length > 0;
    const recentlyUpdated = assistantData.last_synced && 
      (Date.now() - new Date(assistantData.last_synced).getTime()) < 1 * 60 * 60 * 1000; // 1 hour
    
    console.log('✅ Has Assistant ID:', hasAssistant);
    console.log('✅ Has Files:', hasFiles);
    console.log('✅ Recently Updated:', recentlyUpdated);
    
    if (hasAssistant && hasFiles) {
      console.log('');
      console.log('🎯 EXPECTED BEHAVIOR:');
      console.log('   • Assistant should have file_search tool enabled');
      console.log('   • Assistant should have vector store(s) attached');
      console.log('   • Vector store(s) should contain the uploaded files');
      console.log('   • AI chat should have access to pages data via file search');
      console.log('');
      console.log('📝 FILES IN SYSTEM:');
      for (const fileId of assistantData.file_ids) {
        console.log(`   - ${fileId} (should contain pages data)`);
      }
      
      if (recentlyUpdated) {
        console.log('');
        console.log('🎉 CONFIGURATION LOOKS GOOD!');
        console.log('   Assistant was recently synced with updated pages data');
        console.log('   The vector store should be properly attached');
      } else {
        console.log('');
        console.log('⚠️  SYNC MIGHT BE NEEDED:');
        console.log('   Last sync was more than 1 hour ago');
        console.log('   Next AI chat request will trigger automatic sync');
      }
      
    } else {
      console.log('');
      console.log('❌ CONFIGURATION INCOMPLETE:');
      if (!hasAssistant) console.log('   • Missing assistant ID');
      if (!hasFiles) console.log('   • No files uploaded');
      console.log('');
      console.log('🔧 FIX: Make an AI chat request to trigger assistant creation/sync');
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
  }
}

checkAssistantConfig();
/**
 * Check current state in OpenAI and prepare for pipeline test
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function checkCurrentOpenAIState() {
  console.log('🔍 Checking Current OpenAI State');
  console.log('='.repeat(40));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    // Check database state
    console.log('📋 Database State:');
    
    const { data: dbData, error: dbError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (dbError) {
      console.log('   ❌ No assistant record in database');
      console.log('   This is expected - we cleared it for fresh test');
    } else {
      console.log('   🤖 Assistant ID:', dbData.assistant_id);
      console.log('   📅 Last Synced:', dbData.last_synced);
      console.log('   📁 File IDs:', dbData.file_ids);
    }
    
    // Check OpenAI assistants
    console.log('');
    console.log('🤖 OpenAI Assistants:');
    
    try {
      const assistants = await openai.beta.assistants.list({ limit: 10 });
      console.log(`   Found ${assistants.data.length} assistants`);
      
      const tenantAssistants = assistants.data.filter(a => 
        a.name && a.name.includes(testTenantId)
      );
      
      if (tenantAssistants.length > 0) {
        console.log(`   Found ${tenantAssistants.length} assistants for tenant:`);
        for (const assistant of tenantAssistants) {
          console.log(`      ${assistant.id}: ${assistant.name}`);
          console.log(`         Tools: ${assistant.tools?.map(t => t.type).join(', ')}`);
          console.log(`         Vector Stores: ${assistant.tool_resources?.file_search?.vector_store_ids?.length || 0}`);
        }
      } else {
        console.log('   ✅ No existing assistants for tenant (clean slate)');
      }
    } catch (assistantError) {
      console.error('   ❌ Error checking assistants:', assistantError.message);
    }
    
    // Check vector stores
    console.log('');
    console.log('📦 OpenAI Vector Stores:');
    
    try {
      const vectorStores = await openai.beta.vectorStores.list({ limit: 10 });
      console.log(`   Found ${vectorStores.data.length} vector stores`);
      
      const tenantStores = vectorStores.data.filter(vs => 
        vs.name && vs.name.includes(testTenantId)
      );
      
      if (tenantStores.length > 0) {
        console.log(`   Found ${tenantStores.length} vector stores for tenant:`);
        for (const store of tenantStores) {
          console.log(`      ${store.id}: ${store.name}`);
          console.log(`         Status: ${store.status}`);
          console.log(`         Files: ${store.file_counts?.total || 0}`);
        }
      } else {
        console.log('   ✅ No existing vector stores for tenant (clean slate)');
      }
    } catch (vectorStoreError) {
      console.error('   ❌ Error checking vector stores:', vectorStoreError.message);
    }
    
    console.log('');
    console.log('🧪 TEST PREPARATION COMPLETE');
    console.log('');
    console.log('📋 NEXT STEPS TO TEST PIPELINE:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Navigate to AI Chat');
    console.log('   4. Ask: "How many features do I have?"');
    console.log('');
    console.log('🔄 WHAT SHOULD HAPPEN:');
    console.log('   • getOrCreateAssistant() will be called');
    console.log('   • No assistant found → triggers ensureTenantDataSynced()');
    console.log('   • New pipeline creates: File → Vector Store → Assistant');
    console.log('   • All components properly linked with best practices');
    console.log('   • Response shows ~126 features (pages) vs 8 (legacy)');
    console.log('');
    console.log('🔍 VERIFICATION:');
    console.log('   • Run this script again after AI chat to see new resources');
    console.log('   • Check database for new assistant record');
    console.log('   • Verify OpenAI has new assistant with vector store attached');
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkCurrentOpenAIState();
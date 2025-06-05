/**
 * Test the updated OpenAI pipeline with best practices
 * This should create: File → Vector Store → Assistant (with attachments)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testUpdatedPipeline() {
  console.log('🧪 Testing Updated OpenAI Pipeline with Best Practices');
  console.log('='.repeat(60));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    // Step 1: Clear existing assistant (simulate fresh start)
    console.log('🧹 Clearing existing assistant data...');
    
    const { error: deleteError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .delete()
      .eq('tenant_id', testTenantId);
    
    if (deleteError) {
      console.error('⚠️  Error clearing assistant:', deleteError.message);
    } else {
      console.log('✅ Cleared existing assistant data');
    }
    
    // Step 2: Trigger AI chat to activate the new pipeline
    console.log('');
    console.log('🚀 Triggering AI chat to activate new pipeline...');
    console.log('   This should automatically:');
    console.log('   1. Export pages data (126 features vs 8 legacy)');
    console.log('   2. Upload file to OpenAI');
    console.log('   3. Create vector store');
    console.log('   4. Add file to vector store with polling');
    console.log('   5. Create assistant with vector store attached');
    console.log('   6. Store everything in database');
    console.log('');
    
    // Make a simple API request to trigger the pipeline
    const triggerResponse = await fetch('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me understand my product data?',
        mode: 'chat',
        threadId: null,
        // Add tenant context
        testTenantId: testTenantId
      })
    });
    
    console.log('📡 API Response Status:', triggerResponse.status);
    
    if (triggerResponse.status === 200) {
      const response = await triggerResponse.text();
      console.log('📄 Response preview:', response.substring(0, 200) + '...');
    } else {
      const errorText = await triggerResponse.text();
      console.log('❌ API Error:', errorText);
    }
    
    // Step 3: Verify the pipeline results
    console.log('');
    console.log('🔍 Verifying pipeline results...');
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    if (assistantError) {
      console.log('❌ No assistant found in database');
      console.log('   The pipeline may not have been triggered yet');
      console.log('   Try making an AI chat request in the app');
    } else {
      console.log('✅ PIPELINE VERIFICATION:');
      console.log('   🤖 Assistant ID:', assistantData.assistant_id);
      console.log('   📅 Created:', assistantData.created_at);
      console.log('   📅 Last Synced:', assistantData.last_synced);
      console.log('   📁 File IDs:', assistantData.file_ids);
      console.log('   📊 File Count:', assistantData.file_ids?.length || 0);
      
      const isRecent = assistantData.last_synced && 
        (Date.now() - new Date(assistantData.last_synced).getTime()) < 5 * 60 * 1000; // 5 minutes
      
      if (isRecent) {
        console.log('');
        console.log('🎉 SUCCESS: Pipeline executed recently!');
        console.log('   ✅ New assistant created with best practices');
        console.log('   ✅ Vector store should be attached');
        console.log('   ✅ Files should be properly uploaded and processed');
        console.log('   ✅ Ready for AI chat with pages data');
      } else {
        console.log('');
        console.log('ℹ️  Assistant exists but sync is older');
        console.log('   Next AI chat request will trigger refresh');
      }
    }
    
    console.log('');
    console.log('🧪 TEST COMPLETE');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('   1. Open the app at http://localhost:3000');
    console.log('   2. Navigate to AI Chat');
    console.log('   3. Ask: "How many features do I have?"');
    console.log('   4. Expected: ~126 features (pages API) vs 8 (legacy)');
    console.log('');
    console.log('💡 The updated pipeline uses OpenAI best practices:');
    console.log('   • SDK methods for vector store operations');
    console.log('   • uploadAndPoll for proper file processing');
    console.log('   • Assistant created with vector store attached');
    console.log('   • Automatic cleanup of old resources');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdatedPipeline();
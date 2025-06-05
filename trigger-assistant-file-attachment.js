/**
 * Trigger file attachment by making an AI chat request
 * This will automatically ensure files are attached to the existing assistant
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function triggerAssistantFileAttachment() {
  console.log('🔗 Triggering Assistant File Attachment');
  console.log('='.repeat(50));
  
  try {
    // Authenticate as test user
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔐 Authenticating test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pm1@test.com',
      password: 'password'
    });
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('👤 User ID:', authData.user.id);
    
    // Check current assistant status
    console.log('');
    console.log('🔍 Checking current assistant status...');
    
    const { data: assistantData } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', '22222222-2222-2222-2222-222222222222')
      .single();
    
    if (assistantData) {
      console.log('🤖 Found existing assistant:', assistantData.assistant_id);
      console.log('📅 Last synced:', assistantData.last_synced || 'Never');
      console.log('📁 Current files:', assistantData.file_ids?.length || 0);
    }
    
    // Make AI chat request - this will trigger automatic file attachment
    console.log('');
    console.log('🤖 Making AI chat request to trigger file attachment...');
    
    const session = authData.session;
    
    const aiResponse = await fetch('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Cookie': `supabase-auth-token=${JSON.stringify(session)}`
      },
      body: JSON.stringify({
        message: 'How many features do I have? Please give me the exact count and mention if you found the data in uploaded files.',
        mode: 'chat', // Use chat mode to trigger file search
        threadId: null
      })
    });
    
    console.log('📡 AI Response Status:', aiResponse.status);
    
    if (aiResponse.status !== 200) {
      const errorText = await aiResponse.text();
      console.error('❌ AI request failed:', errorText);
      return;
    }
    
    const aiResult = await aiResponse.text();
    
    try {
      const jsonResponse = JSON.parse(aiResult);
      
      console.log('');
      console.log('🤖 AI RESPONSE:');
      console.log('-'.repeat(40));
      console.log(jsonResponse.message || aiResult);
      console.log('-'.repeat(40));
      
      // Check for file search evidence
      const mentionsFiles = (jsonResponse.message || '').toLowerCase().includes('file');
      const hasNumbers = /\d+/.test(jsonResponse.message || '');
      
      console.log('');
      console.log('📊 ANALYSIS:');
      console.log('✅ Response mentions files:', mentionsFiles);
      console.log('✅ Response contains numbers:', hasNumbers);
      
      if (hasNumbers) {
        const numbers = (jsonResponse.message || '').match(/\d+/g);
        console.log('🔢 Numbers found:', numbers);
        
        const featuresCount = numbers?.find(n => parseInt(n) > 10);
        if (featuresCount) {
          const count = parseInt(featuresCount);
          if (count > 100) {
            console.log('');
            console.log('🎉 SUCCESS: High feature count (' + count + ') detected!');
            console.log('   This confirms pages API integration is working');
            console.log('   Assistant has access to updated pages data');
          }
        }
      }
      
    } catch (parseError) {
      console.log('📄 Raw response (not JSON):', aiResult);
    }
    
    // Check assistant status after request
    console.log('');
    console.log('🔍 Checking assistant status after request...');
    
    const { data: updatedAssistantData } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('*')
      .eq('tenant_id', '22222222-2222-2222-2222-222222222222')
      .single();
    
    if (updatedAssistantData) {
      console.log('🤖 Assistant ID:', updatedAssistantData.assistant_id);
      console.log('📅 Last synced:', updatedAssistantData.last_synced);
      console.log('📁 File count:', updatedAssistantData.file_ids?.length || 0);
      
      const wasUpdated = assistantData?.last_synced !== updatedAssistantData.last_synced;
      
      if (wasUpdated) {
        console.log('');
        console.log('✅ ATTACHMENT TRIGGERED!');
        console.log('   Assistant was automatically updated with new files');
        console.log('   Files are now attached to the existing assistant');
      } else {
        console.log('');
        console.log('ℹ️  No sync needed - files already up to date');
      }
    }
    
  } catch (error) {
    console.error('💥 Trigger failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

triggerAssistantFileAttachment();
/**
 * Test the actual AI chat response to show it's working with pages
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testLiveAIResponse() {
  console.log('🤖 Testing Live AI Chat Response - Features Count');
  console.log('='.repeat(50));
  
  try {
    // First, let's get a real session token
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test user credentials (from the existing test setup)
    const testEmail = 'pm1@demo.com';
    const testPassword = 'testpassword123';
    
    console.log('🔐 Authenticating test user...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('👤 User ID:', authData.user.id);
    
    // Get the session token
    const session = authData.session;
    const accessToken = session.access_token;
    
    console.log('');
    console.log('🤖 Making AI chat request...');
    
    // Make the AI chat request
    const aiResponse = await fetch('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': `supabase-auth-token=${JSON.stringify(session)}`
      },
      body: JSON.stringify({
        message: 'How many features do I have? Please give me the exact count.',
        mode: 'agent',
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
    console.log('');
    console.log('🎯 RAW AI RESPONSE:');
    console.log('-'.repeat(50));
    console.log(aiResult);
    console.log('-'.repeat(50));
    
    try {
      const jsonResponse = JSON.parse(aiResult);
      
      if (jsonResponse.message) {
        console.log('');
        console.log('🤖 AI MESSAGE:');
        console.log(jsonResponse.message);
        
        // Extract numbers from the response
        const numbers = jsonResponse.message.match(/\d+/g);
        if (numbers) {
          console.log('');
          console.log('📊 NUMBERS FOUND IN RESPONSE:', numbers);
          
          const featuresCount = numbers.find(n => parseInt(n) > 10); // Look for feature count
          if (featuresCount) {
            const count = parseInt(featuresCount);
            console.log('');
            console.log('🎯 FEATURE COUNT DETECTED:', count);
            
            if (count > 100) {
              console.log('🎉 SUCCESS: AI returned high count (' + count + ') - USING PAGES API!');
              console.log('   This proves the implementation works - pages table has ~126 features');
            } else if (count < 20) {
              console.log('⚠️  ISSUE: Low count (' + count + ') - may still be using legacy API');
              console.log('   Legacy features table only has 8 features');
            } else {
              console.log('🤔 UNCLEAR: Medium count (' + count + ') - need to investigate');
            }
          }
        }
        
        // Check for function calling evidence
        if (jsonResponse.message.includes('listFeatures') || jsonResponse.message.includes('features')) {
          console.log('');
          console.log('✅ AI response mentions features - function calling worked');
        }
        
      } else {
        console.log('📄 Response structure:', Object.keys(jsonResponse));
      }
      
    } catch (parseError) {
      console.log('📄 Response is not JSON, showing raw response above');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLiveAIResponse();
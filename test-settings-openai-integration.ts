/**
 * Quick integration test for OpenAI Assistant settings sync
 * Tests with real tenant ID from env.local
 */

import { 
  updateSpeqqInstructions, 
  getSpeqqInstructions,
  buildAssistantInstructions 
} from './src/services/tenant-settings-db';
import { tenantAssistants, isOpenAIConfigured, openai } from './src/lib/openai';

async function testSettingsSync() {
  const tenantId = '22222222-2222-2222-2222-222222222222'; // From env.local
  
  console.log('🧪 Testing OpenAI Assistant settings sync...');
  console.log('Tenant ID:', tenantId);
  
  if (!isOpenAIConfigured()) {
    console.log('❌ OpenAI not configured - check OPENAI_API_KEY');
    return;
  }
  
  try {
    // Step 1: Get current instructions
    console.log('\n📖 Step 1: Getting current instructions...');
    const currentResult = await getSpeqqInstructions(tenantId);
    console.log('Current instructions length:', currentResult.data?.length || 0);
    
    // Step 2: Get/create Assistant
    console.log('\n🤖 Step 2: Getting Assistant ID...');
    const assistantId = await tenantAssistants.getAssistantId(tenantId);
    console.log('Assistant ID:', assistantId);
    
    // Step 3: Check current Assistant instructions
    console.log('\n🔍 Step 3: Checking current Assistant instructions...');
    const currentAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('Current Assistant instructions length:', currentAssistant.instructions?.length || 0);
    console.log('Current instructions preview:', currentAssistant.instructions?.substring(0, 150) + '...');
    
    // Step 4: Update with test content
    console.log('\n✏️  Step 4: Updating settings with test content...');
    const testContent = `[New] # Integration Test Company

## Company
- **Name:** Integration Test Corp
- **Product:** Settings Sync Testing Platform
- **Industry:** Software Development
- **Stage:** Testing Phase

## Team
- **Size:** Integration Test Team
- **Role:** Test Product Manager
- **Method:** Continuous Testing

## Product
- **Users:** Developers and QA Engineers
- **Value:** Automated settings synchronization
- **Model:** Test-driven development
- **Success:** Successful OpenAI sync

## Style
- **Tone:** Technical and precise
- **Focus:** Integration testing

## Notes
This is an integration test conducted on ${new Date().toISOString()}
Testing if settings changes sync with OpenAI Assistant API.
Unique identifier: ${Math.random().toString(36).substring(7)}`;

    const updateResult = await updateSpeqqInstructions(tenantId, testContent);
    
    if (!updateResult.success) {
      console.log('❌ Failed to update settings:', updateResult.error);
      return;
    }
    
    console.log('✅ Settings updated successfully');
    
    // Step 5: Verify Assistant was updated
    console.log('\n🔍 Step 5: Verifying Assistant instructions were updated...');
    
    // Wait a moment for sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('Updated Assistant instructions length:', updatedAssistant.instructions?.length || 0);
    console.log('Updated instructions preview:', updatedAssistant.instructions?.substring(0, 150) + '...');
    
    // Check if our test content is in the instructions
    const hasNewPrefix = updatedAssistant.instructions?.includes('[New]');
    const hasTestContent = updatedAssistant.instructions?.includes('Integration Test Corp');
    const hasTimestamp = updatedAssistant.instructions?.includes(new Date().toISOString().substring(0, 10)); // Just the date part
    const hasTestPhrase = updatedAssistant.instructions?.includes('Settings Sync Testing Platform');
    
    console.log('\n🧪 Verification Results:');
    console.log('Contains [New] prefix:', hasNewPrefix ? '✅' : '❌');
    console.log('Contains test company name:', hasTestContent ? '✅' : '❌');
    console.log('Contains today\'s date:', hasTimestamp ? '✅' : '❌');
    console.log('Contains test phrase:', hasTestPhrase ? '✅' : '❌');
    console.log('Instructions are different:', currentAssistant.instructions !== updatedAssistant.instructions ? '✅' : '❌');
    
    if (hasNewPrefix && hasTestContent && hasTestPhrase) {
      console.log('\n🎉 SUCCESS: OpenAI Assistant instructions were successfully updated!');
      console.log('The settings sync is working correctly.');
    } else {
      console.log('\n❌ FAILURE: OpenAI Assistant instructions were not updated properly.');
      console.log('There may be an issue with the sync mechanism.');
    }
    
    // Show the actual change
    console.log('\n📊 Instruction Length Comparison:');
    console.log('Before:', currentAssistant.instructions?.length || 0, 'characters');
    console.log('After:', updatedAssistant.instructions?.length || 0, 'characters');
    console.log('Difference:', (updatedAssistant.instructions?.length || 0) - (currentAssistant.instructions?.length || 0), 'characters');
    
  } catch (error) {
    console.error('❌ Test failed with error:', (error as Error).message);
    console.error('Full error:', error);
  }
}

// Run the test
testSettingsSync().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});
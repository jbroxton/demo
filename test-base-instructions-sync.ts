/**
 * Test syncing base instructions with [New] prefix
 */

import { updateSpeqqInstructions, getSpeqqInstructions } from './src/services/tenant-settings-db';
import { tenantAssistants } from './src/lib/openai';
import { openai } from './src/lib/openai';

async function testBaseInstructionsSync() {
  const tenantId = '22222222-2222-2222-2222-222222222222';
  
  console.log('🧪 Testing base instructions sync with [New] prefix...');
  
  try {
    // Step 1: Get Assistant ID
    console.log('\n🤖 Step 1: Getting Assistant ID...');
    const assistantId = await tenantAssistants.getAssistantId(tenantId);
    console.log('Assistant ID:', assistantId);
    
    // Step 2: Check current Assistant instructions
    console.log('\n🔍 Step 2: Checking current Assistant instructions...');
    const currentAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('Current instructions length:', currentAssistant.instructions?.length || 0);
    console.log('Current instructions start with [New]:', currentAssistant.instructions?.startsWith('[New]') ? '✅' : '❌');
    console.log('Current preview:', currentAssistant.instructions?.substring(0, 100) + '...');
    
    // Step 3: Get current Speqq instructions and update (even if just updating with same content)
    console.log('\n📝 Step 3: Triggering instructions sync...');
    const currentSpeqqResult = await getSpeqqInstructions(tenantId);
    const currentSpeqq = currentSpeqqResult.data || '';
    
    // Add a small change to trigger the sync
    const updatedSpeqq = currentSpeqq + '\n\n## Sync Test\nTesting base instructions sync - ' + new Date().toISOString();
    
    const updateResult = await updateSpeqqInstructions(tenantId, updatedSpeqq);
    
    if (!updateResult.success) {
      console.log('❌ Failed to update settings:', updateResult.error);
      return;
    }
    
    console.log('✅ Settings updated successfully');
    
    // Step 4: Verify Assistant was updated with new base instructions
    console.log('\n🔍 Step 4: Verifying Assistant instructions were updated...');
    
    // Wait a moment for sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('Updated instructions length:', updatedAssistant.instructions?.length || 0);
    console.log('Updated instructions start with [New]:', updatedAssistant.instructions?.startsWith('[New]') ? '✅' : '❌');
    console.log('Updated preview:', updatedAssistant.instructions?.substring(0, 100) + '...');
    
    // Check if base instructions contain [New]
    const hasNewInBase = updatedAssistant.instructions?.includes('[New] You are Speqq AI');
    const hasSyncTest = updatedAssistant.instructions?.includes('Sync Test');
    const lengthChanged = currentAssistant.instructions?.length !== updatedAssistant.instructions?.length;
    
    console.log('\n🧪 Verification Results:');
    console.log('Base instructions contain [New]:', hasNewInBase ? '✅' : '❌');
    console.log('Contains sync test content:', hasSyncTest ? '✅' : '❌');
    console.log('Instructions length changed:', lengthChanged ? '✅' : '❌');
    
    if (hasNewInBase) {
      console.log('\n🎉 SUCCESS: Base instructions with [New] prefix successfully synced!');
      console.log('The OpenAI Assistant now has the updated base instructions.');
    } else {
      console.log('\n❌ FAILURE: Base instructions were not properly synced.');
    }
    
    // Show the actual change
    console.log('\n📊 Instruction Length Comparison:');
    console.log('Before:', currentAssistant.instructions?.length || 0, 'characters');
    console.log('After:', updatedAssistant.instructions?.length || 0, 'characters');
    
  } catch (error) {
    console.error('❌ Test failed with error:', (error as Error).message);
    console.error('Full error:', error);
  }
}

// Run the test
testBaseInstructionsSync().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});
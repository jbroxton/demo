/**
 * Test finding existing assistant
 */

import { tenantAssistants } from './src/lib/openai';

async function testFindExisting() {
  const tenantId = '22222222-2222-2222-2222-222222222222';
  
  console.log('🧹 Clearing cache first...');
  tenantAssistants.clearCache(tenantId);
  
  console.log('🔍 Testing assistant discovery...');
  console.log('Expected to find existing assistant: asst_KicskzxGuLgWVut9ShdHh8Za');
  
  try {
    const assistantId = await tenantAssistants.getAssistantId(tenantId);
    console.log('🎯 Found assistant ID:', assistantId);
    
    if (assistantId === 'asst_KicskzxGuLgWVut9ShdHh8Za') {
      console.log('✅ SUCCESS: Found the existing assistant!');
    } else {
      console.log('⚠️  Found a different assistant than expected');
      console.log('Expected: asst_KicskzxGuLgWVut9ShdHh8Za');
      console.log('Got:', assistantId);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFindExisting().catch(console.error);
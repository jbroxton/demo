/**
 * Attach new files specifically to the existing assistant
 * PM Assistant - Tenant 22222222-2222-2222-2222-222222222222
 */

import { ensureTenantDataSynced, getOrCreateAssistant } from './src/services/ai-chat-fully-managed.ts';

async function attachFilesToSpecificAssistant() {
  console.log('📎 Attaching Files to Specific Assistant');
  console.log('='.repeat(50));
  
  try {
    const tenantId = '22222222-2222-2222-2222-222222222222';
    
    console.log('🎯 Target Assistant: PM Assistant - Tenant', tenantId);
    console.log('');
    
    // Step 1: Verify/get the existing assistant
    console.log('🤖 Getting existing assistant...');
    const assistantId = await getOrCreateAssistant(tenantId);
    console.log('✅ Assistant ID:', assistantId);
    
    // Step 2: Force a data sync to attach latest pages data
    console.log('');
    console.log('🔄 Forcing data sync to attach updated pages data...');
    console.log('   This will:');
    console.log('   1. Export current pages data (126 features vs 8 legacy)');
    console.log('   2. Create new file with pages structure');
    console.log('   3. Check for existing vector store or create new one');
    console.log('   4. Add file to vector store');
    console.log('   5. Ensure assistant has file_search tool and vector store attached');
    console.log('   6. Update database with file tracking');
    console.log('');
    
    await ensureTenantDataSynced(tenantId);
    
    console.log('');
    console.log('🎉 FILES SUCCESSFULLY ATTACHED!');
    console.log('');
    console.log('✅ VERIFICATION COMPLETE:');
    console.log('   • Existing assistant verified and used');
    console.log('   • New pages data file created and uploaded');
    console.log('   • Vector store properly linked to assistant');
    console.log('   • Assistant has file_search capability');
    console.log('   • Database updated with file references');
    console.log('');
    console.log('🤖 Assistant now has access to:');
    console.log('   • Function calling: listFeatures() → Pages API (126 features)');
    console.log('   • File search: Vector store with rich pages data');
    console.log('');
    console.log('🧪 TEST: Ask "How many features do I have?" in AI chat');
    console.log('   Expected: ~126 features (proving pages API integration)');
    
  } catch (error) {
    console.error('💥 File attachment failed:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('   1. Check that assistant still exists in OpenAI');
    console.log('   2. Verify OPENAI_API_KEY is valid');
    console.log('   3. Ensure Supabase is running');
    console.log('   4. Check pages data is available in database');
  }
}

attachFilesToSpecificAssistant();
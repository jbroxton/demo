/**
 * Verify OpenAI Assistant and Vector Store Pipeline
 * This script checks if the assistant has proper files attached and vector store is updated
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEST_TENANT_ID = '22222222-2222-2222-2222-222222222222';

async function verifyOpenAIPipeline() {
  try {
    console.log('🔍 Verifying OpenAI Assistant and Vector Store Pipeline...\n');

    // Step 1: Get the assistant for our test tenant
    console.log('📋 Step 1: Finding Assistant for tenant', TEST_TENANT_ID);
    
    const assistants = await openai.beta.assistants.list({
      limit: 100
    });
    
    const tenantAssistant = assistants.data.find(assistant => 
      assistant.name?.includes(TEST_TENANT_ID) || 
      assistant.name?.includes('Speqq AI') ||
      assistant.metadata?.tenantId === TEST_TENANT_ID
    );
    
    if (!tenantAssistant) {
      console.error('❌ No assistant found for tenant', TEST_TENANT_ID);
      return;
    }
    
    console.log(`✅ Found Assistant: ${tenantAssistant.id}`);
    console.log(`   Name: ${tenantAssistant.name}`);
    console.log(`   Created: ${tenantAssistant.created_at}`);
    console.log(`   Tools: ${tenantAssistant.tools.map(t => t.type).join(', ')}`);
    
    // Step 2: Check if assistant has vector store attached
    console.log('\n📂 Step 2: Checking Vector Store attachment...');
    
    const fileSearchTool = tenantAssistant.tools.find(tool => tool.type === 'file_search');
    if (!fileSearchTool) {
      console.error('❌ No file_search tool found on assistant');
      return;
    }
    
    console.log(`✅ File search tool found`);
    
    // Check if vector store is attached via tool resources
    if (tenantAssistant.tool_resources?.file_search?.vector_store_ids?.length > 0) {
      const vectorStoreIds = tenantAssistant.tool_resources.file_search.vector_store_ids;
      console.log(`✅ Vector stores attached: ${vectorStoreIds.join(', ')}`);
      
      // Step 3: Check each vector store
      for (const vectorStoreId of vectorStoreIds) {
        console.log(`\n🗂️  Step 3: Examining Vector Store ${vectorStoreId}...`);
        
        try {
          const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
          console.log(`   Name: ${vectorStore.name}`);
          console.log(`   Status: ${vectorStore.status}`);
          console.log(`   File count: ${vectorStore.file_counts.total}`);
          console.log(`   Created: ${new Date(vectorStore.created_at * 1000).toISOString()}`);
          console.log(`   Last active: ${new Date(vectorStore.last_active_at * 1000).toISOString()}`);
          
          // Step 4: List files in vector store
          console.log(`\n📄 Step 4: Listing files in Vector Store ${vectorStoreId}...`);
          
          const files = await openai.beta.vectorStores.files.list(vectorStoreId, {
            limit: 20
          });
          
          if (files.data.length === 0) {
            console.log('⚠️  No files found in vector store');
          } else {
            console.log(`✅ Found ${files.data.length} files in vector store:`);
            
            for (const file of files.data) {
              try {
                const fileDetails = await openai.files.retrieve(file.id);
                const uploadedDate = new Date(fileDetails.created_at * 1000);
                const isRecent = (Date.now() - uploadedDate.getTime()) < (24 * 60 * 60 * 1000); // Within 24 hours
                
                console.log(`   📁 File ID: ${file.id}`);
                console.log(`      Filename: ${fileDetails.filename}`);
                console.log(`      Size: ${fileDetails.bytes} bytes`);
                console.log(`      Uploaded: ${uploadedDate.toISOString()} ${isRecent ? '🟢 RECENT' : '🔸 OLD'}`);
                console.log(`      Status: ${file.status}`);
                
                // Check if this is a tenant-specific file
                if (fileDetails.filename.includes(TEST_TENANT_ID)) {
                  console.log(`      🎯 TENANT-SPECIFIC FILE for ${TEST_TENANT_ID}`);
                }
                
                console.log('');
              } catch (fileError) {
                console.log(`   📁 File ID: ${file.id} (details unavailable: ${fileError.message})`);
              }
            }
          }
          
        } catch (vectorStoreError) {
          console.error(`❌ Error accessing vector store ${vectorStoreId}:`, vectorStoreError.message);
        }
      }
      
    } else {
      console.log('⚠️  No vector stores attached to assistant');
    }
    
    // Step 5: Check for recent file uploads
    console.log('\n📤 Step 5: Checking recent file uploads...');
    
    const recentFiles = await openai.files.list({
      limit: 20
    });
    
    const tenantFiles = recentFiles.data.filter(file => 
      file.filename?.includes(TEST_TENANT_ID) ||
      file.filename?.includes('tenant-') ||
      file.filename?.includes('pages-data')
    );
    
    if (tenantFiles.length === 0) {
      console.log('⚠️  No recent tenant-specific files found');
    } else {
      console.log(`✅ Found ${tenantFiles.length} recent tenant-specific files:`);
      
      tenantFiles.forEach(file => {
        const uploadedDate = new Date(file.created_at * 1000);
        const isVeryRecent = (Date.now() - uploadedDate.getTime()) < (2 * 60 * 60 * 1000); // Within 2 hours
        
        console.log(`   📄 ${file.filename}`);
        console.log(`      ID: ${file.id}`);
        console.log(`      Uploaded: ${uploadedDate.toISOString()} ${isVeryRecent ? '🟢 VERY RECENT' : '🔸 OLDER'}`);
        console.log(`      Size: ${file.bytes} bytes`);
        console.log(`      Purpose: ${file.purpose}`);
        console.log('');
      });
    }
    
    // Step 6: Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Assistant Found: ${tenantAssistant.id}`);
    console.log(`✅ File Search Enabled: ${!!fileSearchTool}`);
    console.log(`✅ Vector Stores: ${tenantAssistant.tool_resources?.file_search?.vector_store_ids?.length || 0}`);
    console.log(`✅ Recent Tenant Files: ${tenantFiles.length}`);
    
    const hasRecentFiles = tenantFiles.some(file => {
      const uploadedDate = new Date(file.created_at * 1000);
      return (Date.now() - uploadedDate.getTime()) < (2 * 60 * 60 * 1000);
    });
    
    if (hasRecentFiles) {
      console.log('🟢 PIPELINE STATUS: FILES ARE UP TO DATE');
    } else {
      console.log('🔸 PIPELINE STATUS: FILES MAY BE OUTDATED (no uploads in last 2 hours)');
    }
    
  } catch (error) {
    console.error('❌ Error verifying OpenAI pipeline:', error);
  }
}

// Run the verification
verifyOpenAIPipeline();
/**
 * @file OpenAI Fully Managed Service Layer
 * @description Service functions for managing OpenAI Assistants, Threads, and Files
 * 
 * Key Responsibilities:
 * - Thread management (create, retrieve, store)
 * - Assistant management (create per tenant, update with files)
 * - File management (export data, upload to OpenAI, cleanup)
 * - Tenant data synchronization
 */

import OpenAI, { toFile } from 'openai';
import { supabase } from '@/services/supabase';
import { getPages } from '@/services/pages-db';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Allow for Jest environment (which appears browser-like to OpenAI SDK)
  dangerouslyAllowBrowser: true,
});

/**
 * Get OpenAI thread ID for a user/tenant combination
 * 
 * @param userId - User identifier
 * @param tenantId - Tenant identifier
 * @returns Thread ID if exists, null otherwise
 */
export async function getUserThread(userId: string, tenantId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_fully_managed_threads')
      .select('thread_id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Service] Error getting user thread:', error);
      return null;
    }
    
    return data?.thread_id || null;
  } catch (error) {
    console.error('[Service] Unexpected error getting user thread:', error);
    return null;
  }
}

/**
 * Create new OpenAI thread and store reference in database
 * 
 * @param userId - User identifier
 * @param tenantId - Tenant identifier
 * @returns Created thread ID
 * @throws Error if thread creation fails
 */
export async function createUserThread(userId: string, tenantId: string): Promise<string> {
  try {
    // Create thread in OpenAI
    const thread = await openai.beta.threads.create({
      metadata: {
        userId,
        tenantId,
        createdAt: new Date().toISOString()
      }
    });
    
    // Store thread reference in database
    const { error } = await supabase
      .from('ai_chat_fully_managed_threads')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        thread_id: thread.id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, tenant_id'
      });
    
    if (error) {
      console.error('[Service] Error storing thread reference:', error);
      // Try to cleanup the OpenAI thread if DB storage failed
      try {
        await openai.beta.threads.del(thread.id);
      } catch (cleanupError) {
        console.error('[Service] Failed to cleanup thread after DB error:', cleanupError);
      }
      throw new Error(`Failed to store thread reference: ${error.message}`);
    }
    
    console.log(`[Service] Created thread ${thread.id} for user ${userId}, tenant ${tenantId}`);
    return thread.id;
    
  } catch (error) {
    console.error('[Service] Error creating user thread:', error);
    throw error instanceof Error ? error : new Error('Failed to create user thread');
  }
}

// Cache for assistant IDs to avoid database lookups
const assistantCache = new Map<string, { assistantId: string, lastSynced: Date | null }>();

/**
 * Get or create OpenAI assistant for tenant (OPTIMIZED)
 * Uses caching and conditional data sync for performance
 * 
 * @param tenantId - Tenant identifier
 * @returns Assistant ID
 */
export async function getOrCreateAssistant(tenantId: string): Promise<string> {
  try {
    // Check cache first (fastest path)
    const cached = assistantCache.get(tenantId);
    if (cached) {
      console.log(`[Service] Using cached assistant ${cached.assistantId} for tenant ${tenantId}`);
      
      // Check if data sync is needed (only if data hasn't been synced recently)
      const needsSync = !cached.lastSynced || 
        (Date.now() - cached.lastSynced.getTime()) > 60 * 1000; // 1 minute for testing
      
      if (needsSync) {
        console.log(`[Service] Background data sync needed for tenant ${tenantId}`);
        // Fire and forget - don't wait for sync to complete
        ensureTenantDataSynced(tenantId).catch(error => 
          console.error('[Service] Background sync failed:', error)
        );
      }
      
      return cached.assistantId;
    }
    
    console.log(`[Service] Getting or creating assistant for tenant ${tenantId}`);
    
    // Check database
    const { data: existingAssistant, error: selectError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('assistant_id, last_synced')
      .eq('tenant_id', tenantId)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[Service] Error checking existing assistant:', selectError);
      throw new Error('Failed to check existing assistant');
    }
    
    if (existingAssistant?.assistant_id) {
      console.log(`[Service] Found existing assistant ${existingAssistant.assistant_id} for tenant ${tenantId}`);
      
      // Verify the assistant still exists in OpenAI and has correct configuration
      try {
        const assistant = await openai.beta.assistants.retrieve(existingAssistant.assistant_id);
        console.log(`[Service] Verified assistant exists: ${assistant.name}`);
        
        // Check if assistant has proper file_search configuration
        const hasFileSearch = assistant.tools?.some(tool => tool.type === 'file_search');
        if (!hasFileSearch) {
          console.log(`[Service] Assistant missing file_search tool, will update during sync`);
        }
        
        // Cache the result
        assistantCache.set(tenantId, {
          assistantId: existingAssistant.assistant_id,
          lastSynced: existingAssistant.last_synced ? new Date(existingAssistant.last_synced) : null
        });
        
        // Check if data sync is needed
        const lastSynced = existingAssistant.last_synced ? new Date(existingAssistant.last_synced) : null;
        const needsSync = !lastSynced || (Date.now() - lastSynced.getTime()) > 60 * 1000;
        
        if (needsSync) {
          console.log(`[Service] Background data sync needed for tenant ${tenantId}`);
          // Fire and forget - don't wait for sync
          ensureTenantDataSynced(tenantId).catch(error => 
            console.error('[Service] Background sync failed:', error)
          );
        }
        
        return existingAssistant.assistant_id;
        
      } catch (assistantError) {
        const errorMessage = assistantError instanceof Error ? assistantError.message : String(assistantError);
        console.error(`[Service] Existing assistant ${existingAssistant.assistant_id} not found in OpenAI:`, errorMessage);
        console.log(`[Service] Will create new assistant and update database`);
        
        // Assistant was deleted from OpenAI, continue to create new one
        // The database will be updated below
      }
    }
    
    // No assistant exists - trigger fresh pipeline
    console.log(`[Service] No assistant found - triggering fresh pipeline...`);
    
    // Use the new pipeline that creates everything from scratch
    await ensureTenantDataSynced(tenantId);
    
    // Get the newly created assistant from database
    const { data: newAssistant, error: newAssistantError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('assistant_id')
      .eq('tenant_id', tenantId)
      .single();
    
    if (newAssistantError || !newAssistant?.assistant_id) {
      throw new Error('Failed to retrieve newly created assistant');
    }
    
    // Cache the new assistant
    assistantCache.set(tenantId, {
      assistantId: newAssistant.assistant_id,
      lastSynced: new Date()
    });
    
    return newAssistant.assistant_id;
    
  } catch (error) {
    console.error('[Service] Error getting or creating assistant:', error);
    throw error instanceof Error ? error : new Error('Failed to get or create assistant');
  }
}

/**
 * Export tenant data to text format for OpenAI Files
 * 
 * @param tenantId - Tenant identifier
 * @returns Formatted text content with all tenant data
 * @throws Error if data export fails
 */
export async function exportTenantDataForOpenAI(tenantId: string): Promise<string> {
  try {
    console.log(`[Service] Exporting data for tenant ${tenantId}`);
    
    // Fetch all tenant data using pages API (unified approach)
    // Note: requirements are stored as blocks within features, not as separate pages
    const [projectsResult, featuresResult, releasesResult, roadmapsResult, feedbackResult] = await Promise.all([
      getPages({ tenantId, type: 'project' }),
      getPages({ tenantId, type: 'feature' }),
      getPages({ tenantId, type: 'release' }),
      getPages({ tenantId, type: 'roadmap' }),
      getPages({ tenantId, type: 'feedback' }),
    ]);
    
    // Extract page data arrays
    const projects = projectsResult.success ? projectsResult.data || [] : [];
    const features = featuresResult.success ? featuresResult.data || [] : [];
    const releases = releasesResult.success ? releasesResult.data || [] : [];
    const roadmaps = roadmapsResult.success ? roadmapsResult.data || [] : [];
    const feedback = feedbackResult.success ? feedbackResult.data || [] : [];
    
    // Format as comprehensive text document using pages structure
    const content = `# Product Management Context for Organization

This document contains the current product data for this organization, organized as pages with rich content.

## Projects (${projects.length} total)

${projects.length > 0 ? projects.map(project => `
### Project: ${project.title || 'Unnamed Project'}
- **Type**: ${project.type}
- **Properties**: ${JSON.stringify(project.properties)}
- **Blocks**: ${project.blocks?.length || 0} content blocks
- **Created**: ${project.created_at}
- **Parent**: ${project.parent_id || 'None'}
${project.blocks?.map(block => `
  Block: ${block.type} - ${JSON.stringify(block.content)}`).join('\n') || ''}
---`).join('\n') : 'No projects found.'}

## Features (${features.length} total)

${features.length > 0 ? features.map(feature => `
### Feature: ${feature.title || 'Unnamed Feature'}
- **Type**: ${feature.type}
- **Properties**: ${JSON.stringify(feature.properties)}
- **Blocks**: ${feature.blocks?.length || 0} content blocks
- **Created**: ${feature.created_at}
- **Parent**: ${feature.parent_id || 'None'}
${feature.blocks?.map(block => `
  Block: ${block.type} - ${JSON.stringify(block.content)}`).join('\n') || ''}
---`).join('\n') : 'No features found.'}




## Releases (${releases.length} total)

${releases.length > 0 ? releases.map(release => `
### Release: ${release.title || 'Unnamed Release'}
- **Type**: ${release.type}
- **Properties**: ${JSON.stringify(release.properties)}
- **Blocks**: ${release.blocks?.length || 0} content blocks
- **Created**: ${release.created_at}
- **Parent**: ${release.parent_id || 'None'}
${release.blocks?.map(block => `
  Block: ${block.type} - ${JSON.stringify(block.content)}`).join('\n') || ''}
---`).join('\n') : 'No releases found.'}

## Roadmaps (${roadmaps.length} total)

${roadmaps.length > 0 ? roadmaps.map(roadmap => `
### Roadmap: ${roadmap.title || 'Unnamed Roadmap'}
- **Type**: ${roadmap.type}
- **Properties**: ${JSON.stringify(roadmap.properties)}
- **Blocks**: ${roadmap.blocks?.length || 0} content blocks
- **Created**: ${roadmap.created_at}
- **Parent**: ${roadmap.parent_id || 'None'}
${roadmap.blocks?.map(block => `
  Block: ${block.type} - ${JSON.stringify(block.content)}`).join('\n') || ''}
---`).join('\n') : 'No roadmaps found.'}

## Feedback (${feedback.length} total)

${feedback.length > 0 ? feedback.map(item => `
### Feedback: ${item.title || 'Unnamed Feedback'}
- **Type**: ${item.type}
- **Properties**: ${JSON.stringify(item.properties)}
- **Blocks**: ${item.blocks?.length || 0} content blocks
- **Created**: ${item.created_at}
- **Parent**: ${item.parent_id || 'None'}
${item.blocks?.map(block => `
  Block: ${block.type} - ${JSON.stringify(block.content)}`).join('\n') || ''}
---`).join('\n') : 'No feedback found.'}

## Summary

This organization currently manages:
- **${projects.length}** projects
- **${features.length}** features
- **${releases.length}** releases
- **${roadmaps.length}** roadmaps
- **${feedback.length}** feedback items

Total pages: **${projects.length + features.length  + releases.length + roadmaps.length + feedback.length}**

Use this information to provide contextual advice about their product management needs, feature prioritization, and strategic planning.
`;
    
    console.log(`[Service] Exported ${content.length} characters for tenant ${tenantId}`);
    return content;
    
  } catch (error) {
    console.error('[Service] Error exporting tenant data:', error);
    throw error instanceof Error ? error : new Error('Failed to export tenant data');
  }
}

/**
 * Ensure tenant data is synced to OpenAI Files using best practices
 * Updates existing assistant files or creates new assistant if none exists
 * 
 * @param tenantId - Tenant identifier
 * @throws Error if sync fails
 */
export async function ensureTenantDataSynced(tenantId: string): Promise<void> {
  try {
    console.log(`[Service] ===== Starting Data Sync for Tenant ${tenantId} =====`);
    
    // Step 1: Export current tenant data (pages structure)
    console.log(`[Service] Step 1: Exporting pages data...`);
    const contentData = await exportTenantDataForOpenAI(tenantId);
    console.log(`[Service] ✅ Exported ${contentData.length} characters of pages data`);
    
    // Step 2: Upload new file to OpenAI Files
    console.log(`[Service] Step 2: Uploading new file to OpenAI...`);
    const fileBlob = await toFile(Buffer.from(contentData, 'utf-8'), `tenant-${tenantId}-pages-data.txt`);
    
    const file = await openai.files.create({
      file: fileBlob,
      purpose: 'assistants'
    });
    
    console.log(`[Service] ✅ File uploaded: ${file.id}`);
    
    // Step 3: Check if assistant already exists
    const { data: existingAssistant } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('assistant_id, file_ids')
      .eq('tenant_id', tenantId)
      .single();
    
    let assistantId: string = '';
    let vectorStoreId: string = '';
    const oldFileIds = existingAssistant?.file_ids || [];
    
    if (existingAssistant?.assistant_id) {
      console.log(`[Service] Step 3: Using existing assistant ${existingAssistant.assistant_id}`);
      
      // Verify assistant still exists in OpenAI
      try {
        const assistant = await openai.beta.assistants.retrieve(existingAssistant.assistant_id);
        
        // Get the existing vector store ID
        const existingVectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
        if (existingVectorStoreIds.length > 0) {
          vectorStoreId = existingVectorStoreIds[0];
          console.log(`[Service] Using existing vector store: ${vectorStoreId}`);
          
          // Remove old files and add new file to the existing vector store
          console.log(`[Service] Step 4: Updating files in existing vector store...`);
          
          // Remove old files from vector store
          try {
            const existingFiles = await openai.beta.vectorStores.files.list(vectorStoreId);
            console.log(`[Service] Found ${existingFiles.data.length} existing files in vector store`);
            
            for (const existingFile of existingFiles.data) {
              try {
                await openai.beta.vectorStores.files.del(vectorStoreId, existingFile.id);
                console.log(`[Service] ✅ Removed old file from vector store: ${existingFile.id}`);
              } catch (removeError) {
                console.log(`[Service] ⚠️ Could not remove file ${existingFile.id} from vector store:`, removeError);
              }
            }
          } catch (listError) {
            console.log(`[Service] ⚠️ Could not list existing files:`, listError);
          }
          
          // Add new file to vector store and verify
          const fileBatch = await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
            files: [fileBlob]
          });
          
          console.log(`[Service] ✅ File batch uploaded, status: ${fileBatch.status}`);
          
          // Verify the file was actually added to the vector store
          const updatedFiles = await openai.beta.vectorStores.files.list(vectorStoreId);
          const hasNewFile = updatedFiles.data.some(f => f.id === file.id);
          
          if (!hasNewFile) {
            throw new Error(`Failed to verify file ${file.id} was added to vector store`);
          }
          
          console.log(`[Service] ✅ Confirmed file ${file.id} is in vector store`);
          assistantId = existingAssistant.assistant_id;
          
        } else {
          throw new Error('Assistant exists but has no vector store');
        }
        
      } catch (assistantError) {
        console.log(`[Service] Assistant not found in OpenAI, creating new one...`);
        // Fall through to create new assistant
        assistantId = '';
      }
    }
    
    if (!assistantId) {
      // Create new vector store and assistant
      console.log(`[Service] Step 3: Creating new vector store...`);
      const vectorStore = await openai.beta.vectorStores.create({
        name: `Tenant ${tenantId} Pages Knowledge Base`,
        expires_after: {
          anchor: 'last_active_at',
          days: 7
        }
      });
      
      vectorStoreId = vectorStore.id;
      console.log(`[Service] ✅ Vector store created: ${vectorStoreId}`);
      
      // Add file to vector store and verify
      console.log(`[Service] Step 4: Adding file to vector store...`);
      const fileBatch = await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
        files: [fileBlob]
      });
      
      console.log(`[Service] ✅ File batch uploaded, status: ${fileBatch.status}`);
      
      // Verify the file was actually added
      const vectorFiles = await openai.beta.vectorStores.files.list(vectorStoreId);
      const hasNewFile = vectorFiles.data.some(f => f.id === file.id);
      
      if (!hasNewFile) {
        throw new Error(`Failed to verify file ${file.id} was added to vector store`);
      }
      
      console.log(`[Service] ✅ Confirmed file ${file.id} is in vector store`);
      
      // Create new assistant
      console.log(`[Service] Step 5: Creating new assistant...`);
      const assistant = await openai.beta.assistants.create({
        name: `PM Assistant - Tenant ${tenantId}`,
        instructions: `You are a Product Management assistant for this organization's products and features. You have access to their current product data through uploaded files. When answering questions:

1. Always reference specific features, products, or requirements from their uploaded data
2. Provide actionable advice based on their actual product context
3. Be helpful and concise in your responses
4. If you don't find relevant information in the files, say so clearly

Focus on helping with product strategy, feature prioritization, and requirement analysis.`,
        model: "gpt-4-1106-preview",
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        }
      });
      
      assistantId = assistant.id;
      console.log(`[Service] ✅ Assistant created: ${assistantId}`);
    }
    
    // Step 6: Final verification that everything is working in OpenAI
    console.log(`[Service] Step 6: Final verification...`);
    
    // Verify assistant exists and has correct vector store
    const finalAssistant = await openai.beta.assistants.retrieve(assistantId);
    const finalVectorStoreIds = finalAssistant.tool_resources?.file_search?.vector_store_ids || [];
    
    if (finalVectorStoreIds.length === 0) {
      throw new Error('Assistant verification failed: no vector store attached');
    }
    
    // Verify vector store has our file
    const finalFiles = await openai.beta.vectorStores.files.list(finalVectorStoreIds[0]);
    const hasCorrectFile = finalFiles.data.some(f => f.id === file.id && f.status === 'completed');
    
    if (!hasCorrectFile) {
      throw new Error(`Assistant verification failed: file ${file.id} not found or not completed in vector store`);
    }
    
    console.log(`[Service] ✅ OpenAI verification complete`);
    console.log(`[Service] ✅ Assistant ${assistantId} has file ${file.id} in vector store ${finalVectorStoreIds[0]}`);
    
    // Step 7: NOW update database with confirmed OpenAI state
    console.log(`[Service] Step 7: Updating database with confirmed state...`);
    const { error: updateError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .upsert({
        tenant_id: tenantId,
        assistant_id: assistantId,
        file_ids: [file.id],
        created_at: existingAssistant ? undefined : new Date().toISOString(),
        last_synced: new Date().toISOString()
      }, {
        onConflict: 'tenant_id'
      });
    
    if (updateError) {
      console.error('[Service] Error updating database:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log(`[Service] ✅ Database updated with confirmed OpenAI state`);
    
    // Step 8: Cleanup old files only (keep assistant and vector store)
    console.log(`[Service] Step 8: Cleaning up old files...`);
    for (const oldFileId of oldFileIds) {
      if (oldFileId !== file.id) {
        try {
          await openai.files.del(oldFileId);
          console.log(`[Service] ✅ Cleaned up old file ${oldFileId}`);
        } catch (cleanupError) {
          console.error(`[Service] ⚠️ Failed to cleanup old file ${oldFileId}:`, cleanupError);
        }
      }
    }
    
    // Update cache
    assistantCache.set(tenantId, {
      assistantId: assistantId,
      lastSynced: new Date()
    });
    
    console.log(`[Service] 🎉 DATA SYNC COMPLETE!`);
    console.log(`[Service] ✅ Assistant: ${assistantId} (${existingAssistant ? 'updated' : 'created'})`);
    console.log(`[Service] ✅ Vector Store: ${vectorStoreId}`);
    console.log(`[Service] ✅ File: ${file.id}`);
    console.log(`[Service] ✅ Pages data: ${contentData.length} characters`);
    console.log(`[Service] ✅ Ready for AI chat with clean pages data!`);
    
  } catch (error) {
    console.error('[Service] Error ensuring tenant data sync:', error);
    throw error instanceof Error ? error : new Error('Failed to sync tenant data');
  }
}
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
import { getFeaturesFromDb } from '@/services/features-db';
import { getProductsFromDb } from '@/services/products-db';
import { getRequirementsFromDb } from '@/services/requirements-db';
import { getReleasesFromDb } from '@/services/releases-db';

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
        (Date.now() - cached.lastSynced.getTime()) > 24 * 60 * 60 * 1000; // 24 hours
      
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
      console.log(`[Service] Using existing assistant ${existingAssistant.assistant_id} for tenant ${tenantId}`);
      
      // Cache the result
      assistantCache.set(tenantId, {
        assistantId: existingAssistant.assistant_id,
        lastSynced: existingAssistant.last_synced ? new Date(existingAssistant.last_synced) : null
      });
      
      // Check if data sync is needed
      const lastSynced = existingAssistant.last_synced ? new Date(existingAssistant.last_synced) : null;
      const needsSync = !lastSynced || (Date.now() - lastSynced.getTime()) > 24 * 60 * 60 * 1000;
      
      if (needsSync) {
        console.log(`[Service] Background data sync needed for tenant ${tenantId}`);
        // Fire and forget - don't wait for sync
        ensureTenantDataSynced(tenantId).catch(error => 
          console.error('[Service] Background sync failed:', error)
        );
      }
      
      return existingAssistant.assistant_id;
    }
    
    // Create new assistant (first time setup)
    console.log(`[Service] Creating new assistant for tenant ${tenantId}`);
    const assistant = await openai.beta.assistants.create({
      name: `PM Assistant - Tenant ${tenantId}`,
      instructions: `You are a Product Management assistant for this organization's products and features. You have access to their current product data through uploaded files. When answering questions:

1. Always reference specific features, products, or requirements from their uploaded data
2. Provide actionable advice based on their actual product context
3. Be helpful and concise in your responses
4. If you don't find relevant information in the files, say so clearly

Focus on helping with product strategy, feature prioritization, and requirement analysis.`,
      model: "gpt-4-1106-preview",
      tools: [{ type: "file_search" }]
    });
    
    console.log(`[Service] Created assistant ${assistant.id} for tenant ${tenantId}`);
    
    // Store assistant reference in database
    const { error: insertError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .insert({
        tenant_id: tenantId,
        assistant_id: assistant.id,
        created_at: new Date().toISOString(),
        last_synced: null
      });
    
    if (insertError) {
      console.error('[Service] Error storing assistant reference:', insertError);
      
      // Cleanup assistant since we couldn't store the reference
      try {
        await openai.beta.assistants.del(assistant.id);
      } catch (cleanupError) {
        console.error('[Service] Failed to cleanup assistant:', cleanupError);
      }
      
      throw new Error(`Failed to store assistant reference: ${insertError.message}`);
    }
    
    // Cache the new assistant
    assistantCache.set(tenantId, {
      assistantId: assistant.id,
      lastSynced: null
    });
    
    // Start initial data sync in background (don't wait for it)
    console.log(`[Service] Starting initial data sync for new assistant`);
    ensureTenantDataSynced(tenantId).catch(error => 
      console.error('[Service] Initial sync failed:', error)
    );
    
    return assistant.id;
    
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
    
    // Fetch all tenant data in parallel
    const [productsResult, featuresResult, requirementsResult, releasesResult] = await Promise.all([
      getProductsFromDb(tenantId),
      getFeaturesFromDb(tenantId),
      getRequirementsFromDb(tenantId),
      getReleasesFromDb(tenantId)
    ]);
    
    // Extract data arrays
    const products = productsResult.success ? productsResult.data || [] : [];
    const features = featuresResult.success ? featuresResult.data || [] : [];
    const requirements = requirementsResult.success ? requirementsResult.data || [] : [];
    const releases = releasesResult.success ? releasesResult.data || [] : [];
    
    // Format as comprehensive text document
    const content = `# Product Management Context for Organization

This document contains the current product data for this organization, including products, features, requirements, and releases.

## Products (${products.length} total)

${products.length > 0 ? products.map(product => `
### Product: ${product.name || 'Unnamed Product'}
- **Description**: ${product.description || 'No description provided'}
- **Saved**: ${product.isSaved ? 'Yes' : 'No'}
- **Saved At**: ${product.savedAt || 'Not saved'}
---`).join('\n') : 'No products found.'}

## Features (${features.length} total)

${features.length > 0 ? features.map(feature => `
### Feature: ${feature.name || 'Unnamed Feature'}
- **Priority**: ${feature.priority || 'Not set'}
- **Status**: ${feature.workflowStatus || 'Not set'}
- **Interface ID**: ${feature.interfaceId || 'Unknown interface'}
- **Release**: ${feature.releaseName || 'No release assigned'}
- **Description**: ${feature.description || 'No description provided'}
- **Saved**: ${feature.isSaved ? 'Yes' : 'No'}
---`).join('\n') : 'No features found.'}

## Requirements (${requirements.length} total)

${requirements.length > 0 ? requirements.map(requirement => `
### Requirement: ${requirement.name || 'Unnamed Requirement'}
- **Feature ID**: ${requirement.featureId || 'Unknown feature'}
- **Priority**: ${requirement.priority || 'Not set'}
- **Owner**: ${requirement.owner || 'No owner assigned'}
- **Description**: ${requirement.description || 'No description provided'}
- **Acceptance Criteria**: ${requirement.acceptanceCriteria || 'None specified'}
- **CUJ**: ${requirement.cuj || 'Not specified'}
- **Saved**: ${requirement.isSaved ? 'Yes' : 'No'}
---`).join('\n') : 'No requirements found.'}

## Releases (${releases.length} total)

${releases.length > 0 ? releases.map(release => `
### Release: ${release.name || 'Unnamed Release'}
- **Target Date**: ${release.releaseDate || 'Not set'}
- **Priority**: ${release.priority || 'Not set'}
- **Feature ID**: ${release.featureId || 'No feature assigned'}
- **Description**: ${release.description || 'No description provided'}
- **Saved**: ${release.isSaved ? 'Yes' : 'No'}
---`).join('\n') : 'No releases found.'}

## Summary

This organization currently manages:
- **${products.length}** products
- **${features.length}** features
- **${requirements.length}** requirements  
- **${releases.length}** releases

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
 * Ensure tenant data is synced to OpenAI Files
 * Creates/updates file and links to assistant
 * 
 * @param tenantId - Tenant identifier
 * @throws Error if sync fails
 */
export async function ensureTenantDataSynced(tenantId: string): Promise<void> {
  try {
    console.log(`[Service] Ensuring data sync for tenant ${tenantId}`);
    
    // Export current tenant data
    console.log(`[Service] Step 1: Exporting tenant data...`);
    const contentData = await exportTenantDataForOpenAI(tenantId);
    console.log(`[Service] Exported ${contentData.length} characters of data`);
    
    // Upload to OpenAI Files
    console.log(`[Service] Step 2: Creating file for OpenAI...`);
    const fileBlob = await toFile(Buffer.from(contentData, 'utf-8'), `tenant-${tenantId}-data.txt`);
    console.log(`[Service] File blob created, uploading to OpenAI...`);
    
    const file = await openai.files.create({
      file: fileBlob,
      purpose: 'assistants'
    });
    
    console.log(`[Service] Step 3: Successfully uploaded file ${file.id} for tenant ${tenantId}`);
    
    // Get assistant for this tenant
    console.log(`[Service] Step 4: Getting/creating assistant...`);
    const assistantId = await getOrCreateAssistant(tenantId);
    console.log(`[Service] Using assistant ${assistantId}`);
    
    // Step 5: Create vector store using direct REST API (since SDK doesn't have it yet)
    console.log(`[Service] Step 5: Creating vector store...`);
    
    const vectorStoreResponse = await fetch('https://api.openai.com/v1/vector_stores', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: `Tenant ${tenantId} Knowledge Base`,
        expires_after: {
          anchor: 'last_active_at',
          days: 7
        }
      })
    });
    
    if (!vectorStoreResponse.ok) {
      const errorText = await vectorStoreResponse.text();
      throw new Error(`Vector store creation failed: ${vectorStoreResponse.status} ${errorText}`);
    }
    
    const vectorStore = await vectorStoreResponse.json();
    console.log(`[Service] Created vector store: ${vectorStore.id}`);
    
    // Step 6: Add file to vector store
    console.log(`[Service] Step 6: Adding file to vector store...`);
    
    const addFileResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        file_id: file.id
      })
    });
    
    if (!addFileResponse.ok) {
      const errorText = await addFileResponse.text();
      throw new Error(`Adding file to vector store failed: ${addFileResponse.status} ${errorText}`);
    }
    
    const vectorStoreFile = await addFileResponse.json();
    console.log(`[Service] Added file ${file.id} to vector store: ${vectorStoreFile.id}`);
    
    // Step 7: Wait for file processing
    console.log(`[Service] Step 7: Waiting for file processing...`);
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!statusResponse.ok) {
        console.warn('[Service] Failed to check vector store status');
        break;
      }
      
      const storeStatus = await statusResponse.json();
      console.log(`[Service] Vector store status: ${storeStatus.status}, file counts: ${JSON.stringify(storeStatus.file_counts)}`);
      
      if (storeStatus.status === 'completed') {
        break;
      } else if (storeStatus.status === 'failed') {
        throw new Error('Vector store processing failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    // Step 8: Update assistant with vector store
    console.log(`[Service] Step 8: Attaching vector store to assistant...`);
    await openai.beta.assistants.update(assistantId, {
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    
    // Get old file ID to cleanup
    const { data: oldFileData } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .select('file_ids')
      .eq('tenant_id', tenantId)
      .single();
    
    const oldFileIds = oldFileData?.file_ids || [];
    
    // Update database with new file ID
    const { error: updateError } = await supabase
      .from('ai_chat_fully_managed_assistants')
      .update({
        file_ids: [file.id],
        last_synced: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);
    
    if (updateError) {
      console.error('[Service] Error updating file reference:', updateError);
      // Continue anyway - file is uploaded and assistant is updated
    }
    
    // Cleanup old files
    for (const oldFileId of oldFileIds) {
      if (oldFileId !== file.id) {
        try {
          await openai.files.del(oldFileId);
          console.log(`[Service] Cleaned up old file ${oldFileId}`);
        } catch (cleanupError) {
          console.error(`[Service] Failed to cleanup old file ${oldFileId}:`, cleanupError);
          // Continue - cleanup failure shouldn't break the sync
        }
      }
    }
    
    console.log(`[Service] Successfully synced data for tenant ${tenantId}`);
    
    // Update cache with sync timestamp
    const cached = assistantCache.get(tenantId);
    if (cached) {
      assistantCache.set(tenantId, {
        ...cached,
        lastSynced: new Date()
      });
    }
    
  } catch (error) {
    console.error('[Service] Error ensuring tenant data sync:', error);
    throw error instanceof Error ? error : new Error('Failed to sync tenant data');
  }
}
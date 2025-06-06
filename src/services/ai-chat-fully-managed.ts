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
import { unifiedAssistantManager } from '@/services/unified-assistant-manager';

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

/**
 * Get or create OpenAI assistant for tenant using unified manager
 * FIXED: Eliminates dual assistant management systems conflict
 * 
 * @param tenantId - Tenant identifier
 * @returns Assistant ID
 */
export async function getOrCreateAssistant(tenantId: string): Promise<string> {
  try {
    console.log(`[Service] Getting or creating assistant for tenant ${tenantId} via unified manager`);
    
    // Use unified assistant manager to eliminate conflicts
    const assistantId = await unifiedAssistantManager.getOrCreateAssistant(tenantId);
    
    // Check if data sync is needed
    const cacheInfo = unifiedAssistantManager.getCacheInfo(tenantId);
    const needsSync = !cacheInfo?.lastSynced || 
      (Date.now() - cacheInfo.lastSynced.getTime()) > 60 * 1000; // 1 minute for testing
    
    if (needsSync) {
      console.log(`[Service] Background data sync needed for tenant ${tenantId}`);
      // Fire and forget - don't wait for sync to complete
      unifiedAssistantManager.syncTenantData(tenantId).catch(error => 
        console.error('[Service] Background sync failed:', error)
      );
    }
    
    return assistantId;
    
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
 * Ensure tenant data is synced to OpenAI Files using unified manager
 * FIXED: File batch status validation, race conditions, and dual assistant conflicts
 * 
 * @param tenantId - Tenant identifier
 * @throws Error if sync fails
 */
export async function ensureTenantDataSynced(tenantId: string): Promise<void> {
  try {
    console.log(`[Service] ===== Starting Data Sync for Tenant ${tenantId} (via unified manager) =====`);
    
    // Use unified assistant manager which has all the fixes
    await unifiedAssistantManager.syncTenantData(tenantId);
    
    console.log(`[Service] 🎉 DATA SYNC COMPLETE via unified manager!`);
    
  } catch (error) {
    console.error('[Service] Error ensuring tenant data sync:', error);
    throw error instanceof Error ? error : new Error('Failed to sync tenant data');
  }
}
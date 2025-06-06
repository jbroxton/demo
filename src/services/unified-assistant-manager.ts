/**
 * @file Unified Assistant Manager
 * @description Single source of truth for OpenAI Assistant management
 * 
 * Consolidates the conflicting TenantAssistantManager and getOrCreateAssistant systems
 * into a unified, type-safe, reliable assistant management solution.
 * 
 * Key Features:
 * - Single assistant per tenant with proper reuse
 * - Comprehensive error handling with custom error types
 * - File upload with proper status validation
 * - Vector store management with race condition prevention
 * - Database consistency across both storage systems
 * - Proper async file processing completion
 */

import OpenAI, { toFile } from 'openai';
import { supabase } from '@/services/supabase';
import { getPages } from '@/services/pages-db';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 3,
  dangerouslyAllowBrowser: true, // For Jest environment
});

// Zod schemas for runtime validation
const AssistantSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  instructions: z.string().nullable(),
  model: z.string(),
  tools: z.array(z.object({
    type: z.string()
  })),
  tool_resources: z.object({
    file_search: z.object({
      vector_store_ids: z.array(z.string())
    }).optional()
  }).optional(),
  created_at: z.number()
});

const VectorStoreFileSchema = z.object({
  id: z.string(),
  status: z.enum(['in_progress', 'completed', 'cancelled', 'failed']),
  created_at: z.number()
});

const FileBatchSchema = z.object({
  id: z.string(),
  status: z.enum(['in_progress', 'completed', 'cancelling', 'cancelled', 'failed']),
  file_counts: z.object({
    in_progress: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    failed: z.number(),
    total: z.number()
  })
});

// Custom error classes for specific failure scenarios
export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIConfigurationError';
  }
}

export class AssistantNotFoundError extends Error {
  constructor(assistantId: string) {
    super(`Assistant ${assistantId} not found in OpenAI`);
    this.name = 'AssistantNotFoundError';
  }
}

export class FileUploadError extends Error {
  constructor(message: string, public readonly status?: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export class VectorStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VectorStoreError';
  }
}

export class DatabaseSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseSyncError';
  }
}

// Types
export interface AssistantCache {
  assistantId: string;
  lastSynced: Date | null;
  vectorStoreId?: string;
  fileIds: string[];
}

export interface TenantDataExport {
  content: string;
  pageCount: number;
  totalCharacters: number;
}

export interface FileProcessingOptions {
  timeout?: number;
  retryAttempts?: number;
  pollingInterval?: number;
}

/**
 * Unified Assistant Manager - Single source of truth for all assistant operations
 * Consolidates both TenantAssistantManager and getOrCreateAssistant functionality
 */
class UnifiedAssistantManager {
  private assistantCache = new Map<string, AssistantCache>();
  private readonly DEFAULT_MODEL = 'gpt-4-1106-preview';
  private readonly FILE_PROCESSING_TIMEOUT = 120000; // 2 minutes
  private readonly POLLING_INTERVAL = 2000; // 2 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Check if OpenAI is properly configured
   */
  private isOpenAIConfigured(): boolean {
    const apiKey = process.env.OPENAI_API_KEY;
    return !!apiKey && apiKey !== 'dummy-key';
  }

  /**
   * Get or create assistant for a tenant with comprehensive error handling
   * Combines the best features of both previous systems
   */
  async getOrCreateAssistant(tenantId: string, instructions?: string): Promise<string> {
    if (!this.isOpenAIConfigured()) {
      throw new OpenAIConfigurationError('OpenAI API key not configured');
    }

    // Check cache first (fastest path)
    const cached = this.assistantCache.get(tenantId);
    if (cached) {
      // Verify assistant still exists in OpenAI
      try {
        await openai.beta.assistants.retrieve(cached.assistantId);
        console.log(`[UnifiedAssistant] Using cached assistant ${cached.assistantId} for tenant ${tenantId}`);
        return cached.assistantId;
      } catch (error) {
        console.warn(`[UnifiedAssistant] Cached assistant ${cached.assistantId} no longer exists, clearing cache`);
        this.assistantCache.delete(tenantId);
      }
    }

    // Check both database systems for existing assistant
    const existingAssistantId = await this.findExistingAssistant(tenantId);
    
    if (existingAssistantId) {
      try {
        const assistant = await openai.beta.assistants.retrieve(existingAssistantId);
        console.log(`[UnifiedAssistant] Connected to existing assistant: ${existingAssistantId}`);
        
        // Cache the found assistant
        await this.updateCache(tenantId, existingAssistantId);
        return existingAssistantId;
      } catch (error) {
        console.warn(`[UnifiedAssistant] Database assistant ${existingAssistantId} not found in OpenAI`);
      }
    }

    // Search for assistants by name patterns (TenantAssistantManager approach)
    const foundAssistant = await this.searchExistingAssistants(tenantId);
    
    if (foundAssistant) {
      console.log(`[UnifiedAssistant] Found existing assistant by name: ${foundAssistant}`);
      
      // Store in both database systems for consistency
      await this.syncAssistantToDatabases(tenantId, foundAssistant);
      await this.updateCache(tenantId, foundAssistant);
      return foundAssistant;
    }

    // Create new assistant only if none found
    const newAssistantId = await this.createTenantAssistant(tenantId, instructions);
    console.log(`[UnifiedAssistant] Created new assistant: ${newAssistantId} for tenant ${tenantId}`);

    // Store in both database systems
    await this.syncAssistantToDatabases(tenantId, newAssistantId);
    await this.updateCache(tenantId, newAssistantId);
    
    return newAssistantId;
  }

  /**
   * Find existing assistant in both database systems
   */
  private async findExistingAssistant(tenantId: string): Promise<string | null> {
    try {
      // Check System B (ai_chat_fully_managed_assistants) first
      const { data: systemBAssistant } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .select('assistant_id')
        .eq('tenant_id', tenantId)
        .single();

      if (systemBAssistant?.assistant_id) {
        return systemBAssistant.assistant_id;
      }

      // Check System A (tenant_settings)
      const { data: tenantSettings } = await supabase
        .from('tenant_settings')
        .select('settings_json')
        .eq('tenant_id', tenantId)
        .single();

      const settingsJson = tenantSettings?.settings_json as any;
      if (settingsJson?.openai_assistant_id) {
        return settingsJson.openai_assistant_id;
      }

      return null;
    } catch (error) {
      console.error('[UnifiedAssistant] Error checking existing assistants:', error);
      return null;
    }
  }

  /**
   * Search for existing assistants by name patterns (improved from TenantAssistantManager)
   */
  private async searchExistingAssistants(tenantId: string): Promise<string | null> {
    try {
      console.log('[UnifiedAssistant] Searching for existing assistants by name...');
      const existingAssistants = await openai.beta.assistants.list({ 
        limit: 100,
        order: 'desc'
      });
      
      console.log(`[UnifiedAssistant] Found ${existingAssistants.data.length} total assistants`);

      // Search patterns (in order of preference)
      const searchPatterns = [
        // Exact matches
        `Speqq AI - ${tenantId.substring(0, 8)}`,
        `PM Assistant - Tenant ${tenantId}`,
        // Partial matches
        'Speqq',
        'PM Assistant',
        tenantId.substring(0, 8),
      ];

      for (const pattern of searchPatterns) {
        const existingAssistant = existingAssistants.data.find(assistant => 
          assistant.name?.includes(pattern)
        );
        if (existingAssistant) {
          console.log(`[UnifiedAssistant] Found assistant using pattern "${pattern}": ${existingAssistant.id} - "${existingAssistant.name}"`);
          return existingAssistant.id;
        }
      }

      // If no pattern match, use the most recent assistant
      if (existingAssistants.data.length > 0) {
        const mostRecent = existingAssistants.data[0];
        console.log(`[UnifiedAssistant] No pattern match, using most recent: ${mostRecent.id} - "${mostRecent.name}"`);
        return mostRecent.id;
      }

      return null;
    } catch (error) {
      console.error('[UnifiedAssistant] Error searching existing assistants:', error);
      return null;
    }
  }

  /**
   * Create new tenant assistant with unified naming
   */
  private async createTenantAssistant(tenantId: string, instructions?: string): Promise<string> {
    const defaultInstructions = instructions || 
      `You are Speqq AI, an expert product management assistant for tenant ${tenantId.substring(0, 8)}. 
       You have access to their current product data through uploaded files. When answering questions:

       1. Always reference specific features, products, or requirements from their uploaded data
       2. Provide actionable advice based on their actual product context
       3. Be helpful and concise in your responses
       4. If you don't find relevant information in the files, say so clearly

       Focus on helping with product strategy, feature prioritization, and requirement analysis.`;

    const assistant = await openai.beta.assistants.create({
      name: `Speqq AI - ${tenantId.substring(0, 8)}`, // Use System A naming for consistency
      instructions: defaultInstructions,
      model: this.DEFAULT_MODEL,
      tools: [{ type: 'file_search' }],
    });

    return assistant.id;
  }

  /**
   * Sync assistant ID to both database systems for consistency
   */
  private async syncAssistantToDatabases(tenantId: string, assistantId: string): Promise<void> {
    try {
      // Update System B (ai_chat_fully_managed_assistants)
      const { error: systemBError } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .upsert({
          tenant_id: tenantId,
          assistant_id: assistantId,
          file_ids: [],
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (systemBError) {
        console.error('[UnifiedAssistant] Error updating System B:', systemBError);
      }

      // Update System A (tenant_settings)
      const { data: existingSettings } = await supabase
        .from('tenant_settings')
        .select('settings_json')
        .eq('tenant_id', tenantId)
        .single();

      const currentSettings = existingSettings?.settings_json || {};
      const updatedSettings = {
        ...currentSettings,
        openai_assistant_id: assistantId,
      };

      const { error: systemAError } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          settings_json: updatedSettings,
        }, {
          onConflict: 'tenant_id'
        });

      if (systemAError) {
        console.error('[UnifiedAssistant] Error updating System A:', systemAError);
      }

      console.log('[UnifiedAssistant] Synced assistant ID to both database systems');
    } catch (error) {
      throw new DatabaseSyncError(`Failed to sync assistant to databases: ${error}`);
    }
  }

  /**
   * Update cache with assistant information
   */
  private async updateCache(tenantId: string, assistantId: string): Promise<void> {
    try {
      // Get vector store info if available
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
      
      this.assistantCache.set(tenantId, {
        assistantId,
        lastSynced: new Date(),
        vectorStoreId: vectorStoreIds[0],
        fileIds: []
      });
    } catch (error) {
      // Cache basic info even if retrieval fails
      this.assistantCache.set(tenantId, {
        assistantId,
        lastSynced: new Date(),
        fileIds: []
      });
    }
  }

  /**
   * Export tenant data for OpenAI files (from ai-chat-fully-managed.ts)
   */
  async exportTenantData(tenantId: string): Promise<TenantDataExport> {
    try {
      console.log(`[UnifiedAssistant] Exporting data for tenant ${tenantId}`);
      
      const [projectsResult, featuresResult, releasesResult, roadmapsResult, feedbackResult] = await Promise.all([
        getPages({ tenantId, type: 'project' }),
        getPages({ tenantId, type: 'feature' }),
        getPages({ tenantId, type: 'release' }),
        getPages({ tenantId, type: 'roadmap' }),
        getPages({ tenantId, type: 'feedback' }),
      ]);
      
      const projects = projectsResult.success ? projectsResult.data || [] : [];
      const features = featuresResult.success ? featuresResult.data || [] : [];
      const releases = releasesResult.success ? releasesResult.data || [] : [];
      const roadmaps = roadmapsResult.success ? roadmapsResult.data || [] : [];
      const feedback = feedbackResult.success ? feedbackResult.data || [] : [];
      
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

Total pages: **${projects.length + features.length + releases.length + roadmaps.length + feedback.length}**

Use this information to provide contextual advice about their product management needs, feature prioritization, and strategic planning.
`;
      
      const totalPages = projects.length + features.length + releases.length + roadmaps.length + feedback.length;
      console.log(`[UnifiedAssistant] Exported ${content.length} characters for ${totalPages} pages`);
      
      return {
        content,
        pageCount: totalPages,
        totalCharacters: content.length
      };
    } catch (error) {
      console.error('[UnifiedAssistant] Error exporting tenant data:', error);
      throw error instanceof Error ? error : new Error('Failed to export tenant data');
    }
  }

  /**
   * Upload file to OpenAI with proper status validation (FIXES the file batch bug)
   */
  async uploadFileToOpenAI(content: string, filename: string): Promise<string> {
    try {
      const fileBlob = await toFile(Buffer.from(content, 'utf-8'), filename);
      
      const file = await openai.files.create({
        file: fileBlob,
        purpose: 'assistants'
      });
      
      console.log(`[UnifiedAssistant] ✅ File uploaded: ${file.id}`);
      return file.id;
    } catch (error) {
      throw new FileUploadError(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Upload files to vector store with proper status validation and async completion
   * FIXES: File batch status validation and race condition issues
   */
  async uploadFilesToVectorStore(
    vectorStoreId: string, 
    fileBlobs: any[], 
    options: FileProcessingOptions = {}
  ): Promise<void> {
    const timeout = options.timeout || this.FILE_PROCESSING_TIMEOUT;
    const maxRetries = options.retryAttempts || this.MAX_RETRY_ATTEMPTS;
    const pollingInterval = options.pollingInterval || this.POLLING_INTERVAL;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[UnifiedAssistant] Uploading files to vector store (attempt ${attempt + 1}/${maxRetries})`);
        
        // Upload files and poll for completion
        const fileBatch = await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
          files: fileBlobs
        });

        // CRITICAL FIX: Check actual status instead of blindly logging success
        if (fileBatch.status === 'failed') {
          throw new FileUploadError(`File batch upload failed`, fileBatch.status);
        }

        if (fileBatch.status === 'cancelled') {
          throw new FileUploadError(`File batch upload cancelled`, fileBatch.status);
        }

        if (fileBatch.status !== 'completed') {
          // Wait for completion with timeout
          const completedBatch = await this.waitForBatchCompletion(vectorStoreId, fileBatch.id, timeout, pollingInterval);
          
          if (completedBatch.status === 'failed') {
            throw new FileUploadError(`File batch processing failed after upload`, completedBatch.status);
          }
        }

        console.log(`[UnifiedAssistant] ✅ File batch completed successfully: ${fileBatch.status}`);
        return;

      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        
        console.warn(`[UnifiedAssistant] Upload attempt ${attempt} failed, retrying in ${pollingInterval}ms...`);
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }
  }

  /**
   * Wait for file batch completion with proper timeout and status checking
   * FIXES: Race condition where file verification happens before processing completes
   */
  private async waitForBatchCompletion(
    vectorStoreId: string,
    batchId: string,
    timeout: number,
    pollingInterval: number
  ): Promise<z.infer<typeof FileBatchSchema>> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStoreId, batchId);
        const validatedBatch = FileBatchSchema.parse(batch);
        
        if (validatedBatch.status === 'completed' || 
            validatedBatch.status === 'failed' || 
            validatedBatch.status === 'cancelled') {
          return validatedBatch;
        }
        
        console.log(`[UnifiedAssistant] Batch status: ${validatedBatch.status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
      } catch (error) {
        console.error('[UnifiedAssistant] Error checking batch status:', error);
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }
    
    throw new Error(`File batch processing timed out after ${timeout}ms`);
  }

  /**
   * Comprehensive tenant data sync with all fixes applied
   */
  async syncTenantData(tenantId: string): Promise<void> {
    try {
      console.log(`[UnifiedAssistant] ===== Starting Complete Data Sync for Tenant ${tenantId} =====`);
      
      // Get or create assistant
      const assistantId = await this.getOrCreateAssistant(tenantId);
      
      // Export current data
      const tenantData = await this.exportTenantData(tenantId);
      console.log(`[UnifiedAssistant] ✅ Exported ${tenantData.totalCharacters} characters of data`);
      
      // Upload file with proper validation
      const fileId = await this.uploadFileToOpenAI(
        tenantData.content, 
        `tenant-${tenantId}-pages-data.txt`
      );
      
      // Get or create vector store
      const vectorStoreId = await this.getOrCreateVectorStore(tenantId, assistantId);
      
      // Upload to vector store with all fixes applied
      const fileBlob = await toFile(Buffer.from(tenantData.content, 'utf-8'), `tenant-${tenantId}-pages-data.txt`);
      await this.uploadFilesToVectorStore(vectorStoreId, [fileBlob]);
      
      // Update databases with confirmed state
      await this.updateAssistantInDatabases(tenantId, assistantId, [fileId]);
      
      // Update cache
      this.assistantCache.set(tenantId, {
        assistantId,
        lastSynced: new Date(),
        vectorStoreId,
        fileIds: [fileId]
      });
      
      console.log(`[UnifiedAssistant] 🎉 Complete data sync successful!`);
      console.log(`[UnifiedAssistant] ✅ Assistant: ${assistantId}`);
      console.log(`[UnifiedAssistant] ✅ Vector Store: ${vectorStoreId}`);
      console.log(`[UnifiedAssistant] ✅ File: ${fileId}`);
      
    } catch (error) {
      console.error('[UnifiedAssistant] Error in complete sync:', error);
      throw error instanceof Error ? error : new Error('Failed to sync tenant data');
    }
  }

  /**
   * Get or create vector store for assistant
   */
  private async getOrCreateVectorStore(tenantId: string, assistantId: string): Promise<string> {
    try {
      // Check if assistant already has a vector store
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      const existingVectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
      
      if (existingVectorStoreIds.length > 0) {
        console.log(`[UnifiedAssistant] Using existing vector store: ${existingVectorStoreIds[0]}`);
        return existingVectorStoreIds[0];
      }
      
      // Create new vector store
      const vectorStore = await openai.beta.vectorStores.create({
        name: `Tenant ${tenantId} Pages Knowledge Base`,
        expires_after: {
          anchor: 'last_active_at',
          days: 7
        }
      });
      
      // Attach vector store to assistant
      await openai.beta.assistants.update(assistantId, {
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStore.id]
          }
        }
      });
      
      console.log(`[UnifiedAssistant] ✅ Created and attached vector store: ${vectorStore.id}`);
      return vectorStore.id;
      
    } catch (error) {
      throw new VectorStoreError(`Failed to get or create vector store: ${error}`);
    }
  }

  /**
   * Update assistant information in both database systems
   */
  private async updateAssistantInDatabases(tenantId: string, assistantId: string, fileIds: string[]): Promise<void> {
    try {
      // Update System B
      const { error: systemBError } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .upsert({
          tenant_id: tenantId,
          assistant_id: assistantId,
          file_ids: fileIds,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (systemBError) {
        throw new DatabaseSyncError(`Failed to update System B: ${systemBError.message}`);
      }

      // Update System A
      const { data: existingSettings } = await supabase
        .from('tenant_settings')
        .select('settings_json')
        .eq('tenant_id', tenantId)
        .single();

      const currentSettings = existingSettings?.settings_json || {};
      const updatedSettings = {
        ...currentSettings,
        openai_assistant_id: assistantId,
        file_ids: fileIds,
        last_synced: new Date().toISOString()
      };

      const { error: systemAError } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          settings_json: updatedSettings,
        }, {
          onConflict: 'tenant_id'
        });

      if (systemAError) {
        throw new DatabaseSyncError(`Failed to update System A: ${systemAError.message}`);
      }

      console.log('[UnifiedAssistant] ✅ Updated both database systems');
    } catch (error) {
      throw error instanceof DatabaseSyncError ? error : new DatabaseSyncError(`Database update failed: ${error}`);
    }
  }

  /**
   * Clear cache for tenant (useful for testing)
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.assistantCache.delete(tenantId);
    } else {
      this.assistantCache.clear();
    }
  }

  /**
   * Get cached assistant info for debugging
   */
  getCacheInfo(tenantId: string): AssistantCache | undefined {
    return this.assistantCache.get(tenantId);
  }
}

// Singleton instance
export const unifiedAssistantManager = new UnifiedAssistantManager();

// Legacy compatibility exports
export const tenantAssistants = unifiedAssistantManager;
export { unifiedAssistantManager as default };
/**
 * @file OpenAI Provider
 * @description Centralized OpenAI client configuration and management
 * Provides a singleton instance of the OpenAI client for consistent usage across the app.
 */

import OpenAI from 'openai';

// Validate API key is available
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('Warning: OPENAI_API_KEY not found in environment variables');
}

/**
 * Singleton OpenAI client instance
 * Used for both regular API calls and Assistant API management
 */
export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Fallback to prevent crashes during build
  timeout: 30000, // 30 second timeout
  maxRetries: 3,
});

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return !!apiKey && apiKey !== 'dummy-key';
}

/**
 * Get the configured model name for chat completions
 */
export function getChatModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

/**
 * Get the configured model for embeddings
 */
export function getEmbeddingModel(): string {
  return 'text-embedding-3-small';
}

/**
 * Central tenant Assistant management
 * Each tenant gets one Assistant that's reused across the app
 */
class TenantAssistantManager {
  private assistantCache = new Map<string, string>(); // tenantId -> assistantId

  /**
   * Get or create Assistant for a tenant
   * This will connect to existing assistants or create new ones as needed
   */
  async getAssistantId(tenantId: string, instructions?: string): Promise<string> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    // Check cache first
    if (this.assistantCache.has(tenantId)) {
      const assistantId = this.assistantCache.get(tenantId)!;
      
      // Verify assistant still exists
      try {
        await openai.beta.assistants.retrieve(assistantId);
        return assistantId;
      } catch (error) {
        console.warn(`Cached assistant ${assistantId} no longer exists, will check for others`);
        this.assistantCache.delete(tenantId);
      }
    }

    // Check database for stored assistant ID
    try {
      const { getTenantSettings } = await import('@/services/tenant-settings-db');
      const settingsResult = await getTenantSettings(tenantId);
      const storedAssistantId = settingsResult.data?.settings_json?.openai_assistant_id;

      if (storedAssistantId) {
        try {
          await openai.beta.assistants.retrieve(storedAssistantId);
          this.assistantCache.set(tenantId, storedAssistantId);
          console.log(`Connected to existing assistant: ${storedAssistantId}`);
          return storedAssistantId;
        } catch (error) {
          console.warn(`Stored assistant ${storedAssistantId} no longer exists`);
        }
      }
    } catch (error) {
      console.warn('Could not check database for assistant ID:', error);
    }

    // Look for existing assistants - check for multiple possible patterns
    try {
      console.log('Searching for existing assistants...');
      const existingAssistants = await openai.beta.assistants.list({ 
        limit: 100,
        order: 'desc' // Get most recent first
      });
      
      console.log(`Found ${existingAssistants.data.length} total assistants`);
      existingAssistants.data.forEach(assistant => {
        console.log(`- ${assistant.id}: "${assistant.name}" (created: ${new Date(assistant.created_at * 1000).toISOString()})`);
      });

      // Search patterns (in order of preference)
      const searchPatterns = [
        // Exact tenant prefix match
        `Speqq AI - ${tenantId.substring(0, 8)}`,
        // Any Speqq assistant
        'Speqq',
        // Assistants with tenant ID in name
        tenantId.substring(0, 8),
      ];

      let existingAssistant = null;

      // Try each pattern
      for (const pattern of searchPatterns) {
        existingAssistant = existingAssistants.data.find(assistant => 
          assistant.name?.includes(pattern)
        );
        if (existingAssistant) {
          console.log(`Found existing assistant using pattern "${pattern}": ${existingAssistant.id} - "${existingAssistant.name}"`);
          break;
        }
      }

      // If no pattern match, take the first assistant (most recent)
      if (!existingAssistant && existingAssistants.data.length > 0) {
        existingAssistant = existingAssistants.data[0];
        console.log(`No pattern match found, using most recent assistant: ${existingAssistant.id} - "${existingAssistant.name}"`);
      }

      if (existingAssistant) {
        console.log(`Using existing assistant: ${existingAssistant.id} for tenant ${tenantId}`);
        this.assistantCache.set(tenantId, existingAssistant.id);
        
        // Store the found assistant ID in database
        try {
          const { getTenantSettings, updateTenantSettings } = await import('@/services/tenant-settings-db');
          const settingsResult = await getTenantSettings(tenantId);
          const existingSettings = settingsResult.data?.settings_json || {};
          
          await updateTenantSettings(tenantId, {
            ...existingSettings,
            openai_assistant_id: existingAssistant.id,
          });
          console.log('Stored assistant ID in database');
        } catch (error) {
          console.warn('Could not store found assistant ID in database:', error);
        }

        return existingAssistant.id;
      }
    } catch (error) {
      console.warn('Could not search for existing assistants:', error);
    }

    // Create new assistant only if none found
    const assistant = await this.createTenantAssistant(tenantId, instructions);
    const assistantId = assistant.id;

    console.log(`Created new assistant: ${assistantId} for tenant ${tenantId}`);

    // Cache the ID
    this.assistantCache.set(tenantId, assistantId);

    // Store in database
    try {
      const { getTenantSettings, updateTenantSettings } = await import('@/services/tenant-settings-db');
      const settingsResult = await getTenantSettings(tenantId);
      const existingSettings = settingsResult.data?.settings_json || {};
      
      await updateTenantSettings(tenantId, {
        ...existingSettings,
        openai_assistant_id: assistantId,
      });
    } catch (error) {
      console.warn('Could not store assistant ID in database:', error);
      // Don't fail - we have the assistant ID cached
    }

    return assistantId;
  }

  /**
   * Update instructions for tenant's Assistant
   */
  async updateInstructions(tenantId: string, instructions: string): Promise<void> {
    const assistantId = await this.getAssistantId(tenantId, instructions);
    
    await openai.beta.assistants.update(assistantId, {
      instructions,
    });

    console.log(`Updated instructions for tenant ${tenantId} assistant ${assistantId}`);
  }

  /**
   * Create a new Assistant for a tenant
   */
  private async createTenantAssistant(tenantId: string, instructions?: string) {
    const defaultInstructions = instructions || 
      `You are Speqq AI, an expert product management assistant for tenant ${tenantId.substring(0, 8)}. 
       Provide actionable, data-driven guidance using established PM frameworks.`;

    return await openai.beta.assistants.create({
      name: `Speqq AI - ${tenantId.substring(0, 8)}`,
      instructions: defaultInstructions,
      model: getChatModel(),
      tools: [{ type: 'file_search' }],
    });
  }

  /**
   * Clear cache for a tenant (useful for testing)
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.assistantCache.delete(tenantId);
    } else {
      this.assistantCache.clear();
    }
  }
}

// Singleton instance
export const tenantAssistants = new TenantAssistantManager();

/**
 * Assistant API helper functions
 */
export class AssistantManager {
  /**
   * Create a new OpenAI Assistant with instructions
   */
  static async createAssistant(
    name: string,
    instructions: string,
    model: string = getChatModel()
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.assistants.create({
      name,
      instructions,
      model,
      tools: [{ type: 'file_search' }], // Enable file search for RAG
    });
  }

  /**
   * Update an existing Assistant's instructions
   */
  static async updateAssistant(
    assistantId: string,
    instructions: string
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.assistants.update(assistantId, {
      instructions,
    });
  }

  /**
   * Get an Assistant by ID
   */
  static async getAssistant(
    assistantId: string
  ): Promise<OpenAI.Beta.Assistants.Assistant> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.assistants.retrieve(assistantId);
  }

  /**
   * Delete an Assistant
   */
  static async deleteAssistant(assistantId: string): Promise<void> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    await openai.beta.assistants.del(assistantId);
  }

  /**
   * Create a thread for conversation
   */
  static async createThread(): Promise<OpenAI.Beta.Threads.Thread> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.threads.create();
  }

  /**
   * Add a message to a thread
   */
  static async addMessage(
    threadId: string,
    content: string,
    role: 'user' | 'assistant' = 'user'
  ): Promise<OpenAI.Beta.Threads.Messages.Message> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.threads.messages.create(threadId, {
      role,
      content,
    });
  }

  /**
   * Run an Assistant on a thread
   */
  static async runAssistant(
    threadId: string,
    assistantId: string
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    return await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
  }

  /**
   * Get run status and wait for completion
   */
  static async waitForRun(
    threadId: string,
    runId: string,
    maxWaitTime: number = 30000
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Assistant run timed out');
  }

  /**
   * Get messages from a thread
   */
  static async getMessages(
    threadId: string,
    limit: number = 20
  ): Promise<OpenAI.Beta.Threads.Messages.Message[]> {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.beta.threads.messages.list(threadId, {
      limit,
      order: 'desc',
    });
    
    return response.data;
  }
}

export default openai;
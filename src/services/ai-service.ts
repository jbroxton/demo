/**
 * @file ai-service.ts
 * @description AI service layer for RAG functionality with OpenAI and Supabase pgvector.
 * Handles embeddings generation, vector search, chat history, and message persistence.
 * @example
 * ```typescript
 * import { generateEmbedding, searchVectors } from '@/services/ai-service';
 * 
 * // Generate embedding for text
 * const embedding = await generateEmbedding('Some text to embed');
 * 
 * // Search for similar content in vector database
 * const results = await searchVectors('user query', tenantId);
 * ```
 */

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { supabase } from '@/services/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Feature, Release } from '@/types/models';

// Polyfill fetch for Node.js environments
if (typeof global !== 'undefined' && !global.fetch) {
  // @ts-ignore
  global.fetch = require('node-fetch');
}

// Check for API key
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Log warning if no API key found
if (!apiKey) {
  console.warn('Warning: OpenAI API key not found in environment variables');
}

/**
 * Auto-embedding system configuration and detection
 */
let autoEmbeddingEnabled: boolean | null = null;

/**
 * Check if auto-embedding system is enabled by testing for required infrastructure
 */
export async function isAutoEmbeddingEnabled(): Promise<boolean> {
  if (autoEmbeddingEnabled !== null) {
    return autoEmbeddingEnabled;
  }

  try {
    // Check if embedding queue exists
    const { data: queues, error } = await supabase.rpc('pgmq.list_queues');
    
    if (error) {
      console.log('Auto-embedding not available: pgmq not found');
      autoEmbeddingEnabled = false;
      return false;
    }

    const hasEmbeddingQueue = queues?.some((q: any) => q.queue_name === 'embedding_jobs');
    
    if (!hasEmbeddingQueue) {
      console.log('Auto-embedding not available: embedding_jobs queue not found');
      autoEmbeddingEnabled = false;
      return false;
    }

    // Check if cron job is scheduled
    const { data: cronJobs, error: cronError } = await supabase.rpc('check_cron_jobs');
    
    if (cronError) {
      console.log('Auto-embedding partially available: cron job check failed');
      autoEmbeddingEnabled = true; // Queue exists, assume auto-embedding is enabled
      return true;
    }

    const hasCronJob = cronJobs?.some((job: any) => job.jobname === 'process-embedding-queue');
    
    autoEmbeddingEnabled = hasCronJob;
    
    if (autoEmbeddingEnabled) {
      console.log('Auto-embedding system detected and enabled');
    } else {
      console.log('Auto-embedding not available: cron job not scheduled');
    }

    return autoEmbeddingEnabled ?? false;
  } catch (error) {
    console.error('Error checking auto-embedding status:', error);
    autoEmbeddingEnabled = false;
    return false;
  }
}

/**
 * Get current embedding queue status and metrics
 */
export async function getEmbeddingQueueStatus() {
  try {
    const { data: status, error } = await supabase
      .from('embedding_queue_status')
      .select('*')
      .eq('queue_name', 'embedding_jobs')
      .single();

    if (error) {
      console.error('Error getting queue status:', error);
      return {
        available: false,
        queueLength: 0,
        processing: false,
        error: error.message
      };
    }

    return {
      available: true,
      queueLength: status.queue_length || 0,
      totalMessages: status.total_messages || 0,
      oldestMessageAge: status.oldest_msg_age_sec || 0,
      newestMessageAge: status.newest_msg_age_sec || 0,
      processing: (status.queue_length || 0) > 0
    };
  } catch (error) {
    console.error('Error checking queue status:', error);
    return {
      available: false,
      queueLength: 0,
      processing: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Manually trigger embedding queue processing (fallback for manual sync)
 */
export async function triggerManualEmbeddingProcessing(): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    const autoEnabled = await isAutoEmbeddingEnabled();
    
    if (!autoEnabled) {
      return {
        success: false,
        processed: 0,
        error: 'Auto-embedding system not available. Using legacy manual processing.'
      };
    }

    // Trigger the queue processing function directly
    const { data: processed, error } = await supabase.rpc('process_embedding_queue');

    if (error) {
      console.error('Error in manual queue processing:', error);
      return {
        success: false,
        processed: 0,
        error: error.message
      };
    }

    return {
      success: true,
      processed: processed || 0
    };
  } catch (error) {
    console.error('Error triggering manual processing:', error);
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Result type for vector similarity search
 */
export type VectorSearchResult = {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
};

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 * 
 * This function converts text into a 1536-dimensional vector embedding that can be used
 * for semantic similarity searches. The embeddings are generated using OpenAI's latest
 * text-embedding-3-small model which provides high-quality semantic representations.
 * 
 * @param text - The text to generate an embedding for (max ~8000 tokens)
 * @returns Promise<number[]> - The embedding vector (1536 dimensions)
 * @throws Error - If the OpenAI API fails or returns invalid data
 * 
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("Product feature description");
 * // Returns: [0.123, -0.456, 0.789, ...] (1536 numbers)
 * ```
 */
export async function generateEmbedding(text: string) {
  try {
    // Call OpenAI's embedding API through Vercel AI SDK
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'), // Latest OpenAI embedding model
      value: text, // Input text to convert to vector
    });
    
    // Validate that we received a proper embedding array
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding response structure from OpenAI API');
    }
    
    // Return the 1536-dimensional vector array
    return embedding;
  } catch (error) {
    // Enhanced error logging with context for debugging
    console.error('Error generating embeddings:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      // Provide specific error messages for common API issues
      if (error.message.includes('authentication')) {
        throw new Error('Authentication error with OpenAI API. Check your API key.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded with OpenAI API. Try again later.');
      }
    }
    
    // Rethrow with enhanced context for upstream error handling
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * TODO: DELETE - Manual batch embedding no longer needed with auto-embedding
 * 
 * Generate embeddings for multiple texts (LEGACY - replaced by auto-embedding system)
 * 
 * Processes multiple text inputs sequentially to avoid rate limits and generate
 * embeddings for each. This is useful for initial data indexing or bulk operations.
 * Note: This processes sequentially to respect OpenAI rate limits.
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Promise<number[][]> - Array of embedding vectors (each 1536 dimensions)
 * @throws Error - If any individual embedding generation fails
 * @deprecated Use auto-embedding system instead
 * 
 * @example
 * ```typescript
 * const texts = ["Feature 1 description", "Feature 2 description"];
 * const embeddings = await generateBatchEmbeddings(texts);
 * // Returns: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
 * ```
 */
export async function generateBatchEmbeddings(texts: string[]) {
  // TODO: DELETE - This function will be removed once auto-embedding is stable
  console.warn('generateBatchEmbeddings: Using legacy manual batch embedding. Auto-embedding is preferred.');
  try {
    // Validate input array exists and is not empty
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid texts array provided for batch embedding generation');
    }
    
    console.log(`Generating batch embeddings for ${texts.length} texts`);
    
    // Process texts sequentially to avoid OpenAI rate limits
    // Note: Could be parallelized with rate limiting if needed for large batches
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    console.log(`Successfully generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      // Provide specific error messages for common issues
      if (error.message.includes('authentication')) {
        throw new Error('Authentication error with OpenAI API. Check your API key.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded with OpenAI API. Try again later with fewer items.');
      } else if (error.message.includes('billing')) {
        throw new Error('Billing error with OpenAI API. Check your account status.');
      }
    }
    
    // Rethrow with context
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * TODO: DELETE - Manual embedding no longer needed with auto-embedding
 * 
 * Create embeddings for a feature (LEGACY - will be replaced by auto-embedding triggers)
 * @param feature - Feature object to index
 * @param tenantId - Tenant ID for multi-tenancy
 * @returns The created embedding database entry
 * @deprecated Use auto-embedding system instead
 */
export async function indexFeature(feature: Feature, tenantId: string) {
  // TODO: DELETE - This function will be removed once auto-embedding is stable
  console.warn('indexFeature: Using legacy manual embedding. Auto-embedding is preferred.');
  try {
    // Validate inputs
    if (!feature || !feature.id) {
      throw new Error('Invalid feature object provided for indexing');
    }
    
    if (!tenantId) {
      throw new Error('Invalid tenant ID provided for indexing');
    }
    
    // Ensure we have a valid UUID for tenant_id
    const tenantUuid = isValidUuid(tenantId) ? tenantId : uuidv4();
    
    // Prepare content for embedding with structured format
    const content = `
      Feature: ${feature.name || 'Unnamed Feature'}
      Priority: ${feature.priority || 'Not set'}
      Workflow Status: ${feature.workflowStatus || 'Not set'}
      Description: ${feature.description || ''}
      Requirements: ${feature.requirements ? feature.requirements.join('\n') : ''}
    `;
    
    // Generate embedding with error handling
    let embedding;
    try {
      console.log(`Generating embedding for feature: ${feature.id} - ${feature.name}`);
      embedding = await generateEmbedding(content);
    } catch (embeddingError) {
      console.error(`Error generating embedding for feature ${feature.id}:`, embeddingError);
      throw new Error(`Failed to generate embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
    }
    
    // Verify embedding was generated correctly
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Generated embedding is invalid or empty');
    }
    
    console.log(`Storing embedding for feature: ${feature.id} - ${feature.name}`);
    
    // Store in Supabase with detailed metadata
    const { data, error } = await supabase
      .from('ai_embeddings')
      .upsert({
        tenant_id: tenantUuid,
        entity_type: 'feature',
        entity_id: feature.id,
        content,
        embedding,
        metadata: {
          id: feature.id,
          name: feature.name,
          priority: feature.priority,
          workflow_status: feature.workflowStatus,
          interface_id: feature.interfaceId,
          roadmap_id: feature.roadmapId
        }
      }, {
        onConflict: 'tenant_id, entity_type, entity_id'
      })
      .select();
      
    if (error) {
      console.error(`Supabase error storing feature ${feature.id}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned from database after insert/update');
    }
    
    // Parse embedding back to array if it's a string (Supabase serialization)
    const result = data[0];
    if (result.embedding && typeof result.embedding === 'string') {
      try {
        result.embedding = JSON.parse(result.embedding);
      } catch (parseError) {
        console.warn('Could not parse embedding from string, leaving as-is');
      }
    }
    
    return result;
  } catch (error) {
    // Enhance error with context
    const enhancedError = new Error(
      `Failed to index feature ${feature?.id || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    if (error instanceof Error) {
      enhancedError.stack = error.stack;
    }
    throw enhancedError;
  }
}

/**
 * TODO: DELETE - Manual embedding no longer needed with auto-embedding
 * 
 * Create embeddings for a release (LEGACY - will be replaced by auto-embedding triggers)
 * @param release - Release object to index
 * @param tenantId - Tenant ID for multi-tenancy
 * @returns The created embedding database entry
 * @deprecated Use auto-embedding system instead
 */
export async function indexRelease(release: Release, tenantId: string) {
  // TODO: DELETE - This function will be removed once auto-embedding is stable
  console.warn('indexRelease: Using legacy manual embedding. Auto-embedding is preferred.');
  try {
    // Validate inputs
    if (!release || !release.id) {
      throw new Error('Invalid release object provided for indexing');
    }
    
    if (!tenantId) {
      throw new Error('Invalid tenant ID provided for indexing');
    }
    
    // Ensure we have a valid UUID for tenant_id
    const tenantUuid = isValidUuid(tenantId) ? tenantId : uuidv4();
    
    // Prepare content for embedding with null/undefined protection
    const content = `
      Release: ${release.name || 'Unnamed Release'}
      Release Date: ${release.releaseDate || 'Not set'}
      Priority: ${release.priority || 'Not set'}
      Description: ${release.description || ''}
    `;
    
    // Generate embedding with error handling
    let embedding;
    try {
      console.log(`Generating embedding for release: ${release.id} - ${release.name}`);
      embedding = await generateEmbedding(content);
    } catch (embeddingError) {
      console.error(`Error generating embedding for release ${release.id}:`, embeddingError);
      throw new Error(`Failed to generate embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
    }
    
    // Verify embedding was generated correctly
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Generated embedding is invalid or empty');
    }
    
    console.log(`Storing embedding for release: ${release.id} - ${release.name}`);
    
    // Store in Supabase with better metadata
    const { data, error } = await supabase
      .from('ai_embeddings')
      .upsert({
        tenant_id: tenantUuid,
        entity_type: 'release',
        entity_id: release.id,
        content,
        embedding,
        metadata: {
          id: release.id,
          name: release.name,
          releaseDate: release.releaseDate,
          priority: release.priority,
          featureId: release.featureId
        }
      }, {
        onConflict: 'tenant_id, entity_type, entity_id'
      })
      .select();
      
    if (error) {
      console.error(`Supabase error storing release ${release.id}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned from database after insert/update');
    }
    
    // Parse embedding back to array if it's a string (Supabase serialization)
    const result = data[0];
    if (result.embedding && typeof result.embedding === 'string') {
      try {
        result.embedding = JSON.parse(result.embedding);
      } catch (parseError) {
        console.warn('Could not parse embedding from string, leaving as-is');
      }
    }
    
    return result;
  } catch (error) {
    // Enhance error with context
    const enhancedError = new Error(
      `Failed to index release ${release?.id || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    if (error instanceof Error) {
      enhancedError.stack = error.stack;
    }
    throw enhancedError;
  }
}

/**
 * Search for similar vectors in the database using semantic similarity
 * 
 * This function performs a sophisticated vector similarity search that:
 * 1. Converts the query text to an embedding
 * 2. Searches the Supabase vector database using cosine similarity
 * 3. Applies metadata filters if specified
 * 4. Uses intelligent ranking based on keyword matching
 * 5. Returns dynamically limited results based on query type
 * 
 * The search uses a smart dynamic limit system:
 * - Count queries ("how many"): Returns up to 50 results for comprehensive data
 * - List queries ("list all"): Returns up to 30 results for broad coverage
 * - Search queries ("find"): Returns up to 15 most relevant results
 * - Specific queries: Returns up to 10 focused results
 * 
 * @param query - The search query text to find similar content for
 * @param tenantId - Tenant ID for multi-tenancy isolation (UUID format)
 * @param filters - Optional filters for more precise searching
 * @param filters.priority - Filter by priority level (e.g., "High", "Med", "Low")
 * @param filters.status - Filter by status (e.g., "Active", "Done", "Backlog")
 * @param filters.entityType - Filter by entity type (e.g., "feature", "release")
 * @param limit - Optional override for maximum number of results to return
 * @returns Promise<VectorSearchResult[]> - Array of search results with similarity scores
 * @throws Error - If query is invalid, tenant ID is missing, or database error occurs
 * 
 * @example
 * ```typescript
 * // Basic search
 * const results = await searchVectors("authentication features", tenantId);
 * 
 * // Filtered search
 * const results = await searchVectors("mobile features", tenantId, {
 *   priority: "High",
 *   entityType: "feature"
 * });
 * 
 * // Count query (automatically gets higher limit)
 * const results = await searchVectors("How many features do I have?", tenantId);
 * ```
 */
export async function searchVectors(
  query: string, 
  tenantId: string, 
  filters?: { priority?: string, status?: string, entityType?: string },
  limit?: number
): Promise<VectorSearchResult[]> {
  try {
    // === INPUT VALIDATION ===
    // Validate query string is provided and not empty
    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.warn('Invalid or empty query provided for vector search');
      return []; // Return empty results rather than throwing for graceful degradation
    }
    
    // Validate tenant ID is provided for multi-tenancy
    if (!tenantId) {
      throw new Error('Invalid tenant ID provided for vector search');
    }
    
    // Use tenant ID directly - don't generate random UUIDs that break tenant isolation
    const tenantUuid = tenantId;
    
    console.log(`Performing vector search for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
    
    // === EMBEDDING GENERATION ===
    // Convert the search query into a vector embedding for similarity comparison
    let embedding;
    try {
      console.log('API key available:', !!apiKey, 'Length:', apiKey.length);
      // Write debug info to file for inspection
      require('fs').appendFileSync('/Users/delaghetto/Documents/Projects/demo/vector-debug.log', 
        `[${new Date().toISOString()}] API key available: ${!!apiKey}, Length: ${apiKey.length}\n`);
      
      embedding = await generateEmbedding(query);
      console.log('Embedding generated successfully, length:', embedding.length);
      require('fs').appendFileSync('/Users/delaghetto/Documents/Projects/demo/vector-debug.log', 
        `[${new Date().toISOString()}] Embedding generated: ${embedding.length} dimensions\n`);
    } catch (embeddingError) {
      console.error('Error generating embedding for search query:', embeddingError);
      console.error('API key status:', { hasKey: !!apiKey, keyLength: apiKey?.length || 0 });
      throw new Error(`Search failed: ${embeddingError instanceof Error ? embeddingError.message : 'Failed to generate query embedding'}`);
    }
    
    // Validate the embedding was generated successfully
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Generated query embedding is invalid or empty');
    }
    
    console.log('Querying vector database...');
    
    // === DYNAMIC LIMIT CALCULATION ===
    // Determine how many results to return based on the type of query
    const queryType = determineQueryType(query);
    const dynamicLimit = limit || getDynamicLimit(queryType);
    const searchCount = Math.min(dynamicLimit * 2, 100); // Search more candidates than we return
    
    console.log(`Query type: ${queryType}, using limit: ${dynamicLimit}, searching: ${searchCount}`);
    
    // === VECTOR SIMILARITY SEARCH ===
    // Use Supabase's custom match_documents function for optimized vector search
    console.log('RPC Parameters:', {
      embedding_type: typeof embedding,
      embedding_length: embedding.length,
      embedding_sample: embedding.slice(0, 3),
      match_threshold: 0.0,
      match_count: searchCount,
      tenant_filter: tenantUuid
    });
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,                   // Plain array format that worked in unit test
      match_threshold: 0.0,                         // No threshold - accept any similarity for debugging 
      match_count: searchCount,                     // Number of candidates to retrieve
      tenant_filter: tenantUuid                     // Multi-tenant isolation
    });
    
    // Handle database errors
    if (error) {
      console.error('Supabase vector search error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Query parameters:', { 
        embedding_length: embedding.length, 
        match_threshold: 0.3, 
        match_count: searchCount, 
        tenant_filter: tenantUuid 
      });
      throw new Error(`Vector search failed: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} initial matches`);
    if (data && data.length > 0) {
      console.log('Sample result:', {
        id: data[0].id,
        similarity: data[0].similarity,
        content_preview: data[0].content?.substring(0, 100)
      });
    } else {
      console.log('No matches found - this suggests vector search is not finding similar content');
    }
    
    // === METADATA FILTERING ===
    // Apply optional filters to narrow down results based on metadata
    let results = data || [];
    
    // Filter by entity type (e.g., only "feature" or "release" items)
    if (filters?.entityType) {
      results = results.filter((item: any) => 
        item.metadata?.entity_type === filters.entityType
      );
    }
    
    // Filter by priority level (e.g., only "High" priority items)
    if (filters?.priority) {
      results = results.filter((item: any) => 
        item.metadata?.priority === filters.priority
      );
    }
    
    // Filter by status (e.g., only "Active" or "Done" items)
    if (filters?.status) {
      results = results.filter((item: any) => 
        item.metadata?.status === filters.status
      );
    }
    
    // === INTELLIGENT RE-RANKING ===
    // Enhance similarity scores with keyword matching for better relevance
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2); // Skip very short words like "a", "is"
    results = results.map((result: any) => {
      // Count how many query keywords appear in the content
      const matches = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matchCount = ((result.content || '').match(regex) || []).length;
        return count + matchCount;
      }, 0);
      
      // Boost similarity score slightly for keyword matches (0.01 per match)
      // This helps surface results that are both semantically similar AND contain exact keywords
      const adjustedScore = result.similarity + (matches * 0.01);
      
      return {
        ...result,
        similarity: adjustedScore // Return enhanced similarity score
      };
    })
    // Sort by final similarity score (highest first) and limit to dynamic limit
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, dynamicLimit);
    
    console.log(`Returning ${results.length} results after filtering and ranking`);
    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    
    // Special case for empty DB - rather than error, return empty results
    if (error instanceof Error && 
        (error.message.includes('relation "ai_embeddings" does not exist') || 
         error.message.includes('function match_documents() does not exist'))) {
      console.warn('Vector database not set up yet - returning empty results');
      return [];
    }
    
    // Rethrow with context for other errors
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Store a chat message in the database
 * @param userId - User ID who sent/received the message
 * @param tenantId - Tenant ID for multi-tenancy
 * @param role - Message role (user, assistant, system, function)
 * @param content - Message content
 * @returns The stored message
 */
export async function storeChatMessage(userId: string, tenantId: string, role: string, content: string) {
  // Ensure we have valid UUIDs
  const userUuid = isValidUuid(userId) ? userId : uuidv4();
  const tenantUuid = isValidUuid(tenantId) ? tenantId : uuidv4();
  
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      user_id: userUuid,
      tenant_id: tenantUuid,
      role,
      content
    })
    .select();
    
  if (error) throw error;
  return data[0];
}

/**
 * Get chat history for a user
 * @param userId - User ID to get history for
 * @param tenantId - Tenant ID for multi-tenancy
 * @param limit - Maximum number of messages to return
 * @returns Array of chat messages
 */
export async function getChatHistory(userId: string, tenantId: string, limit = 100) {
  // Ensure we have valid UUIDs
  const userUuid = isValidUuid(userId) ? userId : uuidv4();
  const tenantUuid = isValidUuid(tenantId) ? tenantId : uuidv4();
  
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userUuid)
    .eq('tenant_id', tenantUuid)
    .order('created_at', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data;
}

/**
 * Update or create a chat session
 * @param userId - User ID who owns the session
 * @param tenantId - Tenant ID for multi-tenancy
 * @returns The updated/created session
 */
export async function updateChatSession(userId: string, tenantId: string) {
  // Ensure we have valid UUIDs
  const userUuid = isValidUuid(userId) ? userId : uuidv4();
  const tenantUuid = isValidUuid(tenantId) ? tenantId : uuidv4();
  
  const { data, error } = await supabase
    .from('ai_sessions')
    .upsert({
      user_id: userUuid,
      tenant_id: tenantUuid,
      last_activity: new Date().toISOString()
    }, {
      onConflict: 'user_id, tenant_id'
    })
    .select();
    
  if (error) throw error;
  return data[0];
}

/**
 * Determine query type for dynamic limit selection
 * 
 * Analyzes the query text to understand the user's intent and determine
 * how many results should be returned. This enables intelligent scaling
 * based on what the user is actually asking for.
 * 
 * @param query - Search query text to analyze
 * @returns Query type category that determines result limits
 * 
 * Query Types:
 * - 'count': Questions asking for quantities ("how many", "count")
 * - 'list': Requests for comprehensive lists ("list all", "show me")  
 * - 'search': General search queries ("find", "search for", "about")
 * - 'specific': Targeted questions (default for other queries)
 * 
 * @example
 * ```typescript
 * determineQueryType("How many features do I have?") // Returns 'count'
 * determineQueryType("List all active features") // Returns 'list'
 * determineQueryType("Find authentication features") // Returns 'search'
 * determineQueryType("What is feature X?") // Returns 'specific'
 * ```
 */
function determineQueryType(query: string): 'count' | 'list' | 'search' | 'specific' {
  const lowerQuery = query.toLowerCase();
  
  // Count queries: User wants to know quantities - need comprehensive data
  if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
    return 'count';
  }
  
  // List queries: User wants to see multiple items - need broad coverage
  if (lowerQuery.includes('list') || lowerQuery.includes('all') || lowerQuery.includes('show me')) {
    return 'list';
  }
  
  // Search queries: User is exploring - need relevant results
  if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('about')) {
    return 'search';
  }
  
  // Specific queries: Targeted questions - need focused results
  return 'specific';
}

/**
 * Get dynamic limit based on query type
 * 
 * Returns the optimal number of results for different types of queries.
 * This balances comprehensiveness with performance and context window limits.
 * 
 * The limits are designed to:
 * - Provide complete data for count/analysis queries
 * - Keep response times fast
 * - Stay within LLM context windows
 * - Avoid overwhelming users with too many results
 * 
 * @param queryType - Type of query being performed
 * @returns Appropriate result limit for the query type
 * 
 * Limit Strategy:
 * - Count: 50 results - Need comprehensive data to provide accurate counts
 * - List: 30 results - Broad coverage while staying manageable  
 * - Search: 15 results - Most relevant results for exploration
 * - Specific: 10 results - Focused results for targeted questions
 * 
 * @example
 * ```typescript
 * getDynamicLimit('count') // Returns 50
 * getDynamicLimit('list') // Returns 30  
 * getDynamicLimit('search') // Returns 15
 * getDynamicLimit('specific') // Returns 10
 * ```
 */
function getDynamicLimit(queryType: 'count' | 'list' | 'search' | 'specific'): number {
  switch (queryType) {
    case 'count':
      return 50; // For "how many features" - need comprehensive picture for accurate counts
    case 'list':
      return 30; // For "list all features" - comprehensive but manageable for reading
    case 'search':
      return 15; // For "find features like X" - most relevant results for exploration
    case 'specific':
      return 10; // For targeted questions - focused results to avoid overwhelming
    default:
      return 10; // Safe fallback for unknown query types
  }
}

/**
 * Check if a string is a valid UUID
 * @param str - String to check
 * @returns True if the string is a valid UUID
 */
function isValidUuid(str: string): boolean {
  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
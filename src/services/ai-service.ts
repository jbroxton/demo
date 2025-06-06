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

// Polyfill fetch for Node.js environments
// Note: In production, Next.js should handle this automatically

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
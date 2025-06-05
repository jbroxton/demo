/**
 * @file AI Chat API Route
 * @description Next.js API route for AI-powered chat with RAG functionality
 * 
 * This route implements a complete RAG (Retrieval Augmented Generation) system that:
 * - Performs semantic vector search on user's product data
 * - Generates contextual AI responses using OpenAI
 * - Supports real-time streaming responses
 * - Handles multi-tenant data isolation
 * - Provides intelligent dynamic result limiting
 * - Supports data indexing operations
 * 
 * Architecture:
 * 1. Parse request and authenticate user
 * 2. Perform vector similarity search using Supabase pgvector
 * 3. Format retrieved context for AI consumption
 * 4. Generate streaming response using OpenAI + context
 * 5. Store conversation history for future reference
 * 
 * Used by: AI chat component in the product management dashboard
 * Dependencies: OpenAI API, Supabase pgvector, Vercel AI SDK
 */

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiResponse } from '@/utils/api-response';
import { asyncHandler } from '@/utils/api-async-handler';
import { 
  searchVectors, 
  storeChatMessage, 
  indexFeature, 
  indexRelease 
} from '@/services/ai-service';
import { getPages } from '@/services/pages-db';
import { getReleasesFromDb } from '@/services/releases-db';
// BYPASSED: Complex system prompts causing issues with context usage
// import { 
//   analyzeProductContext, 
//   generateContextualSystemPrompt,
//   generateBriefSystemPrompt 
// } from '@/system-prompts';

// Verify API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
if (!apiKey) {
  console.warn('Warning: OpenAI API key not found in environment variables');
}

// OpenAI client is imported from @ai-sdk/openai

// Define input schemas matching Vercel AI SDK expectations
const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      id: z.string().optional(),
      name: z.string().optional(),
    })
  ),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['chat', 'index']).optional().default('chat'),
});

/**
 * AI Chat API Route Handler
 * 
 * This API endpoint handles AI chat requests with RAG (Retrieval Augmented Generation).
 * It supports both chat queries and data indexing operations in a multi-tenant environment.
 * 
 * Features:
 * - Streaming AI responses using Vercel AI SDK
 * - Vector similarity search with Supabase pgvector
 * - Multi-tenant data isolation
 * - Dynamic result limiting based on query type
 * - Automatic data indexing for features and releases
 * - Context-aware responses using retrieved embeddings
 * 
 * Request Body:
 * - messages: Array of chat messages (OpenAI format)
 * - tenantId: UUID for multi-tenant isolation
 * - userId: User identifier for message storage
 * - action: 'chat' (default) or 'index' for data indexing
 * 
 * Response:
 * - Streaming text response compatible with useChat() hook
 * - Uses AI SDK's toDataStreamResponse() format
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    console.log('AI Chat API route called');
    
    // === REQUEST PARSING ===
    // Parse request body first (before getRequestContext which also tries to read it)
    // This prevents "Body is unusable: Body has already been read" errors
    const body = await request.json();
    
    // === AUTHENTICATION & CONTEXT ===
    // Extract user and tenant information from session and headers
    let userId: string | null = null;
    let contextTenantId: string | null = null;
    
    try {
      // Get tenant ID from custom header (set by frontend)
      contextTenantId = request.headers.get('x-tenant-id');
      
      // Try to get session for user context (but skip body reading since we already did it)
      const { authOptions } = await import('@/lib/auth');
      const { getServerSession } = await import('next-auth');
      
      const session = await getServerSession(authOptions);
      if (session?.user) {
        userId = session.user.id;
        // Use session tenant if header tenant not provided (fallback)
        if (!contextTenantId) {
          contextTenantId = session.user.currentTenant || session.user.tenantId;
        }
      }
    } catch (contextError) {
      console.log('[AI Chat] Could not get auth session, proceeding without auth:', contextError instanceof Error ? contextError.message : String(contextError));
      // Continue without context - we'll use headers and body data for multi-tenancy
    }
    console.log('Request body received:', {
      action: body.action,
      tenantId: body.tenantId,
      messagesCount: body.messages?.length || 0,
    });
    
    // === INPUT VALIDATION ===
    // Validate the request body against our schema to ensure type safety
    const validatedBody = chatInputSchema.parse(body);
    const { messages, tenantId: bodyTenantId, action, userId: bodyUserId } = validatedBody;
    
    // === TENANT & USER RESOLUTION ===
    // Determine final tenant and user IDs from multiple sources (priority order)
    const tenantId = contextTenantId || bodyTenantId || 'default';
    const userIdForMessages = userId || bodyUserId || 'anonymous';
    
    // === INDEXING REQUEST HANDLING ===
    // Handle data indexing operations (separate from chat)
    if (action === 'index') {
      return await handleIndexing(tenantId);
    }
    
    // === MESSAGE PERSISTENCE ===
    // Store the user's message for chat history and potential future training
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMessage && lastMessage.role === 'user') {
      await storeChatMessage(userIdForMessages, tenantId, 'user', lastMessage.content);
    }
    
    // === FALLBACK FOR INVALID MESSAGES ===
    // Skip vector search if no valid user message exists
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content.trim()) {
      console.log('No valid user message found, using fallback response');
      
      const modelToUse = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      
      // Provide a basic greeting response when no valid query exists
      const result = await streamText({
        model: openai(modelToUse),
        messages: [
          { role: 'system', content: 'You are a Product Management Assistant.' },
          { role: 'user', content: 'Hello' },
        ],
      });
      
      return result.toDataStreamResponse();
    }
    
    // === RAG: VECTOR SEARCH FOR CONTEXT ===
    // Perform semantic search to find relevant context from user's data
    let searchResults: any[] = [];
    let contextAvailable = false;
    
    try {
      const formattedQuery = lastMessage.content.trim();
      console.log('=== VECTOR SEARCH DEBUG ===');
      console.log('Query:', formattedQuery);
      console.log('Tenant ID:', tenantId);
      console.log('Attempting vector search...');
      
      // Use our intelligent vector search with dynamic limits
      searchResults = await searchVectors(formattedQuery, tenantId);
      contextAvailable = searchResults.length > 0;
      
      console.log('=== VECTOR SEARCH RESULTS ===');
      console.log('Results found:', searchResults.length);
      console.log('Context available:', contextAvailable);
      if (searchResults.length > 0) {
        console.log('Sample result:', {
          id: searchResults[0].id,
          similarity: searchResults[0].similarity,
          content_preview: searchResults[0].content?.substring(0, 100)
        });
      }
      console.log('=========================');
    } catch (error) {
      console.error('=== VECTOR SEARCH ERROR ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : String(error));
      console.error('========================');
      searchResults = []; // Continue without context if search fails
    }
    
    // === CONTEXT FORMATTING ===
    // Format the search results into structured context for the AI
    const contextBlocks = searchResults.map((result, i) => {
      const entityName = result.metadata?.name || 'Unknown';
      const entityType = result.metadata?.entity_type || result.entity_type || 'item';
      return `[${i + 1}] ${entityType.toUpperCase()}: ${entityName}\n${result.content.trim()}`;
    });
    
    const context = contextBlocks.join('\n\n');
    
    // === SIMPLE SYSTEM PROMPT ===
    // Use only context data - no complex analysis that might confuse the AI
    const systemPrompt = contextAvailable 
      ? `You are a Product Management AI assistant. ONLY answer based on the context data provided below. If the context data contains relevant information, reference it specifically by name. If no relevant context data is found, say "I don't see relevant information about that in your product data."

## Context Data
${context}`
      : `You are a Product Management AI assistant. I don't have specific context data about your product to reference for this query.`;
    
    // === AI RESPONSE GENERATION ===
    // Generate streaming response using OpenAI with retrieved context
    try {
      const modelToUse = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      console.log(`Using OpenAI model: ${modelToUse}`);
      
      const result = await streamText({
        model: openai(modelToUse),
        messages: [
          { role: 'system', content: systemPrompt }, // Include RAG context in system message
          ...messages, // Include full conversation history
        ],
        temperature: 0.7,    // Balanced creativity vs consistency
        maxTokens: 1000,     // Reasonable response length limit
        onFinish: async (result) => {
          try {
            // Store the AI's response for chat history
            await storeChatMessage(userIdForMessages, tenantId, 'assistant', result.text);
          } catch (error) {
            console.error('Error storing assistant message:', error);
            // Don't fail the request if message storage fails
          }
        },
      });
      
      // Return streaming response compatible with useChat() hook
      return result.toDataStreamResponse();
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      let errorMessage = 'An error occurred while generating a response. Please try again later.';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        
        if (error.message.includes('authentication')) {
          errorMessage = 'Authentication error with OpenAI API. Please check your API key.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded with OpenAI API. Please try again later.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'OpenAI API request timed out. Please try again later.';
        }
      }
      
      return apiResponse.error(errorMessage, 500);
    }
  } catch (error) {
    console.error('API route error:', error);
    return apiResponse.error('Internal server error occurred.', 500);
  }
});

async function handleIndexing(tenantId: string): Promise<NextResponse> {
  try {
    console.log('Starting indexing process for tenant:', tenantId);
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid tenant ID provided' },
        { status: 400 }
      );
    }
    
    // Get all features and releases for this tenant
    console.log('Fetching features and releases for indexing...');
    let features: any[] = [];
    let releases: any[] = [];
    
    try {
      const featuresResult = await getPages({ tenantId, type: 'feature' });
      features = featuresResult.success ? featuresResult.data || [] : [];
      console.log(`Found ${features.length} features to index`);
    } catch (featureError) {
      console.error('Error fetching features for indexing:', featureError);
      return NextResponse.json(
        { success: false, error: `Error fetching features: ${featureError instanceof Error ? featureError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    try {
      const releasesResult = await getReleasesFromDb(tenantId);
      releases = releasesResult.success ? releasesResult.data || [] : [];
      console.log(`Found ${releases.length} releases to index`);
    } catch (releaseError) {
      console.error('Error fetching releases for indexing:', releaseError);
      return NextResponse.json(
        { success: false, error: `Error fetching releases: ${releaseError instanceof Error ? releaseError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    let indexedCount = 0;
    let errors = [];
    
    // Index features
    if (features && Array.isArray(features)) {
      console.log('Starting feature indexing...');
      for (const feature of features) {
        try {
          await indexFeature(feature, tenantId);
          indexedCount++;
          console.log(`Indexed feature: ${feature.id} - ${feature.name}`);
        } catch (error) {
          const errorMsg = `Feature ${feature.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`Error indexing feature:`, errorMsg);
          errors.push(errorMsg);
        }
      }
    }
    
    // Index releases
    if (releases && Array.isArray(releases)) {
      console.log('Starting release indexing...');
      for (const release of releases) {
        try {
          await indexRelease(release, tenantId);
          indexedCount++;
          console.log(`Indexed release: ${release.id} - ${release.name}`);
        } catch (error) {
          const errorMsg = `Release ${release.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`Error indexing release:`, errorMsg);
          errors.push(errorMsg);
        }
      }
    }
    
    console.log(`Indexing completed. Success: ${indexedCount} items, Errors: ${errors.length} items`);
    return NextResponse.json({
      success: true,
      indexed: indexedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Unexpected error during indexing process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to index data',
      },
      { status: 500 }
    );
  }
}
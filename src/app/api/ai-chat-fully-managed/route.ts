/**
 * @file OpenAI Fully Managed Chat API Route
 * @description Pure OpenAI Assistants + Files implementation (no custom vector search)
 * 
 * Architecture:
 * User Message → OpenAI Thread → OpenAI Assistant → OpenAI File Search → Response
 * 
 * Key Features:
 * - 100% OpenAI managed (no custom RAG)
 * - Conversation memory via OpenAI Threads
 * - Context from uploaded files via OpenAI Files API
 * - Tenant isolation via separate assistants/files
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { asyncHandler } from '@/utils/api-async-handler';
import { apiResponse } from '@/utils/api-response';
import { 
  getUserThread, 
  createUserThread, 
  getOrCreateAssistant,
  ensureTenantDataSynced 
} from '@/services/ai-chat-fully-managed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI Fully Managed Chat Handler
 * 
 * Handles chat requests using pure OpenAI infrastructure:
 * - Creates/manages OpenAI threads per user
 * - Routes messages through OpenAI assistants
 * - Leverages OpenAI file search for context
 * 
 * @param request - Chat request with messages and tenant info
 * @returns Streaming OpenAI assistant response
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    console.log('[AI Fully Managed] Chat request received');
    
    // === AUTHENTICATION ===
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiResponse.error('Unauthorized', 401);
    }
    
    // === REQUEST PARSING ===
    const body = await request.json();
    const { message, tenantId } = body;
    
    // Validate required parameters
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return apiResponse.error('Message is required', 400);
    }
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      return apiResponse.error('Tenant ID is required', 400);
    }
    
    const userId = session.user.id;
    
    console.log(`[AI Fully Managed] Processing request for tenant: ${tenantId}, user: ${userId}`);
    
    // === OPTIMIZED: PARALLEL OPERATIONS ===
    // Run thread and assistant lookup in parallel (no data sync needed per message)
    console.log('[AI Fully Managed] Getting thread and assistant in parallel');
    
    const [threadId, assistantId] = await Promise.all([
      getUserThread(userId, tenantId).then(async (id) => {
        if (!id) {
          console.log('[AI Fully Managed] Creating new thread for user');
          return await createUserThread(userId, tenantId);
        }
        return id;
      }),
      getOrCreateAssistant(tenantId)
    ]);
    
    console.log(`[AI Fully Managed] Using thread: ${threadId}, assistant: ${assistantId}`);
    
    // === ADD MESSAGE TO THREAD ===
    // Add user's message to the OpenAI thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });
    
    console.log('[AI Fully Managed] Added message to thread, creating run');
    
    // === CREATE RUN ===
    // Start assistant run to process the message
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: `You are a Product Management assistant. Use the uploaded files to understand the user's product context. Always reference specific features, products, or requirements when giving advice. Be helpful and actionable.`
    });
    
    console.log(`[AI Fully Managed] Created run: ${run.id}`);
    
    // === POLL FOR COMPLETION ===
    // Wait for run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= maxAttempts) {
        console.error('[AI Fully Managed] Run timeout');
        return apiResponse.error('Assistant response timeout', 408);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }
    
    console.log(`[AI Fully Managed] Run completed with status: ${runStatus.status}`);
    
    // === HANDLE RUN RESULTS ===
    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 1
      });
      
      const assistantMessage = messages.data[0];
      if (!assistantMessage || assistantMessage.role !== 'assistant') {
        return apiResponse.error('No assistant response found', 500);
      }
      
      // Extract text content from the message
      const textContent = assistantMessage.content
        .filter(content => content.type === 'text')
        .map(content => content.text.value)
        .join('\n');
      
      console.log('[AI Fully Managed] Successfully retrieved assistant response');
      
      return NextResponse.json({
        response: textContent,  // Changed from 'content' to 'response'
        message: textContent,   // Added 'message' for hook compatibility
        threadId: threadId,
        runId: run.id
      });
      
    } else if (runStatus.status === 'failed') {
      console.error('[AI Fully Managed] Run failed:', runStatus.last_error);
      return apiResponse.error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`, 500);
      
    } else {
      console.error('[AI Fully Managed] Unexpected run status:', runStatus.status);
      return apiResponse.error(`Unexpected run status: ${runStatus.status}`, 500);
    }
    
  } catch (error) {
    console.error('[AI Fully Managed] API route error:', error);
    
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('[AI Fully Managed] Error name:', error.name);
      console.error('[AI Fully Managed] Error message:', error.message);
      console.error('[AI Fully Managed] Error stack:', error.stack);
      
      // Provide specific error messages for common issues
      if (error.message.includes('rate_limit')) {
        return apiResponse.error('OpenAI rate limit exceeded. Please try again later.', 429);
      } else if (error.message.includes('authentication')) {
        return apiResponse.error('OpenAI authentication failed. Please check configuration.', 401);
      } else if (error.message.includes('quota')) {
        return apiResponse.error('OpenAI quota exceeded. Please check your billing.', 402);
      } else if (error.message.includes('API key')) {
        return apiResponse.error('OpenAI API key is missing or invalid.', 401);
      }
      
      // Return the actual error message for debugging
      return apiResponse.error(`Server error: ${error.message}`, 500);
    }
    
    return apiResponse.error('Internal server error occurred.', 500);
  }
});
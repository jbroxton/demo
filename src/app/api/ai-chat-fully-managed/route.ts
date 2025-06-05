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
import { 
  getAllAgentFunctionTools,
  validateAgentParams 
} from '@/lib/agent-function-tools';
import { agentActionsService } from '@/services/agent-actions-db';
import { agentOperationsService } from '@/services/agent-operations';
import type { AgentMode } from '@/types/models/ai-chat';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate user-friendly action descriptions for confirmation prompts
 */
function getActionDescription(functionName: string, parameters: any): string {
  switch (functionName) {
    case 'createProduct':
      return `create a new product "${parameters.name}"`;
    case 'createFeature':
      return `create a new feature "${parameters.name}"`;
    case 'createRequirement':
      return `create a new requirement "${parameters.title}"`;
    case 'createRelease':
      return `create a new release "${parameters.name}" for ${parameters.targetDate}`;
    case 'createRoadmap':
      return `create a new roadmap "${parameters.name}"`;
    case 'updateProduct':
      return `update product details`;
    case 'updateFeature':
      return `update feature details`;
    case 'updateRequirement':
      return `update requirement details`;
    case 'updateRelease':
      return `update release details`;
    case 'updateRoadmap':
      return `update roadmap details`;
    case 'deleteProduct':
      return `delete a product`;
    case 'deleteFeature':
      return `delete a feature`;
    case 'deleteRequirement':
      return `delete a requirement`;
    case 'deleteRelease':
      return `delete a release`;
    case 'deleteRoadmap':
      return `delete a roadmap`;
    default:
      return `perform ${functionName}`;
  }
}

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
    const { message, tenantId, mode = 'ask', sessionId } = body;
    
    // Validate required parameters
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return apiResponse.error('Message is required', 400);
    }
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      return apiResponse.error('Tenant ID is required', 400);
    }
    
    const userId = session.user.id;
    
    console.log(`[AI Fully Managed] Processing request for tenant: ${tenantId}, user: ${userId}, mode: ${mode}`);
    
    // === AGENT SESSION MANAGEMENT ===
    if (sessionId && mode === 'agent') {
      // Update session activity
      await agentActionsService.upsertSession(sessionId, userId, tenantId, mode as AgentMode);
    }
    
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
    const runConfig: any = {
      assistant_id: assistantId,
      instructions: mode === 'agent' 
        ? `You are a Product Management assistant with the ability to create, update, and manage data. When the user asks you to perform actions like creating products, updating features, or managing requirements, use the available function tools.

CRITICAL CONFIRMATION WORKFLOW:
1. When you call a function and receive a response with "requiresConfirmation: true" or "CONFIRMATION_REQUIRED", this means you need user permission
2. DO NOT treat this as an error - it's a normal part of the workflow
3. Present the confirmation request to the user in a clear, friendly way
4. Wait for the user to respond with "yes", "confirm", "proceed" or "no", "cancel"
5. If confirmed, call the SAME function again with the SAME parameters (the system will execute it this time)
6. If declined, acknowledge and do not proceed

EXAMPLE FLOW:
- User: "Create a product called Test"
- You: Call createProduct function
- Function returns: {"requiresConfirmation": true, "message": "Would you like me to create..."}
- You: "I'd like to create a new product called 'Test'. Would you like me to proceed? Please respond with 'yes' or 'no'."
- User: "yes"
- You: Call createProduct function again with same parameters
- Function executes successfully

Use the uploaded files to understand the user's product context.`
        : `You are a Product Management assistant. Use the uploaded files to understand the user's product context. Always reference specific features, products, or requirements when giving advice. Be helpful and actionable.`
    };
    
    // Add function tools if in agent mode
    if (mode === 'agent') {
      const functionTools = getAllAgentFunctionTools();
      runConfig.tools = [
        { type: "file_search" },
        ...functionTools
      ];
    }
    
    const run = await openai.beta.threads.runs.create(threadId, runConfig);
    
    console.log(`[AI Fully Managed] Created run: ${run.id}`);
    
    // === POLL FOR COMPLETION WITH FUNCTION CALLING ===
    // Wait for run to complete, handling function calls
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait for function calls
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued' || runStatus.status === 'requires_action') {
      if (attempts >= maxAttempts) {
        console.error('[AI Fully Managed] Run timeout');
        return apiResponse.error('Assistant response timeout', 408);
      }
      
      // Handle function calls if required
      if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
        console.log('[AI Fully Managed] Function calls required, processing...');
        
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          console.log(`[AI Fully Managed] Processing function: ${toolCall.function.name}`);
          
          try {
            const functionName = toolCall.function.name;
            const parameters = JSON.parse(toolCall.function.arguments);
            
            // Check if this is a destructive operation that needs confirmation
            const destructiveOperations = ['createProduct', 'createFeature', 'createRequirement', 'createRelease', 'createRoadmap', 
                                          'updateProduct', 'updateFeature', 'updateRequirement', 'updateRelease', 'updateRoadmap',
                                          'deleteProduct', 'deleteFeature', 'deleteRequirement', 'deleteRelease', 'deleteRoadmap'];
            
            // Check if user has already confirmed (look for "confirmed" or "yes" in the parameters)
            const isConfirmed = parameters.confirmed === true || 
                               parameters.userConfirmed === true ||
                               (typeof parameters.confirmation === 'string' && 
                                ['yes', 'confirm', 'confirmed', 'proceed'].includes(parameters.confirmation.toLowerCase()));
            
            if (destructiveOperations.includes(functionName) && !isConfirmed) {
              // Return a response asking for confirmation
              const confirmationMessage = {
                success: true,
                requiresConfirmation: true,
                message: `CONFIRMATION_REQUIRED: I need your permission before proceeding. Would you like me to ${getActionDescription(functionName, parameters)}? Please respond with "yes" to confirm or "no" to cancel.`,
                action: functionName,
                parameters,
                instructions: "Ask the user for confirmation before proceeding with this action."
              };
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(confirmationMessage)
              });
            } else {
              // Execute the function (either read-only or confirmed destructive)
              console.log(`[Agent Function] Executing: ${functionName} with args:`, parameters);
              const result = await executeAgentFunction(
                functionName,
                parameters,
                tenantId,
                'skip-logging'
              );
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result)
              });
            }
            
          } catch (error) {
            console.error(`[AI Fully Managed] Function call error:`, error);
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                requiresConfirmation: true
              })
            });
          }
        }
        
        // Submit tool outputs
        await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
          tool_outputs: toolOutputs
        });
        
        console.log(`[AI Fully Managed] Submitted ${toolOutputs.length} tool outputs`);
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

/**
 * Helper Functions for Agent Function Calling
 */

/**
 * Extract operation type from function name
 */
function extractOperationType(functionName: string): string {
  if (functionName.includes('create')) return 'create';
  if (functionName.includes('update')) return 'update';
  if (functionName.includes('delete')) return 'delete';
  if (functionName.includes('list') || functionName.includes('get')) return 'read';
  return 'unknown';
}

/**
 * Extract entity type from function name
 */
function extractEntityType(functionName: string): string {
  if (functionName.includes('product')) return 'product';
  if (functionName.includes('feature')) return 'feature';
  if (functionName.includes('requirement')) return 'requirement';
  if (functionName.includes('release')) return 'release';
  if (functionName.includes('roadmap')) return 'roadmap';
  return 'unknown';
}

/**
 * Check if operation is destructive (requires confirmation)
 */
function isDestructiveOperation(functionName: string): boolean {
  return functionName.includes('delete') || functionName.includes('update');
}

/**
 * Execute agent function call
 */
async function executeAgentFunction(
  functionName: string,
  parameters: any,
  tenantId: string,
  actionId: string
): Promise<any> {
  try {
    console.log(`[Agent Function] Executing ${functionName} with params:`, parameters);
    
    // Validate parameters first
    console.log(`[Agent Function] Validating ${functionName} with parameters:`, parameters);
    const validationResult = validateAgentParams(functionName, parameters);
    if (!validationResult.success) {
      console.error(`[Agent Function] Validation failed for ${functionName}:`, validationResult.error);
      
      // Update action as failed (skip if no action logging)
      if (actionId !== 'skip-logging') {
        await agentActionsService.updateAgentAction(actionId, {
          status: 'failed',
          errorData: validationResult.error,
          completedAt: new Date().toISOString()
        });
      }
      
      return {
        success: false,
        error: validationResult.error?.userMessage || 'Validation failed',
        details: validationResult.error?.fieldErrors || validationResult.error?.message
      };
    }
    console.log(`[Agent Function] Validation passed for ${functionName}`);
    
    
    let result;
    
    // Route to appropriate service method
    switch (functionName) {
      // Product operations
      case 'createProduct':
        result = await agentOperationsService.createProduct(validationResult.data, tenantId);
        break;
      case 'updateProduct':
        result = await agentOperationsService.updateProduct(
          validationResult.data.id,
          validationResult.data,
          tenantId
        );
        break;
      case 'deleteProduct':
        result = await agentOperationsService.deleteProduct(validationResult.data.id, tenantId);
        break;
      case 'listProduct':
        result = await agentOperationsService.listProducts(tenantId);
        break;
      case 'listProducts':
        result = await agentOperationsService.listProducts(tenantId);
        break;
        
      // Feature operations
      case 'createFeature':
        result = await agentOperationsService.createFeature(validationResult.data, tenantId);
        break;
      case 'updateFeature':
        result = await agentOperationsService.updateFeature(
          validationResult.data.id,
          validationResult.data,
          tenantId
        );
        break;
      case 'deleteFeature':
        result = await agentOperationsService.deleteFeature(validationResult.data.id, tenantId);
        break;
      case 'listFeatures':
        result = await agentOperationsService.listFeatures(tenantId, validationResult.data.productId);
      
        break;
        
      // Release operations
      case 'createRelease':
        result = await agentOperationsService.createRelease(validationResult.data, tenantId);
        break;
      case 'updateRelease':
        result = await agentOperationsService.updateRelease(
          validationResult.data.id,
          validationResult.data,
          tenantId
        );
        break;
      case 'deleteRelease':
        result = await agentOperationsService.deleteRelease(validationResult.data.id, tenantId);
        break;
      case 'listReleases':
        result = await agentOperationsService.listReleases(tenantId, validationResult.data.featureId);
        break;
        
      // Roadmap operations
      case 'createRoadmap':
        result = await agentOperationsService.createRoadmap(validationResult.data, tenantId);
        break;
      case 'updateRoadmap':
        result = await agentOperationsService.updateRoadmap(
          validationResult.data.id,
          validationResult.data,
          tenantId
        );
        break;
      case 'deleteRoadmap':
        result = await agentOperationsService.deleteRoadmap(validationResult.data.id, tenantId);
        break;
      case 'listRoadmaps':
        result = await agentOperationsService.listRoadmaps(tenantId, validationResult.data.productId);
        break;
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
    
    // Update action with result (skip if no action logging)
    if (actionId !== 'skip-logging') {
      if (result.success) {
        await agentActionsService.updateAgentAction(actionId, {
          status: 'completed',
          resultData: typeof result.data === 'object' && result.data !== null 
            ? result.data as Record<string, any>
            : { value: result.data },
          completedAt: new Date().toISOString(),
          entityId: (typeof result.data === 'object' && result.data !== null && !Array.isArray(result.data) && 'id' in result.data) 
            ? (result.data as any).id 
            : undefined
        });
      } else {
        await agentActionsService.updateAgentAction(actionId, {
          status: 'failed',
          errorData: result.error,
          completedAt: new Date().toISOString()
        });
      }
    }
    
    // Return result regardless of logging
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully executed ${functionName}`
      };
    } else {
      return {
        success: false,
        error: result.error?.userMessage || 'Operation failed',
        details: result.error?.message || result.error
      };
    }
    
  } catch (error) {
    console.error(`[Agent Function] Error executing ${functionName}:`, error);
    
    // Update action as failed (skip if no action logging)
    if (actionId !== 'skip-logging') {
      await agentActionsService.updateAgentAction(actionId, {
        status: 'failed',
        errorData: {
          type: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        completedAt: new Date().toISOString()
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
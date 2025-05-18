import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiResponse } from '@/utils/api-response';
import { asyncHandler } from '@/utils/api-async-handler';
import { getRequestContext } from '@/utils/api-request-context';

// Initialize OpenAI with API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Define input schemas
const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  tenantId: z.string().optional(),
});

// Handle chat conversations
export const POST = asyncHandler(async (req: NextRequest): Promise<Response | NextResponse> => {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured');
    return apiResponse.error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.', 500);
  }

  const { body, tenantId: contextTenantId } = await getRequestContext(req);
  
  // Validate the body using our schema
  const validatedBody = chatInputSchema.parse(body);
  const { messages, tenantId: bodyTenantId } = validatedBody;
  
  // Use tenant ID from context, fallback to body, then header, then default
  const tenantId = contextTenantId || bodyTenantId || req.headers.get('x-tenant-id') || 'default';
  
  // Simple system prompt (no database lookups needed)
  const systemPrompt = `
    You are a Product Management AI assistant for Speqq.
    You help users with product management tasks, features, and requirements.
    If you don't know the answer, say you don't know.
  `;
  
  // Generate streaming response
  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages,
    temperature: 0.5,
  });
  
  return result.toDataStreamResponse();
});
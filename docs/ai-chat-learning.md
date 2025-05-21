# AI Chat Implementation Learning

This document provides comprehensive information for implementing an AI chat feature in the Speqq Product Management Platform using OpenAI embeddings, Supabase with pgvector, and the Vercel AI SDK.

## Project Overview

The Speqq platform requires an AI Chat assistant that:
- Enables users to query their product management data
- Performs agentic actions to update product information
- Works as a prototype for <100 initial users
- Uses off-the-shelf components with zero custom UI build

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Vercel AI SDK + shadcn/ui
- **State Management**: React Query + Vercel AI SDK
- **Database**: Supabase with pgvector extension
- **Authentication**: NextAuth.js (existing implementation)
- **AI Service**: OpenAI API
- **Styling**: Tailwind CSS only

## OpenAI Embeddings

### What Are Embeddings?

Embeddings are numerical representations of text that capture semantic meaning in vector space. They transform words, phrases, or documents into high-dimensional vectors where semantically similar content appears closer together, enabling:

- Semantic similarity comparisons
- Content classification and clustering
- Information retrieval/search
- Context-aware AI responses

### text-embedding-3-small Specifications

- **Dimensions**: 1536 by default (can be reduced to as few as 256 dimensions with minimal performance loss)
- **Context length**: 8,192 tokens maximum input
- **Performance**: Significant improvement over previous models on MIRACL and MTEB benchmarks
- **Architecture**: Uses Matryoshka Representation Learning (MRL) to encode information
- **Cost**: $0.02 per million tokens (vs. $0.13 for text-embedding-3-large)

### Embedding Implementation

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embedding for a single text
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  
  return response.data[0].embedding;
}

// Generate embeddings for batch processing (more efficient)
async function generateBatchEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts
  });
  
  return response.data.map(item => item.embedding);
}
```

## Supabase pgvector Implementation

### Setting Up pgvector in Supabase

Enable the extension through the Supabase Dashboard or SQL:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### Database Schema

```sql
-- AI embeddings table for RAG
CREATE TABLE ai_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'feature' or 'release'
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages for chat history
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', or 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI sessions for conversation management
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enabling Row-Level Security for Multi-tenancy

```sql
-- Enable RLS on all tables
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY "Tenant isolation for embeddings"
  ON ai_embeddings FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');

CREATE POLICY "Tenant isolation for messages"
  ON ai_messages FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');

CREATE POLICY "Tenant isolation for sessions"
  ON ai_sessions FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');
```

### Performance Optimization with Indexing

```sql
-- Create HNSW index for better vector search performance
CREATE INDEX ON ai_embeddings 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);
```

### Vector Search Function

```sql
-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  tenant_filter uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM ai_embeddings e
  WHERE 
    e.tenant_id = tenant_filter
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### Supabase Service Implementation

```typescript
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './openai-service';
import { Feature, Release } from '@/types/models';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Index a feature for RAG
export async function indexFeature(feature: Feature, tenantId: string) {
  // Create content string from feature data
  const content = `
    Feature: ${feature.name}
    Priority: ${feature.priority}
    Status: ${feature.status}
    Description: ${feature.description}
    Requirements: ${feature.requirements?.join('\n')}
  `;
  
  // Generate embedding
  const embedding = await generateEmbedding(content);
  
  // Store in Supabase
  const { data, error } = await supabase
    .from('ai_embeddings')
    .insert({
      tenant_id: tenantId,
      entity_type: 'feature',
      entity_id: feature.id,
      content,
      embedding,
      metadata: {
        name: feature.name,
        priority: feature.priority,
        status: feature.status
      }
    });
    
  if (error) throw error;
  return data;
}

// Vector search with tenant isolation
export async function searchVectors(query: string, tenantId: string, limit = 5) {
  // Generate embedding for the query
  const embedding = await generateEmbedding(query);
  
  // Search vectors in Supabase
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
    tenant_filter: tenantId
  });
  
  if (error) throw error;
  return data;
}

// Store chat messages
export async function storeChatMessage(userId: string, tenantId: string, role: string, content: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      role,
      content
    })
    .select();
    
  if (error) throw error;
  return data[0];
}

// Get chat history for a user
export async function getChatHistory(userId: string, tenantId: string, limit = 100) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data;
}
```

## Vercel AI SDK Implementation

### Chat UI Component

```tsx
'use client'

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

export function AIChatComponent() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, session } = useAuth();
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/ai-chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi${user?.name ? ' ' + user.name : ''}! What are we building today?`
      }
    ],
    body: {
      tenantId: session?.user?.tenantId,
      userId: user?.id
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-lg font-semibold mb-4">Product Assistant</div>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 mb-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="mt-4 flex space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your products..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
```

### API Route Implementation

```typescript
// src/app/api/ai-chat/route.ts
import { StreamingTextResponse, OpenAIStream } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchVectors, storeChatMessage } from '@/services/ai-service';

const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle indexing request
    if (body.action === 'index') {
      return handleIndexing(req);
    }
    
    // Handle chat request
    const { messages, tenantId: bodyTenantId, userId: bodyUserId } = chatInputSchema.parse(body);
    const tenantId = req.headers.get('x-tenant-id') || bodyTenantId || 'default';
    const userId = bodyUserId || 'anonymous';
    const lastMessage = messages[messages.length - 1];
    
    // Store user message
    if (lastMessage.role === 'user') {
      await storeChatMessage(userId, tenantId, 'user', lastMessage.content);
    }
    
    // Perform vector search
    const searchResults = await searchVectors(lastMessage.content, tenantId, 5);
    
    // Format context from search results
    const context = searchResults
      .map(result => result.content)
      .join('\n\n');
    
    // Prepare system message with context
    const systemMessage = `You are a Product Management AI assistant for Speqq.
You help users manage their products, features, and releases.

When users ask about their data, use the following context to answer accurately:

${context}

If you don't know something, be honest and say you don't know.
For any feature updates, always show the proposed changes and ask for confirmation.`;

    // Generate OpenAI stream
    const response = await openai.chat({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages.map(msg => ({ role: msg.role, content: msg.content }))
      ],
      stream: true,
      temperature: 0.7,
    });

    // Create streaming response
    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        // Store assistant message
        await storeChatMessage(userId, tenantId, 'assistant', completion);
      },
    });
    
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

### Agent Actions / Tool Calling Implementation

For implementing the agent capability to update features:

```typescript
// src/app/api/ai-chat/route.ts (extended with tools)
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { searchVectors, storeChatMessage } from '@/services/ai-service';
import { getFeatureById, updateFeature } from '@/services/features-db';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Parse request and extract context as before
    
    // Define tools for feature updates
    const tools = [
      {
        type: "function",
        function: {
          name: "getFeatureDetails",
          description: "Get detailed information about a specific feature",
          parameters: {
            type: "object",
            properties: {
              featureId: {
                type: "string",
                description: "The ID of the feature to retrieve",
              },
            },
            required: ["featureId"],
          },
        }
      },
      {
        type: "function",
        function: {
          name: "proposeFeatureUpdate",
          description: "Generate a preview of feature updates for user approval",
          parameters: {
            type: "object",
            properties: {
              featureId: {
                type: "string",
                description: "ID of the feature to update",
              },
              updates: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "New name for the feature",
                  },
                  description: {
                    type: "string", 
                    description: "New description for the feature",
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "New priority level",
                  },
                  requirements: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Updated requirements list",
                  },
                },
              },
            },
            required: ["featureId", "updates"],
          },
        }
      },
      {
        type: "function",
        function: {
          name: "applyFeatureUpdate",
          description: "Apply approved feature updates",
          parameters: {
            type: "object",
            properties: {
              featureId: {
                type: "string",
                description: "ID of the feature to update",
              },
              updates: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "New name for the feature",
                  },
                  description: {
                    type: "string", 
                    description: "New description for the feature",
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "New priority level",
                  },
                  requirements: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Updated requirements list",
                  },
                },
              },
              approved: {
                type: "boolean",
                description: "Whether the user has approved these changes",
              },
            },
            required: ["featureId", "updates", "approved"],
          },
        }
      }
    ];

    // Generate OpenAI response with tool capability
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map(msg => ({ role: msg.role, content: msg.content }))
      ],
      tools: tools,
      tool_choice: "auto",
      stream: true,
    });

    // Process the stream and handle tool calls
    const stream = OpenAIStream(response, {
      async experimental_onFunctionCall({ name, arguments: args }) {
        // Handle getFeatureDetails
        if (name === 'getFeatureDetails') {
          const { featureId } = args;
          const feature = await getFeatureById(featureId, tenantId);
          
          return {
            role: 'function',
            name: 'getFeatureDetails',
            content: JSON.stringify(feature),
          }
        }
        
        // Handle proposeFeatureUpdate
        if (name === 'proposeFeatureUpdate') {
          const { featureId, updates } = args;
          const feature = await getFeatureById(featureId, tenantId);
          
          // Format before/after comparison
          const beforeAfter = {
            before: {
              name: feature.name,
              description: feature.description,
              priority: feature.priority,
              requirements: feature.requirements,
            },
            after: {
              name: updates.name || feature.name,
              description: updates.description || feature.description,
              priority: updates.priority || feature.priority,
              requirements: updates.requirements || feature.requirements,
            }
          };
          
          return {
            role: 'function',
            name: 'proposeFeatureUpdate',
            content: JSON.stringify(beforeAfter),
          }
        }
        
        // Handle applyFeatureUpdate
        if (name === 'applyFeatureUpdate') {
          const { featureId, updates, approved } = args;
          
          if (!approved) {
            return {
              role: 'function',
              name: 'applyFeatureUpdate',
              content: JSON.stringify({ success: false, message: 'Changes rejected by user' }),
            }
          }
          
          const result = await updateFeature(featureId, updates, tenantId);
          
          return {
            role: 'function',
            name: 'applyFeatureUpdate',
            content: JSON.stringify({ 
              success: true, 
              message: 'Changes applied successfully',
              updatedFeature: result
            }),
          }
        }
      },
      
      onCompletion: async (completion) => {
        // Store assistant message
        await storeChatMessage(userId, tenantId, 'assistant', completion);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## RAG Implementation Best Practices

### Content Chunking Strategy

1. **Entity-Level Chunking**: Create embeddings for entire features or releases as coherent units
   ```typescript
   // For a feature, include all relevant data in one coherent chunk
   const featureContent = `
     Feature: ${feature.name}
     Priority: ${feature.priority}
     Status: ${feature.status}
     Description: ${feature.description}
     Requirements: ${feature.requirements?.join('\n')}
   `;
   ```

2. **Metadata Attachment**: Include searchable metadata with each embedding
   ```typescript
   const metadata = {
     id: feature.id,
     type: 'feature',
     name: feature.name,
     priority: feature.priority,
     status: feature.status,
     created_at: feature.created_at
   };
   ```

3. **Cross-Entity Relations**: Include related entity information in embeddings
   ```typescript
   // For a release, include associated features
   const releaseContent = `
     Release: ${release.name}
     Target Date: ${release.target_date}
     Description: ${release.description}
     Features:
     ${release.features.map(f => `- ${f.name} (${f.priority})`).join('\n')}
   `;
   ```

### Vector Search Implementation

1. **Hybrid Retrieval**: Combine vector search with metadata filtering
   ```typescript
   export async function enhancedSearch(
     query: string, 
     tenantId: string, 
     filters?: { priority?: string, status?: string }
   ) {
     // Generate embedding
     const embedding = await generateEmbedding(query);
     
     // Build query with metadata filtering
     let rpcParams: any = {
       query_embedding: embedding,
       match_threshold: 0.5,
       match_count: 20, // Get more results initially for filtering
       tenant_filter: tenantId
     };
     
     const { data, error } = await supabase.rpc('match_documents', rpcParams);
     
     if (error) throw error;
     
     // Apply additional metadata filters client-side
     let results = data;
     
     if (filters?.priority) {
       results = results.filter(item => 
         item.metadata?.priority === filters.priority
       );
     }
     
     if (filters?.status) {
       results = results.filter(item => 
         item.metadata?.status === filters.status
       );
     }
     
     // Return top 5 after filtering
     return results.slice(0, 5);
   }
   ```

2. **Re-ranking**: Implement simple re-ranking based on keyword matching
   ```typescript
   function rerank(results, query) {
     const keywords = query.toLowerCase().split(/\s+/);
     
     return results.map(result => {
       // Count keyword matches in content
       const matches = keywords.reduce((count, keyword) => {
         const regex = new RegExp(keyword, 'gi');
         const matchCount = (result.content.match(regex) || []).length;
         return count + matchCount;
       }, 0);
       
       // Adjust similarity score based on keyword matches
       const adjustedScore = result.similarity + (matches * 0.01);
       
       return {
         ...result,
         adjustedScore
       };
     })
     .sort((a, b) => b.adjustedScore - a.adjustedScore);
   }
   ```

## Multi-tenancy Implementation

1. **Backend Tenant Isolation**:
   - Use RLS policies in Supabase for data isolation
   - Extract tenant ID from auth context in middleware
   - Pass tenant ID to all API routes

2. **Frontend Tenant Context**:
   - Pass tenant ID to chat component via auth context
   - Include tenant ID in all API requests

3. **Middleware Implementation**:
   ```typescript
   // src/middleware.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   import { getToken } from 'next-auth/jwt';

   export async function middleware(request: NextRequest) {
     const pathname = request.nextUrl.pathname;
     
     // Only apply to AI chat routes
     if (pathname.startsWith('/api/ai-chat')) {
       // Check authentication
       const token = await getToken({ req: request });
       
       if (!token) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
       
       // Add tenant header
       const requestHeaders = new Headers(request.headers);
       requestHeaders.set('x-tenant-id', token.currentTenant || 'default');
       
       return NextResponse.next({
         request: {
           headers: requestHeaders,
         },
       });
     }
     
     return NextResponse.next();
   }
   ```

## Performance Optimization

1. **Efficient Embedding Generation**:
   - Batch inputs when generating embeddings
   - Cache embeddings to reduce API calls
   - Process entity updates asynchronously

2. **Database Optimization**:
   - Use proper indexing (HNSW for pgvector)
   - Implement query caching for frequent searches
   - Use connection pooling for Supabase

3. **Response Streaming**:
   - Stream AI responses for better UX
   - Implement proper loading states
   - Handle network interruptions gracefully

## Security Considerations

1. **Authentication & Authorization**:
   - Validate user authentication for all AI routes
   - Implement proper tenant isolation
   - Set appropriate rate limits

2. **Data Privacy**:
   - Store chat history with proper tenant isolation
   - Implement message retention policies
   - Ensure embeddings are properly secured

3. **API Security**:
   - Secure environment variables
   - Implement proper error handling
   - Validate all inputs with zod schemas

## Testing & Monitoring

1. **Integration Testing**:
   - Test vector search functionality
   - Verify tenant isolation
   - Check streaming response behavior

2. **Performance Monitoring**:
   - Track API response times
   - Monitor token usage
   - Set up alerts for abnormal patterns

3. **User Feedback**:
   - Implement feedback mechanisms
   - Track user engagement metrics
   - Collect improvement suggestions

## Implementation Steps

1. **Environment Setup**:
   - Install required dependencies
   - Configure environment variables
   - Set up Supabase project

2. **Database Configuration**:
   - Enable pgvector extension
   - Create required tables
   - Implement RLS policies

3. **Backend Implementation**:
   - Create AI service functions
   - Implement API routes
   - Set up middleware

4. **Frontend Integration**:
   - Implement chat UI component
   - Create custom hooks
   - Integrate with authentication

5. **Testing & Refinement**:
   - Test all functionality
   - Optimize performance
   - Gather initial feedback

## Future Enhancements

- **Conversation Management**: Support multiple conversations per user
- **Enhanced RAG**: Implement more sophisticated retrieval techniques
- **Extended Agent Capabilities**: Add support for additional entities
- **Analytics & Insights**: Track usage patterns and improve responses
- **Custom UI Components**: Develop specialized UI elements for product management
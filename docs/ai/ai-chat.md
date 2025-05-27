# AI Chat for Speqq

## Implementation Background

This document provides a comprehensive guide for implementing the AI Chat feature in Speqq, a product management platform. The implementation follows a Retrieval-Augmented Generation (RAG) architecture using OpenAI embeddings, Supabase with pgvector, and the Vercel AI SDK.

### RAG Architecture Overview

RAG (Retrieval-Augmented Generation) combines the knowledge retrieval capabilities of vector databases with the generative capabilities of large language models (LLMs). This architecture:

1. **Indexes data**: Converts product data (features, releases) into vector embeddings
2. **Performs vector search**: Matches user queries against stored embeddings
3. **Enhances context**: Feeds relevant retrieved context to the LLM
4. **Generates responses**: Uses the LLM to generate accurate responses with the retrieved context

This approach enables the AI to access specific product data that otherwise wouldn't be in its general knowledge.

### Key Technologies

- **OpenAI embeddings**: text-embedding-3-small provides high-quality 1536-dimension embeddings
- **Supabase pgvector**: Stores and queries vector embeddings using PostgreSQL
- **Vercel AI SDK**: Provides streaming, function calling, and UI components 
- **Next.js API Routes**: Implements API endpoints with tenant isolation
- **Function Calling**: Enables agent capabilities for feature updates

### Multi-tenancy Implementation

This feature operates in a multi-tenant environment where:
- Each tenant has access only to their own data
- Embeddings are segregated by tenant_id
- Row-Level Security (RLS) in Supabase enforces tenant isolation
- Authentication headers pass tenant context to all operations

### Agent Capabilities Flow

The feature update workflow follows this pattern:
1. User requests a feature update via natural language
2. LLM calls `getFeatureDetails` to retrieve current state
3. LLM calls `proposeFeatureUpdate` to show a preview
4. User confirms or rejects the proposed changes
5. If confirmed, LLM calls `applyFeatureUpdate` to execute
6. After update, feature is re-indexed to update embeddings

## Objective

Add an Prototype AI Chat assistant to Speqq that understands product management context and provides intelligent responses based on the user's product data.

## About
- AI Chat is a product within Speqq to afford users the ability to 
  - Query data about their product and answer questions about products
  - Make agentic action to update/improve their product data
- We are making a prototype version within Speqq to test value
- The prototype version of AI Chat is to make a simple AI Chat with basic query and agent action
- The AI chat will be a zero custom build and use off the shelf components

## Current State

The current implementation has:

1. **Basic Vercel AI SDK integration:**
   - Uses `useChat` hook from `ai/react` for frontend state management
   - Implements streaming responses via the OpenAI SDK
   - Has a working UI component with proper styling and error handling
   - Includes a data indexing button (non-functional)

2. **Simplified API route:**
   - Follows project API best practices (uses `asyncHandler`, `apiResponse`, etc.)
   - Handles tenant isolation via context extraction
   - Contains a basic system prompt for product management
   - No database/vector operations implemented yet

3. **Features that can be reused:**
   - The entire UI component structure (`AIChatComponent`)
   - The `useAIChat` hook implementation (needs minimal updates)
   - The API route structure and error handling
   - The authentication/tenant context handling

4. **Features that need implementation:**
   - Supabase pgvector integration for embeddings
   - RAG functionality with vector search
   - Chat history persistence
   - Message context handling
   - Data indexing functionality
   - Function calling for agent capabilities

## Functional Requirements

### Core Chat Functionality

1. **Conversation Management**
   - User has single persistent chat conversation
   - System displays timestamp for each message
   - Chat history persists between user sessions
   - System shows typing indicators when AI is responding
   - System maintains conversation history

2. **Context Awareness**
   - Chat system maintains context within a conversation session
   - System can reference earlier messages in the same conversation
   - System can access and query the user's product, feature, and requirement data
   - System respects tenant boundaries - only accesses data within user's tenant

3. **Initial Greeting**
   - System greets new users with "What are we building today {user.name}?" using authenticated user's name
   - System persists chat session when user logs out and back in

4. **Query Capability**
   - User queries Features and Releases using natural language
   - Queryable fields for Features:
     - Name
     - Priority
     - Description
     - Requirements
     - Status
     - Created/Updated dates
   - Queryable fields for Releases:
     - Name
     - Description
     - Target date
     - Associated Features
   - System returns formatted, readable results

5. **Agent Capability**
   - Agent updates Features only (not Releases for prototype)
   - Updatable fields:
     - Name
     - Priority
     - Description
     - Requirements
   - User workflow:
     - System shows before/after preview
     - User explicitly approves or rejects changes
     - System confirms when changes are applied
     - Agent provides change confirmation after updates are applied

### Data Access & Permissions

6. **Product Data Integration**
   - Chat can query and retrieve information about Features and Releases only
   - System provides basic summaries of data
   - System respects multi-tenancy - only accesses data within user's tenant

7. **User Privacy**
   - Chat history stored per user
   - Each user's chat history is private and isolated
   - Conversations are not accessible by other users

### User Experience

8. **Error Handling**
   - System provides clear error feedback to users
   - System maintains conversation state even if errors occur

9. **Prototype Scope**
   - Single conversation per user
   - No conversation management features
   - Limited to Features and Releases entities
   - No advanced analytics or insights

## Technical Requirements

### Architecture Overview
1. **System Architecture**
   - Client: Next.js App Router with React components
   - API: Next.js API Routes with streaming responses
   - Database: Supabase with pgvector extension
   - AI Service: OpenAI API
   - State Management: Vercel AI SDK for chat state 

2. **Platform Integration Requirements**
   - **Authentication**: Must integrate with existing NextAuth.js middleware
     - Extract user ID from auth session
     - Extract tenant ID from auth context
     - Pass auth headers to AI endpoints
   - **Database**: Use Supabase with pgvector
     - Add AI-specific tables for chat history and embeddings
     - Maintain tenant isolation for embeddings and chat history
     - Leverage Supabase RLS for data security
   - **Middleware**: Leverage existing middleware stack
     - Use existing tenant isolation middleware
     - Apply rate limiting via existing middleware
     - Utilize auth validation middleware for all AI routes
   - **Services**: Integrate with existing service layer
     - Access Features and Releases via existing services
     - Use existing tenant utilities for data isolation
     - Leverage existing query patterns and interfaces

### Core Technology Stack
2. **Required Technologies**
   - **Frontend**: 
     - Vercel AI SDK UI components (zero custom build)
     - React 18+ with TypeScript
     - Tailwind CSS for styling
   - **Backend**:
     - Next.js 14+ App Router
     - OpenAI API SDK
     - Supabase with pgvector
   - **Authentication**: 
     - NextAuth.js (existing implementation)
   - **Database**:
     - Supabase with pgvector extension

### Database Schema
3. **Required Tables**
   - **ai_embeddings**:
     - id (UUID PRIMARY KEY)
     - tenant_id (UUID NOT NULL)
     - entity_type (TEXT NOT NULL) - 'feature' | 'release'
     - entity_id (UUID NOT NULL)
     - content (TEXT NOT NULL)
     - embedding (vector(1536) NOT NULL)
     - metadata (JSONB)
     - created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
   
   - **ai_messages**:
     - id (UUID PRIMARY KEY)
     - user_id (UUID NOT NULL)
     - tenant_id (UUID NOT NULL)
     - role (TEXT NOT NULL) - 'user' | 'assistant' | 'system' | 'function'
     - content (TEXT NOT NULL)
     - created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
   
   - **ai_sessions**:
     - id (UUID PRIMARY KEY)
     - user_id (UUID NOT NULL)
     - tenant_id (UUID NOT NULL)
     - last_activity (TIMESTAMP WITH TIME ZONE)
     - created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())

### API Implementation
4. **API Endpoints**
   - `POST /api/ai-chat`: Main chat endpoint
     - Accepts messages array
     - Returns streaming response
     - Handles tenant isolation
     - Supports function calling for agent actions
   - `POST /api/ai-chat` with action=index: Data indexing endpoint
     - Indexes Features and Releases for RAG
     - Generates embeddings for searchable content
     - Uses batch processing for efficiency

### Data Processing
5. **RAG Implementation**
   - **Indexing Requirements**:
     - Index Features: name, description, requirements, priority, status
     - Index Releases: name, description, target date, associated features
     - Generate embeddings using OpenAI text-embedding-3-small
     - Store embeddings with tenant isolation using Supabase RLS
     - Support batch embedding generation for efficiency
   
   - **Search Requirements**:
     - Vector similarity search limited to user's tenant
     - Return top 5 most relevant documents
     - Implement hybrid search (vector + metadata filtering)
     - Include basic re-ranking for keyword relevance
     - Include metadata for context

### Security Requirements
6. **Authentication & Authorization**
   - All requests must include valid auth token
   - Tenant ID extracted from auth context
   - User ID required for message attribution
   - API rate limiting: 60 requests per minute per user

### Performance Requirements
7. **Response Times**
   - Chat responses must stream within 500ms
   - Vector search must complete within 200ms
   - Message history load within 100ms
   - Maximum 100 messages per conversation (prototype limit)

### Integration Requirements
8. **Component Integration**
   - Use existing UI component which already handles:
     - Message display
     - Input field
     - Loading states
     - Error handling
     - Data indexing button  
   - No UI changes needed beyond connecting to backend functionality

### Error Handling
9. **Technical Error Management**
   - Graceful OpenAI API failure handling
   - Database connection error recovery
   - Invalid request validation with zod schemas
   - Consistent error response format using apiResponse utilities

### Deployment Requirements
10. **Environment Configuration**
    - OPENAI_API_KEY environment variable (already configured)
    - Existing auth configuration
    - Supabase connection details
    - Enable pgvector extension in Supabase

### Prototype Constraints
11. **Technical Limitations**
    - Single conversation per user (no conversation management)
    - Basic UI using Vercel AI SDK components only
    - No custom styling beyond Tailwind utilities
    - Limited to 1536-dimension embeddings
    - No real-time collaboration features 

## Implementation Steps

### Step 1: Environment Setup

1. **Install Dependencies**
```bash
npm install @supabase/supabase-js uuid
```
Note: `ai` and `@ai-sdk/openai` are already installed.

2. **Configure Environment Variables**
```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
Note: `OPENAI_API_KEY` is already configured.

### Step 2: Database and Services

1. **Set up pgvector in Supabase**

Run this SQL in the Supabase SQL editor:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE ai_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their tenant's embeddings"
  ON ai_embeddings FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');

CREATE POLICY "Users can only access their tenant's messages"
  ON ai_messages FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');

CREATE POLICY "Users can only access their tenant's sessions"
  ON ai_sessions FOR ALL
  USING (tenant_id = auth.jwt() -> 'tenant_id');

-- Create HNSW index for faster vector search with better recall
CREATE INDEX ON ai_embeddings 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);
```

2. **Create AI Service** (`src/services/ai-service.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { Feature, Release } from '@/types/models';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export type VectorSearchResult = {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
};

// Generate embeddings using OpenAI
export async function generateEmbedding(text: string) {
  const embedResponse = await openai.embeddings({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return embedResponse.data[0].embedding;
}

// Generate embeddings for batch processing (more efficient)
export async function generateBatchEmbeddings(texts: string[]) {
  const embedResponse = await openai.embeddings({
    model: 'text-embedding-3-small',
    input: texts,
  });
  
  return embedResponse.data.map(item => item.embedding);
}

// Create embeddings for features
export async function indexFeature(feature: Feature, tenantId: string) {
  // Prepare content for embedding with better structured format
  const content = `
    Feature: ${feature.name}
    Priority: ${feature.priority}
    Status: ${feature.status}
    Description: ${feature.description}
    Requirements: ${feature.requirements?.join('\n')}
  `;
  
  const embedding = await generateEmbedding(content);
  
  // Store in Supabase with detailed metadata
  const { data, error } = await supabase
    .from('ai_embeddings')
    .insert({
      tenant_id: tenantId,
      entity_type: 'feature',
      entity_id: feature.id,
      content,
      embedding,
      metadata: {
        id: feature.id,
        name: feature.name,
        priority: feature.priority,
        status: feature.status,
        created_at: feature.createdAt,
        updated_at: feature.updatedAt
      }
    });
    
  if (error) throw error;
  return data;
}

// Create embeddings for releases with associated features
export async function indexRelease(release: Release, tenantId: string) {
  // Prepare content for embedding
  const content = `
    Release: ${release.name}
    Target Date: ${release.targetDate}
    Description: ${release.description}
    Features: ${release.features?.map(f => `- ${f.name} (${f.priority})`).join('\n')}
  `;
  
  const embedding = await generateEmbedding(content);
  
  // Store in Supabase with better metadata
  const { data, error } = await supabase
    .from('ai_embeddings')
    .insert({
      tenant_id: tenantId,
      entity_type: 'release',
      entity_id: release.id,
      content,
      embedding,
      metadata: {
        id: release.id,
        name: release.name,
        targetDate: release.targetDate,
        featureCount: release.features?.length || 0,
        features: release.features?.map(f => ({ id: f.id, name: f.name }))
      }
    });
    
  if (error) throw error;
  return data;
}

// Vector search with tenant isolation and hybrid filtering
export async function searchVectors(
  query: string, 
  tenantId: string, 
  filters?: { priority?: string, status?: string, entityType?: string },
  limit = 5
): Promise<VectorSearchResult[]> {
  // Generate embedding for the query
  const embedding = await generateEmbedding(query);
  
  // Search vectors in Supabase
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 20, // Get more results initially for filtering
    tenant_filter: tenantId
  });
  
  if (error) throw error;
  
  // Apply metadata filtering
  let results = data;
  
  if (filters?.entityType) {
    results = results.filter(item => 
      item.metadata?.entity_type === filters.entityType
    );
  }
  
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
  
  // Simple re-ranking based on keyword matching
  const keywords = query.toLowerCase().split(/\s+/);
  results = results.map(result => {
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
      similarity: adjustedScore
    };
  })
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);
  
  return results;
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

### Step 3: Create Vector Search Function in Supabase

Create this stored procedure in your Supabase project:

```sql
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

### Step 4: Update the API Route

Update the API route (`src/app/api/ai-chat/route.ts`) to integrate RAG and function calling:

```typescript
import { StreamingTextResponse, OpenAIStream } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiResponse } from '@/utils/api-response';
import { asyncHandler } from '@/utils/api-async-handler';
import { getRequestContext } from '@/utils/api-request-context';
import { searchVectors, storeChatMessage, indexFeature, indexRelease } from '@/services/ai-service';
import { getFeaturesFromDb, getFeatureById, updateFeature } from '@/services/features-db';
import { getReleasesFromDb } from '@/services/releases-db';

// Initialize OpenAI with API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Define input schemas
const chatInputSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system', 'function']),
      content: z.string(),
      name: z.string().optional(),
    })
  ),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['chat', 'index']).optional().default('chat'),
});

// Define the tools for feature updates
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

// Handle chat conversations
export const POST = asyncHandler(async (req: NextRequest): Promise<Response | NextResponse> => {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured');
    return apiResponse.error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.', 500);
  }

  const { body, tenantId: contextTenantId, userId } = await getRequestContext(req);
  
  // Validate the body using our schema
  const validatedBody = chatInputSchema.parse(body);
  const { messages, tenantId: bodyTenantId, action, userId: bodyUserId } = validatedBody;
  
  // Use tenant ID from context, fallback to body, then default
  const tenantId = contextTenantId || bodyTenantId || 'default';
  const userIdForMessages = userId || bodyUserId || 'anonymous';
  
  // Handle indexing request
  if (action === 'index') {
    return await handleIndexing(tenantId);
  }
  
  // Store user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === 'user') {
    await storeChatMessage(userIdForMessages, tenantId, 'user', lastMessage.content);
  }
  
  // Perform vector search for context
  const searchResults = await searchVectors(lastMessage.content, tenantId);
  
  // Format context from search results
  const context = searchResults
    .map(result => result.content)
    .join('\n\n');
  
  // Enhanced system prompt with context
  const systemPrompt = `
    You are a Product Management AI assistant for Speqq.
    You help users manage their products, features, and releases.
    
    When users ask about their data, use the following context to answer accurately:
    
    ${context || 'No specific product data found for this query.'}
    
    If you don't know something or can't find it in the context, be honest and say you don't know.
    
    When a user wants to update a feature:
    1. Use getFeatureDetails to retrieve current data
    2. Use proposeFeatureUpdate to show a preview of changes
    3. Ask the user to confirm or reject the changes
    4. Use applyFeatureUpdate to apply confirmed changes
    
    Always maintain a professional, helpful tone and provide concise, actionable answers.
  `;
  
  // Generate OpenAI response with function calling
  const response = await openai.chat({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    tools: tools,
    stream: true,
    temperature: 0.7,
  });
  
  // Create streaming response with function calling and message storage callback
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
            content: JSON.stringify({ 
              success: false, 
              message: 'Changes were not applied as they were rejected by the user' 
            }),
          }
        }
        
        const result = await updateFeature(featureId, updates, tenantId);
        
        // Re-index the feature after update
        await indexFeature(result, tenantId);
        
        return {
          role: 'function',
          name: 'applyFeatureUpdate',
          content: JSON.stringify({ 
            success: true, 
            message: 'Feature updated successfully',
            updatedFeature: result
          }),
        }
      }
    },
    
    onCompletion: async (completion) => {
      // Store assistant message
      await storeChatMessage(userIdForMessages, tenantId, 'assistant', completion);
    },
  });
  
  return new StreamingTextResponse(stream);
});

// Handle data indexing
async function handleIndexing(tenantId: string): Promise<NextResponse> {
  try {
    // Get all features and releases for this tenant
    const features = await getFeaturesFromDb({ tenantId });
    const releases = await getReleasesFromDb({ tenantId });
    
    let indexedCount = 0;
    let errors = [];
    
    // Index features in batches of 10
    if (features && Array.isArray(features)) {
      for (let i = 0; i < features.length; i += 10) {
        const batch = features.slice(i, i + 10);
        await Promise.all(batch.map(async (feature) => {
          try {
            await indexFeature(feature, tenantId);
            indexedCount++;
          } catch (error) {
            console.error(`Error indexing feature ${feature.id}:`, error);
            errors.push(`Feature ${feature.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));
      }
    }
    
    // Index releases in batches of 10
    if (releases && Array.isArray(releases)) {
      for (let i = 0; i < releases.length; i += 10) {
        const batch = releases.slice(i, i + 10);
        await Promise.all(batch.map(async (release) => {
          try {
            await indexRelease(release, tenantId);
            indexedCount++;
          } catch (error) {
            console.error(`Error indexing release ${release.id}:`, error);
            errors.push(`Release ${release.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));
      }
    }
    
    return NextResponse.json({
      success: true,
      indexed: indexedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Indexing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to index data',
      },
      { status: 500 }
    );
  }
}
```

### Step 5: No UI Changes Needed

The existing UI component already has all the required functionality:

- Chat messages display
- Input field
- Loading indicators
- Error handling
- Data indexing button

No changes are required to the UI as it's already well-designed and includes the necessary features.

## Testing the Implementation

1. **Test Vector Search**
```bash
curl -X POST "https://your-supabase-project.supabase.co/rest/v1/rpc/match_documents" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "query_embedding": [0.1, 0.2, ...], "match_threshold": 0.5, "match_count": 5, "tenant_filter": "tenant-uuid" }'
```

2. **Test API Endpoint**
```bash
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-uuid" \
  -d '{
    "messages": [
      {"id": "1", "role": "user", "content": "Show me my highest priority features"}
    ],
    "userId": "user-uuid"
  }'
```

3. **Test Indexing**
```bash
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-uuid" \
  -d '{
    "action": "index",
    "tenantId": "tenant-uuid"
  }'
```

4. **Test Feature Update Flow**
```bash
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-uuid" \
  -d '{
    "messages": [
      {"id": "1", "role": "user", "content": "Update the priority of feature xyz123 to high"}
    ],
    "userId": "user-uuid"
  }'
```

5. **Test UI Integration**
- Navigate to your dashboard
- Open the right sidebar
- Click on the Chat tab
- Click the "Index Data" button
- Try sending a message about your features
- Try asking to update a feature

## Performance Optimization

1. **Batch Processing**
   - Features and releases are indexed in batches of 10 items
   - Embeddings are generated in batches when possible
   - Vector operations use the HNSW index for faster similarity search

2. **Caching Strategies**
   - Implement browser caching for conversation history
   - Use staleTime in React Query for frequently accessed data
   - Consider implementing server-side caching for common queries

3. **Efficient Reindexing**
   - Only reindex features after they've been updated
   - Use incremental indexing for new data
   - Consider scheduled background indexing for large datasets

## Best Practices

### Error Handling
- Always wrap API calls in try-catch blocks
- Return consistent error responses using `apiResponse` utilities
- Log errors for debugging with appropriate context

### Type Safety
- Use TypeScript interfaces for all data structures
- Validate inputs with zod schemas
- Avoid `any` types especially for function arguments and return types

### Performance
- Limit vector search results
- Use streaming responses for chat
- Implement batch processing for embedding generation
- Use HNSW indexing for better performance (over IVFFlat)

### Security
- Use Supabase RLS policies for tenant isolation
- Validate tenant access in middleware
- Sanitize user inputs
- Rate limit API requests
- Apply proper input validation

## Production Checklist

- [ ] Environment variables configured
- [ ] pgvector extension enabled in Supabase
- [ ] Database tables and RLS policies created
- [ ] HNSW index created for ai_embeddings
- [ ] Vector search function implemented
- [ ] API endpoints tested
- [ ] Function calling tested with feature updates
- [ ] Batch indexing tested with large datasets
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Performance optimized

## Future Enhancements

- Conversation management for multiple conversations
- Advanced hybrid search with keyword boosting
- Metadata-based filtering options in UI
- Batch embedding update scheduler
- Streaming function calling results
- Expanded agent capabilities for other entity types
- Analytics for tracking chat usage and performance
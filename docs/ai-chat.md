# AI Chat for Speqq

## Objective

Add an Prototype AI Chat assistant to Speqq that understands product management context and provides intelligent responses based on the user's product data.

## About
- AI Chat is an product within Speqq to afford users the ability to 
  - Query data about their product and answer questions about products
  - Make agentic action to upate/improve their prodcut data.
- We are making a prototype version within Speqq to test value
- The prototype version of AI Chat is to make a simple AI Chat with basic query and agent action
- The AI chat will be a zero custom build and use off the shelf component 

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
   - Database: SQLite with vector extension (sqlite-vec)
   - AI Service: OpenAI API for embeddings and chat completions
   - State Management: Vercel AI SDK for chat state

2. **Platform Integration Requirements**
   - **Authentication**: Must integrate with existing NextAuth.js middleware
     - Extract user ID from auth session
     - Extract tenant ID from auth context
     - Pass auth headers to AI endpoints
   - **Database**: Extend existing SQLite database
     - Add AI-specific tables alongside existing entities
     - Maintain foreign key relationships with existing tables
     - Share the same database connection via db.server.ts
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
     - sqlite-vec for vector search
   - **Authentication**: 
     - NextAuth.js (existing implementation)
   - **Database**:
     - SQLite (existing)
     - Better-sqlite3 driver

### Database Schema
3. **Required Tables**
   - **ai_messages**:
     - id (TEXT PRIMARY KEY)
     - user_id (TEXT NOT NULL)
     - tenant_id (TEXT NOT NULL)
     - role (TEXT: 'user' | 'assistant' | 'system')
     - content (TEXT NOT NULL)
     - created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
   
   - **ai_sessions**:
     - id (TEXT PRIMARY KEY)
     - user_id (TEXT NOT NULL)
     - tenant_id (TEXT NOT NULL)
     - last_activity (DATETIME)
     - created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
   
   - **ai_vectors** (virtual table):
     - embedding (FLOAT[1536])
   
   - **ai_vectors_metadata**:
     - rowid (INTEGER PRIMARY KEY)
     - tenant_id (TEXT NOT NULL)
     - entity_type (TEXT)
     - entity_id (TEXT)

### API Implementation
4. **API Endpoints**
   - `POST /api/ai-chat`: Main chat endpoint
     - Accepts messages array
     - Returns streaming response
     - Handles tenant isolation
   - `POST /api/ai-index`: Data indexing endpoint
     - Indexes Features and Releases for RAG
     - Generates embeddings for searchable content

### Data Processing
5. **RAG Implementation**
   - **Indexing Requirements**:
     - Index Features: name, description, requirements, priority, status
     - Index Releases: name, description, target date, associated features
     - Generate embeddings using OpenAI text-embedding-3-small
     - Store embeddings with tenant isolation
   
   - **Search Requirements**:
     - Vector similarity search limited to user's tenant
     - Return top 5 most relevant documents
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
   - Use Vercel AI SDK's `<AIChat>` component
   - Pass authentication context to chat body
   - Configure streaming responses
   - Implement typing indicators

### Error Handling
9. **Technical Error Management**
   - Graceful OpenAI API failure handling
   - Database connection error recovery
   - Invalid request validation
   - Consistent error response format

### Deployment Requirements
10. **Environment Configuration**
    - OPENAI_API_KEY environment variable
    - Existing auth configuration
    - Database initialization scripts
    - Vector extension setup

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
npm install ai @ai-sdk/openai uuid sqlite-vec
```

2. **Configure Environment Variables**
```
# .env.local
OPENAI_API_KEY=your-api-key
```

### Step 2: Database and Services

1. **Create AI Database Service** (`src/services/ai-db.ts`)
```typescript
import { getDb } from './db.server';

export function initializeAITables() {
  const db = getDb();
  
  // AI documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_documents (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      metadata TEXT,
      tenant_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function initializeVectorDatabase() {
  const db = getDb();
  const sqliteVec = require('sqlite-vec');
  sqliteVec.load(db);
  
  // Vector table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ai_vectors USING vec0(
      embedding FLOAT[1536]
    );
    
    CREATE TABLE IF NOT EXISTS ai_vectors_metadata (
      rowid INTEGER PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      FOREIGN KEY (rowid) REFERENCES ai_vectors(rowid)
    );
  `);
}
```

2. **Create Initialization Script** (`scripts/init-ai-db.ts`)
```typescript
import { initializeAITables, initializeVectorDatabase } from '../src/services/ai-db';

async function initializeAIChat() {
  try {
    initializeAITables();
    console.log('✓ AI tables created');
    
    initializeVectorDatabase();
    console.log('✓ Vector database initialized');
  } catch (error) {
    console.error('Failed to initialize AI database:', error);
    process.exit(1);
  }
}

initializeAIChat();
```

3. **Run Database Initialization**
```bash
npx tsx scripts/init-ai-db.ts
```

### Step 3: Create Hook

Create the AI chat hook (`src/hooks/use-ai-chat.ts`):
```typescript
'use client'

import { useAIState } from 'ai/react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface AIState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (event: SubmitEvent) => void;
  isLoading: boolean;
  error?: Error | null;
}

export function useAIChat(): AIState {
  return useAIState();
}
```

### Step 4: Create API Route

Create the chat API (`src/app/api/ai-chat/route.ts`):
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/services/db.server';
import { v4 as uuid } from 'uuid';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle indexing request
    if (body.action === 'index') {
      return handleIndexing(req);
    }
    
    // Handle chat request
    const { messages, tenantId: bodyTenantId } = chatInputSchema.parse(body);
    const tenantId = req.headers.get('x-tenant-id') || bodyTenantId || 'default';
    const lastMessage = messages[messages.length - 1];
    
    // Generate embedding
    const embedAPI = openai.embedding('text-embedding-3-small');
    const embeddingResponse = await embedAPI.doEmbed({
      input: lastMessage.content,
    });
    
    const queryEmbedding = new Float32Array(embeddingResponse.embedding);
    const db = getDb();
    
    // Perform vector search
    const relevantDocs = db.prepare(`
      SELECT 
        d.id, d.content, d.metadata,
        vec_distance(v.embedding, ?) as distance
      FROM 
        ai_vectors AS v
      JOIN 
        ai_vectors_metadata AS vm ON v.rowid = vm.rowid
      JOIN 
        ai_documents AS d ON v.rowid = d.id
      WHERE 
        vm.tenant_id = ?
      ORDER BY 
        distance
      LIMIT 5
    `).all(queryEmbedding.buffer, tenantId);
    
    // Format context
    const context = relevantDocs
      .map((doc: any) => doc.content)
      .join('\n\n');
    
    // Generate response
    const result = await streamText({
      model: openai('gpt-4o'),
      system: `You are a Product Management AI assistant for Speqq.
Use the following context to answer the user's question:

Context: ${context}`,
      messages: messages,
      temperature: 0.5,
    });
    
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('AI Chat API error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function handleIndexing(req: NextRequest): Promise<NextResponse> {
  const tenantId = req.headers.get('x-tenant-id') || 'default';
  // Simple indexing implementation (add your product/feature indexing logic here)
  
  return NextResponse.json({
    success: true,
    indexed: 0,
  });
}
```

### Step 5: Create Components

1. **Chat Component** (`src/components/ai-chat/index.tsx`)
```tsx
'use client'

import { AIChat } from 'ai/react';
import { useAuth } from '@/hooks/use-auth';

export function AIChatComponent() {
  const { user, session } = useAuth();
  
  const chatBody = {
    tenantId: session?.user?.tenantId || 'default',
    userId: user?.id,
  };
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white/90 mb-4">PM Assistant</h2>
      <AIChat
        api="/api/ai-chat"
        id={user?.id || 'anonymous'}
        initialMessages={[
          {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your Product Management Assistant. How can I help you today?"
          }
        ]}
        body={chatBody}
        className="h-full text-white/70 text-sm"
      />
    </div>
  );
}
```

2. **Update Right Sidebar** (`src/components/rightsidebar/right-sidebar.tsx`)
```tsx
// Add import
import { AIChatComponent } from '@/components/ai-chat';

// In the content panel section:
{activeRightTab === 'chat' && (
  <AIChatComponent />
)}
```

3. **Update Middleware** (`src/middleware.ts`)
```typescript
// Add before the final return statement:
if (pathname.startsWith('/api/ai-chat')) {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', token.currentTenant || 'default');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

## Best Practices

### Error Handling
- Always wrap API calls in try-catch blocks
- Return consistent error responses
- Log errors for debugging

### Type Safety
- Use TypeScript interfaces for all data structures
- Validate inputs with zod schemas
- Avoid `any` types

### Performance
- Limit vector search results
- Use streaming responses for chat
- Cache frequently accessed data

### Security
- Validate tenant access
- Sanitize user inputs
- Rate limit API requests

## Testing the Implementation

1. **Test Database Setup**
```bash
npx tsx scripts/init-ai-db.ts
```

2. **Test API Endpoint**
```bash
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -d '{
    "messages": [
      {"id": "1", "role": "user", "content": "Hello"}
    ]
  }'
```

3. **Test UI Integration**
- Navigate to your dashboard
- Open the right sidebar
- Click on the Chat tab
- Try sending a message

## Production Checklist

- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Vector database initialized
- [ ] API endpoints tested
- [ ] UI components integrated
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Performance optimized

## Common Issues and Solutions

1. **Embedding Errors**
   - Check OpenAI API key
   - Verify API rate limits
   - Handle empty responses

2. **Database Issues**
   - Ensure sqlite-vec is loaded
   - Check table permissions
   - Verify foreign key constraints

3. **UI Integration**
   - Check auth context availability
   - Verify component imports
   - Test responsive behavior

## Future Enhancements

- Batch embedding generation
- Caching layer for common queries
- Advanced RAG with metadata filtering
- Custom prompt templates
- Conversation history persistence

 1. Conversation Management
    - User can have up to 1 chat
    - User can create new chat conversations 
    - User can access and resume conversations
    - User can delete old conversations
    - Conversations are named  `"Chat `
    - System displays timestamp for each message
    - System shows typing indicators when AI is responding

  2. Context Awareness
    - Chat system maintains context within a conversation session
    - System can reference earlier messages in the same conversation
    - System can access and query the user's product, feature, and requirement data
    - System respects tenant boundaries - only accesses data within user's tenant
  3. Initial Greeting & Onboarding
    - System greets new users with "What are we building today?" as specified
    - System provides helpful examples of what users can ask about
    - System offers guided prompts for common tasks
 Agent
 -       - System provides undo/rollback capability

### Data Access & Permissions

  4. Product Data Integration
    - Chat can query and retrieve information about products, features, requirements
    - Chat can provide insights based on relationships between entities
    - Chat can generate summaries of product status and progress
    - Chat respects multi-tenancy - only accesses data within user's tenant
  5. User Privacy
    - Each user's chat history is private and isolated
    - Conversations are stored per-user and not accessible by other users
    - Admin users cannot view other users' chat histories

  Agent Capabilities

  6. Agentic Actions (mentioned in About section)
    - System can suggest updates to product data
    - System can create drafts of new requirements or features
    - System requires user confirmation before making any data changes
    - System provides preview of proposed changes

  User Experience

  7. Error Handling
    - System gracefully handles failed requests
    - System provides helpful error messages to users
    - System maintains conversation state even if errors occur
  8. Performance
    - Chat responses stream in real-time for better UX
    - System handles long conversations without degradation
    - Previous messages load quickly when resuming conversations
  9. Search & Navigation
    - User can search through their chat history
    - User can filter conversations by date or topic
    - System provides quick access to recent conversations

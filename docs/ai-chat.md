# AI Chat for Speqq

## Objective
Add an AI Chat assistant to Speqq that understands product management context and provides intelligent responses based on the user's product data.

## About
An AI assistant that can answer questions about products, generate documents, and provide insights using Retrieval Augmented Generation (RAG) to understand context.

## Tech Stack
- **Vercel AI SDK**: Chat UI and state management
- **OpenAI API**: Embeddings and chat completions
- **sqlite-vec**: Vector database for RAG
- **Next.js**: API routes and middleware
- **SQLite**: Database storage

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
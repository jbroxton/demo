import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/services/db.server';
import { v4 as uuid } from 'uuid';
import { getProductsFromDb } from '@/services/products-db';
import { getFeaturesFromDb } from '@/services/features-db';

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

const indexInputSchema = z.object({
  action: z.literal('index'),
});

// Handle chat conversations
export async function POST(req: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return Response.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    
    // Check if this is an indexing request
    if (body.action === 'index') {
      return handleIndexing(req);
    }
    
    // Otherwise, handle as chat
    return handleChat(req, body);
  } catch (error) {
    console.error('AI Chat API error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Type for the parsed chat input
type ChatInput = z.infer<typeof chatInputSchema>;

// Handle chat conversations
async function handleChat(req: NextRequest, body: ChatInput): Promise<Response> {
  const { messages, tenantId: bodyTenantId } = chatInputSchema.parse(body);
  const tenantId = req.headers.get('x-tenant-id') || bodyTenantId || 'default';
  
  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  
  // Generate embedding for the query with error handling
  let queryEmbedding: Float32Array;
  try {
    const embedAPI = openai.embedding('text-embedding-3-small');
    const embeddingResponse = await embedAPI.doEmbed({
      values: [lastMessage.content],
    });
    
    if (!embeddingResponse?.embeddings?.[0] || embeddingResponse.embeddings[0].length === 0) {
      throw new Error('Empty embedding response');
    }
    
    queryEmbedding = new Float32Array(embeddingResponse.embeddings[0]);
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return Response.json(
      { error: 'Failed to process query embedding' },
      { status: 500 }
    );
  }
  
  // Get database instance
  const db = getDb();
  
  // Get system prompt template
  const promptTemplate = db.prepare(`
    SELECT template FROM ai_prompt_templates 
    WHERE name = ? LIMIT 1
  `).get('pm-assistant') as { template: string } | undefined;
  
  const defaultPrompt = `
    You are a Product Management AI assistant for Speqq.
    Use the following context information to answer the user's question.
    If you don't know the answer, say you don't know.
    
    Context: {context}
  `;
  
  const systemPrompt = promptTemplate?.template || defaultPrompt;
  
  // Perform RAG with sqlite-vec
  let relevantDocs: any[] = [];
  
  try {
    relevantDocs = db.prepare(`
      SELECT 
        d.id, d.content, d.metadata,
        vec_distance_l2(v.embedding, ?) as distance
      FROM 
        ai_vectors AS v
      JOIN 
        ai_vectors_metadata AS vm ON v.rowid = vm.rowid
      JOIN 
        ai_documents AS d ON d.id = vm.document_id
      WHERE 
        vm.tenant_id = ?
      ORDER BY 
        distance
      LIMIT 5
    `).all(Buffer.from(queryEmbedding.buffer), tenantId);
  } catch (error) {
    console.error('Vector search failed (sqlite-vec may not be loaded):', error);
    // Continue with empty context if vector search fails
  }
  
  // Type for database document results
  interface DocumentResult {
    id: string;
    content: string;
    metadata: string;
    distance: number;
  }
  
  // Format context
  const context = (relevantDocs as DocumentResult[])
    .map((doc) => `Content: ${doc.content}\nMetadata: ${doc.metadata || '{}'}`)
    .join('\n\n');
  
  // Format system message with context
  const formattedSystemPrompt = systemPrompt.replace('{context}', context);
  
  // Generate streaming response
  const result = await streamText({
    model: openai('gpt-4o'),
    system: formattedSystemPrompt,
    messages: messages,
    temperature: 0.5,
  });
  
  return result.toDataStreamResponse();
}

// Handle RAG indexing
async function handleIndexing(req: NextRequest): Promise<NextResponse> {
  const tenantId = req.headers.get('x-tenant-id') || 'default';
  const db = getDb();
  
  // Get data to index
  const productsResult = await getProductsFromDb();
  const featuresResult = await getFeaturesFromDb();
  
  if (!productsResult.success || !featuresResult.success) {
    throw new Error('Failed to fetch data from database');
  }
  
  const products = productsResult.data || [];
  const features = featuresResult.data || [];
  const indexedDocuments = [];
  
  // Index products with error collection
  const errors: string[] = [];
  
  for (const product of products) {
    const id = uuid();
    const content = `Product: ${product.name}\n\nDescription: ${product.description || ''}`;
    const metadata = JSON.stringify({
      type: 'product',
      id: product.id,
      tenantId,
    });
    
    try {
      // Generate embedding with error handling
      const embedAPI = openai.embedding('text-embedding-3-small');
      const embeddingResponse = await embedAPI.doEmbed({
        values: [content],
      });
      
      if (!embeddingResponse?.embeddings?.[0] || embeddingResponse.embeddings[0].length === 0) {
        console.error(`Failed to generate embedding for product ${product.id}`);
        continue;
      }
      
      const embeddingArray = new Float32Array(embeddingResponse.embeddings[0]);
    
      // Store document and vector
      db.prepare(`
        INSERT INTO ai_documents (id, content, metadata, tenant_id)
        VALUES (?, ?, ?, ?)
      `).run(id, content, metadata, tenantId);
      
      const vectorResult = db.prepare(`
        INSERT INTO ai_vectors (embedding)
        VALUES (?)
      `).run(Buffer.from(embeddingArray.buffer));
      
      const vectorRowId = vectorResult.lastInsertRowid;
      
      db.prepare(`
        INSERT INTO ai_vectors_metadata (rowid, document_id, tenant_id)
        VALUES (?, ?, ?)
      `).run(vectorRowId, id, tenantId);
      
      indexedDocuments.push(id);
    } catch (error) {
      const errorMsg = `Failed to index product ${product.id}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  // Index features (similar logic)
  for (const feature of features) {
    const id = uuid();
    const content = `Feature: ${feature.name}\n\nDescription: ${feature.description || ''}`;
    const metadata = JSON.stringify({
      type: 'feature',
      id: feature.id,
      tenantId,
    });
    
    try {
      // Generate embedding with error handling
      const embedAPI = openai.embedding('text-embedding-3-small');
      const embeddingResponse = await embedAPI.doEmbed({
        values: [content],
      });
      
      if (!embeddingResponse?.embeddings?.[0] || embeddingResponse.embeddings[0].length === 0) {
        console.error(`Failed to generate embedding for feature ${feature.id}`);
        continue;
      }
      
      const embeddingArray = new Float32Array(embeddingResponse.embeddings[0]);
    
      // Store document and vector  
      db.prepare(`
        INSERT INTO ai_documents (id, content, metadata, tenant_id)
        VALUES (?, ?, ?, ?)
      `).run(id, content, metadata, tenantId);
      
      const vectorResult = db.prepare(`
        INSERT INTO ai_vectors (embedding)
        VALUES (?)
      `).run(Buffer.from(embeddingArray.buffer));
      
      const vectorRowId = vectorResult.lastInsertRowid;
      
      db.prepare(`
        INSERT INTO ai_vectors_metadata (rowid, document_id, tenant_id)
        VALUES (?, ?, ?)
      `).run(vectorRowId, id, tenantId);
      
      indexedDocuments.push(id);
    } catch (error) {
      const errorMsg = `Failed to index feature ${feature.id}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  return NextResponse.json({
    success: errors.length === 0,
    indexed: indexedDocuments.length,
    total: products.length + features.length,
    errors: errors.length > 0 ? errors : undefined
  });
}
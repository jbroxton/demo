/**
 * Supabase Edge Function: process-embedding
 * 
 * This function processes embedding jobs from the message queue and generates
 * vector embeddings using OpenAI's API. It's designed to work with Supabase's
 * native auto-embedding system using pgmq and pg_cron.
 * 
 * Features:
 * - Processes jobs from pgmq message queue
 * - Generates embeddings using OpenAI text-embedding-3-small
 * - Stores embeddings in ai_embeddings table
 * - Handles failures gracefully with retry logic
 * - Multi-tenant aware
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'

// Supabase configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client with service role for database access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface EmbeddingJob {
  entity_type: string
  entity_id: string
  tenant_id: string
  content: string
  metadata: Record<string, any>
}

interface OpenAIEmbeddingResponse {
  object: string
  data: Array<{
    object: string
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data: OpenAIEmbeddingResponse = await response.json()
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from OpenAI')
  }

  return data.data[0].embedding
}

/**
 * Store embedding in the database
 */
async function storeEmbedding(job: EmbeddingJob, embedding: number[]): Promise<void> {
  // Ensure entity_id is a valid UUID format
  let entityId = job.entity_id
  
  // If it's not a UUID format, generate one for testing purposes
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entityId)) {
    // For test data, create a deterministic UUID based on the entity_id
    const crypto = globalThis.crypto
    const encoder = new TextEncoder()
    const data = encoder.encode(entityId)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    
    // Create UUID v4 format from hash
    const uuid = Array.from(hashArray.slice(0, 16))
      .map((b, i) => {
        if (i === 6) return ((b & 0x0f) | 0x40).toString(16).padStart(2, '0')
        if (i === 8) return ((b & 0x3f) | 0x80).toString(16).padStart(2, '0')
        return b.toString(16).padStart(2, '0')
      })
    
    entityId = [
      uuid.slice(0, 4).join(''),
      uuid.slice(4, 6).join(''),
      uuid.slice(6, 8).join(''),
      uuid.slice(8, 10).join(''),
      uuid.slice(10, 16).join('')
    ].join('-')
    
    console.log(`Converted entity_id "${job.entity_id}" to UUID format: ${entityId}`)
  }

  const { error } = await supabase
    .from('ai_embeddings')
    .upsert({
      tenant_id: job.tenant_id,
      entity_type: job.entity_type,
      entity_id: entityId,
      content: job.content,
      embedding: embedding, // pgvector handles the array directly
      metadata: job.metadata,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id, entity_type, entity_id'
    })

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }
}

/**
 * Process a single embedding job
 */
async function processEmbeddingJob(job: EmbeddingJob): Promise<{ success: boolean, error?: string }> {
  try {
    console.log(`Processing embedding job for ${job.entity_type} ${job.entity_id}`)
    console.log(`OpenAI API Key available: ${OPENAI_API_KEY ? 'Yes' : 'No'}`)
    console.log(`Supabase URL: ${SUPABASE_URL}`)
    
    // Validate job data
    if (!job.content || !job.entity_id || !job.tenant_id) {
      throw new Error('Invalid job data: missing required fields')
    }

    // Generate embedding
    console.log(`Generating embedding for content: ${job.content.substring(0, 100)}...`)
    const embedding = await generateEmbedding(job.content)
    console.log(`Generated embedding with ${embedding.length} dimensions`)
    
    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate valid embedding')
    }

    // Store in database
    console.log(`Storing embedding in database...`)
    await storeEmbedding(job, embedding)
    
    console.log(`Successfully processed embedding for ${job.entity_type} ${job.entity_id}`)
    return { success: true }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error processing embedding job:`, errorMessage)
    console.error(`Full error:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Main Edge Function handler
 */
serve(async (req) => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('=== Edge Function process-embedding invoked ===')
    console.log(`Request method: ${req.method}`)
    console.log(`Request URL: ${req.url}`)
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(req.headers))}`)
    
    // Log environment variables (without exposing sensitive data)
    console.log(`SUPABASE_URL: ${SUPABASE_URL}`)
    console.log(`OpenAI API Key available: ${OPENAI_API_KEY ? 'Yes' : 'No'}`)
    console.log(`Service Role Key available: ${SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}`)
    
    // Parse request body
    const requestBody = await req.json()
    console.log(`Request body: ${JSON.stringify(requestBody, null, 2)}`)
    
    // Handle single job processing (called from cron/webhook)
    if (requestBody.entity_type) {
      const job = requestBody as EmbeddingJob
      const success = await processEmbeddingJob(job)
      
      return new Response(
        JSON.stringify({ 
          success,
          message: success ? 'Job processed successfully' : 'Job processing failed'
        }),
        { 
          status: success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle batch processing (process multiple jobs from queue)
    let jobsProcessed = 0
    let errors: string[] = []
    const maxJobs = requestBody.maxJobs || 10

    // Read jobs from message queue using the SQL function call
    const { data: jobs, error: queueError } = await supabase
      .rpc('pgmq_read', {
        queue_name: 'embedding_jobs',
        vt: 30, // 30 second visibility timeout
        qty: maxJobs
      })

    if (queueError) {
      throw new Error(`Queue read error: ${queueError.message}`)
    }

    // Process each job
    for (const jobRecord of jobs || []) {
      try {
        const job = jobRecord.message as EmbeddingJob
        const success = await processEmbeddingJob(job)
        
        if (success) {
          // Delete job from queue on success
          await supabase.rpc('pgmq_delete', {
            queue_name: 'embedding_jobs',
            msg_id: jobRecord.msg_id
          })
          jobsProcessed++
        } else {
          errors.push(`Job ${jobRecord.msg_id} failed to process`)
        }
      } catch (error) {
        errors.push(`Job ${jobRecord.msg_id}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobsProcessed,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${jobsProcessed} jobs successfully`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* Usage Examples:

1. Process single job (called by database trigger):
POST /functions/v1/process-embedding
{
  "entity_type": "features",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "tenant_id": "tenant-123",
  "content": "Feature: Authentication System\nPriority: High\nDescription: OAuth integration",
  "metadata": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Authentication System",
    "priority": "High"
  }
}

2. Process batch from queue (called by cron):
POST /functions/v1/process-embedding
{
  "maxJobs": 10
}

*/
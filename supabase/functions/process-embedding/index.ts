/**
 * DISABLED: Old Supabase Edge Function: process-embedding
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
 * 
 * COMMENTED OUT TO AVOID BUILD CONFLICTS
 */

// Entire file commented out to prevent TypeScript/build issues
// This edge function is not currently in use

/*

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

// ... rest of the file content would be here ...

*/

export {}; // Make this a module to satisfy TypeScript
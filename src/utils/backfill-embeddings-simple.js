#!/usr/bin/env node

/**
 * Simple Embedding Backfill - Best Practice Approach
 * 
 * Uses the existing trigger system by updating features without embeddings.
 * This leverages the tested infrastructure instead of duplicating logic.
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Backfilling Embeddings Using Existing Trigger System');
console.log('='.repeat(55));

async function backfillEmbeddings() {
  try {
    console.log('📋 Step 1: Triggering embeddings for all features without embeddings...');
    
    // Use the existing trigger system by updating features that need embeddings
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/backfill_embeddings_via_triggers`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Successfully triggered embeddings for ${result} features`);
      
      if (result > 0) {
        console.log('\n⏳ Features updated, embeddings will be processed by:');
        console.log('   1. Database triggers (immediate job queuing)');
        console.log('   2. Cron job processing (every 30 seconds in production)');
        console.log('   3. Edge Functions (embedding generation)');
        
        console.log('\n🔧 For immediate processing in local development:');
        console.log('   Run: curl -X POST "http://127.0.0.1:54321/rest/v1/rpc/process_embedding_queue" \\');
        console.log('        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \\');
        console.log('        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \\');
        console.log('        -H "Content-Type: application/json" -d "{}"');
      } else {
        console.log('🎉 All features already have embeddings!');
      }
      
    } else {
      console.error('❌ Backfill failed:', result);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the backfill
backfillEmbeddings();
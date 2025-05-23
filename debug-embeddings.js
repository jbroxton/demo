/**
 * Quick debug script to check embeddings in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log('🔍 Checking embeddings in Supabase...');
  
  try {
    // Check if ai_embeddings table exists and has data
    const { data, error, count } = await supabase
      .from('ai_embeddings')
      .select('*', { count: 'exact' })
      .limit(5);
      
    if (error) {
      console.error('❌ Error querying ai_embeddings:', error);
      return;
    }
    
    console.log(`📊 Total embeddings found: ${count || 0}`);
    
    if (data && data.length > 0) {
      console.log('📋 Sample embeddings:');
      data.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ID: ${item.id}`);
        console.log(`     Type: ${item.entity_type}`);
        console.log(`     Entity ID: ${item.entity_id}`);
        console.log(`     Tenant: ${item.tenant_id}`);
        console.log(`     Content: ${item.content?.substring(0, 100)}...`);
        console.log(`     Embedding length: ${item.embedding?.length || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('📭 No embeddings found in the database');
    }
    
    // Check by tenant
    const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';
    const { data: tenantData, error: tenantError } = await supabase
      .from('ai_embeddings')
      .select('*')
      .eq('tenant_id', realTenantId);
      
    if (!tenantError) {
      console.log(`🏢 Embeddings for tenant ${realTenantId}: ${tenantData?.length || 0}`);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkEmbeddings();
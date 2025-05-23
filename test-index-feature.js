/**
 * Test indexFeature function directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

// Import the indexFeature function
async function importIndexFunction() {
  try {
    // Import the ES module
    const aiService = await import('./src/services/ai-service.ts');
    return aiService.indexFeature;
  } catch (error) {
    console.error('❌ Error importing indexFeature:', error);
    return null;
  }
}

async function testIndexing() {
  console.log('🧪 Testing indexFeature function...');
  
  try {
    // Get a real feature from the database
    const { data: features, error } = await supabase
      .from('features')
      .select('*')
      .eq('tenant_id', realTenantId)
      .limit(1);
      
    if (error || !features || features.length === 0) {
      console.error('❌ No features found or error:', error);
      return;
    }
    
    const testFeature = features[0];
    console.log(`✅ Found test feature: ${testFeature.name} (ID: ${testFeature.id})`);
    
    // Import and test the indexFeature function
    const indexFeature = await importIndexFunction();
    if (!indexFeature) {
      console.error('❌ Could not import indexFeature function');
      return;
    }
    
    console.log('🔄 Attempting to index feature...');
    const result = await indexFeature(testFeature, realTenantId);
    
    console.log('✅ Indexing successful!');
    console.log(`📊 Result ID: ${result.id}`);
    console.log(`🎯 Entity type: ${result.entity_type}`);
    console.log(`📝 Content length: ${result.content?.length}`);
    console.log(`🧮 Embedding length: ${result.embedding?.length}`);
    
    // Verify it was stored in database
    const { data: verification, error: verifyError } = await supabase
      .from('ai_embeddings')
      .select('*')
      .eq('entity_id', testFeature.id);
      
    if (verifyError) {
      console.error('❌ Error verifying storage:', verifyError);
    } else {
      console.log(`✅ Verification: ${verification?.length || 0} embeddings found for this feature`);
    }
    
  } catch (error) {
    console.error('💥 Error during test:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testIndexing();
/**
 * Deploy Auto-Embeddings Infrastructure to Supabase
 * 
 * This script deploys the auto-embedding infrastructure directly to your
 * Supabase database using the existing connection configuration.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function deployAutoEmbeddings() {
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('🚀 Starting auto-embeddings infrastructure deployment...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/setup-auto-embeddings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Loaded migration SQL from:', migrationPath);

    // Split SQL into individual statements (basic splitting)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Try direct SQL execution if RPC fails
          const { error: directError } = await supabase
            .from('_sql_exec')
            .insert({ sql: statement });
          
          if (directError) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        errorCount++;
      }
    }

    console.log('\n📊 Deployment Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Auto-embeddings infrastructure deployed successfully!');
      console.log('\n📋 What was deployed:');
      console.log('   • PostgreSQL extensions (pgvector, pgmq, pg_net, pg_cron)');
      console.log('   • Message queue for embedding jobs');
      console.log('   • Database triggers on features and releases tables');
      console.log('   • Utility functions for queue processing');
      console.log('   • Cron job for automatic queue processing');
      console.log('   • Performance indexes for vector search');
      
      console.log('\n⚡ Next steps:');
      console.log('   1. Deploy the Edge Function: npx supabase functions deploy process-embedding');
      console.log('   2. Test the system by creating/updating a feature or release');
      console.log('   3. Monitor the queue status in your application');
    } else {
      console.log('\n⚠️ Some statements failed. Check the errors above.');
      console.log('You may need to run some statements manually in your Supabase SQL editor.');
    }

  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your Supabase environment variables');
    console.error('   2. Ensure your Supabase project has the required permissions');
    console.error('   3. Try running the migration manually in Supabase SQL editor');
    process.exit(1);
  }
}

// Alternative: Manual SQL execution guide
function showManualInstructions() {
  console.log('\n📖 Manual Installation Instructions:');
  console.log('If the automatic deployment fails, you can install manually:');
  console.log('\n1. Open your Supabase project dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Copy and paste the contents of migrations/setup-auto-embeddings.sql');
  console.log('4. Run the SQL script');
  console.log('5. Deploy the Edge Function with: npx supabase functions deploy process-embedding');
}

if (require.main === module) {
  deployAutoEmbeddings().catch(error => {
    console.error('Script execution failed:', error);
    showManualInstructions();
  });
}

module.exports = { deployAutoEmbeddings, showManualInstructions };
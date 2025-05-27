const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables.');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'tenant-settings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: tenant-settings.sql');
    console.log('SQL:', sql);

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) {
      // If RPC doesn't exist, try a different approach
      console.error('RPC failed, attempting direct execution...');
      
      // Split the SQL into statements and execute them
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.trim().substring(0, 50) + '...');
          
          // For Supabase, we need to use the admin API or run this through the dashboard
          console.log('Please run this SQL in your Supabase dashboard:');
          console.log(statement.trim());
          console.log('---');
        }
      }
      
      console.log('\nSince Supabase doesn\'t allow direct SQL execution via the JS client,');
      console.log('please run the above SQL statements in your Supabase SQL Editor.');
      console.log('Go to: https://app.supabase.com/project/{your-project}/sql/new');
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
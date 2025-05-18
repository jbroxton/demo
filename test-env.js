// Test script to verify environment variables are loading correctly
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Environment Variables\n');

// Define expected environment variables
const requiredVars = [
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET'
];

const results = {
  loaded: [],
  missing: [],
  incomplete: []
};

// Check each variable
requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    results.missing.push(varName);
  } else if (value.includes('[get from') || value.includes('your-')) {
    results.incomplete.push({ name: varName, value: value.substring(0, 50) + '...' });
  } else {
    results.loaded.push({ name: varName, preview: value.substring(0, 20) + '...' });
  }
});

// Display results
console.log('✅ Loaded Variables:');
results.loaded.forEach(({ name, preview }) => {
  console.log(`  ${name}: ${preview}`);
});

if (results.incomplete.length > 0) {
  console.log('\n⚠️  Incomplete Variables (need real values):');
  results.incomplete.forEach(({ name, value }) => {
    console.log(`  ${name}: ${value}`);
  });
}

if (results.missing.length > 0) {
  console.log('\n❌ Missing Variables:');
  results.missing.forEach(name => {
    console.log(`  ${name}`);
  });
}

// Test Supabase connection if variables are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && !supabaseKey.includes('your-')) {
  console.log('\n🔗 Testing Supabase Connection...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  supabase
    .from('_test_connection')
    .select('*')
    .limit(1)
    .then(({ error }) => {
      if (error && error.code === '42P01') {
        console.log('✅ Supabase connection successful (table does not exist - expected)');
      } else if (error) {
        console.log('⚠️  Supabase connection error:', error.message);
      } else {
        console.log('✅ Supabase connection successful');
      }
    })
    .catch(err => {
      console.log('❌ Supabase connection failed:', err.message);
    });
} else {
  console.log('\n⏭️  Skipping Supabase connection test (missing credentials)');
}

// Summary
console.log('\n📊 Summary:');
console.log(`  Total variables: ${requiredVars.length}`);
console.log(`  Loaded: ${results.loaded.length}`);
console.log(`  Incomplete: ${results.incomplete.length}`);
console.log(`  Missing: ${results.missing.length}`);

if (results.missing.length === 0 && results.incomplete.length === 0) {
  console.log('\n🎉 All environment variables are properly configured!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some environment variables need attention.');
  process.exit(1);
}
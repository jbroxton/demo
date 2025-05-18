// Simple test script to verify environment variables are loading correctly
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

// Summary
console.log('\n📊 Summary:');
console.log(`  Total variables: ${requiredVars.length}`);
console.log(`  Loaded: ${results.loaded.length}`);
console.log(`  Incomplete: ${results.incomplete.length}`);
console.log(`  Missing: ${results.missing.length}`);

// Next steps
if (results.incomplete.length > 0) {
  console.log('\n📝 Next Steps:');
  console.log('  1. Go to Supabase Dashboard → Settings → API');
  console.log('  2. Copy the "service_role" key and paste it for SUPABASE_SERVICE_ROLE_KEY');
  console.log('  3. Copy the "JWT Secret" and paste it for SUPABASE_JWT_SECRET');
}

if (results.missing.length === 0 && results.incomplete.length === 0) {
  console.log('\n🎉 All environment variables are properly configured!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some environment variables need attention.');
  process.exit(1);
}
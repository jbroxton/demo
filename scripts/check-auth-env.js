/**
 * Simple script to check if the NextAuth environment is properly set up
 * Run with: node scripts/check-auth-env.js
 */

// Load .env.local file content for this script
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse the file and set environment variables
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      
      process.env[key] = value;
    }
  });
  
  console.log('Loaded environment variables from .env.local');
} catch (err) {
  console.log('Could not load .env.local file:', err.message);
}

console.log('\n=== NextAuth.js Environment Check ===\n');

// Check environment variables
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

console.log('NEXTAUTH_SECRET:');
if (nextAuthSecret) {
  console.log(`✅ Set (${nextAuthSecret.length} characters)`);
  
  if (nextAuthSecret.length < 32) {
    console.log('⚠️ WARNING: Secret should be at least 32 characters long for security');
  }
} else {
  console.log('❌ Missing - JWT operations will fail');
}

console.log('\nNEXTAUTH_URL:');
if (nextAuthUrl) {
  console.log(`✅ Set to: ${nextAuthUrl}`);
} else {
  console.log('❌ Missing - Callbacks may not work correctly');
}

// Load and check .env.local file
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  
  console.log('\n.env.local file:');
  console.log('✅ File exists');
  
  // Check for the required variables in the file
  const hasSecret = envFile.includes('NEXTAUTH_SECRET=');
  const hasUrl = envFile.includes('NEXTAUTH_URL=');
  
  console.log(`${hasSecret ? '✅' : '❌'} Contains NEXTAUTH_SECRET`);
  console.log(`${hasUrl ? '✅' : '❌'} Contains NEXTAUTH_URL`);
  
} catch (err) {
  console.log('\n.env.local file:');
  console.log('❌ File not found or cannot be read');
}

console.log('\nRecommended actions:');
console.log('1. Ensure .env.local contains both NEXTAUTH_SECRET and NEXTAUTH_URL');
console.log('2. Make sure NEXTAUTH_URL matches your development server (http://localhost:3001)');
console.log('3. Use a secure random string for NEXTAUTH_SECRET (at least 32 characters)');
console.log('4. Clear browser cookies after updating these settings');
console.log(); 
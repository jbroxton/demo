/**
 * Simple script to generate a secure random string for NextAuth.js NEXTAUTH_SECRET
 * Run with: node scripts/generate-secret.js
 */

const crypto = require('crypto');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

const secret = generateSecureSecret();

console.log('\n=== NextAuth.js Secret Generator ===\n');
console.log('Copy this secret and add it to your .env.local file:\n');
console.log(`NEXTAUTH_SECRET=${secret}\n`);
console.log('Example .env.local file:\n');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('NEXTAUTH_URL=http://localhost:3000\n'); 
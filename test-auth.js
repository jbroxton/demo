// Test authentication directly
const { validateCredentials } = require('./src/services/auth.server.ts');

async function testAuth() {
  try {
    console.log('Testing authentication...');
    const result = await validateCredentials('pm1@test.com', 'password');
    console.log('Auth result:', result);
  } catch (error) {
    console.error('Auth error:', error);
  }
}

testAuth();
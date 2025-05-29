/**
 * Phase 1 Testing: Simple API test with browser session
 * Run this after signing in to the app in your browser
 */

const BASE_URL = 'http://localhost:3001';

async function testWithBrowserSession() {
  console.log('🧪 Testing Pages API with existing browser session');
  console.log('==================================================');
  console.log('1. Sign in to http://localhost:3001 in your browser first');
  console.log('2. Copy the session cookie from browser dev tools');
  console.log('3. Paste it here when prompted\n');

  // For now, let's test the API endpoint structure
  try {
    console.log('Testing API endpoint availability...');
    
    const response = await fetch(`${BASE_URL}/api/pages-db`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    
    if (response.status === 302 || response.status === 401) {
      console.log('✅ API endpoint exists and requires authentication (expected)');
      console.log('📋 To continue testing:');
      console.log('   1. Open browser to http://localhost:3001');
      console.log('   2. Sign in with pm1@test.com / password');
      console.log('   3. Open browser dev tools');
      console.log('   4. Go to Application > Cookies');
      console.log('   5. Copy the next-auth.session-token value');
      console.log('   6. Create a manual test with that cookie\n');
    } else {
      const data = await response.text();
      console.log('Response:', data.substring(0, 200));
    }

    // Test the service layer directly as an alternative
    console.log('\n🔧 Alternative: Testing service layer directly...');
    
    // Import and test the service
    try {
      const { createPage } = require('./src/services/pages-db.ts');
      console.log('✅ Service import successful');
      
      const testResult = await createPage({
        type: 'project',
        title: 'Test Project from Service',
        tenant_id: '22222222-2222-2222-2222-222222222222',
        properties: {
          status: { type: 'select', select: { name: 'Active', color: 'green' } }
        },
        blocks: [],
        created_by: '20000000-0000-0000-0000-000000000001'
      });
      
      if (testResult.success) {
        console.log('✅ Service layer test passed!');
        console.log('   Created page:', testResult.data.title);
        console.log('   Page ID:', testResult.data.id);
        console.log('   Tenant ID:', testResult.data.tenant_id);
      } else {
        console.log('❌ Service layer test failed:', testResult.error);
      }
      
    } catch (serviceError) {
      console.log('❌ Service import/test failed:', serviceError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithBrowserSession();
// Test the AI chat API with authentication cookies
// First login to the app in your browser, then run this test

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testWithCookies() {
  console.log('\nTo test the authenticated API:');
  console.log('1. Login to http://localhost:3000 in your browser');
  console.log('2. Open Developer Tools > Network tab');
  console.log('3. Try to use the AI chat');
  console.log('4. Find the request to /api/ai-chat');
  console.log('5. Copy the Cookie header value');
  console.log('6. Paste it here\n');

  rl.question('Paste your Cookie header value: ', async (cookies) => {
    console.log('\nTesting with authentication...\n');

    const apiUrl = 'http://localhost:3000/api/ai-chat';
    const testPayload = {
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello, can you help me?'
        }
      ],
      tenantId: 'org1'
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'org1',
          'Cookie': cookies
        },
        body: JSON.stringify(testPayload)
      });

      console.log('Response Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log('JSON Response:', JSON.stringify(data, null, 2));
      } else if (contentType?.includes('text/html')) {
        const text = await response.text();
        console.log('HTML Response (first 500 chars):', text.substring(0, 500));
      } else {
        // For streaming responses
        const text = await response.text();
        console.log('Response:', text.substring(0, 500));
      }

    } catch (error) {
      console.error('Error:', error.message);
    }

    rl.close();
  });
}

testWithCookies();
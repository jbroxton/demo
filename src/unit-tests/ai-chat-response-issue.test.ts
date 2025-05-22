/**
 * AI Chat Response Issue Test
 * 
 * This test specifically checks for the issue where users send messages
 * but don't get responses from the AI chat system.
 */

import { NextRequest } from 'next/server';

// Real test data
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Chat Response Issue Debug', () => {
  
  describe('API Route Response Format', () => {
    test('should verify API route returns proper streaming response', async () => {
      console.log('=== TESTING API ROUTE RESPONSE FORMAT ===');
      
      // Import the API route handler
      const { POST } = await import('@/app/api/ai-chat/route');
      
      // Create a mock request that matches what useChat sends
      const requestBody = {
        messages: [
          {
            id: 'test-message-1',
            role: 'user',
            content: 'Hello, what features do we have?'
          }
        ],
        tenantId: realTenantId,
        userId: realUserId
      };
      
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(requestBody)
      });
      
      try {
        console.log('Calling POST handler with request...');
        const response = await POST(request);
        
        console.log('Response received:');
        console.log(`- Status: ${response.status}`);
        console.log(`- Status Text: ${response.statusText}`);
        console.log(`- Headers:`, Object.fromEntries(response.headers.entries()));
        
        // Check if response is valid
        expect(response).toBeDefined();
        expect(response.status).toBeLessThan(500);
        
        // Check content type for streaming
        const contentType = response.headers.get('content-type');
        console.log(`- Content-Type: ${contentType}`);
        
        // For streaming responses, we expect text/plain or similar
        const isStreaming = contentType?.includes('text/') || 
                          contentType?.includes('application/octet-stream') ||
                          contentType?.includes('text/event-stream');
        
        const isJson = contentType?.includes('application/json');
        
        if (response.ok) {
          expect(isStreaming || isJson).toBe(true);
          console.log('✅ Response format is valid');
          
          if (isStreaming) {
            console.log('✅ Streaming response detected');
            
            // Try to read a small chunk of the stream to verify it's working
            const reader = response.body?.getReader();
            if (reader) {
              try {
                const { value, done } = await reader.read();
                if (value && !done) {
                  const chunk = new TextDecoder().decode(value);
                  console.log(`First chunk preview: ${chunk.substring(0, 100)}...`);
                  console.log('✅ Stream is readable');
                }
                reader.releaseLock();
              } catch (streamError) {
                console.error('❌ Stream reading error:', streamError);
              }
            }
          } else if (isJson) {
            const data = await response.json();
            console.log('JSON response data:', data);
          }
          
        } else {
          // For error responses
          expect(isJson).toBe(true);
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          expect(errorData).toHaveProperty('error');
        }
        
      } catch (error) {
        console.error('❌ API route test failed:', error);
        
        // Log detailed error information
        console.error('Error details:');
        console.error(`- Name: ${error.name}`);
        console.error(`- Message: ${error.message}`);
        console.error(`- Stack: ${error.stack}`);
        
        // The test should fail but give us information about why
        throw error;
      }
      
      console.log('=== API ROUTE RESPONSE TEST COMPLETE ===');
    }, 30000); // 30 second timeout
    
    test('should verify streamText integration works correctly', async () => {
      console.log('=== TESTING STREAMTEXT INTEGRATION ===');
      
      // Test the streamText function directly to see if it's configured correctly
      try {
        const { streamText } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');
        
        console.log('✅ AI SDK imports successful');
        
        // Test basic streamText functionality
        const result = await streamText({
          model: openai('gpt-3.5-turbo'),
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say hello' }
          ],
          maxTokens: 50
        });
        
        console.log('✅ StreamText call successful');
        
        // Test toTextStreamResponse method
        const streamResponse = result.toTextStreamResponse();
        
        expect(streamResponse).toBeDefined();
        expect(streamResponse.status).toBe(200);
        
        const contentType = streamResponse.headers.get('content-type');
        console.log(`StreamText response content-type: ${contentType}`);
        
        console.log('✅ StreamText integration working correctly');
        
      } catch (error) {
        console.error('❌ StreamText integration test failed:', error);
        throw error;
      }
      
      console.log('=== STREAMTEXT INTEGRATION TEST COMPLETE ===');
    }, 15000); // 15 second timeout
  });
  
  describe('useChat Hook Compatibility', () => {
    test('should verify API response format matches useChat expectations', async () => {
      console.log('=== TESTING USECHAT COMPATIBILITY ===');
      
      // According to Vercel AI SDK docs, useChat expects specific response formats
      // Let's test what our API actually returns vs what useChat expects
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      const requestBody = {
        messages: [
          {
            id: 'test-compatibility',
            role: 'user',
            content: 'Test message for compatibility'
          }
        ],
        tenantId: realTenantId,
        userId: realUserId
      };
      
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify(requestBody)
      });
      
      const response = await POST(request);
      
      console.log('Checking useChat compatibility:');
      console.log(`- Status: ${response.status}`);
      
      // useChat expects either:
      // 1. Streaming text response (200 status)
      // 2. JSON error response (4xx/5xx status)
      
      if (response.ok) {
        // Should be streaming response
        const contentType = response.headers.get('content-type');
        
        // Check for streaming indicators
        const hasStreamingHeaders = 
          contentType?.includes('text/') ||
          contentType?.includes('application/octet-stream') ||
          response.headers.get('transfer-encoding') === 'chunked';
        
        console.log(`- Streaming headers present: ${hasStreamingHeaders}`);
        console.log(`- Content-Type: ${contentType}`);
        console.log(`- Transfer-Encoding: ${response.headers.get('transfer-encoding')}`);
        
        expect(hasStreamingHeaders).toBe(true);
        console.log('✅ Response format compatible with useChat');
        
      } else {
        // Should be JSON error
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
        
        const errorData = await response.json();
        expect(errorData).toHaveProperty('error');
        console.log('✅ Error format compatible with useChat');
      }
      
      console.log('=== USECHAT COMPATIBILITY TEST COMPLETE ===');
    }, 20000); // 20 second timeout
    
    test('should test minimal chat request to isolate the issue', async () => {
      console.log('=== TESTING MINIMAL CHAT REQUEST ===');
      
      // Test with the most minimal request possible to isolate the issue
      const { POST } = await import('@/app/api/ai-chat/route');
      
      const minimalRequest = {
        messages: [
          {
            role: 'user',
            content: 'hello'
          }
        ]
      };
      
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalRequest)
      });
      
      try {
        console.log('Testing minimal request...');
        const response = await POST(request);
        
        console.log(`Minimal request response status: ${response.status}`);
        
        if (response.ok) {
          console.log('✅ Minimal request successful');
          
          // Try to read the stream
          if (response.body) {
            const reader = response.body.getReader();
            try {
              const { value, done } = await reader.read();
              if (value && !done) {
                const text = new TextDecoder().decode(value);
                console.log(`Response preview: ${text.substring(0, 50)}...`);
                console.log('✅ Stream reading successful');
              }
              reader.releaseLock();
            } catch (streamError) {
              console.error('❌ Stream reading failed:', streamError);
              throw streamError;
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`Error response: ${errorText}`);
          throw new Error(`Minimal request failed with status ${response.status}`);
        }
        
      } catch (error) {
        console.error('❌ Minimal request test failed:', error);
        throw error;
      }
      
      console.log('=== MINIMAL CHAT REQUEST TEST COMPLETE ===');
    }, 15000); // 15 second timeout
  });
  
  describe('Environment and Configuration', () => {
    test('should verify all required environment variables are set', () => {
      console.log('=== CHECKING ENVIRONMENT CONFIGURATION ===');
      
      const requiredEnvVars = [
        'OPENAI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ];
      
      const missingVars = [];
      
      for (const varName of requiredEnvVars) {
        const value = process.env[varName];
        if (!value) {
          missingVars.push(varName);
          console.log(`❌ Missing: ${varName}`);
        } else {
          console.log(`✅ Found: ${varName} = ${value.substring(0, 10)}...`);
        }
      }
      
      expect(missingVars).toHaveLength(0);
      
      console.log('=== ENVIRONMENT CHECK COMPLETE ===');
    });
    
    test('should verify OpenAI API key is valid format', () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(10);
      
      // OpenAI API keys typically start with 'sk-'
      if (!apiKey.startsWith('sk-')) {
        console.warn('⚠️ OpenAI API key does not start with "sk-" - this might be incorrect');
      } else {
        console.log('✅ OpenAI API key format looks correct');
      }
    });
  });
});
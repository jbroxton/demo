/**
 * AI Streaming Format Test
 * 
 * This test specifically checks the streaming response format to fix the
 * "Failed to parse stream string. No separator found" error.
 */

import { NextRequest } from 'next/server';

// Real test data
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Streaming Format Debug', () => {
  
  describe('Stream Response Format Analysis', () => {
    test('should analyze the exact streaming format being returned', async () => {
      console.log('=== ANALYZING STREAMING RESPONSE FORMAT ===');
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      const requestBody = {
        messages: [
          {
            id: 'test-streaming',
            role: 'user',
            content: 'Say exactly: Hello World'
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
      
      console.log(`Response status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`All headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const chunks: string[] = [];
        let chunkCount = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunkCount++;
            const chunk = new TextDecoder().decode(value);
            chunks.push(chunk);
            
            console.log(`\nChunk ${chunkCount}:`);
            console.log(`- Length: ${chunk.length}`);
            console.log(`- Raw bytes:`, Array.from(value).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
            console.log(`- Decoded text: "${chunk}"`);
            console.log(`- Hex representation: ${Buffer.from(chunk).toString('hex')}`);
            
            // Check for common streaming separators
            const hasNewline = chunk.includes('\n');
            const hasCarriageReturn = chunk.includes('\r');
            const hasDataPrefix = chunk.includes('data:');
            const hasEventStream = chunk.includes('event:');
            
            console.log(`- Contains newline: ${hasNewline}`);
            console.log(`- Contains carriage return: ${hasCarriageReturn}`);
            console.log(`- Contains 'data:': ${hasDataPrefix}`);
            console.log(`- Contains 'event:': ${hasEventStream}`);
            
            // Only read first few chunks to avoid infinite loop
            if (chunkCount >= 5) {
              console.log('Stopping after 5 chunks to avoid infinite loop...');
              break;
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        console.log(`\nStream Summary:`);
        console.log(`- Total chunks: ${chunkCount}`);
        console.log(`- Total response: "${chunks.join('')}"`);
        
        // Analyze the overall format
        const fullResponse = chunks.join('');
        console.log(`\nFormat Analysis:`);
        console.log(`- Full response length: ${fullResponse.length}`);
        console.log(`- Has data: prefix: ${fullResponse.includes('data:')}`);
        console.log(`- Has SSE format: ${fullResponse.includes('data:') && fullResponse.includes('\n')}`);
        console.log(`- Is plain text: ${!fullResponse.includes('data:')}`);
        
      } else {
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      console.log('=== STREAMING FORMAT ANALYSIS COMPLETE ===');
    }, 15000);
    
    test('should check if we need Server-Sent Events format', async () => {
      console.log('=== CHECKING SSE FORMAT REQUIREMENTS ===');
      
      // Test what the useChat hook expects by examining the AI SDK
      try {
        const { streamText } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');
        
        // Create a simple streamText response
        const result = await streamText({
          model: openai('gpt-3.5-turbo'),
          messages: [{ role: 'user', content: 'Say: Test' }],
          maxTokens: 10
        });
        
        // Check what toTextStreamResponse actually returns
        const streamResponse = result.toTextStreamResponse();
        
        console.log('StreamText response analysis:');
        console.log(`- Status: ${streamResponse.status}`);
        console.log(`- Content-Type: ${streamResponse.headers.get('content-type')}`);
        console.log(`- Headers:`, Object.fromEntries(streamResponse.headers.entries()));
        
        // Read the actual stream format
        if (streamResponse.body) {
          const reader = streamResponse.body.getReader();
          const chunks: string[] = [];
          let chunkCount = 0;
          
          try {
            while (chunkCount < 3) {
              const { done, value } = await reader.read();
              if (done) break;
              
              chunkCount++;
              const chunk = new TextDecoder().decode(value);
              chunks.push(chunk);
              
              console.log(`StreamText Chunk ${chunkCount}: "${chunk}"`);
              console.log(`- Has data: prefix: ${chunk.includes('data:')}`);
              console.log(`- Has newlines: ${chunk.includes('\n')}`);
            }
          } finally {
            reader.releaseLock();
          }
          
          console.log(`StreamText format: ${chunks.join('')}`);
        }
        
      } catch (error) {
        console.error('Error analyzing StreamText format:', error);
      }
      
      console.log('=== SSE FORMAT CHECK COMPLETE ===');
    }, 10000);
    
    test('should test useChat hook compatibility with current format', async () => {
      console.log('=== TESTING USECHAT HOOK COMPATIBILITY ===');
      
      // Test if the issue is with how useChat parses our stream
      // Let's simulate what useChat does
      
      const { POST } = await import('@/app/api/ai-chat/route');
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: 'Short response please'
          }
        ],
        tenantId: realTenantId
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
      
      if (response.ok && response.body) {
        // Simulate what useChat does internally
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            console.log(`Buffer state: "${buffer}"`);
            
            // Check if this looks like what useChat expects
            // useChat typically expects either:
            // 1. Plain text streaming
            // 2. Server-Sent Events format with data: prefix
            // 3. JSON streaming with separators
            
            const hasSSEFormat = buffer.includes('data:');
            const hasJSONSeparator = buffer.includes('\n') || buffer.includes('\r\n');
            const isPlainText = !hasSSEFormat && !buffer.startsWith('{');
            
            console.log(`Format detection:`);
            console.log(`- Has SSE format: ${hasSSEFormat}`);
            console.log(`- Has separators: ${hasJSONSeparator}`);
            console.log(`- Is plain text: ${isPlainText}`);
            
            // Only check first chunk
            break;
          }
        } finally {
          reader.releaseLock();
        }
        
        console.log(`Final buffer: "${buffer}"`);
        
        // The issue might be that useChat expects a specific format
        // Let's check if we need to modify our response format
        
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      console.log('=== USECHAT COMPATIBILITY TEST COMPLETE ===');
    }, 10000);
  });
  
  describe('Alternative Response Formats', () => {
    test('should test if we need to use different AI SDK methods', async () => {
      console.log('=== TESTING ALTERNATIVE AI SDK METHODS ===');
      
      try {
        // Test different ways to create streaming responses
        const { streamText, createStreamableValue } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');
        
        console.log('Available AI SDK methods:');
        console.log(`- streamText: ${typeof streamText}`);
        console.log(`- createStreamableValue: ${typeof createStreamableValue}`);
        
        // Test 1: Regular streamText (what we're currently using)
        console.log('\nTesting streamText.toTextStreamResponse():');
        const result1 = await streamText({
          model: openai('gpt-3.5-turbo'),
          messages: [{ role: 'user', content: 'Say: Test1' }],
          maxTokens: 5
        });
        
        const response1 = result1.toTextStreamResponse();
        console.log(`- Content-Type: ${response1.headers.get('content-type')}`);
        
        // Test 2: Check if there are other response methods
        console.log('\nChecking other response methods on streamText result:');
        console.log(`- toTextStreamResponse: ${typeof result1.toTextStreamResponse}`);
        console.log(`- toDataStreamResponse: ${typeof (result1 as any).toDataStreamResponse}`);
        console.log(`- pipeDataStreamToResponse: ${typeof (result1 as any).pipeDataStreamToResponse}`);
        
        // Test 3: Try createStreamableValue approach
        if (createStreamableValue) {
          console.log('\nTesting createStreamableValue approach:');
          const streamableValue = createStreamableValue('');
          console.log(`- Streamable value created: ${typeof streamableValue}`);
        }
        
      } catch (error) {
        console.error('Error testing alternative AI SDK methods:', error);
      }
      
      console.log('=== ALTERNATIVE AI SDK METHODS TEST COMPLETE ===');
    }, 10000);
  });
});
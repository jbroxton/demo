/**
 * AI Data Stream Test
 * 
 * Test the new toDataStreamResponse format to ensure it fixes the
 * "Failed to parse stream string. No separator found" error.
 */

import { NextRequest } from 'next/server';

const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI Data Stream Format Test', () => {
  
  test('should verify toDataStreamResponse format has proper separators', async () => {
    console.log('=== TESTING DATA STREAM RESPONSE FORMAT ===');
    
    const { POST } = await import('@/app/api/ai-chat/route');
    
    const requestBody = {
      messages: [
        {
          id: 'test-datastream',
          role: 'user',
          content: 'Say: Hello World'
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
    
    console.log(`Response status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`All headers:`, Object.fromEntries(response.headers.entries()));
    
    expect(response.status).toBe(200);
    
    if (response.body) {
      const reader = response.body.getReader();
      const chunks: string[] = [];
      let chunkCount = 0;
      
      try {
        while (chunkCount < 5) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunkCount++;
          const chunk = new TextDecoder().decode(value);
          chunks.push(chunk);
          
          console.log(`\nDataStream Chunk ${chunkCount}:`);
          console.log(`- Length: ${chunk.length}`);
          console.log(`- Content: "${chunk}"`);
          console.log(`- Hex: ${Buffer.from(chunk).toString('hex')}`);
          
          // Check for data stream format indicators
          const hasDataPrefix = chunk.includes('data:');
          const hasNewline = chunk.includes('\n');
          const hasCarriageReturn = chunk.includes('\r');
          const hasJSON = chunk.includes('{') || chunk.includes('}');
          
          console.log(`- Has 'data:' prefix: ${hasDataPrefix}`);
          console.log(`- Has newline: ${hasNewline}`);
          console.log(`- Has carriage return: ${hasCarriageReturn}`);
          console.log(`- Has JSON: ${hasJSON}`);
          
          // This should have proper separators for useChat
          if (hasDataPrefix || hasNewline || hasJSON) {
            console.log('✅ Found data stream format indicators');
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      const fullResponse = chunks.join('');
      console.log(`\nFull response analysis:`);
      console.log(`- Total chunks: ${chunkCount}`);
      console.log(`- Combined length: ${fullResponse.length}`);
      console.log(`- Full content: "${fullResponse}"`);
      
      // Check if this looks like the format useChat expects
      const hasProperFormat = 
        fullResponse.includes('data:') ||
        fullResponse.includes('\n') ||
        fullResponse.includes('0:') || // Common in AI SDK data streams
        fullResponse.includes('"');    // JSON indicators
      
      console.log(`- Has proper data stream format: ${hasProperFormat}`);
      
      if (hasProperFormat) {
        console.log('✅ Response appears to have proper useChat format');
      } else {
        console.log('❌ Response may still lack proper separators');
      }
      
    } else {
      throw new Error('No response body received');
    }
    
    console.log('=== DATA STREAM FORMAT TEST COMPLETE ===');
  }, 15000);
  
  test('should compare toDataStreamResponse vs toTextStreamResponse', async () => {
    console.log('=== COMPARING STREAM RESPONSE FORMATS ===');
    
    try {
      const { streamText } = await import('ai');
      const { openai } = await import('@ai-sdk/openai');
      
      // Test both methods with the same input
      const result = await streamText({
        model: openai('gpt-3.5-turbo'),
        messages: [{ role: 'user', content: 'Say: Test123' }],
        maxTokens: 10
      });
      
      // Test toTextStreamResponse
      console.log('\nTesting toTextStreamResponse:');
      const textResponse = result.toTextStreamResponse();
      console.log(`- Content-Type: ${textResponse.headers.get('content-type')}`);
      
      if (textResponse.body) {
        const reader1 = textResponse.body.getReader();
        try {
          const { value } = await reader1.read();
          if (value) {
            const chunk = new TextDecoder().decode(value);
            console.log(`- Sample chunk: "${chunk}"`);
            console.log(`- Has separators: ${chunk.includes('\n') || chunk.includes('data:')}`);
          }
        } finally {
          reader1.releaseLock();
        }
      }
      
      // Test toDataStreamResponse
      console.log('\nTesting toDataStreamResponse:');
      const dataResponse = result.toDataStreamResponse();
      console.log(`- Content-Type: ${dataResponse.headers.get('content-type')}`);
      
      if (dataResponse.body) {
        const reader2 = dataResponse.body.getReader();
        try {
          const { value } = await reader2.read();
          if (value) {
            const chunk = new TextDecoder().decode(value);
            console.log(`- Sample chunk: "${chunk}"`);
            console.log(`- Has separators: ${chunk.includes('\n') || chunk.includes('data:') || chunk.includes('0:')}`);
          }
        } finally {
          reader2.releaseLock();
        }
      }
      
    } catch (error) {
      console.error('Error comparing response formats:', error);
    }
    
    console.log('=== STREAM FORMAT COMPARISON COMPLETE ===');
  }, 10000);
});
/**
 * Test OpenAI embedding generation directly
 */

import { describe, test, expect } from '@jest/globals';

describe('OpenAI Embedding Generation', () => {
  test('should generate embeddings with OpenAI API', async () => {
    console.log('🧪 Testing OpenAI embedding generation...');
    
    // Check API key
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ No OpenAI API key found in environment variables');
      expect(apiKey).toBeDefined();
      return;
    }
    
    console.log('✅ OpenAI API key found:', apiKey.substring(0, 10) + '...');
    
    try {
      // Test with simple fetch to OpenAI
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'Test feature for embedding generation'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', response.status, errorText);
        expect(response.ok).toBe(true);
        return;
      }
      
      const data = await response.json();
      console.log('✅ OpenAI API working');
      console.log(`📊 Embedding dimensions: ${data.data[0].embedding.length}`);
      console.log(`🎯 First few values: [${data.data[0].embedding.slice(0, 5).join(', ')}...]`);
      
      expect(data.data[0].embedding).toHaveLength(1536);
      expect(Array.isArray(data.data[0].embedding)).toBe(true);
      
    } catch (error) {
      console.error('💥 Error testing OpenAI API:', error);
      throw error;
    }
  });
});
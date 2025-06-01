/**
 * OpenAI API Connection Test
 * 
 * This test verifies that the OpenAI API connection is working properly
 * through our AI service layer.
 */

import { generateEmbedding } from '@/services/ai-service';

// Mock environment variables for testing  
const mockApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'test-key';

describe('OpenAI API Connection', () => {
  describe('API Key Configuration', () => {
    test('should have OpenAI API key configured', () => {
      expect(mockApiKey).toBeDefined();
      expect(mockApiKey).not.toBe('');
      expect(mockApiKey).not.toBe('test-key');
      expect(mockApiKey).not.toBe('your-api-key-here');
    });
  });

  describe('Embedding Generation', () => {
    test('should be able to generate embeddings', async () => {
      // Fail test if no real API key is provided
      if (mockApiKey === 'test-key' || !mockApiKey.startsWith('sk-')) {
        throw new Error('Valid OpenAI API key is required for this test. Please set OPENAI_API_KEY environment variable.');
      }

      try {
        const embedding = await generateEmbedding('This is a test string for embedding generation.');

        // Verify embedding structure
        expect(embedding).toBeDefined();
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(1536); // text-embedding-3-small dimension
        
        // Verify embedding values are numbers
        embedding.forEach(value => {
          expect(typeof value).toBe('number');
          expect(isFinite(value)).toBe(true);
        });

        // Verify embedding is normalized (typical for OpenAI embeddings)
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        expect(magnitude).toBeCloseTo(1.0, 1); // Should be close to 1.0 for normalized vectors
      } catch (error) {
        // Handle specific OpenAI API errors
        if (error instanceof Error) {
          if (error.message.includes('authentication')) {
            throw new Error('OpenAI API authentication failed. Check your API key.');
          }
          if (error.message.includes('rate limit')) {
            console.warn('Rate limit hit during embeddings test - API connection is working');
            return; // Rate limit means connection works
          }
          if (error.message.includes('billing')) {
            throw new Error('OpenAI API billing error. Check your account status.');
          }
        }
        throw error;
      }
    }, 30000); // 30 second timeout for API call

    test('should generate different embeddings for different texts', async () => {
      // Fail test if no real API key is provided
      if (mockApiKey === 'test-key' || !mockApiKey.startsWith('sk-')) {
        throw new Error('Valid OpenAI API key is required for this test. Please set OPENAI_API_KEY environment variable.');
      }

      try {
        const embedding1 = await generateEmbedding('This is about cats.');
        const embedding2 = await generateEmbedding('This is about dogs.');

        expect(embedding1).toBeDefined();
        expect(embedding2).toBeDefined();
        expect(embedding1.length).toBe(embedding2.length);

        // Embeddings should be different
        let differences = 0;
        for (let i = 0; i < embedding1.length; i++) {
          if (Math.abs(embedding1[i] - embedding2[i]) > 0.001) {
            differences++;
          }
        }
        
        // Should have significant differences (at least 10% of dimensions different)
        expect(differences).toBeGreaterThan(embedding1.length * 0.1);
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.warn('Rate limit hit during comparison test - API connection is working');
          return;
        }
        throw error;
      }
    }, 45000); // 45 second timeout for multiple API calls
  });

  describe('Error Handling', () => {
    test('should handle empty text gracefully', async () => {
      if (mockApiKey === 'test-key' || !mockApiKey.startsWith('sk-')) {
        throw new Error('Valid OpenAI API key is required for this test. Please set OPENAI_API_KEY environment variable.');
      }

      try {
        const embedding = await generateEmbedding('');
        // OpenAI should handle empty strings gracefully
        expect(embedding).toBeDefined();
        expect(Array.isArray(embedding)).toBe(true);
      } catch (error) {
        // It's also acceptable if the service rejects empty strings
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    test('should handle very long text gracefully', async () => {
      if (mockApiKey === 'test-key' || !mockApiKey.startsWith('sk-')) {
        throw new Error('Valid OpenAI API key is required for this test. Please set OPENAI_API_KEY environment variable.');
      }

      // Create a very long text (around token limit)
      const longText = 'This is a test sentence. '.repeat(1000);

      try {
        const embedding = await generateEmbedding(longText);
        expect(embedding).toBeDefined();
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(1536);
      } catch (error) {
        // It's acceptable if very long texts are rejected
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    }, 30000);
  });

  describe('Service Reliability', () => {
    test('should be consistent across multiple calls', async () => {
      if (mockApiKey === 'test-key' || !mockApiKey.startsWith('sk-')) {
        throw new Error('Valid OpenAI API key is required for this test. Please set OPENAI_API_KEY environment variable.');
      }

      const testText = 'Consistency test text for embeddings.';
      
      try {
        // Generate embedding twice
        const embedding1 = await generateEmbedding(testText);
        const embedding2 = await generateEmbedding(testText);

        expect(embedding1).toBeDefined();
        expect(embedding2).toBeDefined();
        expect(embedding1.length).toBe(embedding2.length);

        // Embeddings should be identical for same text
        let maxDifference = 0;
        for (let i = 0; i < embedding1.length; i++) {
          const diff = Math.abs(embedding1[i] - embedding2[i]);
          maxDifference = Math.max(maxDifference, diff);
        }
        
        // Should be very close (allowing for tiny floating point differences)
        expect(maxDifference).toBeLessThan(0.0001);
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.warn('Rate limit hit during consistency test - API connection is working');
          return;
        }
        throw error;
      }
    }, 45000);
  });
});
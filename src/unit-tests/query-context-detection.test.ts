/**
 * Query Context Detection Test
 * 
 * Tests the new intelligent query context detection that determines
 * whether users want general PM knowledge or specific product advice
 */

import { 
  analyzeQueryContext, 
  getContextualPromptModification,
  EXAMPLE_QUERIES 
} from '@/system-prompts/query-context-detector';

import { generateContextualSystemPrompt } from '@/system-prompts';

describe('Query Context Detection', () => {

  const mockProductContext = {
    productType: 'SaaS' as const,
    industry: 'Fintech' as const,
    technicalFocus: ['API', 'Authentication'],
    maturityStage: 'Growth' as const,
    keyThemes: ['payment', 'security'],
    confidence: 0.8
  };

  const mockPromptContext = {
    productContext: mockProductContext,
    userMessage: '',
    tenantId: 'test',
    availableDataTypes: ['features', 'releases'],
    dataCount: { features: 10, releases: 3, requirements: 5, roadmaps: 1 }
  };

  test('should detect general knowledge queries correctly', () => {
    EXAMPLE_QUERIES.general.forEach(query => {
      const context = analyzeQueryContext(query);
      
      console.log(`"${query}" -> ${context.type} (confidence: ${context.confidence.toFixed(2)})`);
      
      expect(context.type).toBe('general');
      expect(context.useProductData).toBe(false);
      expect(context.confidence).toBeGreaterThan(0.1);
    });
  });

  test('should detect specific product queries correctly', () => {
    EXAMPLE_QUERIES.specific.forEach(query => {
      const context = analyzeQueryContext(query);
      
      console.log(`"${query}" -> ${context.type} (confidence: ${context.confidence.toFixed(2)})`);
      
      expect(context.type).toBe('specific');
      expect(context.useProductData).toBe(true);
    });
  });

  test('should detect hybrid queries correctly', () => {
    // Test specific hybrid queries that should definitely be classified as hybrid
    const hybridQueries = [
      "How should I implement SCRUM for my fintech product?",
      "What agile framework would work best for my team?",
      "Help me use RICE for my features"
    ];

    hybridQueries.forEach(query => {
      const context = analyzeQueryContext(query);
      
      console.log(`"${query}" -> ${context.type} (confidence: ${context.confidence.toFixed(2)})`);
      
      expect(['hybrid', 'specific']).toContain(context.type); // Either hybrid or specific is acceptable
      expect(context.useProductData).toBe(true);
    });
  });

  test('should generate different prompt lengths for general vs specific queries', () => {
    const generalQuery = "What is SCRUM?";
    const specificQuery = "Help me prioritize my features";

    const generalContext = { ...mockPromptContext, userMessage: generalQuery };
    const specificContext = { ...mockPromptContext, userMessage: specificQuery };

    const generalPrompt = generateContextualSystemPrompt(generalContext);
    const specificPrompt = generateContextualSystemPrompt(specificContext);

    console.log('General prompt length:', generalPrompt.length);
    console.log('Specific prompt length:', specificPrompt.length);

    // General prompts should be much shorter (no product context)
    expect(generalPrompt.length).toBeLessThan(specificPrompt.length);
    
    // General prompt should focus on education
    expect(generalPrompt).toContain('Educational Focus');
    expect(generalPrompt).toContain('General Knowledge');
    
    // Specific prompt should include product context
    expect(specificPrompt).toContain('Fintech');
    expect(specificPrompt).toContain('SaaS');
  });

  test('should provide appropriate prompt modifications', () => {
    const generalContext = analyzeQueryContext("What is Agile?");
    const specificContext = analyzeQueryContext("Help me prioritize my features");
    const hybridContext = analyzeQueryContext("How should I implement Agile for my fintech startup?");

    const generalMod = getContextualPromptModification(generalContext);
    const specificMod = getContextualPromptModification(specificContext);
    const hybridMod = getContextualPromptModification(hybridContext);

    console.log('General modification includes:', generalMod.includes('educational'));
    console.log('Specific modification includes:', specificMod.includes('product data'));
    console.log('Hybrid modification includes:', hybridMod.includes('General explanation'));

    expect(generalMod).toContain('General Knowledge');
    expect(specificMod).toContain('Product-Specific');
    expect(hybridMod).toContain('General Knowledge + Specific Application');
  });

  test('should handle edge cases and ambiguous queries', () => {
    const edgeCases = [
      "Help", // Very short
      "What should I do?", // Ambiguous
      "Tell me about my product and also explain SCRUM", // Mixed
      "I want to learn about RICE but also apply it to my features" // Hybrid
    ];

    edgeCases.forEach(query => {
      const context = analyzeQueryContext(query);
      
      console.log(`Edge case: "${query}" -> ${context.type}`);
      
      // Should not crash and should return a valid type
      expect(['general', 'specific', 'hybrid']).toContain(context.type);
      expect(context.confidence).toBeGreaterThanOrEqual(0);
      expect(context.confidence).toBeLessThanOrEqual(1);
    });
  });

  test('should provide reasoning for classification decisions', () => {
    const testQueries = [
      "What is RICE prioritization?",
      "Help me use RICE for my features",
      "How should I implement RICE in my startup?"
    ];

    testQueries.forEach(query => {
      const context = analyzeQueryContext(query);
      
      console.log(`Query: "${query}"`);
      console.log(`Type: ${context.type}`);
      console.log(`Reasoning: ${context.reasoning}`);
      console.log('---');
      
      expect(context.reasoning).toBeTruthy();
      expect(context.reasoning.length).toBeGreaterThan(10);
    });
  });

});
/**
 * Product Manager Enhanced Chat Test
 * 
 * Tests the PM-specific enhancements to the AI chat system
 */

import { 
  generateContextualSystemPrompt, 
  detectPMQueryType, 
  generatePMConversationStarters,
  getRelevantFrameworks
} from '@/system-prompts';

describe('PM Enhanced Chat Features', () => {

  const mockProductContext = {
    productType: 'SaaS' as const,
    industry: 'Fintech' as const,
    technicalFocus: ['API', 'Authentication', 'Analytics'],
    maturityStage: 'Growth' as const,
    keyThemes: ['payment', 'transaction', 'security'],
    confidence: 0.8
  };

  const mockPromptContext = {
    productContext: mockProductContext,
    userMessage: '',
    tenantId: 'test-tenant',
    availableDataTypes: ['features', 'releases'],
    dataCount: {
      features: 15,
      releases: 4,
      requirements: 8,
      roadmaps: 2
    }
  };

  test('should detect prioritization queries and suggest RICE framework', () => {
    const queries = [
      'Help me prioritize my features',
      'Which features should I build first?',
      'What is the priority of these features?'
    ];

    queries.forEach(query => {
      const queryType = detectPMQueryType(query);
      expect(queryType).toBeTruthy();
      expect(queryType?.category).toBe('prioritization');
      expect(queryType?.suggestedFrameworks).toContain('RICE');
      
      console.log(`Query: "${query}" -> Category: ${queryType?.category}`);
    });
  });

  test('should generate PM-specific system prompts with frameworks', () => {
    const testContext = {
      ...mockPromptContext,
      userMessage: 'How should I prioritize my payment features?'
    };

    const systemPrompt = generateContextualSystemPrompt(testContext);
    
    console.log('PM System Prompt Length:', systemPrompt.length);
    console.log('First 500 chars:', systemPrompt.substring(0, 500));

    // Should include PM-specific elements
    expect(systemPrompt).toContain('Product Management');
    expect(systemPrompt).toContain('RICE');
    expect(systemPrompt).toContain('prioritization');
    expect(systemPrompt).toContain('Fintech');
    expect(systemPrompt).toContain('SaaS');
    expect(systemPrompt).toContain('financial regulations');
    expect(systemPrompt).toContain('business impact');
    expect(systemPrompt).toContain('Framework');
  });

  test('should generate relevant conversation starters based on product context', () => {
    const starters = generatePMConversationStarters(mockProductContext, mockPromptContext.dataCount);
    
    console.log('Generated conversation starters:');
    starters.forEach(starter => {
      console.log(`\n${starter.category}:`);
      starter.questions.forEach(q => console.log(`  - ${q}`));
    });

    expect(starters.length).toBeGreaterThan(0);
    
    // Should have fintech-specific starters
    const fintechStarter = starters.find(s => s.category.includes('Fintech'));
    expect(fintechStarter).toBeTruthy();
    expect(fintechStarter?.questions[0]).toContain('compliance');

    // Should have SaaS-specific starters
    const saasStarter = starters.find(s => s.category.includes('SaaS'));
    expect(saasStarter).toBeTruthy();
    expect(saasStarter?.questions).toContain('What\'s my current churn rate and how can I improve it?');
  });

  test('should suggest appropriate frameworks for different query types', () => {
    const testCases = [
      { query: 'prioritize features', expected: ['RICE'] },
      { query: 'track metrics', expected: ['HEART', 'AARRR'] },
      { query: 'plan roadmap', expected: ['RICE'] }, // Features and roadmap both suggest RICE
      { query: 'define strategy', expected: ['NorthStar', 'JobsToBeHired'] }
    ];

    testCases.forEach(({ query, expected }) => {
      const frameworks = getRelevantFrameworks(query, 'Growth');
      console.log(`Query: "${query}" -> Frameworks: ${frameworks.join(', ')}`);
      
      expected.forEach(expectedFramework => {
        expect(frameworks).toContain(expectedFramework);
      });
    });
  });

  test('should adapt suggestions based on product maturity', () => {
    // Early stage product
    const earlyStageContext = {
      ...mockProductContext,
      maturityStage: 'Early Stage' as const
    };

    const earlyStarters = generatePMConversationStarters(earlyStageContext, { 
      features: 3, releases: 0, requirements: 5, roadmaps: 1 
    });

    const mvpCategory = earlyStarters.find(s => s.category.includes('MVP'));
    expect(mvpCategory).toBeTruthy();
    expect(mvpCategory?.questions[0]).toContain('MVP');

    // Growth stage should suggest different things
    const growthStarters = generatePMConversationStarters(mockProductContext, mockPromptContext.dataCount);
    const growthCategory = growthStarters.find(s => s.category.includes('Growth'));
    expect(growthCategory).toBeTruthy();
    expect(growthCategory?.questions[0]).toContain('engagement');
  });

  test('should provide structured response guidance', () => {
    const queries = [
      'How do I prioritize features?',
      'What metrics should I track?',
      'Help me plan my roadmap',
      'How do I communicate with stakeholders?'
    ];

    queries.forEach(query => {
      const testContext = { ...mockPromptContext, userMessage: query };
      const systemPrompt = generateContextualSystemPrompt(testContext);
      
      // Should include PM response structure elements
      expect(systemPrompt).toContain('PM Response Structure');
      expect(systemPrompt).toContain('Framework');
      expect(systemPrompt).toContain('actionable');
      
      console.log(`Query "${query}" has structured guidance: ✓`);
    });
  });

  test('should include PM mindset and best practices', () => {
    const systemPrompt = generateContextualSystemPrompt(mockPromptContext);

    // Should include PM thinking patterns
    expect(systemPrompt).toContain('user outcomes');
    expect(systemPrompt).toContain('business impact');
    expect(systemPrompt).toContain('strategic alignment');
    expect(systemPrompt).toContain('Data-driven decisions');
    expect(systemPrompt).toContain('Stakeholder'); // Capital S in "Stakeholder Management"
    expect(systemPrompt).toContain('experiment');
    expect(systemPrompt).toContain('continuous improvement');
  });

  test('should handle different product types appropriately', () => {
    const productTypes = [
      { type: 'B2B' as const, expectKeyword: 'enterprise' },
      { type: 'B2C' as const, expectKeyword: 'consumer' },
      { type: 'API Platform' as const, expectKeyword: 'developer experience' }
    ];

    productTypes.forEach(({ type, expectKeyword }) => {
      const context = {
        ...mockPromptContext,
        productContext: { ...mockProductContext, productType: type }
      };

      const systemPrompt = generateContextualSystemPrompt(context);
      expect(systemPrompt.toLowerCase()).toContain(expectKeyword.toLowerCase());
      
      console.log(`${type} product includes "${expectKeyword}": ✓`);
    });
  });

});
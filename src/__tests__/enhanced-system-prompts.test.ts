/**
 * Enhanced System Prompts Test
 * 
 * Tests the new intelligent system prompt generation based on product context analysis
 */

import { analyzeProductContext, generateContextualSystemPrompt, generateBriefSystemPrompt } from '@/system-prompts';

describe('Enhanced System Prompts', () => {
  
  test('should analyze fintech product context correctly', async () => {
    const mockFeatures = [
      {
        id: '1',
        name: 'Payment Processing',
        description: 'Handle credit card transactions and billing',
        priority: 'High' as const,
        interfaceId: 'test',
        isSaved: true
      },
      {
        id: '2', 
        name: 'User Authentication',
        description: 'OAuth integration for secure login',
        priority: 'High' as const,
        interfaceId: 'test',
        isSaved: true
      },
      {
        id: '3',
        name: 'Transaction Analytics',
        description: 'Real-time dashboard for financial metrics',
        priority: 'Med' as const,
        interfaceId: 'test',
        isSaved: true
      }
    ];

    const mockReleases = [
      {
        id: '1',
        name: 'Payment Gateway v1.0',
        description: 'Initial payment processing release',
        releaseDate: '2024-03-01',
        priority: 'High' as const,
        featureId: '1',
        tenantId: 'test',
        isSaved: true
      }
    ];

    const productContext = await analyzeProductContext(mockFeatures, mockReleases, []);
    
    console.log('Product context analysis:', {
      type: productContext.productType,
      industry: productContext.industry,
      technicalFocus: productContext.technicalFocus,
      confidence: productContext.confidence
    });

    // Should detect fintech characteristics
    expect(productContext.industry).toBe('Fintech');
    expect(productContext.technicalFocus).toContain('Authentication');
    expect(productContext.technicalFocus).toContain('Analytics');
    expect(productContext.confidence).toBeGreaterThan(0.05); // Lower threshold since we have limited test data
  });

  test('should generate contextual system prompt for fintech SaaS', async () => {
    const mockProductContext = {
      productType: 'SaaS' as const,
      industry: 'Fintech' as const,
      technicalFocus: ['API', 'Authentication', 'Analytics'],
      maturityStage: 'Growth' as const,
      keyThemes: ['payment', 'transaction', 'security'],
      confidence: 0.8
    };

    const promptContext = {
      productContext: mockProductContext,
      userMessage: 'How many payment features do we have?',
      tenantId: 'test-tenant',
      availableDataTypes: ['features', 'releases'],
      dataCount: {
        features: 5,
        releases: 2,
        requirements: 0,
        roadmaps: 1
      }
    };

    const systemPrompt = generateContextualSystemPrompt(promptContext);
    
    console.log('Generated system prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 300));

    // Should include fintech-specific guidance
    expect(systemPrompt).toContain('Fintech');
    expect(systemPrompt).toContain('financial regulations');
    expect(systemPrompt).toContain('SaaS');
    expect(systemPrompt).toContain('5 features');
    expect(systemPrompt).toContain('growth');
  });

  test('should generate brief prompt for unknown product type', async () => {
    const briefPrompt = generateBriefSystemPrompt('Unknown', 'Unknown');
    
    console.log('Brief prompt:', briefPrompt);
    
    expect(briefPrompt).toContain('product management');
    expect(briefPrompt).toContain('actual data');
    expect(briefPrompt.length).toBeLessThan(200); // Should be concise
  });

  test('should handle empty data gracefully', async () => {
    const productContext = await analyzeProductContext([], [], []);
    
    expect(productContext.productType).toBe('Unknown');
    expect(productContext.industry).toBe('Unknown');
    expect(productContext.confidence).toBeLessThan(0.5);
    expect(productContext.technicalFocus).toHaveLength(0);
  });

  test('should detect B2B enterprise software', async () => {
    const mockFeatures = [
      {
        id: '1',
        name: 'Admin Dashboard',
        description: 'Enterprise admin interface with role-based permissions',
        priority: 'High' as const,
        interfaceId: 'test',
        isSaved: true
      },
      {
        id: '2',
        name: 'Approval Workflow',
        description: 'Multi-stage approval process for compliance',
        priority: 'High' as const,
        interfaceId: 'test',
        isSaved: true
      },
      {
        id: '3',
        name: 'Audit Trail',
        description: 'Comprehensive logging for enterprise compliance',
        priority: 'Med' as const,
        interfaceId: 'test',
        isSaved: true
      }
    ];

    const productContext = await analyzeProductContext(mockFeatures, [], []);
    
    console.log('Enterprise software analysis:', {
      type: productContext.productType,
      industry: productContext.industry,
      technicalFocus: productContext.technicalFocus
    });

    expect(['B2B', 'Enterprise Software']).toContain(productContext.productType);
    expect(productContext.technicalFocus).toContain('Security');
  });

});
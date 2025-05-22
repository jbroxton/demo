/**
 * Query Context Detector
 * 
 * Determines whether a user query is asking for general PM knowledge
 * or specific advice about their product, and adjusts the response approach accordingly.
 */

export interface QueryContext {
  type: 'general' | 'specific' | 'hybrid';
  confidence: number;
  reasoning: string;
  useProductData: boolean;
  promptModifications: string[];
}

/**
 * Analyze user query to determine if it's asking for general knowledge or specific product advice
 */
export function analyzeQueryContext(userMessage: string): QueryContext {
  const lowerMessage = userMessage.toLowerCase();
  
  // General knowledge indicators
  const generalIndicators = [
    /what is (?:scrum|agile|kanban|lean|waterfall)/i,
    /explain (?:scrum|agile|kanban|lean|waterfall)/i,
    /define\s+\w+/i,
    /how does \w+ work/i,
    /what are the principles of/i,
    /what are the benefits of/i,
    /tell me about \w+/i,
    /difference between \w+ and \w+/i,
    /when should (?:i|you|we) use/i,
    /pros and cons of/i,
    /best practices for \w+ in general/i
  ];

  // Specific product indicators  
  const specificIndicators = [
    /my features?/i,
    /our product/i,
    /my roadmap/i,
    /our users?/i,
    /my team/i,
    /our data/i,
    /should (?:i|we) (?:build|prioritize|launch)/i,
    /how (?:can|should) (?:i|we) (?:improve|optimize|measure)/i,
    /what's the best way to \w+ (?:my|our)/i,
    /help me (?:prioritize|plan|analyze)/i,
    /recommend.*for (?:my|our)/i
  ];

  // Hybrid indicators (general knowledge applied to specific context)
  const hybridIndicators = [
    /how (?:can|should) (?:i|we) (?:implement|apply|use) \w+ (?:for|in|with)/i,
    /what \w+ framework (?:should|would) work best for/i,
    /how to apply \w+ to/i,
    /use \w+ (?:for|with|in) my/i
  ];

  let generalScore = 0;
  let specificScore = 0;
  let hybridScore = 0;

  // Score general knowledge patterns
  generalIndicators.forEach(pattern => {
    if (pattern.test(lowerMessage)) {
      generalScore += 2;
    }
  });

  // Score specific product patterns
  specificIndicators.forEach(pattern => {
    if (pattern.test(lowerMessage)) {
      specificScore += 2;
    }
  });

  // Score hybrid patterns
  hybridIndicators.forEach(pattern => {
    if (pattern.test(lowerMessage)) {
      hybridScore += 3;
    }
  });

  // Additional scoring based on question words and context
  if (lowerMessage.startsWith('what is') || lowerMessage.startsWith('what are')) {
    generalScore += 1;
  }

  if (lowerMessage.includes('should i') || lowerMessage.includes('help me')) {
    specificScore += 1;
  }

  // Determine primary type
  const maxScore = Math.max(generalScore, specificScore, hybridScore);
  let type: 'general' | 'specific' | 'hybrid';
  let useProductData: boolean;
  let promptModifications: string[] = [];

  if (hybridScore === maxScore && hybridScore > 0) {
    type = 'hybrid';
    useProductData = true;
    promptModifications = [
      'Provide general knowledge first, then specific application to user\'s product context',
      'Include both theoretical explanation and practical implementation advice'
    ];
  } else if (generalScore === maxScore && generalScore > specificScore) {
    type = 'general';
    useProductData = false;
    promptModifications = [
      'Focus on providing comprehensive general knowledge',
      'Include industry best practices and common approaches',
      'Only briefly mention user\'s product context if highly relevant'
    ];
  } else {
    type = 'specific';
    useProductData = true;
    promptModifications = [
      'Analyze user\'s product data thoroughly before responding',
      'Provide specific recommendations based on their actual features and context'
    ];
  }

  const confidence = maxScore / (generalScore + specificScore + hybridScore + 1);

  let reasoning = '';
  if (type === 'general') {
    reasoning = `Query appears to be asking for general knowledge (score: ${generalScore}). User wants to understand concepts rather than get specific product advice.`;
  } else if (type === 'specific') {
    reasoning = `Query is asking for specific product advice (score: ${specificScore}). User wants actionable recommendations for their product.`;
  } else {
    reasoning = `Query is asking for general knowledge applied to specific context (score: ${hybridScore}). User wants to understand concepts and how to apply them.`;
  }

  return {
    type,
    confidence,
    reasoning,
    useProductData,
    promptModifications
  };
}

/**
 * Generate context-appropriate system prompt modifications
 */
export function getContextualPromptModification(queryContext: QueryContext): string {
  if (queryContext.type === 'general') {
    return `
## Response Mode: General Knowledge
This query is asking for general product management knowledge rather than specific product advice.

**Response Approach:**
- Provide comprehensive explanation of the concept/framework
- Include industry best practices and common approaches  
- Focus on educational content rather than specific recommendations
- Only mention user's product context if directly relevant to the explanation
- Structure as: Definition → Key Principles → How It Works → When to Use → Best Practices

**Tone:** Educational and comprehensive, like a PM textbook or training resource.
`;
  }

  if (queryContext.type === 'hybrid') {
    return `
## Response Mode: General Knowledge + Specific Application  
This query wants general knowledge applied to the user's specific product context.

**Response Approach:**
1. **First:** Provide clear explanation of the concept/framework
2. **Then:** Show how it applies to their specific product and industry
3. **Finally:** Give actionable next steps for implementation

**Structure:** 
- General explanation of concept
- "How this applies to your [product type] in [industry]"  
- Specific implementation recommendations using their data
`;
  }

  // Default for 'specific' type
  return `
## Response Mode: Product-Specific Advice
This query is asking for specific advice about the user's product.

**Response Approach:**
- Analyze their product data first
- Provide targeted recommendations based on their context
- Reference their actual features, releases, and requirements
- Focus on actionable next steps they can implement immediately
`;
}

/**
 * Example usage patterns for testing
 */
export const EXAMPLE_QUERIES = {
  general: [
    "What is SCRUM?",
    "Explain the difference between Agile and Waterfall",
    "What are the principles of Lean product development?",
    "Tell me about the RICE prioritization framework",
    "What are the benefits of user story mapping?"
  ],
  specific: [
    "Help me prioritize my features",
    "Should I build this feature next?",
    "How can I improve user engagement in my app?",
    "What metrics should I track for my SaaS product?",
    "Analyze my current feature portfolio"
  ],
  hybrid: [
    "How should I implement SCRUM for my fintech product?",
    "What agile framework would work best for my team?",
    "How can I apply RICE scoring to my current features?",
    "Should I use Kanban or SCRUM for my development process?",
    "How do I implement OKRs for my product team?"
  ]
};
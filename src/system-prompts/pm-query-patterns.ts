/**
 * Product Management Query Patterns and Response Templates
 * 
 * Defines common PM queries and how the AI should structure responses
 * to be most helpful for Product Managers.
 */

export interface PMQueryPattern {
  pattern: RegExp;
  category: 'prioritization' | 'strategy' | 'metrics' | 'discovery' | 'planning' | 'stakeholder';
  responseTemplate: string;
  suggestedFrameworks: string[];
  followUpQuestions: string[];
}

export const PM_QUERY_PATTERNS: PMQueryPattern[] = [
  // Prioritization queries
  {
    pattern: /prioriti[zs]e|priority|which.*(first|next|important)|should.*build.*first/i,
    category: 'prioritization',
    responseTemplate: `
## Feature Prioritization Analysis

Based on your current features, here's a prioritization approach:

**High Priority Features:**
[List features with rationale]

**Recommended Framework:** Use RICE scoring to quantify:
- **Reach**: How many users affected?
- **Impact**: Business/user impact level (3=high, 1=medium, 0.5=low)
- **Confidence**: How sure are you? (100%=high, 50%=low)
- **Effort**: Development time in person-months

**Next Steps:**
1. Score your top features using RICE
2. Validate assumptions with user research
3. Align with stakeholders on priorities
    `,
    suggestedFrameworks: ['RICE', 'MoSCoW', 'KanoModel'],
    followUpQuestions: [
      'What business goals are you trying to achieve this quarter?',
      'Which user segments are most important to you?',
      'What constraints do you have (time, resources, dependencies)?'
    ]
  },

  // Roadmap planning
  {
    pattern: /roadmap|timeline|plan|release|launch/i,
    category: 'planning',
    responseTemplate: `
## Roadmap Planning Analysis

**Current Release Status:**
[Analyze current releases and timeline]

**Roadmap Recommendations:**
[Strategic roadmap suggestions based on data]

**Release Planning Framework:**
1. **Theme-based roadmaps** for flexibility
2. **Quarterly milestones** with monthly check-ins
3. **Dependency mapping** to avoid blockers

**Next Steps:**
1. Define success metrics for each release
2. Identify dependencies and risks
3. Communicate timeline to stakeholders
    `,
    suggestedFrameworks: ['UserStoryMapping', 'MoSCoW'],
    followUpQuestions: [
      'What are your key milestones or deadlines?',
      'What dependencies exist between features?',
      'How do you measure release success?'
    ]
  },

  // Metrics and measurement
  {
    pattern: /metric|measure|track|kpi|analytics|success/i,
    category: 'metrics',
    responseTemplate: `
## Product Metrics Strategy

**Current Product Stage Analysis:**
[Based on detected maturity stage]

**Recommended Metric Framework:**
[AARRR for early stage, HEART for mature products]

**Key Metrics to Track:**
[Specific metrics based on product type and stage]

**Implementation Plan:**
1. Define baseline measurements
2. Set up tracking infrastructure
3. Create dashboards for stakeholders
4. Review metrics weekly/monthly
    `,
    suggestedFrameworks: ['AARRR', 'HEART', 'NorthStar'],
    followUpQuestions: [
      'What business outcomes are you trying to drive?',
      'How do you currently measure success?',
      'What tools do you have for analytics?'
    ]
  },

  // Feature analysis
  {
    pattern: /feature|functionality|capability|build|develop/i,
    category: 'discovery',
    responseTemplate: `
## Feature Analysis

**Current Features Overview:**
[Analyze existing features from data]

**Feature Recommendations:**
[Based on gaps and opportunities]

**Discovery Questions:**
- What job is this feature helping users accomplish?
- What's the expected business impact?
- How will you measure success?

**Validation Approach:**
1. User interviews to validate problem
2. Prototype/wireframe for feedback
3. A/B test if possible
4. Track adoption metrics post-launch
    `,
    suggestedFrameworks: ['JobsToBeHired', 'UserStoryMapping'],
    followUpQuestions: [
      'What user problem does this solve?',
      'How do users currently solve this problem?',
      'What would success look like?'
    ]
  },

  // Stakeholder communication
  {
    pattern: /stakeholder|communicate|present|update|alignment/i,
    category: 'stakeholder',
    responseTemplate: `
## Stakeholder Communication Strategy

**Key Messages:**
[Based on current product state and priorities]

**Communication Framework:**
1. **Executive Summary**: High-level business impact
2. **Progress Update**: What's been accomplished
3. **Upcoming Priorities**: What's next and why
4. **Risks/Blockers**: What needs attention
5. **Success Metrics**: How you're measuring progress

**Presentation Tips:**
- Lead with business outcomes, not features
- Use data to support decisions
- Be transparent about trade-offs
- Provide clear next steps
    `,
    suggestedFrameworks: ['NorthStar'],
    followUpQuestions: [
      'Who are your key stakeholders?',
      'What concerns do they typically have?',
      'How often do you need to communicate updates?'
    ]
  }
];

/**
 * Detect the type of PM query and return appropriate guidance
 */
export function detectPMQueryType(userMessage: string): PMQueryPattern | null {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const pattern of PM_QUERY_PATTERNS) {
    if (pattern.pattern.test(lowerMessage)) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Generate PM-specific response structure based on query type
 */
export function generatePMResponseGuidance(userMessage: string): string {
  const queryPattern = detectPMQueryType(userMessage);
  
  if (!queryPattern) {
    return `## Product Management Approach
Structure your response to be actionable for a Product Manager:
1. **Analysis**: What the data shows
2. **Recommendations**: Specific next steps
3. **Framework**: Relevant PM methodology
4. **Success Metrics**: How to measure outcomes`;
  }

  let guidance = `## PM Response Structure (${queryPattern.category})
${queryPattern.responseTemplate}

**Suggested Frameworks:** ${queryPattern.suggestedFrameworks.join(', ')}

**Follow-up Questions to Consider:**`;

  queryPattern.followUpQuestions.forEach(question => {
    guidance += `\n- ${question}`;
  });

  return guidance;
}
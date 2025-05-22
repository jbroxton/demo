/**
 * Product Management Frameworks and Methodologies
 * 
 * Provides PM-specific frameworks, templates, and guidance that the AI can reference
 * when helping Product Managers with strategic decisions.
 */

export const PM_FRAMEWORKS = {
  prioritization: {
    RICE: {
      name: "RICE (Reach, Impact, Confidence, Effort)",
      description: "Score features based on Reach × Impact × Confidence ÷ Effort",
      whenToUse: "Feature prioritization with quantitative data",
      template: `
## RICE Scoring Framework
**Reach**: How many users will this impact in a given time period?
**Impact**: How much will this improve the experience for each user? (Scale: 3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal)
**Confidence**: How confident are you in your estimates? (Scale: 100%=high, 80%=medium, 50%=low)
**Effort**: How much work will this require from your team? (In person-months)

**RICE Score = (Reach × Impact × Confidence) ÷ Effort**
      `
    },
    MoSCoW: {
      name: "MoSCoW (Must have, Should have, Could have, Won't have)",
      description: "Categorize requirements by priority levels",
      whenToUse: "Release planning and stakeholder alignment",
      template: `
## MoSCoW Prioritization
**Must Have**: Critical for success, non-negotiable
**Should Have**: Important but not critical, can be delayed if needed
**Could Have**: Nice-to-have features that add value
**Won't Have**: Features explicitly excluded from this scope
      `
    },
    KanoModel: {
      name: "Kano Model",
      description: "Categorize features by customer satisfaction impact",
      whenToUse: "Understanding feature value and customer satisfaction",
      categories: ["Must-be", "One-dimensional", "Attractive", "Indifferent", "Reverse"]
    }
  },

  discovery: {
    JobsToBeHired: {
      name: "Jobs to be Hired Framework",
      description: "Understand what job customers are hiring your product to do",
      questions: [
        "What job is the customer trying to get done?",
        "What are they using today to get this job done?",
        "What outcomes are they hoping to achieve?",
        "What are the emotional and functional dimensions?"
      ]
    },
    UserStoryMapping: {
      name: "User Story Mapping",
      description: "Visualize user journey and identify gaps",
      structure: "User Activities → User Tasks → User Stories → Story Details"
    }
  },

  metrics: {
    AARRR: {
      name: "Pirate Metrics (AARRR)",
      stages: ["Acquisition", "Activation", "Retention", "Referral", "Revenue"],
      description: "Funnel-based metrics for growth tracking"
    },
    HEART: {
      name: "HEART Framework (Google)",
      metrics: ["Happiness", "Engagement", "Adoption", "Retention", "Task success"],
      description: "User-centered metrics framework"
    }
  },

  strategy: {
    NorthStar: {
      name: "North Star Framework",
      components: ["North Star Metric", "Work Streams", "Inputs"],
      description: "Align team around single key metric that drives business value"
    }
  }
};

/**
 * Get relevant frameworks based on user query and product context
 */
export function getRelevantFrameworks(query: string, productStage: string): string[] {
  const lowerQuery = query.toLowerCase();
  const frameworks: string[] = [];

  // Prioritization queries
  if (lowerQuery.includes('prioritiz') || lowerQuery.includes('priority')) {
    frameworks.push('RICE', 'MoSCoW');
  }

  // Feature planning queries
  if (lowerQuery.includes('feature') || lowerQuery.includes('roadmap')) {
    frameworks.push('RICE', 'KanoModel', 'UserStoryMapping');
  }

  // Metrics queries
  if (lowerQuery.includes('metric') || lowerQuery.includes('measure') || lowerQuery.includes('kpi')) {
    if (productStage === 'Early Stage') {
      frameworks.push('AARRR');
    } else {
      frameworks.push('HEART', 'AARRR');
    }
  }

  // Strategy queries
  if (lowerQuery.includes('strategy') || lowerQuery.includes('goal') || lowerQuery.includes('objective')) {
    frameworks.push('NorthStar', 'JobsToBeHired');
  }

  return frameworks;
}

/**
 * Get framework details by name
 */
export function getFrameworkDetails(frameworkName: string): any {
  // Flatten all frameworks for lookup
  const allFrameworks: Record<string, any> = {
    ...PM_FRAMEWORKS.prioritization,
    ...PM_FRAMEWORKS.discovery,
    ...PM_FRAMEWORKS.metrics,
    ...PM_FRAMEWORKS.strategy
  };

  return allFrameworks[frameworkName];
}
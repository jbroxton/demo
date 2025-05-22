/**
 * Product Management Conversation Starters
 * 
 * Provides intelligent conversation starters and suggested questions
 * based on the user's product context and current state.
 */

import { ProductContext } from './product-context-analyzer';

export interface PMConversationStarter {
  category: string;
  questions: string[];
  context: string;
}

/**
 * Generate relevant conversation starters based on product context
 */
export function generatePMConversationStarters(
  productContext: ProductContext,
  dataCount: { features: number; releases: number; requirements: number; roadmaps: number }
): PMConversationStarter[] {
  const starters: PMConversationStarter[] = [];

  // Early stage prompts
  if (productContext.maturityStage === 'Early Stage' || dataCount.features < 10) {
    starters.push({
      category: "MVP & Prioritization",
      questions: [
        "Help me prioritize my features for the MVP",
        "What's the minimum viable feature set for launch?",
        "How should I validate these features with users?",
        "Which features are must-have vs nice-to-have?"
      ],
      context: "Focus on core value proposition and user validation"
    });
  }

  // Growth stage prompts
  if (productContext.maturityStage === 'Growth' || (dataCount.features > 10 && dataCount.releases > 2)) {
    starters.push({
      category: "Growth & Optimization", 
      questions: [
        "How can I improve user engagement and retention?",
        "What features should I build to scale the product?",
        "How do I measure product-market fit?",
        "What metrics should I track for growth?"
      ],
      context: "Focus on scaling and optimization"
    });
  }

  // Roadmap planning
  if (dataCount.features > 5) {
    starters.push({
      category: "Roadmap Planning",
      questions: [
        "Help me create a quarterly roadmap",
        "How should I sequence these features?",
        "What dependencies exist between my features?",
        "How do I communicate roadmap changes to stakeholders?"
      ],
      context: "Strategic planning and execution"
    });
  }

  // Industry-specific starters
  if (productContext.industry === 'Fintech') {
    starters.push({
      category: "Fintech Strategy",
      questions: [
        "How do I prioritize compliance vs new features?",
        "What security features are essential for financial products?",
        "How should I approach regulatory requirements in my roadmap?",
        "What payment features have the highest user impact?"
      ],
      context: "Financial services considerations"
    });
  }

  if (productContext.industry === 'Healthcare') {
    starters.push({
      category: "Healthcare Product Strategy",
      questions: [
        "How do I balance HIPAA compliance with user experience?",
        "What clinical workflow features are most critical?",
        "How should I approach patient data security?",
        "What healthcare integrations should I prioritize?"
      ],
      context: "Healthcare industry requirements"
    });
  }

  // Product type specific
  if (productContext.productType === 'B2B') {
    starters.push({
      category: "B2B Product Management",
      questions: [
        "How do I balance enterprise vs SMB customer needs?",
        "What admin and permission features are essential?",
        "How should I approach customer onboarding and training?",
        "What integration capabilities do B2B customers need most?"
      ],
      context: "Enterprise and business customer focus"
    });
  }

  if (productContext.productType === 'SaaS') {
    starters.push({
      category: "SaaS Metrics & Growth",
      questions: [
        "What's my current churn rate and how can I improve it?",
        "How do I increase user activation and time-to-value?",
        "What pricing and packaging strategy should I use?",
        "How do I measure feature adoption across my user base?"
      ],
      context: "Subscription business model optimization"
    });
  }

  // Data analysis starters
  if (dataCount.features > 0) {
    starters.push({
      category: "Data Analysis",
      questions: [
        "Analyze my current feature portfolio",
        "What gaps do you see in my product offering?",
        "How do my features compare to industry standards?",
        "What's the overall health of my product backlog?"
      ],
      context: "Leverage your existing product data"
    });
  }

  // Generic PM starters if no specific context
  if (starters.length === 0) {
    starters.push({
      category: "Product Strategy",
      questions: [
        "Help me define my product strategy",
        "What frameworks should I use for prioritization?",
        "How do I set up product metrics and KPIs?",
        "What's the best way to gather user feedback?"
      ],
      context: "Foundational product management"
    });
  }

  return starters;
}

/**
 * Generate contextual follow-up questions based on current conversation
 */
export function generateFollowUpQuestions(userMessage: string, productContext: ProductContext): string[] {
  const followUps: string[] = [];
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('prioritiz') || lowerMessage.includes('priority')) {
    followUps.push(
      "What are your main business objectives this quarter?",
      "Who are your primary user segments?",
      "What constraints do you have (time, team size, dependencies)?",
      "How do you currently make prioritization decisions?"
    );
  }

  if (lowerMessage.includes('metric') || lowerMessage.includes('measure')) {
    followUps.push(
      "What business outcomes are you trying to drive?",
      "What tools do you currently use for analytics?",
      "How often do you review metrics with your team?",
      "What's your current biggest challenge with measurement?"
    );
  }

  if (lowerMessage.includes('roadmap') || lowerMessage.includes('plan')) {
    followUps.push(
      "What's your planning horizon (quarterly, yearly)?",
      "Who are the key stakeholders you need to align with?",
      "What external dependencies or deadlines do you have?",
      "How do you handle roadmap changes and communication?"
    );
  }

  if (lowerMessage.includes('feature') || lowerMessage.includes('build')) {
    followUps.push(
      "What user problem does this solve?",
      "How will you measure success for this feature?",
      "What's the expected business impact?",
      "How will you validate this before building?"
    );
  }

  return followUps;
}
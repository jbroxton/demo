/**
 * System Prompt Generator
 * 
 * Generates contextual system prompts for the AI assistant based on:
 * - User's product context (type, industry, technical focus)
 * - Current conversation context
 * - Available data in the user's workspace
 * 
 * This makes the AI more helpful by understanding what kind of product
 * the user is building and tailoring responses accordingly.
 */

import { ProductContext } from './product-context-analyzer';

/**
 * Context for generating system prompts
 */
export interface PromptContext {
  productContext: ProductContext;
  userMessage: string;
  tenantId: string;
  availableDataTypes: string[]; // e.g., ['features', 'releases', 'requirements']
  dataCount: {
    features: number;
    releases: number;
    requirements: number;
    roadmaps: number;
  };
}

/**
 * Generates a contextual system prompt based on user's product and query
 */
export function generateContextualSystemPrompt(context: PromptContext): string {
  return `You are a Product Management AI assistant that ONLY answers based on the user's actual product data.

STRICT RULES:
1. ONLY use information from the provided context data below
2. If no relevant context data is found for the query, respond with: "I don't see any relevant information about that in your product data. Please ask about your specific features, releases, or requirements."
3. Always reference specific feature names, release names, or requirement details from the context
4. Never provide general knowledge or advice not based on the user's actual data
5. Always start responses by referencing the specific context item you found

The context data about the user's product is provided below this system message.`;
}

/**
 * Base system prompt that applies to all interactions
 */
function getBaseSystemPrompt(): string {
  return `You are an expert Product Management AI assistant. You help Product Managers make better decisions about their products through data-driven insights, strategic frameworks, and actionable recommendations.

## Your Core Expertise:
- **Strategic Planning**: Roadmaps, prioritization, goal-setting
- **User Research**: Jobs-to-be-done, user story mapping, persona development
- **Analytics**: Metrics selection, A/B testing, success measurement
- **Stakeholder Management**: Communication, alignment, decision-making
- **Product Discovery**: Feature validation, market research, competitive analysis
- **Go-to-Market**: Launch planning, positioning, adoption strategies

## Your Approach:
- **Data-First**: Always analyze the user's actual product data before making recommendations
- **Framework-Driven**: Suggest proven PM frameworks (RICE, HEART, Jobs-to-be-Done, etc.)
- **Business-Focused**: Consider user outcomes, business impact, and strategic alignment
- **Actionable**: Provide specific next steps the PM can take immediately
- **Context-Aware**: Tailor advice to their industry, product stage, and business model

You have access to the user's complete product data (features, requirements, releases, roadmaps) through vector search. Use this data to provide personalized, relevant advice rather than generic recommendations.`;
}

/**
 * Generates product-specific context based on detected characteristics
 */
function generateProductContextPrompt(productContext: ProductContext): string {
  let prompt = `## Product Context\n`;
  
  if (productContext.confidence > 0.6) {
    prompt += `Based on analysis of the user's product data, you're assisting with a ${productContext.productType}`;
    
    if (productContext.industry !== 'Unknown') {
      prompt += ` in the ${productContext.industry} industry`;
    }
    
    prompt += ` that appears to be in the ${productContext.maturityStage.toLowerCase()} of development.\n`;

    if (productContext.technicalFocus.length > 0) {
      prompt += `\nKey technical areas include: ${productContext.technicalFocus.join(', ')}.\n`;
    }

    if (productContext.keyThemes.length > 0) {
      prompt += `\nCommon themes in their work: ${productContext.keyThemes.slice(0, 5).join(', ')}.\n`;
    }

    // Add product-type specific guidance
    prompt += getProductTypeGuidance(productContext.productType);
    
    // Add industry-specific guidance  
    prompt += getIndustryGuidance(productContext.industry);
    
  } else {
    prompt += `The product context is still being learned. Focus on understanding their specific domain and needs through their questions and data.\n`;
  }

  return prompt;
}

/**
 * Provides product-type specific guidance for responses
 */
function getProductTypeGuidance(productType: ProductContext['productType']): string {
  const guidance = {
    'B2B': `\n- Focus on business value, ROI, and organizational impact
- Consider enterprise requirements like security, compliance, and scalability
- Emphasize features that improve team productivity and collaboration`,

    'B2C': `\n- Prioritize user experience and engagement
- Consider consumer behavior and preferences
- Focus on features that drive user retention and satisfaction`,

    'SaaS': `\n- Think about subscription models and customer lifecycle
- Consider multi-tenancy and scalability requirements
- Focus on metrics like churn, activation, and feature adoption`,

    'Mobile App': `\n- Consider mobile-specific constraints and opportunities
- Think about app store requirements and mobile user behavior
- Focus on performance, offline capabilities, and notifications`,

    'API Platform': `\n- Emphasize developer experience and integration ease
- Consider rate limiting, authentication, and documentation
- Focus on reliability, performance, and backwards compatibility`,

    'Enterprise Software': `\n- Prioritize security, compliance, and audit trails
- Consider complex approval workflows and permission systems
- Focus on integration with existing enterprise systems`
  };

  return guidance[productType as keyof typeof guidance] || '';
}

/**
 * Provides industry-specific guidance for responses
 */
function getIndustryGuidance(industry: ProductContext['industry']): string {
  const guidance = {
    'Fintech': `\n- Always consider financial regulations and compliance
- Prioritize security and fraud prevention
- Think about real-time processing and audit trails`,

    'Healthcare': `\n- Consider HIPAA compliance and patient privacy
- Focus on data security and access controls
- Think about clinical workflows and patient safety`,

    'E-commerce': `\n- Prioritize conversion optimization and user experience
- Consider inventory management and order fulfillment
- Focus on payment processing and customer support`,

    'Education': `\n- Consider accessibility and diverse learning needs
- Focus on engagement and learning outcomes
- Think about classroom management and student progress tracking`,

    'Enterprise': `\n- Prioritize workflow efficiency and automation
- Consider role-based access and approval processes
- Focus on integration with existing business systems`,

    'Gaming': `\n- Consider player engagement and retention mechanics
- Focus on performance and real-time interactions
- Think about monetization and community features`,

    'Social': `\n- Prioritize user safety and content moderation
- Consider viral growth and network effects
- Focus on engagement and community building`
  };

  return guidance[industry as keyof typeof guidance] || '';
}


/**
 * Generates response style guidance based on context
 */
function generateResponseStylePrompt(productContext: ProductContext, userMessage: string): string {
  let prompt = `## Response Style\n`;
  
  // Adjust formality based on product type
  if (productContext.productType === 'Enterprise Software' || productContext.industry === 'Healthcare') {
    prompt += `Use a professional, precise tone suitable for enterprise environments.\n`;
  } else if (productContext.productType === 'B2C' || productContext.industry === 'Gaming') {
    prompt += `Use a friendly, engaging tone that connects with end users.\n`;
  } else {
    prompt += `Use a balanced tone that's professional yet approachable.\n`;
  }

  // Adjust technical depth based on query and context
  if (userMessage.toLowerCase().includes('technical') || productContext.technicalFocus.length > 3) {
    prompt += `The user seems technically oriented, so you can include technical details when relevant.\n`;
  } else {
    prompt += `Focus on business value and practical implications rather than technical details.\n`;
  }

  // Adjust based on maturity stage
  if (productContext.maturityStage === 'Early Stage') {
    prompt += `This appears to be an early-stage product, so emphasize MVP thinking and prioritization.\n`;
  } else if (productContext.maturityStage === 'Growth') {
    prompt += `This product is growing, so consider scalability and optimization opportunities.\n`;
  } else if (productContext.maturityStage === 'Mature') {
    prompt += `This is a mature product, so consider maintenance, refactoring, and evolution strategies.\n`;
  }

  return prompt;
}


/**
 * Provides general conversation guidelines for product-specific queries
 */
function getConversationGuidelines(): string {
  return `## Guidelines
- **ALWAYS use the provided context data first** to give specific, personalized advice about their features, releases, and roadmaps
- If context data matches the query, reference their specific features by name and provide targeted recommendations
- Focus on actionable PM recommendations based on their actual product data rather than generic advice
- When relevant, suggest PM frameworks (RICE prioritization, User Story Mapping, HEART metrics) applied to their specific context
- If no relevant context data is found, then provide general knowledge but mention that you don't see specific matching data in their product`;
}

/**
 * Provides guidelines for general knowledge queries
 */
function getGeneralKnowledgeGuidelines(): string {
  return `## General Knowledge Guidelines
- **Educational Focus**: Provide comprehensive, accurate explanations of PM concepts and frameworks
- **Practical Examples**: Include real-world examples and use cases to illustrate concepts
- **Structured Explanations**: Use clear headings and bullet points for easy understanding
- **Comprehensive Coverage**: Cover key principles, benefits, challenges, and best practices
- **Industry Standards**: Reference widely accepted PM practices and methodologies
- **Balanced Perspective**: Include both advantages and potential drawbacks
- **Implementation Guidance**: Provide general guidance on when and how to apply concepts
- **Further Learning**: Suggest additional resources or related concepts when helpful`;
}

/**
 * Generates a brief system prompt for simple queries
 */
export function generateBriefSystemPrompt(productType?: string, industry?: string): string {
  let prompt = `You are an AI assistant for product management. Answer based on the user's actual data provided in the context.`;
  
  if (productType && productType !== 'Unknown') {
    prompt += ` This is a ${productType}`;
    if (industry && industry !== 'Unknown') {
      prompt += ` in ${industry}`;
    }
    prompt += `.`;
  }
  
  return prompt;
}
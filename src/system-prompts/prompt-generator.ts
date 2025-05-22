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
import { getRelevantFrameworks, getFrameworkDetails } from './pm-frameworks';
import { generatePMResponseGuidance } from './pm-query-patterns';
import { analyzeQueryContext, getContextualPromptModification } from './query-context-detector';

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
  // Analyze query context to determine if it's general knowledge vs specific product advice
  const queryContext = analyzeQueryContext(context.userMessage);
  
  const basePrompt = getBaseSystemPrompt();
  const queryContextModification = getContextualPromptModification(queryContext);
  
  // Only include product-specific sections if the query needs product data
  if (queryContext.useProductData) {
    const productContextPrompt = generateProductContextPrompt(context.productContext);
    const dataContextPrompt = generateDataContextPrompt(context.dataCount);
    const responseStylePrompt = generateResponseStylePrompt(context.productContext, context.userMessage);
    const pmFrameworksPrompt = generatePMFrameworksPrompt(context.userMessage, context.productContext.maturityStage);
    const pmResponseGuidance = generatePMResponseGuidance(context.userMessage);

    return [
      basePrompt,
      queryContextModification,
      productContextPrompt,
      dataContextPrompt,
      responseStylePrompt,
      pmFrameworksPrompt,
      pmResponseGuidance,
      getConversationGuidelines()
    ].join('\n\n');
  } else {
    // For general knowledge queries, use minimal context
    return [
      basePrompt,
      queryContextModification,
      getGeneralKnowledgeGuidelines()
    ].join('\n\n');
  }
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
 * Generates context about available data
 */
function generateDataContextPrompt(dataCount: PromptContext['dataCount']): string {
  const totalItems = Object.values(dataCount).reduce((sum, count) => sum + count, 0);
  
  if (totalItems === 0) {
    return `## Data Context\nThe user's workspace is currently empty. Help them get started by suggesting how to create their first features, requirements, or releases.`;
  }

  let prompt = `## Data Context\nThe user's workspace contains:\n`;
  
  if (dataCount.features > 0) {
    prompt += `- ${dataCount.features} feature${dataCount.features === 1 ? '' : 's'}\n`;
  }
  if (dataCount.releases > 0) {
    prompt += `- ${dataCount.releases} release${dataCount.releases === 1 ? '' : 's'}\n`;
  }
  if (dataCount.requirements > 0) {
    prompt += `- ${dataCount.requirements} requirement${dataCount.requirements === 1 ? '' : 's'}\n`;
  }
  if (dataCount.roadmaps > 0) {
    prompt += `- ${dataCount.roadmaps} roadmap${dataCount.roadmaps === 1 ? '' : 's'}\n`;
  }

  prompt += `\nUse this data to provide specific, accurate answers about their product.`;

  return prompt;
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
 * Generates PM framework recommendations based on user query
 */
function generatePMFrameworksPrompt(userMessage: string, maturityStage: string): string {
  const relevantFrameworks = getRelevantFrameworks(userMessage, maturityStage);
  
  if (relevantFrameworks.length === 0) {
    return `## Product Management Approach
When appropriate, suggest relevant PM frameworks like RICE prioritization, User Story Mapping, HEART metrics, or North Star framework to help structure their thinking.`;
  }

  let prompt = `## Recommended PM Frameworks
Based on your query, consider these frameworks:\n`;

  relevantFrameworks.forEach(frameworkName => {
    const framework = getFrameworkDetails(frameworkName);
    if (framework) {
      prompt += `\n**${framework.name}**: ${framework.description}`;
      if (framework.whenToUse) {
        prompt += ` (Best for: ${framework.whenToUse})`;
      }
    }
  });

  prompt += `\n\nWhen providing advice, reference these frameworks and help the user apply them to their specific situation.`;
  
  return prompt;
}

/**
 * Provides general conversation guidelines for product-specific queries
 */
function getConversationGuidelines(): string {
  return `## Product Management Guidelines
- **Think like a PM**: Focus on user outcomes, business impact, and strategic alignment
- **Data-driven decisions**: Always check the provided context data before answering
- **Actionable advice**: Suggest specific actions they can take in their product management platform
- **Framework-driven**: When relevant, suggest PM frameworks (RICE, MoSCoW, HEART, etc.) to structure thinking
- **Prioritization focus**: Help them prioritize features based on impact, effort, and strategic goals
- **User-centric**: Keep the focus on solving real user problems and delivering value
- **Business context**: Consider their industry, product stage, and business model in recommendations
- **Stakeholder alignment**: Help them communicate decisions and rationale clearly
- **Iterative mindset**: Encourage experimentation, measurement, and continuous improvement
- **Reference actual data**: When discussing features or requirements, reference their specific data`;
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
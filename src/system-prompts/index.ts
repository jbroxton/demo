/**
 * System Prompts Module
 * 
 * Provides intelligent, context-aware system prompt generation for the AI assistant.
 * 
 * Features:
 * - Product context analysis from user's features/releases/requirements
 * - Industry and product type detection
 * - Technical focus area identification
 * - Maturity stage assessment
 * - Contextual system prompt generation
 */

export { analyzeProductContext } from './product-context-analyzer';
export { generateContextualSystemPrompt, generateBriefSystemPrompt } from './prompt-generator';
export { PM_FRAMEWORKS, getRelevantFrameworks, getFrameworkDetails } from './pm-frameworks';
export { detectPMQueryType, generatePMResponseGuidance } from './pm-query-patterns';
export { generatePMConversationStarters, generateFollowUpQuestions } from './pm-conversation-starters';
export { analyzeQueryContext, getContextualPromptModification, EXAMPLE_QUERIES } from './query-context-detector';

export type { ProductContext } from './product-context-analyzer';
export type { PromptContext } from './prompt-generator';
export type { PMQueryPattern } from './pm-query-patterns';
export type { PMConversationStarter } from './pm-conversation-starters';
export type { QueryContext } from './query-context-detector';
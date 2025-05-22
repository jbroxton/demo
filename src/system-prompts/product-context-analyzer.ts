/**
 * Product Context Analyzer
 * 
 * Analyzes user's product data (features, releases, roadmaps) to determine:
 * - Product type (B2B, B2C, SaaS, mobile app, etc.)
 * - Industry vertical (fintech, healthcare, e-commerce, etc.)
 * - Technical characteristics (API-heavy, auth-focused, analytics, etc.)
 * - Product maturity stage (early stage, growth, mature)
 * 
 * This context is used to generate intelligent system prompts that make the AI
 * assistant more aware of the user's specific product domain and needs.
 */

import { Feature } from '@/types/models';

/**
 * Product characteristics detected from user's data
 */
export interface ProductContext {
  productType: 'B2B' | 'B2C' | 'SaaS' | 'Mobile App' | 'Enterprise Software' | 'API Platform' | 'Unknown';
  industry: 'Fintech' | 'Healthcare' | 'E-commerce' | 'Education' | 'Enterprise' | 'Gaming' | 'Social' | 'Unknown';
  technicalFocus: string[]; // e.g., ['API', 'Authentication', 'Analytics', 'Real-time']
  maturityStage: 'Early Stage' | 'Growth' | 'Mature' | 'Unknown';
  keyThemes: string[]; // Most common themes/topics in their features
  confidence: number; // 0-1 confidence score in the analysis
}

/**
 * Analyzes features and releases to determine product characteristics
 */
export async function analyzeProductContext(
  features: Feature[],
  releases: any[] = [],
  requirements: any[] = []
): Promise<ProductContext> {
  
  // Combine all text content for analysis
  const allText = [
    ...features.map(f => `${f.name} ${f.description || ''}`),
    ...releases.map(r => `${r.name || ''} ${r.description || ''}`),
    ...requirements.map(req => `${req.title || ''} ${req.description || ''}`)
  ].join(' ').toLowerCase();

  // Detect product type based on keywords and patterns
  const productType = detectProductType(allText, features);
  
  // Detect industry vertical
  const industry = detectIndustry(allText);
  
  // Identify technical focus areas
  const technicalFocus = detectTechnicalFocus(allText);
  
  // Determine maturity stage
  const maturityStage = detectMaturityStage(features, releases);
  
  // Extract key themes
  const keyThemes = extractKeyThemes(allText);
  
  // Calculate confidence based on amount of data and keyword matches
  const confidence = calculateConfidence(features.length, releases.length, allText.length);

  return {
    productType,
    industry,
    technicalFocus,
    maturityStage,
    keyThemes,
    confidence
  };
}

/**
 * Detects product type based on feature patterns and keywords
 */
function detectProductType(text: string, features: Feature[]): ProductContext['productType'] {
  const patterns = {
    'B2B': ['enterprise', 'business', 'admin', 'organization', 'team', 'workspace', 'compliance', 'audit'],
    'B2C': ['consumer', 'user profile', 'social', 'personal', 'individual', 'shopping', 'entertainment'],
    'SaaS': ['subscription', 'billing', 'tenant', 'multi-tenant', 'pricing plan', 'analytics dashboard'],
    'Mobile App': ['push notification', 'offline', 'mobile', 'ios', 'android', 'app store'],
    'API Platform': ['api', 'webhook', 'integration', 'endpoint', 'rate limiting', 'authentication'],
    'Enterprise Software': ['permissions', 'roles', 'approval workflow', 'audit log', 'single sign-on']
  };

  let maxScore = 0;
  let detectedType: ProductContext['productType'] = 'Unknown';

  for (const [type, keywords] of Object.entries(patterns)) {
    const score = keywords.reduce((sum, keyword) => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      return sum + matches;
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedType = type as ProductContext['productType'];
    }
  }

  return maxScore > 0 ? detectedType : 'Unknown';
}

/**
 * Detects industry vertical based on domain-specific keywords
 */
function detectIndustry(text: string): ProductContext['industry'] {
  const industries = {
    'Fintech': ['payment', 'transaction', 'banking', 'financial', 'money', 'wallet', 'invoice', 'billing'],
    'Healthcare': ['patient', 'medical', 'health', 'appointment', 'clinic', 'diagnosis', 'treatment'],
    'E-commerce': ['product', 'cart', 'checkout', 'order', 'inventory', 'shipping', 'customer'],
    'Education': ['student', 'course', 'lesson', 'assignment', 'grade', 'learning', 'curriculum'],
    'Enterprise': ['employee', 'hr', 'payroll', 'department', 'workflow', 'approval', 'compliance'],
    'Gaming': ['player', 'game', 'level', 'score', 'achievement', 'leaderboard', 'multiplayer'],
    'Social': ['friend', 'follow', 'post', 'comment', 'like', 'share', 'feed', 'community']
  };

  let maxScore = 0;
  let detectedIndustry: ProductContext['industry'] = 'Unknown';

  for (const [industry, keywords] of Object.entries(industries)) {
    const score = keywords.reduce((sum, keyword) => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      return sum + matches;
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedIndustry = industry as ProductContext['industry'];
    }
  }

  return maxScore > 0 ? detectedIndustry : 'Unknown';
}

/**
 * Identifies technical focus areas from feature descriptions
 */
function detectTechnicalFocus(text: string): string[] {
  const technicalAreas = {
    'API': ['api', 'rest', 'graphql', 'endpoint', 'webhook'],
    'Authentication': ['auth', 'login', 'signup', 'password', 'oauth', 'jwt', 'session'],
    'Analytics': ['analytics', 'tracking', 'metrics', 'dashboard', 'report', 'chart'],
    'Real-time': ['real-time', 'live', 'websocket', 'push', 'notification', 'streaming'],
    'Database': ['database', 'sql', 'query', 'storage', 'backup', 'migration'],
    'Security': ['security', 'encryption', 'permission', 'role', 'access control'],
    'Performance': ['performance', 'optimization', 'caching', 'speed', 'load time'],
    'Integration': ['integration', 'sync', 'import', 'export', 'third-party'],
    'UI/UX': ['interface', 'design', 'responsive', 'mobile', 'accessibility'],
    'Search': ['search', 'filter', 'query', 'index', 'elasticsearch']
  };

  const detectedAreas: string[] = [];

  for (const [area, keywords] of Object.entries(technicalAreas)) {
    const hasKeywords = keywords.some(keyword => 
      text.includes(keyword)
    );
    
    if (hasKeywords) {
      detectedAreas.push(area);
    }
  }

  return detectedAreas.slice(0, 5); // Return top 5 areas
}

/**
 * Determines product maturity based on feature count and complexity
 */
function detectMaturityStage(features: Feature[], releases: any[]): ProductContext['maturityStage'] {
  const featureCount = features.length;
  const releaseCount = releases.length;
  
  // Look for maturity indicators in feature names/descriptions
  const allText = features.map(f => `${f.name} ${f.description || ''}`).join(' ').toLowerCase();
  
  const maturityIndicators = {
    early: ['mvp', 'prototype', 'basic', 'simple', 'initial', 'first version'],
    growth: ['enhancement', 'improvement', 'optimization', 'scale', 'expand'],
    mature: ['enterprise', 'advanced', 'sophisticated', 'comprehensive', 'migration', 'refactor']
  };

  let stageScores = {
    early: 0,
    growth: 0,
    mature: 0
  };

  // Score based on keywords
  for (const [stage, keywords] of Object.entries(maturityIndicators)) {
    stageScores[stage as keyof typeof stageScores] = keywords.reduce((sum, keyword) => {
      return sum + (allText.includes(keyword) ? 1 : 0);
    }, 0);
  }

  // Adjust scores based on feature and release counts
  if (featureCount < 10) {
    stageScores.early += 2;
  } else if (featureCount < 30) {
    stageScores.growth += 2;
  } else {
    stageScores.mature += 2;
  }

  if (releaseCount < 3) {
    stageScores.early += 1;
  } else if (releaseCount < 10) {
    stageScores.growth += 1;
  } else {
    stageScores.mature += 1;
  }

  // Return stage with highest score
  const maxStage = Object.entries(stageScores).reduce((max, [stage, score]) => 
    score > max.score ? { stage, score } : max
  , { stage: 'Unknown', score: 0 });

  const stageMap = {
    early: 'Early Stage' as const,
    growth: 'Growth' as const,
    mature: 'Mature' as const
  };

  return maxStage.score > 0 ? stageMap[maxStage.stage as keyof typeof stageMap] || 'Unknown' : 'Unknown';
}

/**
 * Extracts key themes/topics from all content
 */
function extractKeyThemes(text: string): string[] {
  // Simple keyword extraction - count word frequency and return most common
  const words = text
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word));

  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  return Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
}

/**
 * Calculates confidence in the analysis based on available data
 */
function calculateConfidence(featureCount: number, releaseCount: number, textLength: number): number {
  let confidence = 0;

  // More features = higher confidence
  if (featureCount > 20) confidence += 0.4;
  else if (featureCount > 10) confidence += 0.3;
  else if (featureCount > 5) confidence += 0.2;
  else confidence += 0.1;

  // More releases = higher confidence  
  if (releaseCount > 5) confidence += 0.2;
  else if (releaseCount > 2) confidence += 0.1;

  // More descriptive text = higher confidence
  if (textLength > 5000) confidence += 0.3;
  else if (textLength > 2000) confidence += 0.2;
  else if (textLength > 500) confidence += 0.1;

  return Math.min(confidence, 1.0);
}
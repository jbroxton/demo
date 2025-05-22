# Enhanced System Prompts Module

This module provides intelligent, context-aware system prompt generation for the AI assistant based on analyzing the user's actual product data.

## Overview

The enhanced system prompts make the AI assistant more helpful by understanding what kind of product the user is building and tailoring responses accordingly. Instead of generic responses, the AI can now provide advice specific to fintech vs healthcare vs e-commerce products.

## Features

### 🧠 Product Context Analysis
- **Product Type Detection**: Automatically identifies B2B, B2C, SaaS, Mobile App, Enterprise Software, or API Platform
- **Industry Classification**: Detects Fintech, Healthcare, E-commerce, Education, Enterprise, Gaming, or Social verticals
- **Technical Focus Areas**: Identifies key technical areas like API, Authentication, Analytics, Real-time, etc.
- **Maturity Assessment**: Determines if the product is Early Stage, Growth, or Mature
- **Confidence Scoring**: Provides confidence level (0-1) in the analysis

### 🎯 Contextual System Prompts
- **Product-Specific Guidance**: Tailors advice based on detected product type and industry
- **Data-Aware Responses**: Knows exactly what data the user has (features, releases, requirements, roadmaps)
- **Technical Depth Adjustment**: Adapts technical level based on user's product and query
- **Maturity-Appropriate Advice**: Suggests MVP thinking for early stage, optimization for growth, etc.

## Architecture

```
/src/system-prompts/
├── product-context-analyzer.ts  # Analyzes user's product data
├── prompt-generator.ts         # Generates contextual prompts
├── index.ts                   # Module exports
└── README.md                  # This documentation
```

## Usage

### Basic Product Analysis
```typescript
import { analyzeProductContext } from '@/system-prompts';

const productContext = await analyzeProductContext(features, releases, requirements);
console.log(productContext.productType);  // 'SaaS'
console.log(productContext.industry);     // 'Fintech'
console.log(productContext.confidence);   // 0.8
```

### Generate Contextual System Prompt
```typescript
import { generateContextualSystemPrompt } from '@/system-prompts';

const promptContext = {
  productContext,
  userMessage: 'How many payment features do we have?',
  tenantId: 'user-123',
  availableDataTypes: ['features', 'releases'],
  dataCount: { features: 15, releases: 3, requirements: 8, roadmaps: 2 }
};

const systemPrompt = generateContextualSystemPrompt(promptContext);
// Returns a detailed, contextual system prompt
```

## How It Works

### 1. Data Collection
The system fetches all user data (features, releases, requirements, roadmaps) using the existing service layer functions.

### 2. Content Analysis
All text content is analyzed for keywords and patterns:
- **Product Type Keywords**: 'enterprise', 'consumer', 'subscription', 'mobile', 'api', etc.
- **Industry Keywords**: 'payment', 'patient', 'order', 'student', 'employee', etc.
- **Technical Keywords**: 'authentication', 'analytics', 'real-time', 'integration', etc.

### 3. Pattern Matching
Uses sophisticated pattern matching to detect:
- Business model (B2B vs B2C)
- Technical architecture patterns
- Industry-specific terminology
- Product maturity indicators

### 4. Prompt Generation
Creates intelligent system prompts that include:
- Product-specific business guidance
- Industry-specific considerations (regulations, compliance, etc.)
- Technical depth appropriate for the user
- Data context awareness

## Examples

### Fintech SaaS Detection
**Input**: Features like "Payment Processing", "Transaction Analytics", "Billing Dashboard"
**Output**: 
- Product Type: SaaS
- Industry: Fintech
- Technical Focus: ['API', 'Authentication', 'Analytics']
- System Prompt: Includes financial regulations, compliance considerations, real-time processing advice

### Healthcare B2B Detection
**Input**: Features like "Patient Records", "Appointment Scheduling", "Medical Reports"
**Output**:
- Product Type: B2B
- Industry: Healthcare  
- Technical Focus: ['Security', 'Database', 'Integration']
- System Prompt: Includes HIPAA compliance, patient privacy, clinical workflow considerations

## Integration with AI Chat

The enhanced system prompts are automatically used in the AI chat API route (`/src/app/api/ai-chat/route.ts`):

1. User sends a message to the AI chat
2. System fetches user's product data
3. Analyzes product context with confidence scoring
4. Generates contextual system prompt
5. AI responds with domain-specific, intelligent advice

## Performance

- **Efficient**: Only analyzes data once per chat session
- **Cached**: Product context could be cached for frequent users
- **Scalable**: Works with any amount of product data
- **Fallback**: Gracefully handles missing or insufficient data

## Confidence Scoring

The system provides confidence scores based on:
- **Data Volume**: More features/releases = higher confidence
- **Keyword Density**: More domain-specific terms = higher confidence  
- **Pattern Strength**: Clear patterns = higher confidence

Confidence levels:
- `> 0.8`: Very confident in analysis
- `0.6 - 0.8`: Confident with good data
- `0.3 - 0.6`: Moderate confidence
- `< 0.3`: Low confidence, uses generic prompts

## Testing

Comprehensive test suite in `/src/unit-tests/enhanced-system-prompts.test.ts` covers:
- Product type detection accuracy
- Industry classification
- System prompt generation
- Edge cases and error handling
- Confidence scoring validation

## Future Enhancements

1. **Machine Learning**: Train models on user feedback to improve accuracy
2. **User Preferences**: Allow users to override detected characteristics
3. **Prompt Templates**: Create reusable prompt templates for common scenarios
4. **A/B Testing**: Test different prompt strategies for effectiveness
5. **Caching**: Cache product context analysis for performance

## Impact

This enhancement makes the AI assistant significantly more useful by:
- **Reducing Generic Responses**: No more one-size-fits-all advice
- **Increasing Relevance**: Advice tailored to actual product domain
- **Improving User Experience**: Users feel the AI "understands" their product
- **Accelerating Productivity**: More actionable, specific recommendations
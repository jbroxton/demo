// Test query classification
const { analyzeQueryContext } = require('./src/system-prompts/query-context-detector.ts');

function testQueries() {
  const testQueries = [
    "What features do we have?",
    "social commerce integration", 
    "Tell me about social commerce integration",
    "What is social commerce?",
    "Show me my features",
    "List all my features",
    "social commerce"
  ];
  
  console.log('Testing query classification:\n');
  
  testQueries.forEach(query => {
    const result = analyzeQueryContext(query);
    console.log(`Query: "${query}"`);
    console.log(`Type: ${result.type}`);
    console.log(`Use Product Data: ${result.useProductData}`);
    console.log(`Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log('---');
  });
}

testQueries();
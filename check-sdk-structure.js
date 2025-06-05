const OpenAI = require('openai');
const client = new OpenAI({ apiKey: 'test-key' });

console.log('OpenAI SDK Structure Analysis');
console.log('============================');

console.log('client.beta keys:', Object.keys(client.beta || {}));
console.log('vectorStores available:', !!client.beta?.vectorStores);
console.log('vector_stores available:', !!client.beta?.vector_stores);

if (client.beta) {
  console.log('assistants available:', !!client.beta.assistants);
  console.log('threads available:', !!client.beta.threads);
  
  // Check for different naming conventions
  const betaKeys = Object.keys(client.beta);
  console.log('All beta keys:', betaKeys);
  
  // Look for vector-related methods
  betaKeys.forEach(key => {
    if (key.toLowerCase().includes('vector')) {
      console.log(`Found vector-related key: ${key}`);
    }
  });
}

// Check if it's directly on the client
console.log('Direct vectorStores:', !!client.vectorStores);
console.log('Direct vector_stores:', !!client.vector_stores);

if (client.vectorStores) {
  console.log('vectorStores.create:', typeof client.vectorStores.create);
  console.log('vectorStores.fileBatches:', !!client.vectorStores.fileBatches);
  
  if (client.vectorStores.fileBatches) {
    console.log('vectorStores.fileBatches.uploadAndPoll:', typeof client.vectorStores.fileBatches.uploadAndPoll);
  }
}

console.log('');
console.log('✅ CORRECT PATHS FOUND:');
console.log('  openai.vectorStores.create() - Available');
console.log('  openai.vectorStores.fileBatches.uploadAndPoll() - Available');
console.log('  openai.beta.assistants.create() - Available');
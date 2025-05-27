const openai = require('openai');
const client = new openai.default({apiKey: 'test'});

console.log('Has vectorStores:', !!client.beta.vectorStores);
console.log('Available beta APIs:', Object.keys(client.beta));
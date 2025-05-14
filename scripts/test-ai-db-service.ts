import { initializeAITables, initializeVectorDatabase } from '../src/services/ai-db';

// Test the service functions
console.log('Testing AI DB service functions...');

try {
  // Test AI tables initialization
  initializeAITables();
  console.log('✓ AI tables initialization function works');
  
  // Test vector database initialization
  initializeVectorDatabase();
  console.log('✓ Vector database initialization function works');
  
  console.log('\nService functions completed successfully');
} catch (error) {
  console.error('Service function test failed:', error);
  process.exit(1);
}
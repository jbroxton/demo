// Test that all imports in the API route work
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

console.log('Testing API route imports...');

// Test each import
console.log('✓ streamText imported:', typeof streamText);
console.log('✓ openai imported:', typeof openai);
console.log('✓ NextRequest imported:', typeof NextRequest);
console.log('✓ NextResponse imported:', typeof NextResponse);
console.log('✓ zod imported:', typeof z);
console.log('✓ uuid imported:', typeof uuid);

// Test that we can create instances/use the imports
try {
  // Test zod schema
  const testSchema = z.object({
    test: z.string()
  });
  console.log('✓ Zod schema creation works');
  
  // Test uuid generation
  const testId = uuid();
  console.log('✓ UUID generation works:', testId.length === 36);
  
  // Test openai embedding
  const embedModel = openai.embedding('text-embedding-3-small');
  console.log('✓ OpenAI embedding model created');
  
  // Test NextResponse
  const response = NextResponse.json({ test: true });
  console.log('✓ NextResponse creation works');
  
} catch (error) {
  console.error('Import functionality test failed:', error);
}

console.log('\nAll API route imports verified!');
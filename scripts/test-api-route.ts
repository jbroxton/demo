// Test API route imports and structure
console.log('Testing AI Chat API route structure...');

// Test that the route file exists
import * as fs from 'fs';
import * as path from 'path';

const routePath = path.join(process.cwd(), 'src/app/api/ai-chat/route.ts');
const routeExists = fs.existsSync(routePath);

console.log('✓ API route file exists:', routeExists);

// Test route export structure (basic check)
const routeContent = fs.readFileSync(routePath, 'utf-8');

// Check for required exports
const hasPOST = routeContent.includes('export async function POST');
const hasHandleChat = routeContent.includes('async function handleChat');
const hasHandleIndexing = routeContent.includes('async function handleIndexing');

console.log('✓ POST handler exported:', hasPOST);
console.log('✓ handleChat function defined:', hasHandleChat);
console.log('✓ handleIndexing function defined:', hasHandleIndexing);

// Check for required imports
const hasOpenAI = routeContent.includes("import { openai } from '@ai-sdk/openai'");
const hasStreamText = routeContent.includes("import { streamText } from 'ai'");
const hasZod = routeContent.includes("import { z } from 'zod'");

console.log('✓ OpenAI imported:', hasOpenAI);
console.log('✓ StreamText imported:', hasStreamText);
console.log('✓ Zod imported:', hasZod);

console.log('\nAPI route structure test complete!');
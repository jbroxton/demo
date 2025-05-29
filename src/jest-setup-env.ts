/**
 * Jest environment setup file
 * This file runs BEFORE the test framework is installed and before any test modules are imported
 * Use this for setting environment variables that need to be available during module loading
 */

// Set environment variables BEFORE any modules are imported
// These values match what's in .env.local
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
process.env.USER_ID = process.env.USER_ID || '20000000-0000-0000-0000-000000000001';
process.env.TENANT_ID = process.env.TENANT_ID || '22222222-2222-2222-2222-222222222222';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key-for-testing';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-nextauth';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';
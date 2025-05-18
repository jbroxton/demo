/**
 * Jest test setup file
 * This file runs before each test suite to configure the test environment
 */

import '@testing-library/jest-dom';

// Mock environment variables if needed
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Add custom matchers or global test utilities here
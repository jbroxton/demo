/**
 * Test providers wrapper for rendering components with all necessary context
 * Use this to wrap components in tests that need React Query, Auth, or other providers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { createMockSession } from './mock-session';
import { REAL_USER_ID, REAL_TENANT_ID } from './test-db';

interface TestProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
  queryClient?: QueryClient;
}

export function TestProviders({ 
  children, 
  session = null,
  queryClient 
}: TestProvidersProps) {
  // Create a fresh QueryClient for each test to avoid cross-test contamination
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: 0, // Disable caching in tests (replaces cacheTime)
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Use default test session if none provided
  const testSession = session !== null ? (session || createMockSession({
    userId: REAL_USER_ID,
    tenantId: REAL_TENANT_ID,
    email: 'pm1@demo.com',
    name: 'Sarah Chen'
  })) : null;

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Render helper that automatically wraps components with test providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    session?: Session | null;
    queryClient?: QueryClient;
  } = {}
) {
  const { session, queryClient } = options;
  
  return {
    ...render(
      <TestProviders session={session} queryClient={queryClient}>
        {ui}
      </TestProviders>
    ),
    queryClient: queryClient || new QueryClient(),
  };
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event'; 
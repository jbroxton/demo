/**
 * API route testing utilities
 * Helpers for testing Next.js API routes with authentication and database interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { createMockSession } from './mock-session';
import { REAL_USER_ID, REAL_TENANT_ID } from './test-db';

export interface ApiTestRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  session?: Session | null;
}

/**
 * Create a mock NextRequest for testing API routes
 */
export function createTestRequest(options: ApiTestRequest = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    query = {},
    session
  } = options;

  // Add query parameters to URL
  const urlWithQuery = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    urlWithQuery.searchParams.set(key, value);
  });

  // Create request with headers
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });

  // Add session info to headers for testing
  if (session) {
    requestHeaders.set('x-test-user-id', session.user?.id || '');
    requestHeaders.set('x-test-tenant-id', session.user?.tenantId || '');
  }

  const requestInit: any = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlWithQuery.toString(), requestInit);
}

/**
 * Test API route handler with mock request/response
 */
export async function testApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: ApiTestRequest = {}
) {
  const request = createTestRequest(options);
  const response = await handler(request);
  
  // Parse response data
  const responseData = response.body ? await response.json() : null;
  
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData,
    response,
  };
}

/**
 * Create authenticated API test request
 */
export function createAuthenticatedRequest(options: Omit<ApiTestRequest, 'session'> = {}) {
  const session = createMockSession({
    userId: REAL_USER_ID,
    tenantId: REAL_TENANT_ID,
    email: 'pm1@demo.com',
    name: 'Sarah Chen'
  });

  return createTestRequest({
    ...options,
    session,
  });
}

/**
 * Test API route with authentication
 */
export async function testAuthenticatedApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Omit<ApiTestRequest, 'session'> = {}
) {
  return testApiRoute(handler, {
    ...options,
    session: createMockSession({
      userId: REAL_USER_ID,
      tenantId: REAL_TENANT_ID,
      email: 'pm1@demo.com',
      name: 'Sarah Chen'
    }),
  });
}

/**
 * Test API route without authentication (should fail)
 */
export async function testUnauthenticatedApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Omit<ApiTestRequest, 'session'> = {}
) {
  return testApiRoute(handler, {
    ...options,
    session: null,
  });
}

/**
 * Mock fetch for testing API calls from components
 */
export function mockFetch(responses: Array<{ url: string; response: any; status?: number }>) {
  const mockFetch = jest.fn();
  
  responses.forEach(({ url, response, status = 200 }) => {
    mockFetch.mockImplementationOnce((requestUrl: string) => {
      if (requestUrl.includes(url)) {
        return Promise.resolve({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
        });
      }
      return Promise.reject(new Error(`Unmocked URL: ${requestUrl}`));
    });
  });

  global.fetch = mockFetch;
  return mockFetch;
}

/**
 * Assert API response format
 */
export function expectApiSuccess(response: any, expectedData?: any) {
  expect(response.status).toBe(200);
  expect(response.data).toBeDefined();
  
  if (expectedData) {
    expect(response.data).toEqual(expectedData);
  }
}

export function expectApiError(response: any, expectedStatus = 400, expectedError?: string) {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toHaveProperty('error');
  
  if (expectedError) {
    expect(response.data.error).toContain(expectedError);
  }
}

/**
 * Common test data for API testing
 */
export const API_TEST_DATA = {
  product: {
    name: 'Test Product',
    description: 'A test product for API testing',
  },
  feature: {
    name: 'Test Feature',
    description: 'A test feature for API testing',
  },
  requirement: {
    title: 'Test Requirement',
    description: 'A test requirement for API testing',
    priority: 'high' as const,
  },
  page: {
    title: 'Test Page',
    type: 'project' as const,
  },
};

/**
 * Helper to create test headers with tenant/user context
 */
export function createTestHeaders(session?: Session) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session) {
    headers['x-test-user-id'] = session.user?.id || '';
    headers['x-test-tenant-id'] = session.user?.tenantId || '';
  }

  return headers;
} 
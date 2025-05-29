/**
 * Jest test setup file
 * This file runs after the test framework is installed to configure the test environment
 * Environment variables should be set in jest-setup-env.ts which runs before module imports
 */

import '@testing-library/jest-dom';

// Simple fetch implementation for testing that handles authentication headers
global.fetch = async (url, options = {}) => {
  const http = require('http');
  const https = require('https');
  const { URL } = require('url');
  
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const headers = {
      'Authorization': 'Bearer test-token',
      'x-tenant-id': (options.headers as any)?.['x-test-tenant-id'] || 'test-tenant',
      'x-user-id': (options.headers as any)?.['x-test-user-id'] || 'test-user',
      ...options.headers
    };

    const req = client.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers
    }, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => jsonData,
            text: async () => data
          } as any);
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => ({ error: 'Invalid JSON' }),
            text: async () => data
          } as any);
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/dashboard',
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth provider with real test credentials
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: { 
      id: 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a', 
      email: 'pm1@demo.com' 
    },
    tenant: { 
      id: 'cb1e1373-da6e-4167-86b9-3f08f81e3315', 
      name: 'Tenant 1' 
    },
    isAuthenticated: true,
  }),
}));
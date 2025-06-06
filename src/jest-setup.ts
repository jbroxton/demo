/**
 * Jest test setup file
 * This file runs after the test framework is installed to configure the test environment
 * Environment variables should be set in jest-setup-env.ts which runs before module imports
 */

import '@testing-library/jest-dom';

// Add TextEncoder/TextDecoder polyfill for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Mock Next.js globals for API route testing
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(public url: string, public init?: any) {}
    json() { return this.init?.body ? JSON.parse(this.init.body) : {}; }
    text() { return this.init?.body || ''; }
    headers = new Map();
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(public body?: any, public init?: any) {}
    json() { return Promise.resolve(this.body); }
    text() { return Promise.resolve(this.body); }
    get ok() { return (this.init?.status || 200) >= 200 && (this.init?.status || 200) < 300; }
    get status() { return this.init?.status || 200; }
    get statusText() { return this.init?.statusText || 'OK'; }
    headers = new Map();
  } as any;
}

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
      id: '20000000-0000-0000-0000-000000000001', 
      email: 'pm1@test.com' 
    },
    tenant: { 
      id: '22222222-2222-2222-2222-222222222222', 
      name: 'ShopFlow Commerce' 
    },
    isAuthenticated: true,
  }),
}));
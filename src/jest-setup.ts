/**
 * Jest test setup file
 * This file runs before each test suite to configure the test environment
 */

import '@testing-library/jest-dom';

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
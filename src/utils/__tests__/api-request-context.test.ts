/// <reference types="jest" />

/**
 * Unit tests for api-request-context utility
 */

import { getRequestContext } from '@/utils/api-request-context';
import { NextRequest } from 'next/server';

// Mock getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock authOptions
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

import { getServerSession } from 'next-auth/next';

// Mock console.error
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

describe('getRequestContext', () => {
  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchParams extraction', () => {
    it('should extract search params from URL', async () => {
      const request = new NextRequest('http://localhost/api/test?id=123&filter=active');
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { searchParams } = await getRequestContext(request);
      
      expect(searchParams.get('id')).toBe('123');
      expect(searchParams.get('filter')).toBe('active');
      expect(searchParams.get('missing')).toBeNull();
    });

    it('should handle empty search params', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { searchParams } = await getRequestContext(request);
      
      expect(searchParams.toString()).toBe('');
    });

    it('should handle encoded search params', async () => {
      const request = new NextRequest('http://localhost/api/test?name=John%20Doe&email=test%40example.com');
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { searchParams } = await getRequestContext(request);
      
      expect(searchParams.get('name')).toBe('John Doe');
      expect(searchParams.get('email')).toBe('test@example.com');
    });
  });

  describe('body parsing', () => {
    it('should parse JSON body for POST requests', async () => {
      const bodyData = { name: 'John', email: 'john@example.com' };
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify(bodyData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Mock the json() method
      request.json = jest.fn().mockResolvedValue(bodyData);
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { body } = await getRequestContext(request);
      
      expect(body).toEqual(bodyData);
    });

    it('should parse body for PUT requests', async () => {
      const bodyData = { id: '123', name: 'Updated' };
      const request = new NextRequest('http://localhost/api/test', {
        method: 'PUT',
        body: JSON.stringify(bodyData)
      });
      
      request.json = jest.fn().mockResolvedValue(bodyData);
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { body } = await getRequestContext(request);
      
      expect(body).toEqual(bodyData);
    });

    it('should not parse body for GET requests', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET'
      });
      
      request.json = jest.fn();
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { body } = await getRequestContext(request);
      
      expect(body).toBeNull();
      expect(request.json).not.toHaveBeenCalled();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: 'invalid json'
      });
      
      request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { body } = await getRequestContext(request);
      
      expect(body).toBeNull();
    });

    it('should handle empty body', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST'
      });
      
      request.json = jest.fn().mockRejectedValue(new Error('No body'));
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { body } = await getRequestContext(request);
      
      expect(body).toBeNull();
    });
  });

  describe('tenantId extraction', () => {
    it('should extract tenantId from session', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const mockSession = {
        user: {
          currentTenant: 'tenant-123'
        }
      };
      
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const { tenantId } = await getRequestContext(request);
      
      expect(tenantId).toBe('tenant-123');
    });

    it('should return null when no session', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { tenantId } = await getRequestContext(request);
      
      expect(tenantId).toBeNull();
    });

    it('should return null when session has no user', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockResolvedValue({});
      
      const { tenantId } = await getRequestContext(request);
      
      expect(tenantId).toBeNull();
    });

    it('should return null when user has no currentTenant', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {}
      });
      
      const { tenantId } = await getRequestContext(request);
      
      expect(tenantId).toBeNull();
    });

    it('should handle session errors gracefully', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'));
      
      const { tenantId } = await getRequestContext(request);
      
      expect(tenantId).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Request Context] Error getting session:',
        expect.any(Error)
      );
    });
  });

  describe('combined functionality', () => {
    it('should extract all context data successfully', async () => {
      const bodyData = { name: 'Test' };
      const request = new NextRequest('http://localhost/api/test?id=123', {
        method: 'POST',
        body: JSON.stringify(bodyData)
      });
      
      request.json = jest.fn().mockResolvedValue(bodyData);
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { currentTenant: 'tenant-456' }
      });
      
      const context = await getRequestContext(request);
      
      expect(context).toEqual({
        searchParams: expect.any(URLSearchParams),
        body: bodyData,
        tenantId: 'tenant-456'
      });
      
      expect(context.searchParams.get('id')).toBe('123');
    });

    it('should work with minimal data', async () => {
      const request = new NextRequest('http://localhost/api/test');
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const context = await getRequestContext(request);
      
      expect(context).toEqual({
        searchParams: expect.any(URLSearchParams),
        body: null,
        tenantId: null
      });
    });
  });
});
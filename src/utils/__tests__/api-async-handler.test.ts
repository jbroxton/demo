/// <reference types="jest" />

/**
 * Unit tests for api-async-handler utility
 */

import { asyncHandler } from '@/utils/api-async-handler';
import { NextRequest, NextResponse } from 'next/server';

// Mock console.error to verify logging
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

// Mock apiResponse
jest.mock('@/utils/api-response', () => ({
  apiResponse: {
    success: jest.fn((data) => ({ type: 'success', data })),
    error: jest.fn((message, status) => ({ type: 'error', message, status })),
    unauthorized: jest.fn(() => ({ type: 'unauthorized' }))
  }
}));

describe('asyncHandler', () => {
  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful execution', () => {
    it('should return the handler response when no error occurs', async () => {
      const mockResponse = NextResponse.json({ data: 'test' });
      const handler = async (request: NextRequest) => mockResponse;
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const result = await wrapped(request);
      
      expect(result).toBe(mockResponse);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should pass through request and context parameters', async () => {
      const handler = jest.fn(async (request, context) => 
        NextResponse.json({ request: request.url, context })
      );
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const context = { params: { id: '123' } };
      
      await wrapped(request, context);
      
      expect(handler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('error handling', () => {
    it('should catch and log errors', async () => {
      const testError = new Error('Test error');
      const handler = async () => {
        throw testError;
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      
      await wrapped(request);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          method: 'GET',
          url: 'http://localhost/api/test',
          error: 'Test error',
          stack: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should return 500 error for generic errors', async () => {
      const handler = async () => {
        throw new Error('Generic error');
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const result = await wrapped(request);
      
      expect(result).toEqual({
        type: 'error',
        message: 'Something went wrong',
        status: 500
      });
    });

    it('should return unauthorized for auth errors', async () => {
      const handler = async () => {
        throw new Error('Unauthorized access');
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const result = await wrapped(request);
      
      expect(result).toEqual({
        type: 'unauthorized'
      });
    });

    it('should return 404 for not found errors', async () => {
      const handler = async () => {
        throw new Error('Resource not found');
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const result = await wrapped(request);
      
      expect(result).toEqual({
        type: 'error',
        message: 'Resource not found',
        status: 404
      });
    });

    it('should handle non-Error objects', async () => {
      const handler = async () => {
        throw 'String error';
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test');
      const result = await wrapped(request);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          error: 'Unknown error',
          stack: undefined
        })
      );
      
      expect(result).toEqual({
        type: 'error',
        message: 'Internal server error',
        status: 500
      });
    });
  });

  describe('request methods', () => {
    it('should log POST method correctly', async () => {
      const handler = async () => {
        throw new Error('POST error');
      };
      
      const wrapped = asyncHandler(handler);
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST'
      });
      
      await wrapped(request);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should log different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const handler = async () => {
        throw new Error('Method error');
      };
      const wrapped = asyncHandler(handler);

      for (const method of methods) {
        mockConsoleError.mockClear();
        const request = new NextRequest('http://localhost/api/test', { method });
        await wrapped(request);
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error]',
          expect.objectContaining({ method })
        );
      }
    });
  });
});
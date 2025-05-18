/// <reference types="jest" />

/**
 * Unit tests for api-response utility
 */

import { apiResponse } from '@/utils/api-response';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      _data: data,
      _init: init
    }))
  }
}));

describe('apiResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should return correct format with default status', () => {
      const data = { id: 1, name: 'Test' };
      const response = apiResponse.success(data);
      
      expect(response._data).toEqual({ data });
      expect(response.status).toBe(200);
    });

    it('should accept custom status code', () => {
      const data = { message: 'Created' };
      const response = apiResponse.success(data, 201);
      
      expect(response._data).toEqual({ data });
      expect(response.status).toBe(201);
    });

    it('should handle null data', () => {
      const response = apiResponse.success(null);
      
      expect(response._data).toEqual({ data: null });
      expect(response.status).toBe(200);
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const response = apiResponse.success(data);
      
      expect(response._data).toEqual({ data });
      expect(response.status).toBe(200);
    });
  });

  describe('error', () => {
    it('should return correct format with default status', () => {
      const message = 'Something went wrong';
      const response = apiResponse.error(message);
      
      expect(response._data).toEqual({ error: message });
      expect(response.status).toBe(500);
    });

    it('should accept custom status code', () => {
      const message = 'Not found';
      const response = apiResponse.error(message, 404);
      
      expect(response._data).toEqual({ error: message });
      expect(response.status).toBe(404);
    });

    it('should handle empty message', () => {
      const response = apiResponse.error('');
      
      expect(response._data).toEqual({ error: '' });
      expect(response.status).toBe(500);
    });
  });

  describe('unauthorized', () => {
    it('should return correct format', () => {
      const response = apiResponse.unauthorized();
      
      expect(response._data).toEqual({ error: 'Unauthorized' });
      expect(response.status).toBe(401);
    });

    it('should always return 401 status', () => {
      const response = apiResponse.unauthorized();
      
      expect(response.status).toBe(401);
    });
  });
});
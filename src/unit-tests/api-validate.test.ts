/// <reference types="jest" />

/**
 * Unit tests for api-validate utility
 */

import { validateRequired } from '@/utils/api-validate';

describe('validateRequired', () => {
  describe('successful validation', () => {
    it('should return null when all required fields are present', () => {
      const body = { name: 'John', email: 'john@example.com' };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBeNull();
    });

    it('should return null when no fields are required', () => {
      const body = { anything: 'value' };
      const result = validateRequired(body, []);
      
      expect(result).toBeNull();
    });

    it('should accept numbers as valid values', () => {
      const body = { age: 25, score: 100 };
      const result = validateRequired(body, ['age', 'score']);
      
      expect(result).toBeNull();
    });

    it('should accept booleans as valid values', () => {
      const body = { active: true, verified: false };
      const result = validateRequired(body, ['active', 'verified']);
      
      expect(result).toBeNull();
    });
  });

  describe('validation failures', () => {
    it('should return error when body is null', () => {
      const result = validateRequired(null, ['name']);
      
      expect(result).toBe('Request body is required');
    });

    it('should return error when body is undefined', () => {
      const result = validateRequired(undefined, ['name']);
      
      expect(result).toBe('Request body is required');
    });

    it('should return error when body is not an object', () => {
      const result = validateRequired('string' as any, ['name']);
      
      expect(result).toBe('Request body is required');
    });

    it('should return error for missing field', () => {
      const body = { name: 'John' };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBe('Email is required');
    });

    it('should return error for null field value', () => {
      const body = { name: 'John', email: null };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBe('Email is required');
    });

    it('should return error for undefined field value', () => {
      const body = { name: 'John', email: undefined };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBe('Email is required');
    });

    it('should return error for empty string', () => {
      const body = { name: 'John', email: '' };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBe('Email is required');
    });

    it('should return error for string with only spaces', () => {
      const body = { name: 'John', email: '   ' };
      const result = validateRequired(body, ['name', 'email']);
      
      expect(result).toBe('Email is required');
    });
  });

  describe('field name formatting', () => {
    it('should capitalize first letter of field name', () => {
      const body = {};
      const result = validateRequired(body, ['username']);
      
      expect(result).toBe('Username is required');
    });

    it('should handle camelCase field names', () => {
      const body = {};
      const result = validateRequired(body, ['firstName']);
      
      expect(result).toBe('FirstName is required');
    });

    it('should handle snake_case field names', () => {
      const body = {};
      const result = validateRequired(body, ['user_name']);
      
      expect(result).toBe('User_name is required');
    });
  });

  describe('field checking order', () => {
    it('should return error for first missing field', () => {
      const body = { third: 'value' };
      const result = validateRequired(body, ['first', 'second', 'third']);
      
      expect(result).toBe('First is required');
    });

    it('should stop checking after first error', () => {
      const body = {};
      const result = validateRequired(body, ['first', 'second']);
      
      expect(result).toBe('First is required');
      // Should not check 'second' field
    });
  });
});
/**
 * API Response Helper Utilities
 * 
 * Provides standardized response format for all API routes.
 * This ensures consistency across the entire API surface.
 * 
 * Usage:
 * ```typescript
 * import { apiResponse } from '@/utils/api-response';
 * 
 * // Success response
 * return apiResponse.success(data);
 * 
 * // Error response
 * return apiResponse.error('Something went wrong', 500);
 * 
 * // Unauthorized response
 * return apiResponse.unauthorized();
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Creates a successful API response with standardized format
 * 
 * @param data - The data to return in the response
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with successful response format
 * 
 * @example
 * ```typescript
 * const users = await getUsersFromDb();
 * return apiResponse.success(users);
 * 
 * // Returns: { data: [...users], status: 200 }
 * ```
 */
function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { data },
    { status }
  );
}

/**
 * Creates an error API response with standardized format
 * 
 * @param message - The error message to return
 * @param status - HTTP status code for the error (default: 500)
 * @returns NextResponse with error response format
 * 
 * @example
 * ```typescript
 * // Basic error
 * return apiResponse.error('Something went wrong');
 * 
 * // With specific status code
 * return apiResponse.error('Product not found', 404);
 * 
 * // Returns: { error: "Product not found", status: 404 }
 * ```
 */
function error(message: string, status = 500): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Creates an unauthorized (401) API response
 * 
 * @returns NextResponse with unauthorized error format
 * 
 * @example
 * ```typescript
 * // Check authentication
 * if (!session || !tenantId) {
 *   return apiResponse.unauthorized();
 * }
 * 
 * // Returns: { error: "Unauthorized", status: 401 }
 * ```
 */
function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

export const apiResponse = {
  success,
  error,
  unauthorized,
};
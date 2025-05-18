/**
 * Async Handler Wrapper for API Routes
 * 
 * Provides automatic error handling for async route handlers.
 * Catches all errors and returns standardized error responses.
 * 
 * Usage:
 * ```typescript
 * import { asyncHandler } from '@/utils/async-handler';
 * 
 * export const GET = asyncHandler(async (request) => {
 *   const data = await someAsyncOperation();
 *   return apiResponse.success(data);
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiResponse } from '@/utils/api-response';

/**
 * Higher-order function that wraps async route handlers with error handling
 * 
 * @param fn - The async route handler function to wrap
 * @returns Wrapped function that catches and handles errors
 * 
 * @example
 * ```typescript
 * // Without asyncHandler (manual try-catch)
 * export async function GET(request: NextRequest) {
 *   try {
 *     const data = await fetchData();
 *     return apiResponse.success(data);
 *   } catch (error) {
 *     console.error('Error:', error);
 *     return apiResponse.error('Something went wrong', 500);
 *   }
 * }
 * 
 * // With asyncHandler (automatic error handling)
 * export const GET = asyncHandler(async (request: NextRequest) => {
 *   const data = await fetchData();
 *   return apiResponse.success(data);
 * });
 * ```
 */
export function asyncHandler(
  fn: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse | Response> => {
    try {
      return await fn(request, context);
    } catch (error) {
      // Log error with context for debugging
      console.error('[API Error]', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      // Return standardized error response
      const message = error instanceof Error ? error.message : 'Internal server error';
      
      // Check for common error types
      if (message.includes('Unauthorized') || message.includes('unauthorized')) {
        return apiResponse.unauthorized();
      }
      
      if (message.includes('not found') || message.includes('Not found')) {
        return apiResponse.error(message, 404);
      }
      
      // Default to 500 for unexpected errors
      return apiResponse.error('Something went wrong', 500);
    }
  };
}
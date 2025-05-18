/**
 * Authenticated Handler Wrapper for API Routes
 * 
 * Combines async error handling with automatic tenant extraction.
 * Ensures all routes have proper authentication and tenant context.
 * 
 * Usage:
 * ```typescript
 * import { authenticatedHandler } from '@/utils/api-authenticated-handler';
 * 
 * export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
 *   const products = await getProductsFromDb(tenantId);
 *   return apiResponse.success(products);
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { apiResponse } from '@/utils/api-response';
import { getRequestContext } from '@/utils/api-request-context';

export type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: {
    tenantId: string;
    userId: string;
    searchParams: URLSearchParams;
    body: any;
  }
) => Promise<Response>;

/**
 * Higher-order function that provides authentication and tenant context
 * 
 * @param handler - The route handler function that receives authenticated context
 * @returns Wrapped function that handles auth, errors, and context extraction
 */
export function authenticatedHandler(handler: AuthenticatedRouteHandler) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Extract context including tenant ID and user ID
      const { tenantId, userId, searchParams, body } = await getRequestContext(request);
      
      // Check for tenant ID and user ID (authentication)
      if (!tenantId || !userId) {
        console.error('[Authenticated Handler] Missing required auth context:', {
          tenantId,
          userId,
          method: request.method,
          url: request.url
        });
        return apiResponse.unauthorized();
      }
      
      // Call the actual handler with authenticated context
      return await handler(request, { tenantId, userId, searchParams, body });
      
    } catch (error) {
      // Log error with context
      console.error('[API Error]', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      
      // Return appropriate error response
      const message = error instanceof Error ? error.message : 'Internal server error';
      
      if (message.includes('not found') || message.includes('Not found')) {
        return apiResponse.error(message, 404);
      }
      
      return apiResponse.error('Something went wrong', 500);
    }
  };
}
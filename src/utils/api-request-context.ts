/**
 * Request Context Helper for API Routes
 * 
 * Extracts common request data including search parameters, body, and tenant context.
 * Centralizes request parsing logic for consistency across all API routes.
 * 
 * Usage:
 * ```typescript
 * import { getRequestContext } from '@/utils/api-request-context';
 * 
 * export const GET = asyncHandler(async (request) => {
 *   const { searchParams, body, tenantId } = await getRequestContext(request);
 *   
 *   if (!tenantId) return apiResponse.unauthorized();
 *   
 *   const id = searchParams.get('id');
 *   const data = await fetchData(id, tenantId);
 *   return apiResponse.success(data);
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ensureValidTenantId } from '@/utils/uuid-utils';

/**
 * Extracts common context from an API request
 * 
 * @param request - The Next.js request object
 * @returns Object containing searchParams, body, and tenantId
 * 
 * @example
 * ```typescript
 * // GET request with query params
 * const { searchParams, tenantId } = await getRequestContext(request);
 * const id = searchParams.get('id');
 * const filter = searchParams.get('filter');
 * 
 * // POST request with body
 * const { body, tenantId } = await getRequestContext(request);
 * const { name, description } = body;
 * 
 * // Check for tenant context
 * if (!tenantId) {
 *   return apiResponse.unauthorized();
 * }
 * ```
 */
export async function getRequestContext(request: NextRequest) {
  // Extract search params from URL
  const { searchParams } = new URL(request.url);
  
  // Parse JSON body for non-GET requests
  let body = null;
  if (request.method !== 'GET') {
    try {
      body = await request.json();
    } catch (error) {
      // Body might be empty or not JSON, which is okay
      body = null;
    }
  }
  
  // Extract tenant ID and user ID from session or test headers
  let tenantId: string | null = null;
  let userId: string | null = null;
  
  // Check for test headers first (for integration tests)
  const testTenantId = request.headers.get('x-test-tenant-id');
  const testUserId = request.headers.get('x-test-user-id');
  
  if (testTenantId && testUserId) {
    tenantId = testTenantId;
    userId = testUserId;
    console.log('[Request Context] Using test headers:', { tenantId, userId });
  } else {
    // Extract from session for normal requests
    try {
      const session = await getServerSession(authOptions);
      console.log('[Request Context] Session data:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        tenantId: session?.user?.tenantId,
        currentTenant: session?.user?.currentTenant,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        fullUser: session?.user
      });
      
      // Extract tenant ID using the same logic as useAuth()
      // Priority: tenantId > currentTenant
      tenantId = session?.user?.tenantId || session?.user?.currentTenant || null;
      
      console.log('[Request Context] Tenant extraction:', {
        sessionTenantId: session?.user?.tenantId,
        sessionCurrentTenant: session?.user?.currentTenant,
        extractedTenantId: tenantId
      });
      
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('[Request Context] Using userId:', userId);
      }
    } catch (error) {
      console.error('[Request Context] Error getting session:', error);
      // Continue without tenant ID, let route decide if it's required
    }
  }
  
  return {
    searchParams,
    body,
    tenantId,
    userId,
  };
}
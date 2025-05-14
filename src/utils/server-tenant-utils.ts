/**
 * This file contains server-side tenant utilities.
 * Unlike tenant-utils.ts, this file doesn't use the "use client" directive,
 * making it safe to use in API routes and other server-side code.
 */

import type { Tenant } from './tenant-utils';

/**
 * Demo tenant data for development and testing
 */
export const DEMO_TENANTS: Tenant[] = [
  { id: 'org1', name: 'Organization 1', slug: 'org1' },
  { id: 'org2', name: 'Organization 2', slug: 'org2' },
];

/**
 * Extract tenant ID from Next.js API request
 * This can be used in API routes to get the current tenant
 * @param request Next.js API request object
 * @returns Tenant ID or default 'org1' if not found
 */
export function getTenantFromRequest(request: Request): string {
  // In a real application, this would extract tenant info from:
  // 1. Request headers
  // 2. Cookies 
  // 3. Session data (requiring getServerSession)
  
  try {
    // For simplicity in this prototype, we'll return the default tenant
    return 'org1';
  } catch (error) {
    console.error('Error getting tenant from request:', error);
    return 'org1'; // Fallback to default tenant
  }
}
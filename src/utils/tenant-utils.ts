"use client"

import type { Session } from "next-auth"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useCallback } from "react"

/**
 * Type for tenant data
 * This is used throughout the application for tenant management
 */
export type Tenant = {
  id: string
  name: string
  slug: string
}

/**
 * Demo tenant data for development and testing
 */
export const DEMO_TENANTS: Tenant[] = [
  { id: 'org1', name: 'Organization 1', slug: 'org1' },
  { id: 'org2', name: 'Organization 2', slug: 'org2' },
]

/**
 * Custom hook for switching tenants
 * @deprecated Use the useAuth hook instead with its switchTenant method
 * @example
 * ```tsx
 * const { switchTenant } = useAuth();
 * await switchTenant('org1');
 * ```
 */
export function useTenantSwitcher() {
  const { data: session, update } = useSession()

  const switchTenant = useCallback(async (tenantId: string): Promise<boolean> => {
    try {
      // Call the API to switch tenants
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to switch tenant')
        return false
      }
      
      // Get the result data
      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Failed to switch tenant')
        return false
      }
      
      // Update the session with the new tenant
      // This triggers the "update" callback in [...nextauth]/route.ts
      await update({
        currentTenant: tenantId,
      })
      
      toast.success('Tenant switched successfully')
      return true
    } catch (error) {
      console.error('Error switching tenant:', error)
      toast.error('An error occurred while switching tenants')
      return false
    }
  }, [update])

  return { switchTenant }
}

/**
 * Get allowed tenants for the current user from session
 * @deprecated Use the useAuth hook instead with its allowedTenants property
 * @example
 * ```tsx
 * const { allowedTenants } = useAuth();
 * ```
 */
export function getAllowedTenants(session: Session | null): Tenant[] {
  if (!session?.user?.allowedTenants) {
    return []
  }
  
  // Filter the demo tenants based on allowed tenant IDs in session
  return DEMO_TENANTS.filter(tenant => 
    Array.isArray(session.user.allowedTenants) && 
    session.user.allowedTenants.includes(tenant.id)
  )
}

/**
 * Get current tenant data based on session
 * @deprecated Use the useAuth hook instead which exposes the current tenant
 * @example
 * ```tsx
 * const { currentTenant, allowedTenants } = useAuth();
 * const currentTenantObject = allowedTenants.find(t => t.id === currentTenant);
 * ```
 */
export function getCurrentTenant(session: Session | null): Tenant | null {
  if (!session?.user?.currentTenant) {
    return null
  }
  
  return DEMO_TENANTS.find(t => t.id === session.user.currentTenant) || null
}
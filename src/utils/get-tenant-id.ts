import { useSession } from 'next-auth/react';

/**
 * Hook to get the current tenant ID from the session
 * Returns the current tenant UUID or null if not authenticated
 */
export function useCurrentTenantId(): string | null {
  const { data: session } = useSession();
  return session?.user?.currentTenant || null;
}

/**
 * Server-side function to get tenant ID from session
 * This should be used in server components or API routes
 * Returns null if no tenant ID is available
 */
export async function getServerTenantId(session: any): Promise<string | null> {
  return session?.user?.currentTenant || null;
}
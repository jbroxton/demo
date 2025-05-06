/**
 * Helper functions for session and auth configuration
 * These help ensure we're properly handling authentication in any environment
 */

/**
 * Get the appropriate base URL for authentication
 * This ensures auth works correctly regardless of port or environment
 */
export function getAuthUrl() {
  // Client-side: Always use the current window location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side priority order:
  // 1. NEXTAUTH_URL environment variable (for production)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // 2. Internal URL if specified (for environments where public/private URLs differ)
  if (process.env.NEXTAUTH_URL_INTERNAL) {
    return process.env.NEXTAUTH_URL_INTERNAL;
  }
  
  // 3. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 4. Fallback to localhost with proper port
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/**
 * Get cookie settings based on the environment
 */
export function getCookieSettings() {
  // In development, use less strict cookie settings
  if (process.env.NODE_ENV === 'development') {
    return {
      useSecureCookies: false
    };
  }
  
  // In production, use secure cookies
  return {
    useSecureCookies: true
  };
} 
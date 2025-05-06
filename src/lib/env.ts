/**
 * Environment utilities that help with dynamic configuration
 * All using standard Next.js and NextAuth approaches
 */

// Server-side environment helper
export function getServerUrl() {
  // For Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // If APP_URL is set, use that
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // In production, use the NEXTAUTH_URL environment variable if set
  // but only as a fallback to the above options
  if (process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // For local development, use dynamic port detection
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

// Client-side environment helper
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // In the browser, always use the current URL origin
    // This ensures we work with any port the app is running on
    return window.location.origin;
  }
  
  // Server-side fallback
  return getServerUrl();
}

// Helper to check if we're in development
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
} 
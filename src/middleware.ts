import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Skip auth check for public paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/debug-auth") || // Debug endpoint
    pathname.startsWith("/api/ai-chat") || // AI chat API for testing
    pathname.startsWith("/api/ai-chat-fully-managed") || // Agent AI chat API
    pathname === "/signin" ||
    pathname === "/signup" || // Explicitly allow signup page
    pathname === "/error" ||
    pathname === "/" || // Explicitly allow home page
    // Keep old paths temporarily for compatibility
    pathname === "/auth/signin" ||
    pathname === "/auth/error"
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = await getToken({ 
    req: request,
    // Use the secret from env for JWT token validation
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect to signin if no token
  if (!token) {
    // Use the request origin for the URL to handle dynamic ports
    const url = new URL("/signin", origin);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Centralized tenant management
  if (pathname.startsWith("/dashboard")) {
    // Special case: if no current tenant is set but user has allowed tenants
    if (!token.currentTenant && token.allowedTenants?.length > 0) {
      console.log("Middleware: Auto-selecting first tenant:", token.allowedTenants[0]);
      
      // Allow request to proceed, the default tenant was already set during auth
      return NextResponse.next();
    }
    
    // If user has no tenants at all, they shouldn't access dashboard
    if (!token.allowedTenants || token.allowedTenants.length === 0) {
      console.log("Middleware: User has no allowed tenants");
      
      // In development mode, allow access for easier debugging
      if (process.env.NODE_ENV === 'development') {
        console.log("Middleware: Development mode - allowing access");
        return NextResponse.next();
      }
      
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Agent operation permission checks for API routes
  if (pathname.startsWith("/api/") && isAgentOperation(pathname)) {
    const hasAgentPermission = await validateAgentPermission(token, request);
    
    if (!hasAgentPermission) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Insufficient permissions for agent operations',
          code: 'AGENT_PERMISSION_DENIED'
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // If authenticated with a tenant, allow access to all routes
  return NextResponse.next();
}

/**
 * Check if the pathname is an agent operation
 */
function isAgentOperation(pathname: string): boolean {
  return pathname.startsWith("/api/ai-chat-fully-managed") ||
         pathname.includes("agent") ||
         pathname.includes("confirmation");
}

/**
 * Validate agent operation permissions
 */
async function validateAgentPermission(token: any, request: NextRequest): Promise<boolean> {
  // Basic checks
  if (!token?.sub || !token?.currentTenant) {
    return false;
  }

  // For now, allow all authenticated users with valid tenants to use agent features
  // In production, you might want more granular permissions
  const hasBasicAuth = !!(token.sub && token.currentTenant);
  
  // Check if user has agent feature enabled (could be a user setting or tenant feature)
  const agentEnabled = token.agentEnabled !== false; // Default to true unless explicitly disabled
  
  // Rate limiting check could be added here
  const withinRateLimit = await checkAgentRateLimit(token.sub, token.currentTenant);
  
  return hasBasicAuth && agentEnabled && withinRateLimit;
}

/**
 * Check rate limiting for agent operations
 */
async function checkAgentRateLimit(userId: string, tenantId: string): Promise<boolean> {
  // Implement rate limiting logic here
  // For now, return true (no rate limiting)
  // In production, you might want to:
  // - Check recent agent action count
  // - Limit based on tenant plan
  // - Implement sliding window rate limiting
  
  return true;
}
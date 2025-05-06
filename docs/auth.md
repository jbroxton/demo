# Authentication Flow

This document outlines the ideal authentication flow for the application.

## Authentication Process

### 1. Login Form Submission
- User enters email and password in the auth form
- Client-side validation occurs using Zod
- Credentials are submitted to NextAuth's signIn function
- `redirect: false` is used to handle redirects programmatically

### 2. Credential Verification
- NextAuth's authorize callback (`[...nextauth]/route.ts`) receives credentials
- Validate credentials against the database using `validateCredentials()`
- If valid, retrieve user data including available tenants with `getUserTenants()`
- Return user object with `id`, `email`, `name`, `role`, `allowedTenants`, and `currentTenant`
- If invalid credentials, return null (NextAuth handles the error)

### 3. Session/Token Creation
- NextAuth's jwt callback processes the user object
- Store additional user data in the token:
  - `token.role` = user.role
  - `token.allowedTenants` = user.allowedTenants
  - `token.currentTenant` = user.currentTenant (default to first tenant)
- Token is securely stored as an HTTP-only cookie

### 4. Session Retrieval
- NextAuth's session callback converts token to session data
- Maps token properties to session.user properties:
  - `session.user.id` = token.sub
  - `session.user.role` = token.role
  - `session.user.allowedTenants` = token.allowedTenants
  - `session.user.currentTenant` = token.currentTenant
- Session data is made available to client components via useSession()

### 5. Client-side Redirect
- After successful authentication, the auth form redirects to the dashboard
- Use the `callbackUrl` query parameter if present, otherwise default to `/dashboard`
- Avoid multiple redirect mechanisms to prevent loops

### 6. Session Validation in Protected Routes
- Middleware checks for valid session token
- If no valid token, redirect to login page
- If token exists but no tenant is selected, middleware selects the first available tenant
- Access is granted to protected routes with a valid session

## Common Issues and Solutions

### Redirect Loops
- Ensure there's only ONE redirect mechanism after login
- Avoid mixing useEffect redirects with form submission redirects
- Check that middleware redirects don't conflict with component-level redirects

### Missing Session Data
- Make session callback resilient with proper fallbacks for all properties
- Add type guards to ensure properties exist before using them
- Log session structure at key points to diagnose issues

### Tenant Selection
- Always ensure a default tenant is selected if allowedTenants exists
- Handle the case where a user might not have any tenants
- Middleware should have clear logic for tenant selection

## Debug Tips

When troubleshooting authentication issues:

1. Check NextAuth logs with `debug: true` in authOptions
2. Verify token and session structure at each step
3. Confirm middleware is working as expected
4. Validate that session is properly hydrated on client components
5. Examine network requests for cookie handling
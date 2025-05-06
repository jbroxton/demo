# Authentication Architecture

## Overview

The authentication system in this application uses NextAuth.js combined with a custom AuthProvider React context to create a centralized authentication system. This document explains the key components and how they interact.

## Key Components

### 1. NextAuth.js Configuration

Located in `/src/app/api/auth/[...nextauth]/route.ts`, this is the foundation of the authentication system. It handles:

- User authentication via credentials provider
- JWT token creation and validation
- Session management
- Tenant access control
- User profile data including tenant access rights

> Note: The application previously used a separate `/api/auth/check-session` endpoint for session verification, but this has been removed in favor of the centralized AuthProvider approach.

### 2. Server-Side Authentication Services

Located in `/src/services/auth.server.ts`, this module provides:

- Database interaction for authentication operations
- User credential validation
- Tenant access management
- Type definitions for auth-related entities

This file is crucial for the server-side portion of authentication and should only be imported by server components or API routes.

### 3. AuthProvider Context

Located in `/src/providers/auth-provider.tsx`, this is a React context provider that:

- Wraps NextAuth functionality in a simpler API
- Provides access to auth state throughout the application
- Manages tenant switching
- Handles login and logout operations

### 3. useAuth Hook

A custom hook that provides access to the AuthProvider context. It can be imported from:
- `/src/hooks/use-auth.ts` (re-exported for convenience)
- `/src/providers/auth-provider.tsx` (source)

### 4. Auth Form

Located in `/src/components/auth/auth-form.tsx`, this is the user interface for authentication. It:
- Uses the useAuth hook to interact with authentication
- Handles form validation and submission
- Provides error handling and user feedback

## Authentication Flow

1. User enters credentials in the auth form
2. AuthProvider's login method calls NextAuth's signIn function
3. NextAuth authenticates against the database
4. On success, a JWT is created with user and tenant information
5. The session is established and made available through useAuth() hook
6. Protected pages use useAuth() to verify authentication status

## Tenant Switching

1. User selects a tenant from TenantSwitcher component
2. The switchTenant function in AuthProvider is called
3. It updates the JWT session via NextAuth's update function
4. The session update triggers re-renders with new tenant context
5. Components using the useAuth hook automatically receive the updated tenant information

## Usage Examples

### Accessing Auth State in Components

```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.name}!</div>;
}
```

### Tenant Management

```tsx
import { useAuth } from '@/hooks/use-auth';

function TenantDisplay() {
  const { currentTenant, allowedTenants, switchTenant } = useAuth();
  
  return (
    <div>
      <p>Current tenant: {currentTenant}</p>
      <select 
        value={currentTenant || ''} 
        onChange={(e) => switchTenant(e.target.value)}
      >
        {allowedTenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Security Considerations

- The JWT token contains tenant access information
- Tenant switching is validated against allowed tenants on the server
- Authentication state is centralized to reduce inconsistencies
- The middleware (`/src/middleware.ts`) provides an additional layer of route protection

## Best Practices

1. Always use the useAuth hook to access authentication state
2. Don't use useSession() directly - prefer useAuth()
3. Check isLoading before making authentication decisions
4. Handle both isAuthenticated and user presence for complete validation
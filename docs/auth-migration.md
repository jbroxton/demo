# NextAuth Migration Guide

This document outlines the steps required to complete the migration from our custom Zustand-based authentication system to NextAuth.js.

## Completed Migration Steps

1. ✅ Set up NextAuth.js with Credentials provider
2. ✅ Extended NextAuth.js types to include tenant information
3. ✅ Added middleware for route protection
4. ✅ Created tenant switching API endpoint
5. ✅ Updated components to use NextAuth session:
   - ✅ TenantSwitcher
   - ✅ AppSidebar
   - ✅ Dashboard Header
   - ✅ Select Tenant Page
   - ✅ Create Tenant Dialog

## Remaining Work

### Zustand Store Cleanup

The following Zustand auth/tenant stores should be deprecated once all components have been migrated to use NextAuth:

1. `src/stores/auth.ts` - Auth store (replaced by NextAuth session)
2. `src/stores/tenants.ts` - Tenant store (replaced by NextAuth JWT and utility functions)

### Deprecation Process

1. First, identify any remaining components still using these stores:

```bash
# Search for useAuth or useTenantStore imports
grep -r "useAuth\|useTenantStore" --include="*.tsx" --include="*.ts" src/
```

2. Refactor each component to use NextAuth session and the utility functions in `src/utils/tenant-utils.ts`.

3. Once all components are migrated:

   a. Mark the stores as deprecated by adding a comment and console warning:

   ```typescript
   /** @deprecated Use NextAuth session instead */
   export const useAuth = create<AuthStore>()(...
   ```

   b. Add a console warning in the store initialization:

   ```typescript
   console.warn('useAuth is deprecated. Use NextAuth session instead.');
   ```

4. Create a plan to remove the stores entirely in a future release.

### NextAuth Utility Functions

The following utility functions should be used instead of direct Zustand store access:

- `useTenantSwitcher()` - Hook for switching tenants
- `getAllowedTenants(session)` - Get tenants allowed for the current user
- `getCurrentTenant(session)` - Get current tenant information

## Testing the Migration

After completing the migration:

1. Test the auth flow from login to logout
2. Test tenant switching
3. Test route protection for unauthenticated users
4. Test tenant access control
5. Test session persistence after page refresh

## Benefits of NextAuth

- Server-side session validation
- More secure JWT-based authentication
- Better integration with Next.js App Router
- Simpler code with fewer client-side dependencies
- Support for multiple authentication providers in the future
# Multi-Tenancy Implementation Overview

#Goal
Allow test user
- login and see their personal data
- logout and their data persist
- Demo driver can switch between user types

#Core Requirements
- Simple client-side multi-tenant demo
- No database required (using Zustand with localStorage)
- Using only pre-built Shadcn components

#Test Users & Organizations
- **PM1**: `pm1@demo.com` / `password` (access to Org 1)
- **PM2**: `pm2@demo.com` / `password` (access to Org 2) 
- **Admin**: `admin@example.com` / `password` (access to both orgs)

#Data Models

User
```ts
type User = {
  email: string
  name: string
  role: 'admin' | 'pm'
  allowedTenants: string[]
}
```

Tenant
```ts
type Tenant = {
  id: string
  name: string
  slug: string
}
```

Key Features
1. Tenant Switching
   - Tenant switcher in header
   - Only shows organizations user has access to
   - Persists selection in localStorage

2. Authentication
   - Simple email/password login
   - Role-based access (admin vs pm)
   - Tenant-specific permissions

3. Components Used
   - Command (for tenant selection)
   - Card (for layouts)
   - Button (for actions)
   - Popover (for tenant switcher)



# TODO

## R1
- [x] Tenant store with mock tenants (`stores/tenants.ts`)
- [x] Auth store with test users and `allowedTenants` (`stores/auth.ts`)
- [x] `TenantSwitcher` component (uses Popover + Command)
- [x] `SelectTenantPage` for onboarding tenant selection
- [x] `DashboardLayout` guards (authentication, tenant selection, access)
- [x] `DashboardHeader` with TenantSwitcher & Sign Out button
- [x] `DashboardPage` displays current user & tenant context
- [x] `SignInPage` shows test account info in Card
- [x] Removed all `plan` references from codebase
- [x] Display greeting "Hi <user name>" at top of page after login
- [x] Configure Zustand stores for client-side only operation
- [x] Fix hydration issues with proper client/server boundaries
- [x] Implement proper localStorage persistence

## R2
- [x] Clear `currentTenant` on logout
- [ ] Integrate `CreateTenantDialog` in `DashboardHeader`
- [x] Sync tenant state on login/logout transitions
- [ ] Add tenant-scoped data loading (e.g., projects per tenant)
- [ ] Implement role-based UI visibility (admin vs pm)
- [ ] Write unit tests for auth & tenant stores
- [ ] Write end-to-end tests for multi-tenant scenarios
- [ ] Document tenant implementation in `README.md` 
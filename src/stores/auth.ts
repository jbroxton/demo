"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useTenantStore } from './tenants'

// Define our types
type User = {
  email: string
  name: string
  role: 'admin' | 'pm'  // Added role type
  allowedTenants: string[] // tenant IDs they can access
}

// Simplified test users with their allowed organizations
const DEMO_USERS: Record<string, User> = {
  'pm1@demo.com': {
    email: 'pm1@demo.com',
    name: 'Justin',
    role: 'pm',
    allowedTenants: ['org1']
  },
  'pm2@demo.com': {
    email: 'pm2@demo.com',
    name: 'Sarah',
    role: 'pm',
    allowedTenants: ['org2']
  },
  'admin@example.com': {
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    allowedTenants: ['org1', 'org2']
  }
}

type AuthStore = {
  user: User | null
  isAuthenticated: boolean
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Create the store
export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // Simple demo login
        if (password !== 'password') {
          throw new Error('Invalid credentials')
        }
        
        const user = DEMO_USERS[email]
        if (!user) {
          throw new Error('Invalid credentials')
        }
        
        // Set the user in auth store
        set({ user, isAuthenticated: true })

        // Get the tenant store
        const tenantStore = useTenantStore.getState()
        
        // Find the first allowed tenant for the user
        const firstAllowedTenant = tenantStore.tenants.find(
          tenant => user.allowedTenants.includes(tenant.id)
        )
        
        // Set the current tenant
        if (firstAllowedTenant) {
          tenantStore.setCurrentTenant(firstAllowedTenant)
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
        // Clear the current tenant on logout
        useTenantStore.getState().setCurrentTenant(null)
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true // Skip hydration to avoid SSR issues
    }
  )
) 
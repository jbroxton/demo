"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Tenant = {
  id: string
  name: string
  slug: string
}

// Simplified tenants - just 2 organizations
const DEMO_TENANTS = [
  { id: 'org1', name: 'Organization 1', slug: 'org1' },
  { id: 'org2', name: 'Organization 2', slug: 'org2' },
]

type TenantStore = {
  tenants: Tenant[]
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      tenants: DEMO_TENANTS,
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant })
    }),
    {
      name: 'tenant-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true // Skip hydration to avoid SSR issues
    }
  )
)
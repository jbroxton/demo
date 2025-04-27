"use client"

import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useAuth } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenants'
import { ThemeProvider } from 'next-themes'
import { migrateFeatures } from '@/utils/migrate-features'

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Handle Zustand hydration
  useEffect(() => {
    useAuth.persist.rehydrate()
    useTenantStore.persist.rehydrate()
  }, [])

  // Run feature content migration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Run migration after a delay to ensure stores are loaded
      setTimeout(() => {
        migrateFeatures();
      }, 1000);
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster />
    </ThemeProvider>
  )
} 
"use client"

import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useAuth } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenants'
import { ThemeProvider } from 'next-themes'

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Handle Zustand hydration
  useEffect(() => {
    useAuth.persist.rehydrate()
    useTenantStore.persist.rehydrate()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster />
    </ThemeProvider>
  )
} 
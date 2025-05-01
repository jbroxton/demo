"use client"

import React, { forwardRef } from 'react'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useAuth } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenants'
import { ThemeProvider } from 'next-themes'
import { migrateFeatures } from '@/utils/migrate-features'
import { syncData } from '@/utils/sync-data'

type AppProvidersProps = {
  children?: React.ReactNode
}

export const AppProviders = forwardRef<HTMLDivElement, AppProvidersProps>(
  function AppProviders({ children }: AppProvidersProps, ref: React.ForwardedRef<HTMLDivElement>) {
    // Handle Zustand hydration
    useEffect(() => {
      if (typeof window !== 'undefined') {
        useAuth.persist.rehydrate()
        useTenantStore.persist.rehydrate()
      }
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
    
    // Synchronize stores using immer-based solution
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // Run synchronization after stores are loaded and hydrated
        setTimeout(() => {
          const result = syncData();
          if (result.anyChanged) {
            console.log('Data synchronized successfully with immer:', result);
          }
        }, 1500);
      }
    }, []);

    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <div ref={ref}>
          {children}
          <Toaster />
        </div>
      </ThemeProvider>
    )
  }
) 
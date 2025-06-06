"use client"

import React, { forwardRef, Suspense } from 'react'
import { Toaster } from 'sonner'
import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { TanstackQueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { getBaseUrl } from '@/lib/env'
// Theme providers removed

// Dynamically import client-only providers to prevent hydration mismatches
const ClientOnlyProviders = dynamic(() => import('./client-only-providers'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
})

type AppProvidersProps = {
  children?: React.ReactNode
  session?: any
}

// Main application providers component
export const AppProviders = forwardRef<HTMLDivElement, AppProvidersProps>(
  function AppProviders({ children, session }: AppProvidersProps, ref: React.ForwardedRef<HTMLDivElement>) {
    const content = (
      <div ref={ref}>
        {children}
        <Toaster />
      </div>
    )

    // Configuration for SessionProvider with dynamic base URL for proper callback handling
    const baseUrl = getBaseUrl();
    console.log("Using base URL:", baseUrl);

    // Wrap with NextAuth SessionProvider and our custom AuthProvider
    return (
      <SessionProvider 
        session={session} 
        refetchInterval={5 * 60} 
        refetchOnWindowFocus={true}
        basePath={`${baseUrl}/api/auth`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TanstackQueryProvider>
            <AuthProvider>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              }>
                <ClientOnlyProviders>
                  {content}
                </ClientOnlyProviders>
              </Suspense>
            </AuthProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </SessionProvider>
    )
  }
) 
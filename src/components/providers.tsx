"use client"

import React, { forwardRef } from 'react'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { TanstackQueryProvider } from '@/providers/query-provider'
import { UnifiedStateProvider } from '@/providers/unified-state-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { getBaseUrl } from '@/lib/env'
import { StyleLoader } from '@/components/style-loader'
import { ApprovalSystemInit } from '@/components/approval-system-init'
import { TableThemeProvider } from '@/providers/table-theme-provider'
import { SidenavThemeProvider } from '@/providers/sidenav-theme-provider'

type AppProvidersProps = {
  children?: React.ReactNode
  session?: any
}

export const AppProviders = forwardRef<HTMLDivElement, AppProvidersProps>(
  function AppProviders({ children, session }: AppProvidersProps, ref: React.ForwardedRef<HTMLDivElement>) {
    // Add state to track client-side hydration
    const [isHydrated, setIsHydrated] = useState(false)
    
    // Handle client-side hydration
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // Mark as hydrated
        setIsHydrated(true)
        
        console.log("App hydrated - session data:", 
                    session ? `User: ${session.user?.email || 'No email'}` : "No session");
      }
    }, [session])

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
              <StyleLoader />
              {isHydrated ? (
                <UnifiedStateProvider>
                  <SidenavThemeProvider>
                    <TableThemeProvider>
                      <ApprovalSystemInit />
                      {content}
                    </TableThemeProvider>
                  </SidenavThemeProvider>
                </UnifiedStateProvider>
              ) : (
                // Render without the providers until hydration is complete
                content
              )}
            </AuthProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </SessionProvider>
    )
  }
) 
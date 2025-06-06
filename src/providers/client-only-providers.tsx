"use client"

import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { UnifiedStateProvider } from '@/providers/unified-state-provider'
import { AgentProvider } from '@/providers/agent-provider'

interface ClientOnlyProvidersProps {
  children: React.ReactNode
}

// Client-only providers that were causing hydration mismatches
export default function ClientOnlyProviders({ children }: ClientOnlyProvidersProps) {
  return (
    <SidebarProvider>
      <UnifiedStateProvider>
        <AgentProvider>
          {children}
        </AgentProvider>
      </UnifiedStateProvider>
    </SidebarProvider>
  )
}
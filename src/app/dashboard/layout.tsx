"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { UIStateProvider } from "@/providers/ui-state-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  
  // Direct redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isLoading, router])

  // Wrap children with UIStateProvider
  return (
    <div className="min-h-screen bg-background">
      <UIStateProvider>
        {children}
      </UIStateProvider>
    </div>
  )
}
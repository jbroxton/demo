"use client"

import { useAuth } from "@/stores/auth"
import { useTenantStore } from "@/stores/tenants"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { currentTenant } = useTenantStore()

  useEffect(() => {
    // Guard 1: Authentication Check
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    // Guard 2: Tenant Selection Check
    if (!currentTenant) {
      router.push('/dashboard/select-tenant')
      return
    }

    // Guard 3: Tenant Access Check
    if (!user?.allowedTenants.includes(currentTenant.id)) {
      router.push('/dashboard/select-tenant')
    }
  }, [isAuthenticated, currentTenant, user, router])

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      {children}
    </div>
  )
} 
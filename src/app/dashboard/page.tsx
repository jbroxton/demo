"use client"

import { useAuth } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import DashboardLayout from "@/components/dashboard-layout"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, router])

  if (!user) return null
  
  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardLayout />
    </SidebarProvider>
  )
}
"use client"

import { useAuth } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, router])

  if (!user) return null

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => {
            logout()
            router.push('/auth/signin')
          }}
        >
          Sign Out
        </Button>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.name}</h2>
          <p className="text-sm text-muted-foreground">
            You are logged in as: {user.role}
          </p>
        </div>
      </div>
    </div>
  )
} 
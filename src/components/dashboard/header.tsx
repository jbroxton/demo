"use client"

import { TenantSwitcher } from "@/components/tenant/tenant-switcher"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

export function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <Card className="rounded-none border-b">
      <div className="flex h-16 items-center px-4">
        <div className="text-lg font-medium mr-4">Hi {user?.name}</div>
        <TenantSwitcher />
        <div className="ml-auto">
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
      </div>
    </Card>
  )
} 
"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error signing out')
      setIsLoggingOut(false)
    }
  }

  return (
    <Card className="rounded-none border-b">
      <div className="flex h-16 items-center px-4">
        <div className="text-lg font-medium mr-4">Hi {user?.name || 'User'}</div>
        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
} 
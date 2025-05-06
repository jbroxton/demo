"use client"

import React from "react"
import { useAuth } from "@/hooks/use-auth"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type SignOutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "destructive" | "outline" | "secondary" | "link"
  showIcon?: boolean
  showText?: boolean
}

export default function SignOutButton({
  className,
  variant = "ghost",
  showIcon = true,
  showText = false,
  ...props
}: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const { logout } = useAuth()

  async function handleSignOut() {
    try {
      setIsSigningOut(true)
      await logout()
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("An error occurred while signing out")
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={cn(
        "h-8 w-8 rounded-md p-0",
        showText && "w-auto px-3",
        className
      )}
      aria-label="Sign out"
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {showText && <span className="ml-2">Sign out</span>}
    </Button>
  )
}
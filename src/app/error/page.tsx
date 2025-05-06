"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button" 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

// Error page for auth errors
export default function ErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get error from URL - NextAuth passes error via query params
  const error = searchParams?.get("error") || "Unknown error"
  
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    "Configuration": "There is a problem with the server configuration.",
    "AccessDenied": "You do not have access to this resource.",
    "Verification": "The verification link is invalid or has expired.",
    "CredentialsSignin": "Invalid email or password.",
    "Default": "An unexpected error occurred.",
  }
  
  // Get appropriate error message
  const errorMessage = errorMessages[error] || errorMessages["Default"]
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
          <CardDescription>
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 text-xs opacity-70">
                Error code: {error}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button 
            onClick={() => router.push("/signin")}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
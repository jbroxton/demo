"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error") || "unknown"
  
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    "Configuration": "There is a problem with the server configuration.",
    "AccessDenied": "You do not have access to this resource.",
    "Verification": "The verification link you used is invalid or has expired.",
    "CredentialsSignin": "The credentials you provided are invalid.",
    "OAuthSignin": "Error in OAuth sign in. Please try again.",
    "OAuthCallback": "Error in OAuth callback. Please try again.",
    "OAuthCreateAccount": "Could not create OAuth account. Please try again.",
    "EmailCreateAccount": "Could not create email account. Please try again.",
    "Callback": "Error in authentication callback. Please try again.",
    "OAuthAccountNotLinked": "To confirm your identity, sign in with the same account you used originally.",
    "SessionRequired": "Authentication required. Please sign in to access this page.",
    "default": "An unknown error occurred. Please try again."
  }

  const errorMessage = errorMessages[error] || errorMessages.default

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            We encountered a problem during authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {errorMessage}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signin">Try Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
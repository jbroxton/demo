"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export function AuthForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    async function onSubmit(event: React.FormEvent) {
      event.preventDefault()
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push("/dashboard")
      } catch (error) {
        console.error("Login error:", error)
      } finally {
        setIsLoading(false)
      }
    }
  
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white/60 border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-150"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-gray-700">
                  Password
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white/60 border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all duration-150"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-gray-600">
                Remember me for 30 days
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-150" 
              disabled={isLoading}
            >
              <span className="flex items-center justify-center">
                {isLoading && (
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? "Signing in..." : "Sign in"}
              </span>
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-11 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium transition-all duration-150" 
              type="button"
            >
              Google
            </Button>
            <Button 
              variant="outline" 
              className="h-11 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium transition-all duration-150" 
              type="button"
            >
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <p className="text-sm text-gray-600 text-center w-full">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    )
}
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/hooks/use-auth" // Import from central location
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

// Define the form schema with proper types
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional().default(false)
});

// Infer the type from the schema - make remember optional to match the resolver expectations
type FormValues = {
  email: string;
  password: string;
  remember?: boolean;
}

export function AuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get auth state from our enhanced provider
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    user, 
    login, 
    error,
    clearError 
  } = useAuth()
  
  // Local form error state
  const [formError, setFormError] = React.useState<string | null>(null)
  
  // Debug log auth state with improved formatting
  React.useEffect(() => {
    console.log(`🔐 Auth form - Auth state:`, {
      isAuthenticated,
      isLoading,
      isInitialized,
      user: user ? `${user.email} (${user.id})` : 'No user',
      error: error ? `${error.type}: ${error.message}` : 'none'
    });
  }, [isAuthenticated, isLoading, isInitialized, user, error]);
  
  // Get error from URL if available
  const urlError = searchParams?.get("error")
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  // Set error message if provided in URL
  React.useEffect(() => {
    if (urlError === "CredentialsSignin") {
      setFormError("Invalid email or password")
    }
  }, [urlError])

  // Handle form submission with improved error handling
  async function onSubmit(data: FormValues) {
    setFormError(null)
    clearError() // Clear any previous auth errors
    
    try {
      console.log("🔑 Signing in with:", data.email);
      
      // Use the login method from our auth provider
      const result = await login(data.email, data.password);
      
      if (!result.success) {
        setFormError(result.error || "Invalid email or password")
        toast.error(result.error || "Invalid credentials")
      } else {
        toast.success('Logged in successfully')
        console.log("✅ Login successful - auth state will update")
      }
    } catch (err) {
      console.error("❌ Sign in error:", err)
      setFormError("An error occurred during sign in")
      toast.error('An error occurred during sign in')
    }
  }
  
  // Use Next.js router for redirects - consistent with our approach
  React.useEffect(() => {
    // Only proceed if authenticated and initialization is complete
    if (!isAuthenticated || !isInitialized) return;
    
    const destination = searchParams?.get("callbackUrl") || "/dashboard";
    console.log("🔄 Auth redirect - conditions met, redirecting to:", destination);
    
    const redirectTimer = setTimeout(() => {
      try {
        router.push(destination);
        console.log("➡️ Router redirect initiated");
      } catch (err) {
        console.error("❌ Redirect error:", err);
        
        // Fallback to hard redirect if router fails
        window.location.href = destination;
      }
    }, 100);
    
    // Cleanup timeout if component unmounts
    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, isInitialized, searchParams, router]);
  
  // Show login form after timeout if still in loading
  const [showLoginFormFallback, setShowLoginFormFallback] = React.useState(false);
  
  // Set a shorter timeout for the fallback (2 seconds)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoginFormFallback(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show auth errors from the provider
  const effectiveError = error?.message || formError;
  
  // Improved loading state - using error state from provider
  // Only show loading if not initialized or loading and not showing fallback
  if ((isLoading || !isInitialized || isAuthenticated) && !showLoginFormFallback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="flex items-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">
            {!isInitialized ? "Initializing auth..." :
             isAuthenticated ? "Redirecting to dashboard..." : "Loading..."}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowLoginFormFallback(true)}
          className="mt-2"
        >
          Show login form
        </Button>
        
        {isAuthenticated && (
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mt-2"
          >
            Go to dashboard
          </Button>
        )}
      </div>
    );
  }

  // Add function to handle enter key in password field
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} data-testid="auth-form" {...props}>
      <Card className="bg-[#0A0A0A] border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-4xl text-center font-bold">Sign in to Speqq</CardTitle>
        </CardHeader>
        <CardContent>
          {effectiveError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                {effectiveError}
                {error && (
                  <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-xs text-destructive underline"
                    onClick={() => clearError()}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  required
                  className="bg-transparent border-white/80 text-white focus-visible:ring-[#4f46e5]/30 focus-visible:border-white placeholder:text-white/50"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-auto p-0 h-auto text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info('Password reset is not implemented in this demo');
                    }}
                  >
                    Forgot your password?
                  </Button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  className="bg-transparent border-white/80 text-white focus-visible:ring-[#4f46e5]/30 focus-visible:border-white"
                  {...form.register("password")}
                  onKeyDown={handlePasswordKeyDown}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={form.watch("remember")}
                  onCheckedChange={(checked) => 
                    form.setValue("remember", checked === true)
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#9333EA] to-[#2563EB] hover:from-[#8327d9] hover:to-[#2359d4] border-0"
                disabled={form.formState.isSubmitting || isLoading}
              >
                {form.formState.isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-[#9333EA] hover:text-[#8327d9]"
                  onClick={() => router.push('/signup')}
                >
                  Sign up
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          {/* Demo user info removed for production */}
        </CardFooter>
      </Card>
    </div>
  )
}

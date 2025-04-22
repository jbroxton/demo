"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { useAuth } from "@/stores/auth"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

// Define the form schema with proper types
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean()
}) satisfies z.ZodType<{
  email: string
  password: string
  remember: boolean
}>

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

export function AuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [isHydrated, setIsHydrated] = React.useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  // Handle hydration
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isHydrated, isAuthenticated, router])

  async function onSubmit(data: FormValues) {
    try {
      await login(data.email, data.password)
      toast.success('Logged in successfully')
      router.push("/dashboard")
    } catch (error) {
      toast.error('Invalid credentials')
    }
  }

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
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
                  <a
                    href="#" 
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  {...form.register("password")}
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
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <Button variant="outline" className="w-full">
                Login with Google
              </Button>
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm">
                Don&apos;t have an account?{" "}
                <a 
                  href="#" 
                  className="text-sm underline underline-offset-4"
                >
                  Sign up
                </a>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

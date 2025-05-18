"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import { ArrowRight, Package, Users, Database } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-background text-foreground">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex">
        <div className="fixed left-0 top-0 flex w-full justify-between items-center border-b border-border bg-gradient-to-b from-muted pb-6 pt-8 px-8 backdrop-blur-2xl dark:border-border dark:bg-background/30 dark:from-inherit">
          <p className="font-mono text-xl font-semibold">
            Speqq
          </p>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center max-w-3xl text-center mt-20 mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Modern Database-Driven Product Management
        </h1>
        <p className="text-xl text-muted-foreground mb-10">
          Multi-tenant, high-performance product management platform powered by Supabase
        </p>
        
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Button 
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="px-8"
            >
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              size="lg"
              onClick={() => router.push('/signin')}
              className="px-8"
            >
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-10">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Product Management</h3>
          <p className="text-muted-foreground">
            Create and organize products with intuitive interfaces
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Multi-tenant Access</h3>
          <p className="text-muted-foreground">
            Secure organization-based access controls
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Supabase Database</h3>
          <p className="text-muted-foreground">
            Scalable PostgreSQL backend with real-time capabilities
          </p>
        </div>
      </div>

      <div className="w-full border-t border-border pt-8 pb-4 text-center text-sm text-muted-foreground">
        &copy; 2023 Speqq App. All rights reserved.
      </div>
    </main>
  )
}

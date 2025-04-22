"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b border-border bg-gradient-to-b from-muted pb-6 pt-8 backdrop-blur-2xl dark:border-border dark:bg-background/30 dark:from-inherit">
          <p className="font-mono text-sm">
            Theme Test Page
          </p>
        </div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-background via-background">
          <ThemeToggle />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-lg w-full max-w-md mt-12 p-6 text-card-foreground">
        <h2 className="text-2xl font-semibold mb-4">Dark Mode Test</h2>
        <p className="mb-4">
          This card should change appearance based on the current theme.
        </p>
        <div className="bg-muted rounded p-4 text-muted-foreground">
          <p className="text-sm">
            This is muted content that should adapt to the theme.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="default">
            Primary Button
          </Button>
          <Button variant="secondary">
            Secondary Button
          </Button>
        </div>
        <div className="mt-6">
          <Button 
            onClick={() => router.push('/auth/signin')}
            size="lg"
          >
            Go to Login
          </Button>
        </div>
      </div>
    </main>
  )
}

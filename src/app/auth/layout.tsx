import { ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
    children,
  }: {
    children: ReactNode
  }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    )
  }
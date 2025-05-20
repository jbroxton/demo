"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] text-white">
      {/* Main content */}
      <div className="container mx-auto px-6 flex flex-col items-center text-center z-0">
        {/* Logo above welcome text */}
        <div className="mb-8 w-16 h-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="speqqGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#speqqGradientMain)" />
            <path d="M40 24c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 3.54 2.29 6.53 5.47 7.59.12.04.26.06.4.06h5.27c.14 0 .28-.02.4-.06C38.71 30.53 40 27.54 40 24zm-8 12h-5.27c-.14 0-.28.02-.4.06C23.29 37.13 21 40.12 21 43.66c0 4.42 3.58 8 8 8s8-3.58 8-8c0-3.54-2.29-6.53-5.47-7.59-.12-.04-.26-.06-.4-.06z" fill="white" />
          </svg>
        </div>
        
        <h2 className="text-5xl md:text-6xl font-bold mb-6 max-w-3xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          Welcome to Speqq
        </h2>
        
        <p className="text-xl text-white/70 mb-12 max-w-xl">
          Where Product Managers Work
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5">
          <Link href="/signin" passHref>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[#9333EA] to-[#2563EB] hover:from-[#8327d9] hover:to-[#2359d4] text-white border-0 px-8 py-6 text-lg"
            >
              Sign In
            </Button>
          </Link>
          
          <Link href="/signup" passHref>
            <Button 
              size="lg"
              className="bg-transparent border-white/80 text-white hover:bg-white/10 px-8 py-6 text-lg focus-visible:ring-[#4f46e5]/30 focus-visible:border-white"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Background gradient */}
      <div className="fixed top-1/3 -left-1/4 w-1/2 h-1/2 bg-[#9333EA]/10 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed top-1/2 -right-1/4 w-1/2 h-1/2 bg-[#2563EB]/10 rounded-full blur-[120px] -z-10"></div>
      
      {/* Footer */}
      <footer className="w-full absolute bottom-6 text-center text-sm text-white/40">
        &copy; {new Date().getFullYear()} Speqq. All rights reserved.
      </footer>
    </main>
  )
}

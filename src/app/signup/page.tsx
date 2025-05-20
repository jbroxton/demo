"use client"

import { SignupForm } from "@/components/auth/signup-form"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0A] text-white p-6 md:p-10">
      {/* Logo and title in a row */}
      <div className="mb-8 flex items-center">
        {/* Smaller logo */}
        <div className="w-10 h-10 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64">
            {/* Define the gradient */}
            <defs>
              <linearGradient id="speqqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" /> {/* Purple (tailwind purple-600) */}
                <stop offset="100%" stopColor="#2563EB" /> {/* Blue (tailwind blue-600) */}
              </linearGradient>
            </defs>
            
            {/* Background circle with gradient */}
            <circle cx="32" cy="32" r="30" fill="url(#speqqGradient)" />
            
            {/* Letter S in white */}
            <path d="M40 24c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 3.54 2.29 6.53 5.47 7.59.12.04.26.06.4.06h5.27c.14 0 .28-.02.4-.06C38.71 30.53 40 27.54 40 24zm-8 12h-5.27c-.14 0-.28.02-.4.06C23.29 37.13 21 40.12 21 43.66c0 4.42 3.58 8 8 8s8-3.58 8-8c0-3.54-2.29-6.53-5.47-7.59-.12-.04-.26-.06-.4-.06z" fill="white" />
          </svg>
        </div>
        {/* Smaller text */}
        <h1 className="text-xl md:text-2xl font-semibold text-white">Speqq</h1>
      </div>
      
      {/* Signup form with refined styling */}
      <div className="w-full max-w-sm bg-transparent">
        <SignupForm />
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-sm text-[#a0a0a0]">
        © {new Date().getFullYear()} Speqq. All rights reserved.
      </div>
    </div>
  )
} 
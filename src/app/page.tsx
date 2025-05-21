"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // Easter egg animation state
  const [showAnimation, setShowAnimation] = useState(false)
  
  // Handle logo click to show animation
  const handleLogoClick = () => {
    console.log("Logo clicked, showing animation")
    setShowAnimation(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] text-white overflow-hidden">
      {/* Moonwalking Stick Figure */}
      {showAnimation && (
        <div className="fixed bottom-16 left-10 z-50">
          <div className="animate-slide-in-left">
            {/* Stick Figure Animation Container */}
            <div className="w-60 h-72 relative">
              
              {/* Fun Fact Text */}
              <div className="absolute -top-16 left-0 w-64 transform rotate-[-5deg]">
                <p className="text-base font-semibold text-white opacity-80 mb-2 font-comic" style={{
                  fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}>
                  Fun fact: in the time you took to watch this, you could have already logged in
                </p>
              </div>
              
              {/* Stick Figure */}
              <div className="absolute bottom-10 left-20 animate-moonwalk-sequence">
                <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Head */}
                  <circle cx="60" cy="30" r="20" stroke="white" strokeWidth="3" />
                  
                  {/* Body */}
                  <line x1="60" y1="50" x2="60" y2="120" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Arms - with waving right arm */}
                  <g>
                    <line x1="60" y1="70" x2="30" y2="90" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <g className="origin-[60px_70px]">
                      <line x1="60" y1="70" x2="90" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <animateTransform
                          attributeName="transform"
                          attributeType="XML"
                          type="rotate"
                          from="0 60 70"
                          to="-20 60 70"
                          dur="0.5s"
                          repeatCount="indefinite"
                          additive="sum"
                          values="0 60 70; -20 60 70; 0 60 70"
                          keyTimes="0; 0.5; 1"
                        />
                      </line>
                    </g>
                  </g>
                  
                  {/* Legs - will be animated separately */}
                  <g className="animate-moonwalk-legs">
                    <line x1="60" y1="120" x2="40" y2="180" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-leg-left" />
                    <line x1="60" y1="120" x2="80" y2="180" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-leg-right" />
                  </g>
                  
                  {/* Face - simple expression */}
                  <circle cx="52" cy="25" r="3" fill="white" /> {/* Left eye */}
                  <circle cx="68" cy="25" r="3" fill="white" /> {/* Right eye */}
                  <path d="M50 40 Q60 45 70 40" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-smile-to-shock" /> {/* Mouth */}
                </svg>
              </div>
              
              {/* Trip Effect Elements - appear at end of moonwalk */}
              <div className="absolute bottom-16 left-48 animate-trip-sequence opacity-0">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 5 L25 15 L15 15 Z" fill="#ef4444" /> {/* Triangle */}
                  <circle cx="20" cy="20" r="10" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" /> {/* Dashed circle */}
                  <path d="M15 30 L25 30" stroke="#ef4444" strokeWidth="2" /> {/* Line */}
                </svg>
              </div>
              
              {/* Falling Stick Figure - appears after trip */}
              <div className="absolute bottom-10 left-40 animate-falling-sequence opacity-0">
                <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-rotate-fall">
                  {/* Head */}
                  <circle cx="60" cy="30" r="20" stroke="white" strokeWidth="3" />
                  
                  {/* Body */}
                  <line x1="60" y1="50" x2="60" y2="120" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Arms - flailing */}
                  <g className="animate-flailing-arms">
                    <line x1="60" y1="70" x2="20" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <line x1="60" y1="70" x2="100" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  
                  {/* Legs - spreading out in panic */}
                  <g className="animate-spreading-legs">
                    <line x1="60" y1="120" x2="30" y2="170" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <line x1="60" y1="120" x2="90" y2="170" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  
                  {/* Face - shocked expression */}
                  <circle cx="52" cy="25" r="4" fill="white" /> {/* Left eye - wider */}
                  <circle cx="68" cy="25" r="4" fill="white" /> {/* Right eye - wider */}
                  <circle cx="60" cy="40" r="5" stroke="white" strokeWidth="2" fill="none" /> {/* O-shaped mouth */}
                </svg>
              </div>
              
              {/* Bang/Stars Effect - appears when hitting ground */}
              <div className="absolute bottom-12 left-60 animate-bang-sequence opacity-0">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 0 L43 30 L50 15 L48 35 L65 25 L55 45 L80 45 L55 55 L65 75 L45 60 L50 80 L40 60 L30 80 L35 60 L15 75 L25 55 L0 50 L25 45 L15 25 L35 35 L30 15 L40 30 Z" fill="#facc15" className="animate-bang-star" />
                  <circle cx="40" cy="40" r="20" fill="#9333EA" className="animate-bang-circle" />
                </svg>
              </div>
              
              {/* Text labels - appear at key moments */}
              <div className="absolute top-10 left-10 animate-moonwalk-text text-xl font-bold text-white opacity-0">Moonwalking...</div>
              <div className="absolute top-10 left-60 animate-trip-text text-xl font-bold text-white opacity-0">Whoops!</div>
              <div className="absolute top-30 left-70 animate-bang-text text-xl font-bold text-[#facc15] opacity-0">BANG!</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="container mx-auto px-6 flex flex-col items-center text-center z-0">
        {/* Clickable logo above welcome text */}
        <div 
          className="mb-8 w-16 h-16 cursor-pointer hover:scale-110 transition-transform duration-200 relative" 
          onClick={handleLogoClick}
          title="Click me for a surprise!"
        >
          <div className="absolute inset-0 bg-[#9333EA]/20 rounded-full -z-10 animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
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

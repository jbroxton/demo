import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProviders } from '@/providers/app-providers'
import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Add comment to indicate we're deliberately not importing MUI styles here
// Material UI styles are loaded in globals.css

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter',
})

// Standard metadata for Next.js App Router
export const metadata: Metadata = {
  title: 'Specky Demo',
  description: 'A demonstration application with feature management',
}

type RootLayoutProps = {
  children: React.ReactNode
};

export default async function RootLayout({
  children,
}: RootLayoutProps) {
  // Get the session server-side to eliminate initial loading flicker
  const session = await getServerSession(authOptions);
  
  // Add server-side logging
  console.log("RootLayout - Server-side session:", 
              session ? `User: ${session.user?.name || 'No name'}, ID: ${session.user?.id || 'No ID'}` : "No session");
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
      </head>
      <body className={inter.className}>
        <AppProviders session={session}>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
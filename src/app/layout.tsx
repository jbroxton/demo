"use client"

import { Geist } from "next/font/google"
import "./globals.css"
import { AppProviders } from '@/components/providers'

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
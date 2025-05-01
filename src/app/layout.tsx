import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
// AG Grid imports removed
import { AppProviders } from '@/components/providers'

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

type RootLayoutProps = {
  children: React.ReactNode
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
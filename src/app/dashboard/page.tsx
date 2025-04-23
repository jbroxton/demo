"use client"

import { useAuth } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, router])

  if (!user) return null
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                logout()
                router.push('/auth/signin')
              }}
            >
              Sign Out
            </Button>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Dashboard Card 1</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Dashboard Card 2</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Dashboard Card 3</p>
            </div>
          </div>
          <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 flex items-center justify-center md:min-h-min">
            <p className="text-muted-foreground">Dashboard Content</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
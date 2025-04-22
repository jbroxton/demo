"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { useTenantStore } from "@/stores/tenants"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SelectTenantPage() {
  const router = useRouter()
  const { tenants, setCurrentTenant } = useTenantStore()

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Select a workspace</CardTitle>
          <CardDescription>
            Choose which workspace you want to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search workspace..." />
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup>
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  onSelect={() => {
                    setCurrentTenant(tenant)
                    router.push('/dashboard')
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed">
                    {tenant.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{tenant.name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </CardContent>
      </Card>
    </div>
  )
} 
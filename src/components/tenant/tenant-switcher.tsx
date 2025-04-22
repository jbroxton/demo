"use client"

import * as React from "react"
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/stores/auth"
import { useTenantStore } from "@/stores/tenants"

export function TenantSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { user } = useAuth()
  const { tenants, currentTenant, setCurrentTenant } = useTenantStore()

  // Filter tenants based on user's allowed tenants
  const allowedTenants = tenants.filter(
    tenant => user?.allowedTenants.includes(tenant.id)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className="w-[200px] justify-between"
        >
          {currentTenant?.name ?? "Select organization..."}
          <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandEmpty>No organization found.</CommandEmpty>
          <CommandGroup>
            {allowedTenants.map((tenant) => (
              <CommandItem
                key={tenant.id}
                onSelect={() => {
                  setCurrentTenant(tenant)
                  setOpen(false)
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    currentTenant?.id === tenant.id 
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {tenant.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                // We can add tenant creation logic here later
                setOpen(false)
              }}
            >
              <PlusCircledIcon className="mr-2 h-5 w-5" />
              Create Tenant
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
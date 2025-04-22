"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useTenantStore } from "@/stores/tenants"
import { toast } from "sonner"

export function CreateTenantDialog() {
  const [name, setName] = useState("")
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">("free")
  const [open, setOpen] = useState(false)
  const { tenants, setCurrentTenant } = useTenantStore()

  const onSubmit = () => {
    const newTenant = {
      id: `t${tenants.length + 1}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      plan
    }
    setCurrentTenant(newTenant)
    setOpen(false)
    toast.success("Workspace created!")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Add a new workspace to manage your projects
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Select value={plan} onValueChange={(value: any) => setPlan(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
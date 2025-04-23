import * as React from "react"
import { 
  ChevronRight, 
  File, 
  Folder, 
  Plus, 
  User as UserIcon 
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/stores/auth"
import { Feature, useFeaturesStore } from "@/stores/features"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"

// This is sample data for changes.
const changesData = {
  changes: [
    {
      file: "README.md",
      state: "M",
    },
    {
      file: "api/hello/route.ts",
      state: "U",
    },
    {
      file: "app/layout.tsx",
      state: "M",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { features, addFeature, getFeatures } = useFeaturesStore();
  
  // State for the form
  const [featureName, setFeatureName] = useState('');
  const [priority, setPriority] = useState<'High' | 'Med' | 'Low'>('Med');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle form submission
  const handleCreateFeature = () => {
    if (!featureName) return;
    
    addFeature({
      name: featureName,
      priority,
      description,
      productName,
    });
    
    // Reset form
    setFeatureName('');
    setPriority('Med');
    setDescription('');
    setProductName('');
    setIsOpen(false);
  };
  
  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-3 space-y-3">
        <div className="bg-muted/50 rounded-md p-3 flex items-center">
          <div className="bg-primary/10 rounded-full p-2 mr-3">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium">Welcome, {user?.name}</div>
            <div className="text-xs text-muted-foreground">Logged in as: {user?.role}</div>
          </div>
        </div>
        
        <Drawer direction="bottom" open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Feature
            </Button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-lg border-2 border-border bg-background" style={{ backgroundColor: 'var(--background)' }}>
            <DrawerHeader className="border-b-2 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              <DrawerTitle>New Feature</DrawerTitle>
              <DrawerDescription>
                Create a new feature for your project.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-4 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              <div className="space-y-2">
                <Label htmlFor="feature-name">Feature Name*</Label>
                <Input 
                  id="feature-name" 
                  placeholder="Enter feature name" 
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature-priority">Priority</Label>
                <Select 
                  value={priority} 
                  onValueChange={(value) => setPriority(value as 'High' | 'Med' | 'Low')}
                >
                  <SelectTrigger id="feature-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Med">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature-description">Description</Label>
                <Textarea 
                  id="feature-description" 
                  placeholder="Enter feature description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input 
                  id="product-name" 
                  placeholder="Enter product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
            </div>
            <DrawerFooter className="border-t-2 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              <Button onClick={handleCreateFeature}>Create Feature</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {changesData.changes.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton>
                    <File />
                    {item.file}
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{item.state}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {features.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No features yet. Create one by clicking "New Feature".
                </div>
              ) : (
                features.map((feature) => (
                  <SidebarMenuItem key={feature.id}>
                    <SidebarMenuButton>
                      <File />
                      {feature.name}
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{feature.priority}</SidebarMenuBadge>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3">
        <Button variant="outline" className="w-full">Settings</Button>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

function Tree({ item }: { item: string | any[] }) {
  const [name, ...items] = Array.isArray(item) ? item : [item]

  if (!items.length) {
    return (
      <SidebarMenuButton
        isActive={name === "button.tsx"}
        className="data-[active=true]:bg-transparent"
      >
        <File />
        {name}
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

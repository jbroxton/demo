import * as React from "react"
import { 
  ChevronRight, 
  Calendar,
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
import { Release, useReleasesStore } from "@/stores/releases"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { features, addFeature, updateFeatureWithRelease } = useFeaturesStore();
  const { releases, addRelease, getReleasesByFeatureId } = useReleasesStore();
  
  // State for the feature form
  const [featureName, setFeatureName] = useState('');
  const [priority, setPriority] = useState<'High' | 'Med' | 'Low'>('Med');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the release form
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [releaseName, setReleaseName] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [releasePriority, setReleasePriority] = useState<'High' | 'Med' | 'Low'>('Med');
  const [currentFeatureId, setCurrentFeatureId] = useState<string | null>(null);
  
  // Handle feature form submission
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
  
  // Handle release form submission
  const handleCreateRelease = () => {
    if (!releaseName || !currentFeatureId || !releaseDate) return;
    
    const newRelease: Omit<Release, 'id'> = {
      name: releaseName,
      description: releaseDescription,
      releaseDate,
      priority: releasePriority,
      featureId: currentFeatureId
    };
    
    addRelease(newRelease);
    
    // Get the new release's ID (newest release for this feature)
    const featureReleases = getReleasesByFeatureId(currentFeatureId);
    const newReleaseId = featureReleases[featureReleases.length - 1]?.id;
    
    if (newReleaseId) {
      updateFeatureWithRelease(currentFeatureId, newReleaseId);
    }
    
    // Reset form
    setShowReleaseForm(false);
    setReleaseName('');
    setReleaseDescription('');
    setReleaseDate('');
    setReleasePriority('Med');
  };
  
  // Show the release form for a specific feature
  const handleShowReleaseForm = (featureId: string) => {
    setCurrentFeatureId(featureId);
    setShowReleaseForm(true);
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
              <div className="flex justify-between items-center">
                <div>
                  <DrawerTitle>New Feature</DrawerTitle>
                  <DrawerDescription>
                    Create a new feature for your project.
                  </DrawerDescription>
                </div>
                {currentFeatureId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleShowReleaseForm(currentFeatureId)}
                  >
                    New Release
                  </Button>
                )}
              </div>
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
              
              {showReleaseForm && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Add Release</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="release-name">Release Name*</Label>
                      <Input 
                        id="release-name" 
                        placeholder="Enter release name" 
                        value={releaseName}
                        onChange={(e) => setReleaseName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="release-description">Description</Label>
                      <Textarea 
                        id="release-description" 
                        placeholder="Enter release description"
                        value={releaseDescription}
                        onChange={(e) => setReleaseDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="release-date">Release Date*</Label>
                      <Input 
                        id="release-date" 
                        type="date" 
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="release-priority">Priority</Label>
                      <Select 
                        value={releasePriority} 
                        onValueChange={(value) => setReleasePriority(value as 'High' | 'Med' | 'Low')}
                      >
                        <SelectTrigger id="release-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Med">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <Button onClick={handleCreateRelease}>Add Release</Button>
                      <Button 
                        variant="outline" 
                        className="ml-2" 
                        onClick={() => setShowReleaseForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                features.map((feature) => {
                  const featureReleases = getReleasesByFeatureId(feature.id);
                  
                  return (
                    <FeatureTreeItem 
                      key={feature.id} 
                      feature={feature} 
                      releases={featureReleases}
                      onAddRelease={() => {
                        setCurrentFeatureId(feature.id);
                        setIsOpen(true);
                        setShowReleaseForm(true);
                      }}
                    />
                  );
                })
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

function FeatureTreeItem({ 
  feature, 
  releases,
  onAddRelease
}: { 
  feature: Feature; 
  releases: Release[];
  onAddRelease: () => void;
}) {
  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90" defaultOpen>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {feature.name}
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto h-5 w-5 opacity-0 hover:opacity-100" 
              onClick={(e) => {
                e.stopPropagation();
                onAddRelease();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {releases.length === 0 ? (
              <div className="pl-9 py-1 text-xs text-muted-foreground">
                No releases yet
              </div>
            ) : (
              releases.map((release) => (
                <SidebarMenuItem key={release.id}>
                  <SidebarMenuButton className="pl-9">
                    <Calendar className="h-4 w-4 mr-2" />
                    {release.name}
                    <div className="ml-2 text-xs text-muted-foreground">
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{release.priority}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

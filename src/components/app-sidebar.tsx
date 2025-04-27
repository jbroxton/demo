import * as React from "react"
import { 
  ChevronRight, 
  ChevronDown,
  Calendar,
  File, 
  Folder, 
  Plus, 
  User as UserIcon,
  Package,
  Layers,
  Puzzle,
  Pencil,
  Target,
  CheckSquare,
  Rocket,
  Map,
  Settings,
  LogOut
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/stores/auth"
import { Feature, useFeaturesStore } from "@/stores/features"
import { Interface, useInterfacesStore } from "@/stores/interfaces"
import { Product, useProductsStore } from "@/stores/products"
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useTabsStore } from "@/stores/tabs"
import { useRouter } from "next/navigation"

// This is sample data for changes.
const changesData = {
  changes: [
    {
      file: "Goals",
      icon: Target
    },
    {
      file: "Approvals",
      icon: CheckSquare
    },
    {
      file: "Launches",
      icon: Rocket
    },
    {
      file: "Roadmap",
      icon: Map
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Stores
  const { products, addProduct, updateProductWithInterface, updateProductName } = useProductsStore();
  const { interfaces, addInterface, getInterfacesByProductId, updateInterfaceWithFeature, updateInterfaceName } = useInterfacesStore();
  const { features, addFeature, getFeaturesByInterfaceId, updateFeatureWithRelease } = useFeaturesStore();
  const { releases, addRelease, getReleasesByFeatureId } = useReleasesStore();
  
  // Drawer state
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'product' | 'interface' | 'feature' | 'release'>('product');
  
  // Selected items for hierarchy
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  
  // Product form
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  
  // Interface form
  const [interfaceName, setInterfaceName] = useState('');
  const [interfaceDescription, setInterfaceDescription] = useState('');
  
  // Feature form
  const [featureName, setFeatureName] = useState('');
  const [featurePriority, setFeaturePriority] = useState<'High' | 'Med' | 'Low'>('Med');
  const [featureDescription, setFeatureDescription] = useState('');
  
  // Release form
  const [releaseName, setReleaseName] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [releasePriority, setReleasePriority] = useState<'High' | 'Med' | 'Low'>('Med');
  
  // Reset all forms
  const resetForms = () => {
    // Product form
    setProductName('');
    setProductDescription('');
    
    // Interface form
    setInterfaceName('');
    setInterfaceDescription('');
    
    // Feature form
    setFeatureName('');
    setFeaturePriority('Med');
    setFeatureDescription('');
    
    // Release form
    setReleaseName('');
    setReleaseDescription('');
    setReleaseDate('');
    setReleasePriority('Med');
  };
  
  // Handle product form submission
  const handleCreateProduct = () => {
    if (!productName) return;
    
    const newProduct = {
      name: productName,
      description: productDescription,
    };
    
    addProduct(newProduct);
    resetForms();
    setIsOpen(false);
  };
  
  // Handle interface form submission
  const handleCreateInterface = () => {
    if (!interfaceName || !selectedProductId) return;
    
    const newInterface = {
      name: interfaceName,
      description: interfaceDescription,
      productId: selectedProductId,
    };
    
    addInterface(newInterface);
    
    // Get the new interface's ID (newest interface for this product)
    const productInterfaces = getInterfacesByProductId(selectedProductId);
    const newInterfaceId = productInterfaces[productInterfaces.length - 1]?.id;
    
    if (newInterfaceId) {
      updateProductWithInterface(selectedProductId, newInterfaceId);
    }
    
    resetForms();
    setIsOpen(false);
  };
  
  // Handle feature form submission
  const handleCreateFeature = () => {
    if (!featureName || !selectedInterfaceId) return;
    
    const newFeature = {
      name: featureName,
      priority: featurePriority,
      description: featureDescription,
      interfaceId: selectedInterfaceId,
    };
    
    addFeature(newFeature);
    
    // Get the new feature's ID (newest feature for this interface)
    const interfaceFeatures = getFeaturesByInterfaceId(selectedInterfaceId);
    const newFeatureId = interfaceFeatures[interfaceFeatures.length - 1]?.id;
    
    if (newFeatureId) {
      updateInterfaceWithFeature(selectedInterfaceId, newFeatureId);
    }
    
    resetForms();
    setIsOpen(false);
  };
  
  // Handle release form submission
  const handleCreateRelease = () => {
    if (!releaseName || !selectedFeatureId || !releaseDate) return;
    
    const newRelease: Omit<Release, 'id'> = {
      name: releaseName,
      description: releaseDescription,
      releaseDate,
      priority: releasePriority,
      featureId: selectedFeatureId
    };
    
    addRelease(newRelease);
    
    // Get the new release's ID (newest release for this feature)
    const featureReleases = getReleasesByFeatureId(selectedFeatureId);
    const newReleaseId = featureReleases[featureReleases.length - 1]?.id;
    
    if (newReleaseId) {
      updateFeatureWithRelease(selectedFeatureId, newReleaseId);
    }
    
    resetForms();
    setIsOpen(false);
  };
  
  // Handle add action based on active form
  const handleAdd = () => {
    switch (activeForm) {
      case 'product':
        handleCreateProduct();
        break;
      case 'interface':
        handleCreateInterface();
        break;
      case 'feature':
        handleCreateFeature();
        break;
      case 'release':
        handleCreateRelease();
        break;
    }
  };
  
  // Open drawer to add a new product
  const handleAddProduct = () => {
    setActiveForm('product');
    setIsOpen(true);
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new interface
  const handleAddInterface = (productId: string) => {
    setSelectedProductId(productId);
    setActiveForm('interface');
    setIsOpen(true);
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new feature
  const handleAddFeature = (interfaceId: string) => {
    setSelectedInterfaceId(interfaceId);
    setActiveForm('feature');
    setIsOpen(true);
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new release
  const handleAddRelease = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setActiveForm('release');
    setIsOpen(true);
    setIsTypeDialogOpen(false);
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
        
        {/* Add Type Selection Dialog */}
        <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Select what type of item you want to add.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button 
                variant="outline"
                className="justify-start h-12 text-left px-4"
                onClick={handleAddProduct}
              >
                <Package className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Product</div>
                  <div className="text-xs text-muted-foreground">Top-level container for interfaces</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="justify-start h-12 text-left px-4"
                onClick={() => {
                  if (products.length > 0) {
                    setSelectedProductId(products[0].id);
                    handleAddInterface(products[0].id);
                  }
                }}
                disabled={products.length === 0}
              >
                <Layers className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Interface</div>
                  <div className="text-xs text-muted-foreground">Container for features</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="justify-start h-12 text-left px-4"
                onClick={() => {
                  if (interfaces.length > 0) {
                    setSelectedInterfaceId(interfaces[0].id);
                    handleAddFeature(interfaces[0].id);
                  }
                }}
                disabled={interfaces.length === 0}
              >
                <Puzzle className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Feature</div>
                  <div className="text-xs text-muted-foreground">Product capabilities or user stories</div>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Form Drawer (existing) */}
        <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent 
            className="rounded-t-lg border-2 border-border bg-background !w-[50vw] !max-w-[50vw]" 
            style={{ 
              backgroundColor: 'var(--background)',
              width: '50vw',
              maxWidth: '50vw'
            }}
          >
            <DrawerHeader className="border-b-2 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              <DrawerTitle>
                {activeForm === 'product' && 'Add New Product'}
                {activeForm === 'interface' && 'Add New Interface'}
                {activeForm === 'feature' && 'Add New Feature'}
                {activeForm === 'release' && 'Add New Release'}
              </DrawerTitle>
              <DrawerDescription>
                {activeForm === 'product' && 'Create a new top-level product'}
                {activeForm === 'interface' && 'Add a new interface to the selected product'}
                {activeForm === 'feature' && 'Add a new feature to the selected interface'}
                {activeForm === 'release' && 'Add a new release to the selected feature'}
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-6 space-y-4 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              {/* Product Form */}
              {activeForm === 'product' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name*</Label>
                    <Input 
                      id="product-name" 
                      placeholder="Enter product name" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-description">Description</Label>
                    <Textarea 
                      id="product-description" 
                      placeholder="Enter product description"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              {/* Interface Form */}
              {activeForm === 'interface' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Product</Label>
                    <div className="p-3 border rounded-md bg-muted/20 text-sm">
                      {products.find(p => p.id === selectedProductId)?.name || 'Unknown Product'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interface-name">Interface Name*</Label>
                    <Input 
                      id="interface-name" 
                      placeholder="Enter interface name" 
                      value={interfaceName}
                      onChange={(e) => setInterfaceName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interface-description">Description</Label>
                    <Textarea 
                      id="interface-description" 
                      placeholder="Enter interface description"
                      value={interfaceDescription}
                      onChange={(e) => setInterfaceDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}
              
              {/* Feature Form */}
              {activeForm === 'feature' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Interface</Label>
                    <div className="p-3 border rounded-md bg-muted/20 text-sm">
                      {interfaces.find(i => i.id === selectedInterfaceId)?.name || 'Unknown Interface'}
                    </div>
                  </div>
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
                      value={featurePriority} 
                      onValueChange={(value) => setFeaturePriority(value as 'High' | 'Med' | 'Low')}
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
                      value={featureDescription}
                      onChange={(e) => setFeatureDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}
              
              {/* Release Form */}
              {activeForm === 'release' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Feature</Label>
                    <div className="p-3 border rounded-md bg-muted/20 text-sm">
                      {features.find(f => f.id === selectedFeatureId)?.name || 'Unknown Feature'}
                    </div>
                  </div>
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
                </div>
              )}
            </div>
            
            <DrawerFooter className="border-t-2 bg-background" style={{ backgroundColor: 'var(--background)' }}>
              <Button onClick={handleAdd}>
                {activeForm === 'product' && 'Create Product'}
                {activeForm === 'interface' && 'Create Interface'}
                {activeForm === 'feature' && 'Create Feature'}
                {activeForm === 'release' && 'Create Release'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {changesData.changes.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton>
                    {item.icon ? <item.icon /> : <File />}
                    {item.file}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold">Products</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {products.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No products yet. Create one by clicking "Add New".
                </div>
              ) : (
                products.map((product) => (
                  <ProductTreeItem 
                    key={product.id} 
                    product={product}
                    interfaces={interfaces}
                    features={features}
                    releases={releases}
                    getInterfacesByProductId={getInterfacesByProductId}
                    getFeaturesByInterfaceId={getFeaturesByInterfaceId}
                    getReleasesByFeatureId={getReleasesByFeatureId}
                    onAddInterface={() => handleAddInterface(product.id)}
                    onAddFeature={handleAddFeature}
                    onAddRelease={handleAddRelease}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 flex flex-col gap-2">
        <Button variant="outline" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            logout();
            router.push('/auth/signin');
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

function ProductTreeItem({ 
  product,
  interfaces,
  features,
  releases,
  getInterfacesByProductId,
  getFeaturesByInterfaceId,
  getReleasesByFeatureId,
  onAddInterface,
  onAddFeature,
  onAddRelease
}: { 
  product: Product;
  interfaces: Interface[];
  features: Feature[];
  releases: Release[];
  getInterfacesByProductId: (productId: string) => Interface[];
  getFeaturesByInterfaceId: (interfaceId: string) => Feature[];
  getReleasesByFeatureId: (featureId: string) => Release[];
  onAddInterface: () => void;
  onAddFeature: (interfaceId: string) => void;
  onAddRelease: (featureId: string) => void;
}) {
  const productInterfaces = getInterfacesByProductId(product.id);
  const { openTab, updateTabTitle } = useTabsStore();
  const { updateProductName } = useProductsStore();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(product.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleProductClick = () => {
    if (isEditing) return;
    
    // Open a tab for this product
    openTab({
      title: product.name,
      type: 'product',
      itemId: product.id,
    });
  };
  
  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setNameValue(product.name);
    // Focus will be set after rendering with useEffect
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== product.name) {
      updateProductName(product.id, nameValue);
      updateTabTitle(product.id, 'product', nameValue);
    } else {
      // Reset to original value if empty or unchanged
      setNameValue(product.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(product.name);
      setIsEditing(false);
    }
  };
  
  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <SidebarMenuItem>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {productInterfaces.length > 0 ? (
            <Collapsible 
              className="[&[data-state=open]>button>svg:first-child]:rotate-90" 
              defaultOpen
              onOpenChange={setIsExpanded}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton onClick={handleProductClick} className="hover-container relative">
                  {productInterfaces.length > 0 ? (
                    <ChevronRight 
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      className="transition-transform duration-200" 
                    />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  {isEditing ? (
                    <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={nameValue}
                        onChange={handleNameChange}
                        onBlur={handleNameSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center flex-1">
                      <Package className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="text-base">{product.name}</span>
                      <span 
                        onClick={handleEditStart}
                        className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                        aria-label={`Edit ${product.name}`}
                        role="button"
                        tabIndex={0}
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                  <div 
                    className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddInterface();
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {productInterfaces.length === 0 ? null : (
                    productInterfaces.map((interface_) => (
                      <InterfaceTreeItem 
                        key={interface_.id}
                        interface_={interface_}
                        features={features}
                        releases={releases}
                        getFeaturesByInterfaceId={getFeaturesByInterfaceId}
                        getReleasesByFeatureId={getReleasesByFeatureId}
                        onAddFeature={() => onAddFeature(interface_.id)}
                        onAddRelease={onAddRelease}
                      />
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton onClick={handleProductClick} className="hover-container relative">
              <div className="w-4 h-4" />
              {isEditing ? (
                <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameValue}
                    onChange={handleNameChange}
                    onBlur={handleNameSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center flex-1">
                  <Package className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span className="text-base">{product.name}</span>
                  <span 
                    onClick={handleEditStart}
                    className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                    aria-label={`Edit ${product.name}`}
                    role="button"
                    tabIndex={0}
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                </div>
              )}
              <div 
                className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddInterface();
                }}
              >
                <Plus className="h-3 w-3" />
              </div>
            </SidebarMenuButton>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onAddInterface}>
            Add Interface
          </ContextMenuItem>
          <ContextMenuItem onClick={handleEditStart}>
            Rename Product
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  )
}

function InterfaceTreeItem({ 
  interface_,
  features,
  releases,
  getFeaturesByInterfaceId,
  getReleasesByFeatureId,
  onAddFeature,
  onAddRelease
}: { 
  interface_: Interface;
  features: Feature[];
  releases: Release[];
  getFeaturesByInterfaceId: (interfaceId: string) => Feature[];
  getReleasesByFeatureId: (featureId: string) => Release[];
  onAddFeature: () => void;
  onAddRelease: (featureId: string) => void;
}) {
  const interfaceFeatures = getFeaturesByInterfaceId(interface_.id);
  const { openTab, updateTabTitle } = useTabsStore();
  const { updateInterfaceName } = useInterfacesStore();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(interface_.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInterfaceClick = () => {
    if (isEditing) return;
    
    // Open a tab for this interface
    openTab({
      title: interface_.name,
      type: 'interface',
      itemId: interface_.id,
    });
  };
  
  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setNameValue(interface_.name);
    // Focus will be set after rendering with useEffect
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== interface_.name) {
      updateInterfaceName(interface_.id, nameValue);
      updateTabTitle(interface_.id, 'interface', nameValue);
    } else {
      // Reset to original value if empty or unchanged
      setNameValue(interface_.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(interface_.name);
      setIsEditing(false);
    }
  };
  
  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <SidebarMenuItem>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {interfaceFeatures.length > 0 ? (
            <Collapsible 
              className="[&[data-state=open]>button>svg:first-child]:rotate-90" 
              defaultOpen
              onOpenChange={setIsExpanded}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton onClick={handleInterfaceClick} className="hover-container relative">
                  {interfaceFeatures.length > 0 ? (
                    <ChevronRight 
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      className="transition-transform duration-200" 
                    />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  {isEditing ? (
                    <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={nameValue}
                        onChange={handleNameChange}
                        onBlur={handleNameSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center flex-1">
                      <Layers className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span>{interface_.name}</span>
                      <span
                        onClick={handleEditStart}
                        className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                        aria-label={`Edit ${interface_.name}`}
                        role="button"
                        tabIndex={0}
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                  <div 
                    className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFeature();
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {interfaceFeatures.length === 0 ? null : (
                    interfaceFeatures.map((feature) => (
                      <FeatureTreeItem 
                        key={feature.id}
                        feature={feature}
                        releases={releases}
                        getReleasesByFeatureId={getReleasesByFeatureId}
                        onAddRelease={() => onAddRelease(feature.id)}
                      />
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton onClick={handleInterfaceClick} className="hover-container relative">
              <div className="w-4 h-4" />
              {isEditing ? (
                <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameValue}
                    onChange={handleNameChange}
                    onBlur={handleNameSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center flex-1">
                  <Layers className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span>{interface_.name}</span>
                  <span
                    onClick={handleEditStart}
                    className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                    aria-label={`Edit ${interface_.name}`}
                    role="button"
                    tabIndex={0}
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                </div>
              )}
              <div 
                className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFeature();
                }}
              >
                <Plus className="h-3 w-3" />
              </div>
            </SidebarMenuButton>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onAddFeature}>
            Add Feature
          </ContextMenuItem>
          <ContextMenuItem onClick={handleEditStart}>
            Rename Interface
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  )
}

function FeatureTreeItem({ 
  feature,
  releases,
  getReleasesByFeatureId,
  onAddRelease
}: { 
  feature: Feature;
  releases: Release[];
  getReleasesByFeatureId: (featureId: string) => Release[];
  onAddRelease: () => void;
}) {
  const featureReleases = getReleasesByFeatureId(feature.id);
  const { openTab, updateTabTitle } = useTabsStore();
  const { updateFeatureName } = useFeaturesStore();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(feature.name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFeatureClick = () => {
    if (isEditing) return;
    
    openTab({
      title: feature.name,
      type: 'feature',
      itemId: feature.id,
    });
  };
  
  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setNameValue(feature.name);
    // Focus will be set after rendering with useEffect
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== feature.name) {
      updateFeatureName(feature.id, nameValue);
      updateTabTitle(feature.id, 'feature', nameValue);
    } else {
      // Reset to original value if empty or unchanged
      setNameValue(feature.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(feature.name);
      setIsEditing(false);
    }
  };
  
  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  return (
    <SidebarMenuItem>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {featureReleases.length > 0 ? (
            <Collapsible 
              className="[&[data-state=open]>button>svg:first-child]:rotate-90" 
              defaultOpen
              onOpenChange={setIsExpanded}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton onClick={handleFeatureClick} className="hover-container relative">
                  {featureReleases.length > 0 ? (
                    <ChevronRight 
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      className="transition-transform duration-200" 
                    />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  {isEditing ? (
                    <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={nameValue}
                        onChange={handleNameChange}
                        onBlur={handleNameSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center flex-1">
                      <Puzzle className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="truncate">{feature.name}</span>
                      <span
                        onClick={handleEditStart}
                        className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                        aria-label={`Edit ${feature.name}`}
                        role="button"
                        tabIndex={0}
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                  <div 
                    className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRelease();
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {featureReleases.length === 0 ? null : (
                    featureReleases.map((release) => (
                      <SidebarMenuItem key={release.id}>
                        <SidebarMenuButton 
                          className="pl-[4.5rem]"
                          onClick={() => {
                            openTab({
                              title: release.name,
                              type: 'release',
                              itemId: release.id,
                            });
                          }}
                        >
                          {release.name}
                          <div className="ml-2 text-xs text-muted-foreground">
                            {new Date(release.releaseDate).toLocaleDateString()}
                          </div>
                          <SidebarMenuBadge>{release.priority}</SidebarMenuBadge>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton onClick={handleFeatureClick} className="hover-container relative">
              <div className="w-4 h-4" />
              {isEditing ? (
                <div onClick={e => e.stopPropagation()} className="flex-1 mx-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameValue}
                    onChange={handleNameChange}
                    onBlur={handleNameSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#232326] border border-[#2a2a2c] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center flex-1">
                  <Puzzle className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span className="truncate">{feature.name}</span>
                  <span
                    onClick={handleEditStart}
                    className="ml-1.5 p-0.5 rounded-sm opacity-0 hover:opacity-100 hover:bg-[#2a2a2c] cursor-pointer transition-opacity duration-200 edit-button"
                    aria-label={`Edit ${feature.name}`}
                    role="button"
                    tabIndex={0}
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                </div>
              )}
              <div 
                className="ml-auto h-5 w-5 flex items-center justify-center rounded-sm opacity-0 hover:opacity-100 hover:bg-muted/50 cursor-pointer transition-opacity duration-200 plus-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRelease();
                }}
              >
                <Plus className="h-3 w-3" />
              </div>
            </SidebarMenuButton>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onAddRelease}>
            Add Release
          </ContextMenuItem>
          <ContextMenuItem onClick={handleEditStart}>
            Rename Feature
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  )
}

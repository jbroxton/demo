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
import { cn } from "@/lib/utils"

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
  const { openTab } = useTabsStore();
  
  // Dialog states
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  // Form and selection states
  const [activeForm, setActiveForm] = useState<'product' | 'interface' | 'feature' | 'release'>('product');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string>('');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('');
  
  // For backward compatibility with existing code, maintain isOpen state
  const [isOpen, setIsOpen] = useState(false);
  
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
    // Open a new tab for creating a product
    const newProductId = `new-product-${Date.now()}`;
    openTab({
      title: 'New Product',
      type: 'product',
      itemId: newProductId
    });
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new interface
  const handleAddInterface = (productId: string) => {
    // Open a new tab for creating an interface
    const newInterfaceId = `new-interface-${Date.now()}-${productId}`;
    openTab({
      title: 'New Interface',
      type: 'interface',
      itemId: newInterfaceId
    });
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new feature
  const handleAddFeature = (interfaceId: string) => {
    // Open a new tab for creating a feature
    const newFeatureId = `new-feature-${Date.now()}-${interfaceId}`;
    openTab({
      title: 'New Feature',
      type: 'feature',
      itemId: newFeatureId
    });
    setIsTypeDialogOpen(false);
  };
  
  // Open drawer to add a new release
  const handleAddRelease = (featureId: string) => {
    // Open a new tab for creating a release
    const newReleaseId = `new-release-${Date.now()}-${featureId}`;
    openTab({
      title: 'New Release',
      type: 'release',
      itemId: newReleaseId
    });
    setIsTypeDialogOpen(false);
  };
  
  return (
    <Sidebar className={props.className} {...props}>
      <div className="flex flex-col h-full">
        <div className="p-3 flex justify-between items-center border-b border-[#232326]">
          <div className="flex items-center space-x-2">
            <div className="bg-zinc-800 w-8 h-8 rounded-md flex items-center justify-center">
              <div className="w-4 h-4 bg-zinc-300 rounded-sm"></div>
          </div>
          <div>
              <div className="text-sm font-medium text-white">specky</div>
              <div className="text-xs text-[#a0a0a0]">spec editor</div>
          </div>
        </div>
          <button 
            className="p-1.5 rounded-md text-[#a0a0a0] hover:bg-[#232326] hover:text-white"
                onClick={() => {
              logout();
              router.push('/auth/signin');
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
                </div>

        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {changesData.changes.map((change) => (
                <SidebarMenuItem key={change.file}>
                  <SidebarMenuButton>
                    <change.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{change.file}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center">
            <span>Products</span>
            <button 
              onClick={() => {
                setIsTypeDialogOpen(true);
                setActiveForm('product');
              }}
              className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-[#2a2a2c]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {products.length === 0 ? (
                <SidebarMenuItem>
                  <div className="flex justify-center py-4 text-[#a0a0a0] text-sm">
                    No products yet
                </div>
                </SidebarMenuItem>
              ) : (
                products.map(product => (
                  <ProductTreeItem 
                    key={product.id} 
                    product={product}
                    interfaces={interfaces}
                    features={features}
                    releases={releases}
                    getInterfacesByProductId={getInterfacesByProductId}
                    getFeaturesByInterfaceId={getFeaturesByInterfaceId}
                    getReleasesByFeatureId={getReleasesByFeatureId}
                    onAddInterface={() => {
                      handleAddInterface(product.id);
                    }}
                    onAddFeature={(interfaceId) => {
                      handleAddFeature(interfaceId);
                    }}
                    onAddRelease={(featureId) => {
                      handleAddRelease(featureId);
                    }}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Dialog 
          open={isTypeDialogOpen} 
          onOpenChange={setIsTypeDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Choose the type of item you want to add
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Card className="cursor-pointer hover:bg-muted/50" onClick={handleAddProduct}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-muted-foreground" />
                    Product
                  </CardTitle>
                  <DialogDescription>
                    Create a new product
                  </DialogDescription>
                </CardHeader>
              </Card>
              <Card 
                className={cn(
                  "cursor-pointer", 
                  products.length > 0 ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                )} 
                onClick={products.length > 0 ? () => {
                  // If there are products, select the first one and create an interface for it
                  if (products.length > 0) {
                    handleAddInterface(products[0].id);
                  }
                  setIsTypeDialogOpen(false);
                } : undefined}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
                    Interface
                  </CardTitle>
                  <DialogDescription>
                    {products.length > 0 
                      ? "Add a new interface" 
                      : "Create a product first"
                    }
                  </DialogDescription>
                </CardHeader>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Card 
                className={cn(
                  "cursor-pointer", 
                  interfaces.length > 0 ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                )} 
                onClick={interfaces.length > 0 ? () => {
                  // If there are interfaces, select the first one and create a feature for it
                  if (interfaces.length > 0) {
                    handleAddFeature(interfaces[0].id);
                  }
                  setIsTypeDialogOpen(false);
                } : undefined}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Puzzle className="h-5 w-5 mr-2 text-muted-foreground" />
                    Feature
                  </CardTitle>
                  <DialogDescription>
                    {interfaces.length > 0 
                      ? "Add a new feature" 
                      : "Create an interface first"
                    }
                  </DialogDescription>
                </CardHeader>
              </Card>
              <Card 
                className={cn(
                  "cursor-pointer", 
                  features.length > 0 ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                )} 
                onClick={features.length > 0 ? () => {
                  // If there are features, select the first one and create a release for it
                  if (features.length > 0) {
                    handleAddRelease(features[0].id);
                  }
                  setIsTypeDialogOpen(false);
                } : undefined}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    Release
                  </CardTitle>
                  <DialogDescription>
                    {features.length > 0 
                      ? "Add a new release" 
                      : "Create a feature first"
                    }
                  </DialogDescription>
                </CardHeader>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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

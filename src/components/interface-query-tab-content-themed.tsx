import React, { useEffect, useState } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Layers, Save, X, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

interface InterfaceQueryTabContentProps {
  interfaceId: string;
  tabId: string;
  isNew?: boolean;
  selectedProductId?: string;
}

export function InterfaceQueryTabContentThemed({ 
  interfaceId, 
  tabId,
  isNew = false, 
  selectedProductId 
}: InterfaceQueryTabContentProps) {
  // Get theme
  const theme = useAppTheme();
  
  // React Query hooks
  const interfacesQuery = useInterfacesQuery();
  const productsQuery = useProductsQuery();
  const featuresQuery = useFeaturesQuery();
  
  // Tabs query hook
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem, openTab } = useTabsQuery();
  
  // State
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Interface' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [productId, setProductId] = useState(selectedProductId || '');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Get data from React Query hooks
  const interface_ = isNew ? null : interfacesQuery.getInterfaceById(interfaceId);
  const products = productsQuery.getProducts();
  const selectedProduct = productId ? productsQuery.getProductById(productId) : null;
  
  // Get features for this interface if not new
  const interfaceFeatures = !isNew ? featuresQuery.getFeaturesByInterfaceId(interfaceId) : [];
  const hasFeatures = interfaceFeatures && interfaceFeatures.length > 0;
  
  // Loading states
  const isLoading = interfacesQuery.isLoading || productsQuery.isLoading || featuresQuery.isLoading;
  const isSaving = 
    interfacesQuery.addInterfaceMutation.isPending || 
    interfacesQuery.updateInterfaceNameMutation.isPending || 
    interfacesQuery.updateInterfaceDescriptionMutation.isPending;
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize values from interface
    if (interface_) {
      setNameValue(interface_.name);
      setDescriptionValue(interface_.description || '');
      setProductId(interface_.productId);
    }
  }, [interface_]);
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading interface...
      </div>
    );
  }
  
  // Interface not found
  if (!isNew && !interface_) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
        Interface not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };
  
  const handleProductChange = (value: string) => {
    setProductId(value);
  };
  
  const handleSaveInterface = async () => {
    if (!nameValue.trim()) {
      return;
    }
    
    try {
      if (isNew) {
        if (!productId) {
          return;
        }
        
        // Create new interface
        const savedInterface = await interfacesQuery.addInterface({
          name: nameValue.trim(),
          description: descriptionValue.trim(),
          productId: productId
        });
        
        if (savedInterface && savedInterface.id) {
          // Update the product with this interface
          await productsQuery.updateProductWithInterface(productId, savedInterface.id);
          
          // Find the current tab (temporary tab)
          const currentTab = tabs.find(tab => tab.id === tabId);
          if (currentTab) {
            updateNewTabToSavedItem(currentTab.id, savedInterface.id, nameValue.trim(), 'interface');
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
          }
        }
      } else if (interface_) {
        // Update existing interface
        if (nameValue.trim() !== interface_.name) {
          await interfacesQuery.updateInterfaceName(interfaceId, nameValue);
          updateTabTitle(interfaceId, 'interface', nameValue);
        }
        
        if (descriptionValue.trim() !== interface_.description) {
          await interfacesQuery.updateInterfaceDescription(interfaceId, descriptionValue);
        }
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save interface:', error);
      toast.error('Failed to save interface');
    }
  };
  
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (!isNew && interface_) {
        handleSaveInterface();
      }
    } else {
      // Enter edit mode - reset form values to current interface values
      if (interface_) {
        setNameValue(interface_.name);
        setDescriptionValue(interface_.description || '');
      }
      setIsEditing(true);
    }
  };
  
  const handleCancelNewInterface = () => {
    if (isNew) {
      closeTab(tabId);
    } else {
      // Reset to interface values and exit edit mode
      if (interface_) {
        setNameValue(interface_.name);
        setDescriptionValue(interface_.description || '');
      }
      setIsEditing(false);
    }
  };
  
  const handleDeleteInterface = async () => {
    if (!isNew && interface_) {
      try {
        await interfacesQuery.deleteInterface(interfaceId);
        toast.success('Interface deleted successfully');
        // Close this specific tab using the tabId prop, not the interfaceId
        closeTab(tabId);
      } catch (error) {
        console.error('Failed to delete interface:', error);
        toast.error('Failed to delete interface');
      }
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCreateFeature = () => {
    if (!isNew && interface_) {
      // Create a temporary ID with timestamp and interface ID
      const timestamp = Date.now();
      const temporaryItemId = `new-feature-${timestamp}-${interfaceId}`;
      
      openTab({
        title: 'New Feature',
        type: 'feature',
        itemId: temporaryItemId
      });
    }
  };
  
  const handleOpenFeature = (featureId: string, featureName: string) => {
    openTab({
      title: featureName,
      type: 'feature',
      itemId: featureId
    });
  };
  
  // Removed the hardcoded background color from the container div to allow parent styles to show through
  return (
    <div className="flex flex-col h-full">
      {/* Header section with interface name and action buttons */}
      <div className="px-6 py-4 border-b border-white/[0.05] grid grid-cols-2">
        {/* Column 1: Interface name */}
        <div className="flex items-center">
          <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter interface name"
              />
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
            </h1>
          )}
        </div>
        
        {/* Column 2: Action buttons */}
        <div className="flex items-center justify-end space-x-2">
          {!isNew && !isEditing && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleToggleEditMode}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={interfacesQuery.deleteInterfaceMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
          
          {(isNew || isEditing) && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleCancelNewInterface}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleSaveInterface}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || !nameValue.trim() || (isNew && !productId)}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          
          {showSaveSuccess && (
            <div className="text-sm text-green-500 transition-opacity duration-300">
              Saved successfully!
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">Interface Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              {isEditing ? (
                <Textarea
                  value={descriptionValue}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
                  placeholder="Enter interface description"
                  rows={4}
                />
              ) : (
                <p>{descriptionValue ? descriptionValue : "No description provided."}</p>
              )}
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Product</p>
              {isNew ? (
                <div className="max-w-md">
                  <Select
                    value={productId}
                    onValueChange={handleProductChange}
                    disabled={products.length === 0}
                  >
                    <SelectTrigger className="bg-[#232326] border-[#2a2a2c] text-white">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {products.length === 0 && (
                    <p className="text-sm text-red-400 mt-1">
                      No products available. Create a product first.
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  {selectedProduct ? `Connected to product: ${selectedProduct.name}` : "No product connected"}
                </p>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[#a0a0a0] text-sm">Features</p>
                {!isNew && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                    onClick={handleCreateFeature}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                )}
              </div>
              
              {isNew ? (
                <p>Features can be added after the interface is created.</p>
              ) : hasFeatures ? (
                <div className="bg-[#232326] rounded-md p-2 space-y-1">
                  {interfaceFeatures.map(feature => (
                    <div 
                      key={feature.id} 
                      className="p-2 hover:bg-[#2a2a2c] rounded-md cursor-pointer flex justify-between items-center"
                      onClick={() => handleOpenFeature(feature.id, feature.name)}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          feature.priority === 'High' ? 'bg-red-500' : 
                          feature.priority === 'Med' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}></div>
                        <span>{feature.name}</span>
                      </div>
                      <span className="text-xs text-[#a0a0a0]">{feature.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No features connected to this interface.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#232326] border-[#2a2a2c] text-white">
          <DialogHeader>
            <DialogTitle>Delete Interface</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure you want to delete this interface? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteInterface}
              disabled={interfacesQuery.deleteInterfaceMutation.isPending}
            >
              {interfacesQuery.deleteInterfaceMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
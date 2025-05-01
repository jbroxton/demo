import React, { useEffect, useState } from 'react';
import { useInterfacesStore } from '@/stores/interfaces';
import { useProductsStore } from '@/stores/products';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Layers, Save, X, Trash2 } from 'lucide-react';
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

interface InterfaceTabContentProps {
  interfaceId: string;
  tabId: string;
  isNew?: boolean;
  selectedProductId?: string;
}

export function InterfaceTabContent({ 
  interfaceId, 
  tabId,
  isNew = false, 
  selectedProductId 
}: InterfaceTabContentProps) {
  const { getInterfaceById, updateInterfaceName, updateInterfaceDescription, addInterface, getInterfacesByProductId, deleteInterface } = useInterfacesStore();
  const { getProducts, getProductById, updateProductWithInterface } = useProductsStore();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Interface' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [productId, setProductId] = useState(selectedProductId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const interface_ = isNew ? null : getInterfaceById(interfaceId);
  const products = getProducts();
  const selectedProduct = productId ? getProductById(productId) : null;
  
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
  
  if (!isNew && !interface_) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
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
    
    if (isNew) {
      if (!productId) {
        return;
      }
      
      setIsSaving(true);
      try {
        // Create new interface
        await addInterface({
          name: nameValue.trim(),
          description: descriptionValue.trim(),
          productId: productId
        });
        // Update the product with this interface
        const newInterfaces = getInterfacesByProductId(productId);
        if (newInterfaces.length > 0) {
          const newInterfaceId = newInterfaces[newInterfaces.length - 1].id;
          updateProductWithInterface(productId, newInterfaceId);
          // Find the current tab (temporary tab)
          const currentTab = tabs.find(tab => tab.id === tabId);
          if (currentTab && newInterfaceId) {
            updateNewTabToSavedItem(currentTab.id, newInterfaceId, nameValue.trim(), 'interface');
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
          }
        }
      } catch (error) {
        console.error('Failed to save interface:', error);
      } finally {
        setIsSaving(false);
      }
    } else if (interface_) {
      // Update existing interface
      if (nameValue.trim() !== interface_.name) {
        updateInterfaceName(interfaceId, nameValue);
        updateTabTitle(interfaceId, 'interface', nameValue);
      }
      
      if (descriptionValue.trim() !== interface_.description) {
        updateInterfaceDescription(interfaceId, descriptionValue);
      }
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setIsEditing(false);
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
  
  const handleDeleteInterface = () => {
    if (!isNew && interface_) {
      const success = deleteInterface(interfaceId);
      if (success) {
        toast.success('Interface deleted successfully');
        // Close this specific tab using the tabId prop, not the interfaceId
        closeTab(tabId);
      } else {
        toast.error('Failed to delete interface');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section with interface name and action buttons */}
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
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
              <p className="text-[#a0a0a0] text-sm mb-1">Features</p>
              <p>
                {isNew ? 
                  "No features connected" : 
                  (interface_ && interface_.features && interface_.features.length > 0 
                    ? `${interface_.features.length} features connected` 
                    : "No features connected to this interface.")
                }
              </p>
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
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
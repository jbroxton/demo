import React, { useEffect, useState } from 'react';
import { useProductsStore } from '@/stores/products';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Package, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductTabContentProps {
  productId: string;
  tabId: string;
  isNew?: boolean;
}

export function ProductTabContent({ productId, tabId, isNew = false }: ProductTabContentProps) {
  const { getProductById, updateProductName, updateProductDescription, addProduct, deleteProduct } = useProductsStore();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Product' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const product = isNew ? null : getProductById(productId);
  
  // Debug log on every render
  console.log('[ProductTabContent] render', { productId, isNew, product });
  
  // Handle client-side rendering and reset state on productId/isNew/product change
  useEffect(() => {
    setIsClient(true);
    if (isNew) {
      setNameValue('New Product');
      setDescriptionValue('');
      setIsEditing(true);
    } else if (product) {
      setNameValue(product.name);
      setDescriptionValue(product.description || '');
      setIsEditing(false);
    }
    console.log('[ProductTabContent] useEffect', { productId, isNew, product });
  }, [productId, isNew, product]);
  
  if (!isNew && !product) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Product not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };
  
  const handleSaveProduct = async () => {
    console.log('[ProductTabContent] handleSaveProduct called');
    if (!nameValue.trim()) {
      return;
    }
    
    if (isNew) {
      setIsSaving(true);
      try {
        // Create new product and get the new product object
        const savedProduct = await addProduct({
          name: nameValue.trim(),
          description: descriptionValue.trim()
        });
        // Find the current tab (temporary tab)
        const currentTab = tabs.find(tab => tab.id === tabId);
        if (currentTab && savedProduct && savedProduct.id) {
          console.log('[ProductTabContent] Calling updateNewTabToSavedItem with type:', 'product');
          updateNewTabToSavedItem(currentTab.id, savedProduct.id, savedProduct.name, 'product');
          setShowSaveSuccess(true);
          setTimeout(() => setShowSaveSuccess(false), 3000);
        }
      } catch (error) {
        console.error('Failed to save product:', error);
      } finally {
        setIsSaving(false);
      }
    } else if (product) {
      // Update existing product
      if (nameValue.trim() !== product.name) {
        updateProductName(productId, nameValue);
        updateTabTitle(productId, 'product', nameValue);
      }
      
      if (descriptionValue.trim() !== product.description) {
        updateProductDescription(productId, descriptionValue);
      }
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setIsEditing(false);
    }
  };
  
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (!isNew && product) {
        handleSaveProduct();
      }
    } else {
      // Enter edit mode - reset form values to current product values
      if (product) {
        setNameValue(product.name);
        setDescriptionValue(product.description || '');
      }
      setIsEditing(true);
    }
  };
  
  const handleCancelNewProduct = () => {
    if (isNew) {
      closeTab(tabId);
    } else {
      // Reset to product values and exit edit mode
      if (product) {
        setNameValue(product.name);
        setDescriptionValue(product.description || '');
      }
      setIsEditing(false);
    }
  };
  
  const handleDeleteProduct = () => {
    if (!isNew && product) {
      const success = deleteProduct(productId);
      if (success) {
        toast.success('Product deleted successfully');
        // Close this specific tab using the tabId prop, not the productId
        closeTab(tabId);
      } else {
        toast.error('Failed to delete product');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        <div className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter product name"
              />
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
            </h1>
          )}
        </div>
        
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
                onClick={handleCancelNewProduct}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleSaveProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || !nameValue.trim()}
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
          <h2 className="text-lg font-medium mb-4">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              {isEditing ? (
                <Textarea
                  value={descriptionValue}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
                  placeholder="Enter product description"
                  rows={4}
                />
              ) : (
                <p>{descriptionValue ? descriptionValue : "No description provided."}</p>
              )}
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Interfaces</p>
              <p>
                {isNew ? 
                  "No interfaces connected" : 
                  (product && product.interfaces && product.interfaces.length > 0 
                    ? `${product.interfaces.length} interfaces connected` 
                    : "No interfaces connected to this product.")
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#232326] border-[#2a2a2c] text-white">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure you want to delete this product? This action cannot be undone.
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
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
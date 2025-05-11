import React, { useEffect, useState } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Package, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductsQuery } from '@/hooks/use-products-query';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

interface ProductQueryTabContentProps {
  productId: string;
  tabId: string;
  isNew?: boolean;
}

export function ProductQueryTabContentThemed({ productId, tabId, isNew = false }: ProductQueryTabContentProps) {
  // Get theme
  const theme = useAppTheme();
  
  const productsQuery = useProductsQuery();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsQuery();
  
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Product' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Get the current product (if not new)
  const product = isNew ? null : productsQuery.getProductById(productId);
  
  // Handle product loading and state initialization
  useEffect(() => {
    if (isNew) {
      setNameValue('New Product');
      setDescriptionValue('');
      setIsEditing(true);
    } else if (product) {
      setNameValue(product.name);
      setDescriptionValue(product.description || '');
      setIsEditing(false);
    }
  }, [productId, isNew, product]);
  
  // Loading state
  if (productsQuery.isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading product...
      </div>
    );
  }
  
  // Error state
  if (productsQuery.error && !isNew) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Error loading product: {String(productsQuery.error)}
      </div>
    );
  }
  
  // Product not found
  if (!isNew && !product && !productsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
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
    if (!nameValue.trim()) {
      return;
    }
    
    try {
      if (isNew) {
        // Create new product
        const savedProduct = await productsQuery.addProduct({
          name: nameValue.trim(),
          description: descriptionValue.trim()
        });
        
        // Find the current tab (temporary tab)
        const currentTab = tabs.find(tab => tab.id === tabId);
        if (currentTab && savedProduct && savedProduct.id) {
          updateNewTabToSavedItem(currentTab.id, savedProduct.id, savedProduct.name, 'product');
          showSuccessMessage();
        }
      } else if (product) {
        // Update existing product
        if (nameValue.trim() !== product.name) {
          await productsQuery.updateProductName(productId, nameValue);
          updateTabTitle(productId, 'product', nameValue);
        }
        
        if (descriptionValue.trim() !== product.description) {
          await productsQuery.updateProductDescription(productId, descriptionValue);
        }
        
        showSuccessMessage();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product');
    }
  };
  
  const showSuccessMessage = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
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
  
  const handleDeleteProduct = async () => {
    if (!isNew && product) {
      try {
        const success = await productsQuery.deleteProduct(productId);
        if (success) {
          toast.success('Product deleted successfully');
          // Close this specific tab using the tabId prop, not the productId
          closeTab(tabId);
        } else {
          toast.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Determine if we're in a loading state for mutations
  const isSaving = 
    productsQuery.addProductMutation.isPending || 
    productsQuery.updateProductNameMutation.isPending || 
    productsQuery.updateProductDescriptionMutation.isPending;

  const isDeleting = productsQuery.deleteProductMutation.isPending;
  
  // Removed the hardcoded background color from the container div to allow parent styles to show through
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/[0.05] grid grid-cols-2">
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
                disabled={productsQuery.isLoading}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={productsQuery.isLoading || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
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
                disabled={isSaving}
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
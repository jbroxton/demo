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

interface ProductQueryTabContentProps {
  productId: string;
  tabId: string;
}

export function ProductQueryTabContent({ productId, tabId }: ProductQueryTabContentProps) {
  const productsQuery = useProductsQuery();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsQuery();
  
  console.log('ProductQueryTabContent mounted - props:', { productId, tabId });
  console.log('ProductQueryTabContent - productsQuery state:', {
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    products: productsQuery.products,
    productsCount: Array.isArray(productsQuery.products) ? productsQuery.products.length : 0
  });
  
  // Get the current product
  const product = productsQuery.getProductById(productId);
  
  // Check if this is a new product based on isSaved field
  const isNew = product && !product.isSaved;
  
  console.log('ProductQueryTabContent - product lookup:', {
    productId,
    product,
    products: productsQuery.getProducts(),
    isNew,
    isSaved: product?.isSaved
  });
  
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  console.log('ProductQueryTabContent - state:', { isEditing, nameValue, descriptionValue });
  
  // Handle product loading and state initialization
  useEffect(() => {
    if (product) {
      setNameValue(product.name);
      setDescriptionValue(product.description || '');
      // Edit mode should be on for new products (isSaved = false)
      setIsEditing(!product.isSaved);
    }
  }, [product]);
  
  // Attempt to refresh the product if not found
  useEffect(() => {
    if (!productsQuery.isLoading && !product && productId) {
      console.log('Product not found, attempting refresh...');
      // First try to invalidate and refetch the entire products list
      const timer = setTimeout(async () => {
        await productsQuery.invalidateQueries();
        await productsQuery.refetch();
        
        // If still not found, try to fetch specifically this product
        const checkProduct = productsQuery.getProductById(productId);
        if (!checkProduct) {
          console.log('Product still not found after refresh, possible tenant mismatch');
          // Force a fetch of this specific product
          try {
            const response = await fetch(`/api/products-db?id=${productId}`);
            if (response.ok) {
              const result = await response.json();
              console.log('Direct fetch result:', result);
            }
          } catch (error) {
            console.error('Error fetching specific product:', error);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [productsQuery.isLoading, product, productId]);
  
  // Loading state
  if (productsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading product...
      </div>
    );
  }
  
  // Error state
  if (productsQuery.error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-red-400">
        Error loading product: {String(productsQuery.error)}
      </div>
    );
  }
  
  // Product not found
  if (!product && !productsQuery.isLoading) {
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
    if (!nameValue.trim() || !product) {
      return;
    }
    
    try {
      // For new products, we need to update the product and mark it as saved
      if (isNew) {
        // Update product properties
        if (nameValue.trim() !== product.name) {
          await productsQuery.updateProductName(productId, nameValue);
          updateTabTitle(productId, 'product', nameValue);
        }
        
        if (descriptionValue.trim() !== product.description) {
          await productsQuery.updateProductDescription(productId, descriptionValue);
        }
        
        // Mark product as saved (isSaved = true)
        await productsQuery.markProductAsSaved(productId);
        
        showSuccessMessage();
        setIsEditing(false);
      } else {
        // Update existing product (already saved)
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
  
  const handleCancelNewProduct = async () => {
    if (isNew && product) {
      // For new unsaved products, we should delete the product from the database
      try {
        await productsQuery.deleteProduct(productId);
        closeTab(tabId);
      } catch (error) {
        console.error('Failed to delete canceled product:', error);
        toast.error('Failed to cancel product creation');
      }
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
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        <div className="flex items-center">
          <Package className="h-7 w-7 mr-3 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-3xl font-medium text-white/90 bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter product name"
              />
            </div>
          ) : (
            <h1 className="text-3xl font-medium text-white/90">
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
          <h2 className="text-lg font-medium mb-4">Product Details (React Query Version)</h2>
          
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

            {!isNew && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-[#a0a0a0] text-sm">Features</p>
                  <a
                    href={`/dashboard/products/feature-canvas?new=true&productId=${productId}`}
                    className="inline-flex items-center"
                  >
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      New Feature (Canvas)
                    </Button>
                  </a>
                </div>
                <div className="mt-2 p-4 bg-[#232326] rounded-md border border-[#2a2a2c]">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                      <Pencil className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">New Canvas Feature</h3>
                      <p className="text-sm text-[#a0a0a0]">
                        Create a rich document-based feature with our new canvas editor.
                        Add formatted text, tables, and other elements within a single document.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
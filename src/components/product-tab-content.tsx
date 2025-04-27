import React, { useEffect, useState } from 'react';
import { useProductsStore } from '@/stores/products';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Package, Save } from 'lucide-react';

interface ProductTabContentProps {
  productId: string;
  tabId: string;
  isNew?: boolean;
}

export function ProductTabContent({ productId, tabId, isNew = false }: ProductTabContentProps) {
  const { getProductById, updateProductName, addProduct } = useProductsStore();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Product' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  const handleNameSave = () => {
    if (!isNew && product) {
      if (nameValue.trim() !== '' && nameValue !== product.name) {
        updateProductName(productId, nameValue);
        updateTabTitle(productId, 'product', nameValue);
      } else {
        // Reset to original name if empty or unchanged
        setNameValue(product.name);
      }
      setIsEditing(false);
    }
  };
  
  const handleSaveProduct = async () => {
    console.log('[ProductTabContent] handleSaveProduct called');
    if (!nameValue.trim()) {
      return;
    }
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
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      if (!isNew && product) {
        setNameValue(product.name);
      }
      setIsEditing(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326]">
        <div className="flex items-center mb-1">
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                onBlur={isNew ? undefined : handleNameSave}
                onKeyDown={isNew ? undefined : handleKeyDown}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter product name"
              />
              {!isNew && (
                <button 
                  onClick={handleNameSave}
                  className="ml-2 p-1 rounded-md hover:bg-[#232326]"
                  aria-label="Save product name"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </button>
              )}
            </div>
          ) : (
            <h1 
              className="text-xl font-medium text-white flex items-center cursor-pointer hover:bg-[#232326] px-2 py-0.5 rounded-md"
              onClick={() => setIsEditing(true)}
            >
              <Package className="h-5 w-5 mr-2 text-muted-foreground" />
              {product ? product.name : nameValue}
              <Pencil className="ml-2 h-4 w-4 opacity-50" />
            </h1>
          )}
        </div>
        {!isNew && product && product.description && (
          <div className="text-sm text-[#a0a0a0] mt-2">
            {product.description}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              {isNew ? (
                <Textarea
                  value={descriptionValue}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
                  placeholder="Enter product description"
                  rows={4}
                />
              ) : (
                <p>{product && product.description ? product.description : "No description provided."}</p>
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
            
            {isNew && (
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleSaveProduct}
                  disabled={!nameValue.trim() || isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Product'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useInterfacesStore } from '@/stores/interfaces';
import { useProductsStore } from '@/stores/products';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Layers, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { getInterfaceById, updateInterfaceName, addInterface, getInterfacesByProductId } = useInterfacesStore();
  const { getProducts, getProductById, updateProductWithInterface } = useProductsStore();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Interface' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [productId, setProductId] = useState(selectedProductId || '');
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  const handleNameSave = () => {
    if (!isNew && interface_) {
      if (nameValue.trim() !== '' && nameValue !== interface_.name) {
        updateInterfaceName(interfaceId, nameValue);
        updateTabTitle(interfaceId, 'interface', nameValue);
      } else {
        // Reset to original name if empty or unchanged
        setNameValue(interface_.name);
      }
      setIsEditing(false);
    }
  };
  
  const handleSaveInterface = async () => {
    if (!nameValue.trim() || !productId) {
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
        }
      }
    } catch (error) {
      console.error('Failed to save interface:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      if (!isNew && interface_) {
        setNameValue(interface_.name);
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
                placeholder="Enter interface name"
              />
              {!isNew && (
                <button 
                  onClick={handleNameSave}
                  className="ml-2 p-1 rounded-md hover:bg-[#232326]"
                  aria-label="Save interface name"
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
              <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
              {interface_ ? interface_.name : nameValue}
              <Pencil className="ml-2 h-4 w-4 opacity-50" />
            </h1>
          )}
        </div>
        {!isNew && interface_ && interface_.description && (
          <div className="text-sm text-[#a0a0a0] mt-2">
            {interface_.description}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">Interface Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              {isNew ? (
                <Textarea
                  value={descriptionValue}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
                  placeholder="Enter interface description"
                  rows={4}
                />
              ) : (
                <p>{interface_ && interface_.description ? interface_.description : "No description provided."}</p>
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
            
            {isNew && (
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleSaveInterface}
                  disabled={!nameValue.trim() || !productId || isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Interface'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
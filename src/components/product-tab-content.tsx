import React, { useEffect, useState } from 'react';
import { useProductsStore } from '@/stores/products';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Pencil, Check, Package } from 'lucide-react';

interface ProductTabContentProps {
  productId: string;
}

export function ProductTabContent({ productId }: ProductTabContentProps) {
  const { getProductById, updateProductName } = useProductsStore();
  const { updateTabTitle } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const product = getProductById(productId);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize name value from product
    if (product) {
      setNameValue(product.name);
    }
  }, [product]);
  
  if (!product) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Product not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== product.name) {
      updateProductName(productId, nameValue);
      updateTabTitle(productId, 'product', nameValue);
    } else {
      // Reset to original name if empty or unchanged
      setNameValue(product.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(product.name);
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
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
              />
              <button 
                onClick={handleNameSave}
                className="ml-2 p-1 rounded-md hover:bg-[#232326]"
                aria-label="Save product name"
              >
                <Check className="h-4 w-4 text-green-500" />
              </button>
            </div>
          ) : (
            <h1 
              className="text-xl font-medium text-white flex items-center cursor-pointer hover:bg-[#232326] px-2 py-0.5 rounded-md"
              onClick={() => setIsEditing(true)}
            >
              <Package className="h-5 w-5 mr-2 text-muted-foreground" />
              {product.name}
              <Pencil className="ml-2 h-4 w-4 opacity-50" />
            </h1>
          )}
        </div>
        {product.description && (
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
              <p>{product.description || "No description provided."}</p>
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Interfaces</p>
              <p>{product.interfaces && product.interfaces.length > 0 
                ? `${product.interfaces.length} interfaces connected` 
                : "No interfaces connected to this product."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
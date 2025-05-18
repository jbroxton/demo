import React, { useState, useEffect } from 'react';
import { Layers, Plus, Puzzle, Package } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { toast } from 'sonner';
import { EntityTabContent, EntitySection, EntityAction, EntityItemList } from './entity-tab-content';

interface InterfaceTabProps {
  interfaceId: string;
  tabId: string;
  isNew?: boolean;
  selectedProductId?: string;
}

export function ExampleInterfaceTab({
  interfaceId,
  tabId,
  isNew = false,
  selectedProductId
}: InterfaceTabProps) {
  // React Query hooks
  const interfacesQuery = useInterfacesQuery();
  const productsQuery = useProductsQuery();
  const featuresQuery = useFeaturesQuery();
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem, openTab } = useTabsQuery();
  
  // Local state
  const [nameValue, setNameValue] = useState(isNew ? 'New Interface' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [productId, setProductId] = useState(selectedProductId || '');
  
  // Get entity data from queries
  const interface_ = isNew ? null : interfacesQuery.getInterfaceById(interfaceId);
  const products = productsQuery.getProducts();
  const selectedProduct = productId ? productsQuery.getProductById(productId) : null;
  
  // Get features for this interface
  const interfaceFeatures = !isNew ? featuresQuery.getFeaturesByInterfaceId(interfaceId) : [];
  
  // Loading and saving states
  const isLoading = interfacesQuery.isLoading || productsQuery.isLoading || featuresQuery.isLoading;
  const isSaving = 
    interfacesQuery.addInterfaceMutation.isPending || 
    interfacesQuery.updateInterfaceNameMutation.isPending || 
    interfacesQuery.updateInterfaceDescriptionMutation.isPending;
  
  // Set initial values
  useEffect(() => {
    if (interface_) {
      setNameValue(interface_.name);
      setDescriptionValue(interface_.description || '');
      setProductId(interface_.productId);
    }
  }, [interface_]);
  
  // Handle save
  const handleSave = async () => {
    if (!nameValue.trim()) {
      toast.error('Name is required');
      return;
    }
    
    try {
      if (isNew) {
        if (!productId) {
          toast.error('Product is required');
          return;
        }
        
        // Create new interface
        const savedInterface = await interfacesQuery.addInterface({
          name: nameValue.trim(),
          description: descriptionValue.trim(),
          productId: productId,
          isSaved: false,
          savedAt: null
        });
        
        if (savedInterface && savedInterface.id) {
          // Update the product with this interface
          await productsQuery.updateProductWithInterface(productId, savedInterface.id);
          
          // Find the current tab (temporary tab)
          const currentTab = tabs.find(tab => tab.id === tabId);
          if (currentTab) {
            updateNewTabToSavedItem(currentTab.id, savedInterface.id, nameValue.trim(), 'interface');
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
      }
    } catch (error) {
      console.error('Failed to save interface:', error);
      toast.error('Failed to save interface');
      throw error;
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!isNew && interface_) {
      try {
        await interfacesQuery.deleteInterface(interfaceId);
        toast.success('Interface deleted successfully');
        closeTab(tabId);
      } catch (error) {
        console.error('Failed to delete interface:', error);
        toast.error('Failed to delete interface');
        throw error;
      }
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (isNew) {
      closeTab(tabId);
    }
  };
  
  // Handle create feature
  const handleCreateFeature = () => {
    if (!isNew && interface_) {
      const timestamp = Date.now();
      const temporaryItemId = `new-feature-${timestamp}-${interfaceId}`;
      
      openTab({
        title: 'New Feature',
        type: 'feature',
        itemId: temporaryItemId,
        hasChanges: false
      });
    }
  };
  
  // Handle open feature
  const handleOpenFeature = (featureId: string, featureName: string) => {
    openTab({
      title: featureName,
      type: 'feature',
      itemId: featureId,
      hasChanges: false
    });
  };
  
  // Check if form is valid
  const isFormValid = nameValue.trim().length > 0 && (!isNew || productId.length > 0);
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading interface...
      </div>
    );
  }
  
  // Interface not found
  if (!isNew && !interface_) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Interface not found
      </div>
    );
  }
  
  return (
    <EntityTabContent
      id={interfaceId}
      tabId={tabId}
      isNew={isNew}
      entityType="interface"
      name={nameValue}
      icon={Layers}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={handleCancel}
      onNameChange={setNameValue}
      isSaving={isSaving}
      isValid={isFormValid}
    >
      <div className="space-y-6">
        {/* Description section */}
        <EntitySection title="Description">
          <Textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
            placeholder="Enter interface description"
            rows={4}
            disabled={!isNew && !interface_}
          />
        </EntitySection>
        
        {/* Product section */}
        <EntitySection title="Product">
          {isNew ? (
            <div className="max-w-md">
              <Select
                value={productId}
                onValueChange={setProductId}
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
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{selectedProduct ? selectedProduct.name : "No product connected"}</span>
            </div>
          )}
        </EntitySection>
        
        {/* Features section */}
        {!isNew && (
          <EntitySection 
            title="Features" 
            action={
              <EntityAction
                label="Add Feature"
                onClick={handleCreateFeature}
                icon={Plus}
              />
            }
          >
            <EntityItemList
              items={interfaceFeatures}
              emptyMessage="No features connected to this interface."
              renderItem={(feature) => (
                <div 
                  key={feature.id} 
                  className="p-2 hover:bg-[#2a2a2c] rounded-md cursor-pointer flex justify-between items-center"
                  onClick={() => handleOpenFeature(feature.id, feature.name)}
                >
                  <div className="flex items-center">
                    <Puzzle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{feature.name}</span>
                  </div>
                  <span className="text-xs text-[#a0a0a0]">{feature.priority}</span>
                </div>
              )}
            />
          </EntitySection>
        )}
      </div>
    </EntityTabContent>
  );
} 
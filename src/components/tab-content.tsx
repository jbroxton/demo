import React from 'react';
import { useTabsStore } from '@/stores/tabs';
import { useProductsStore } from '@/stores/products';
import { useInterfacesStore } from '@/stores/interfaces';
import { useFeaturesStore } from '@/stores/features';
import { useReleasesStore } from '@/stores/releases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureTabContent } from './feature-tab-content';
import { ProductTabContent } from './product-tab-content';
import { InterfaceTabContent } from './interface-tab-content';
import { ReleaseTabContent } from './release-tab-content';

export function TabContent() {
  const { tabs, activeTabId } = useTabsStore();
  const { getProductById } = useProductsStore();
  const { getInterfaceById } = useInterfacesStore();
  const { getFeatureById } = useFeaturesStore();
  const { getReleaseById } = useReleasesStore();

  // If there are no tabs or no active tab, show a placeholder
  if (!tabs.length || !activeTabId) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20]">
        <div className="text-center text-[#a0a0a0] p-4">
          <h3 className="text-lg font-medium">No active tab</h3>
          <p className="text-sm mt-2">Click on an item in the sidebar to view it</p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return null;

  console.log('[TabContent] activeTab:', activeTab);

  let content;
  
  // Render content based on the active tab's type
  switch (activeTab.type) {
    case 'product': {
      // Check if this is a new product tab
      const isNew = activeTab.itemId.startsWith('new-product-');
      console.log('[TabContent] Rendering ProductTabContent', { itemId: activeTab.itemId, isNew });
      content = <ProductTabContent key={activeTab.itemId} productId={activeTab.itemId} tabId={activeTab.id} isNew={isNew} />;
      break;
    }
    case 'interface': {
      // Check if this is a new interface tab
      const isNew = activeTab.itemId.startsWith('new-interface-');
      
      // Extract the product ID from the itemId if this is a new interface
      let selectedProductId: string | undefined;
      if (isNew) {
        const parts = activeTab.itemId.split('-');
        if (parts.length >= 4) {
          // The format is 'new-interface-timestamp-productId'
          selectedProductId = parts.slice(3).join('-');
        } else {
          selectedProductId = useProductsStore.getState().products[0]?.id;
        }
      }
      
      content = <InterfaceTabContent key={activeTab.itemId} interfaceId={activeTab.itemId} tabId={activeTab.id} isNew={isNew} selectedProductId={selectedProductId} />;
      break;
    }
    case 'feature': {
      // Check if this is a new feature tab
      const isNew = activeTab.itemId.startsWith('new-feature-');
      
      // Extract the interface ID from the itemId if this is a new feature
      let selectedInterfaceId: string | undefined;
      if (isNew) {
        const parts = activeTab.itemId.split('-');
        if (parts.length >= 4) {
          // The format is 'new-feature-timestamp-interfaceId'
          selectedInterfaceId = parts.slice(3).join('-');
        } else {
          selectedInterfaceId = useInterfacesStore.getState().interfaces[0]?.id;
        }
      }
      
      console.log('[TabContent] Rendering FeatureTabContent', { itemId: activeTab.itemId, isNew, selectedInterfaceId });
      content = <FeatureTabContent 
        featureId={activeTab.itemId} 
        tabId={activeTab.id} 
        isNew={isNew} 
        selectedInterfaceId={selectedInterfaceId} 
      />;
      break;
    }
    case 'release': {
      // Check if this is a new release tab
      const isNew = activeTab.itemId.startsWith('new-release-');
      
      // Extract the feature ID from the itemId if this is a new release
      let selectedFeatureId: string | undefined;
      if (isNew) {
        const parts = activeTab.itemId.split('-');
        if (parts.length >= 4) {
          // The format is 'new-release-timestamp-featureId'
          selectedFeatureId = parts.slice(3).join('-');
        } else {
          selectedFeatureId = useFeaturesStore.getState().features[0]?.id;
        }
      }
      
      content = <ReleaseTabContent 
        releaseId={activeTab.itemId} 
        tabId={activeTab.id}
        isNew={isNew} 
        selectedFeatureId={selectedFeatureId} 
      />;
      break;
    }
    default:
      content = <div className="text-[#a0a0a0]">Unknown item type</div>;
  }

  return (
    <div key={activeTab.itemId} className="bg-[#1e1e20] h-full">
      {content}
    </div>
  );
} 
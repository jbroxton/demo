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

  let content;
  
  // Render content based on the active tab's type
  switch (activeTab.type) {
    case 'product': {
      // Use our new ProductTabContent component
      content = <ProductTabContent productId={activeTab.itemId} />;
      break;
    }
    case 'interface': {
      // Use our new InterfaceTabContent component
      content = <InterfaceTabContent interfaceId={activeTab.itemId} />;
      break;
    }
    case 'feature': {
      // Use our FeatureTabContent component
      content = <FeatureTabContent featureId={activeTab.itemId} />;
      break;
    }
    case 'release': {
      const release = getReleaseById(activeTab.itemId);
      if (!release) {
        content = <div className="text-[#a0a0a0]">Release not found</div>;
      } else {
        content = (
          <div className="bg-[#1e1e20] rounded-none p-6">
            <h1 className="text-xl font-medium text-white mb-6">{release.name}</h1>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white">Release Date</h3>
                <p className="text-sm text-[#a0a0a0] mt-1">
                  {new Date(release.releaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Priority</h3>
                <div className="mt-1 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    release.priority === 'High' ? 'bg-red-500' : 
                    release.priority === 'Med' ? 'bg-yellow-500' : 'bg-blue-500'
                  } mr-2`}></div>
                  <span className="text-sm text-[#a0a0a0]">{release.priority}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      break;
    }
    default:
      content = <div className="text-[#a0a0a0]">Unknown item type</div>;
  }

  return (
    <div className="bg-[#1e1e20] h-full">
      {content}
    </div>
  );
} 
import React from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureQueryTabContent } from './feature-query-tab-content';
import { FeatureQueryTabContentThemed } from './feature-query-tab-content-themed';
import { ProductQueryTabContent } from './product-query-tab-content';
import { ProductQueryTabContentThemed } from './product-query-tab-content-themed';
import { InterfaceQueryTabContent } from './interface-query-tab-content';
import { InterfaceQueryTabContentThemed } from './interface-query-tab-content-themed';
import { ReleaseQueryTabContent } from './release-query-tab-content';
import { ReleaseQueryTabContentThemed } from './release-query-tab-content-themed';
import { RoadmapQueryTabContent } from './roadmap-query-tab-content';
import { RoadmapSpecificTabContent } from './roadmap-specific-tab-content';
import { RoadmapSpecificTabContentThemed } from './roadmap-specific-tab-content-themed';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

export function TabQueryContentThemed() {
  const { tabs, activeTabId, isLoading } = useTabsQuery();
  const theme = useAppTheme();
  
  // React Query hooks (only used for first-item selections)
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const featuresQuery = useFeaturesQuery();
  const roadmapsQuery = useRoadmapsQuery();

  // If there are no tabs or no active tab, show a placeholder
  if (!tabs.length || !activeTabId) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center text-[#a0a0a0]">
          <h3 className="text-lg font-medium">No active tab</h3>
          <p className="text-sm mt-2">Click on an item in the sidebar to view it</p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return null;

  console.log('[TabQueryContent] activeTab:', activeTab);

  let content;
  
  // Render content based on the active tab's type
  switch (activeTab.type) {
    case 'product': {
      // Check if this is a new product tab
      const isNew = activeTab.itemId.startsWith('new-product-');
      console.log('[TabQueryContent] Rendering ProductQueryTabContentThemed', { itemId: activeTab.itemId, isNew });
      content = <ProductQueryTabContentThemed key={activeTab.itemId} productId={activeTab.itemId} tabId={activeTab.id} isNew={isNew} />;
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
          // Get first product ID from React Query
          const products = productsQuery.products;
          selectedProductId = products && products.length > 0 ? products[0]?.id : undefined;
        }
      }

      content = <InterfaceQueryTabContentThemed
        key={activeTab.itemId}
        interfaceId={activeTab.itemId}
        tabId={activeTab.id}
        isNew={isNew}
        selectedProductId={selectedProductId}
      />;
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
          // Get first interface ID from React Query
          const interfaces = interfacesQuery.interfaces;
          selectedInterfaceId = interfaces && interfaces.length > 0 ? interfaces[0]?.id : undefined;
        }
      }

      console.log('[TabQueryContent] Rendering FeatureQueryTabContentThemed',
        { itemId: activeTab.itemId, isNew, selectedInterfaceId });

      content = <FeatureQueryTabContentThemed
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
          // Get first feature ID from React Query
          const features = featuresQuery.features;
          selectedFeatureId = features && features.length > 0 ? features[0]?.id : undefined;
        }
      }

      content = <ReleaseQueryTabContentThemed
        releaseId={activeTab.itemId}
        tabId={activeTab.id}
        isNew={isNew}
        selectedFeatureId={selectedFeatureId}
      />;
      break;
    }
    case 'roadmap': {
      // Check if this is the main roadmaps tab or a specific roadmap tab
      if (activeTab.itemId === 'roadmaps') {
        // This is the main roadmaps tab showing all roadmaps
        content = <RoadmapQueryTabContent tabId={activeTab.id} />;
      } else {
        // Check if this is a new roadmap tab
        const isNew = activeTab.itemId.startsWith('new-roadmap-');

        content = <RoadmapSpecificTabContentThemed
          roadmapId={activeTab.itemId}
          tabId={activeTab.id}
          isNew={isNew}
        />;
      }
      break;
    }
    default:
      content = <div className="text-[#a0a0a0]">Unknown item type (DB Version)</div>;
  }

  // Use the theme's content styles instead of hardcoded classes
  return (
    <div
      key={activeTab.itemId}
      className="h-full"
      style={{
        background: '#0A0A0A', /* Already using the dark background */
        padding: '0'
      }}
    >
      {content}
    </div>
  );
}
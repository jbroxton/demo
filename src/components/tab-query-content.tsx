import React from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureQueryTabContent } from './feature-query-tab-content';
import { ProductQueryTabContent } from './product-query-tab-content';
import { InterfaceQueryTabContent } from './interface-query-tab-content';
import { ReleaseQueryTabContent } from './release-query-tab-content';
import { RoadmapQueryTabContent } from './roadmap-query-tab-content';
import { RoadmapSpecificTabContent } from './roadmap-specific-tab-content';

export function TabQueryContent() {
  const { tabs, activeTabId, isLoading } = useTabsQuery();

  console.log('TabQueryContent - tabs:', tabs);
  console.log('TabQueryContent - activeTabId:', activeTabId);

  // If there are no tabs or no active tab, show a placeholder
  if (!tabs.length || !activeTabId) {
    return (
      <div
        className="flex items-center justify-center h-full p-6"
        data-component="canvas-content"
        data-state="empty"
      >
        <div className="text-center text-[#a0a0a0]">
          <h3 className="text-lg font-medium">No active canvas</h3>
          <p className="text-sm mt-2">Click on an item in the navigator to open it</p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return null;

  console.log('[TabQueryContent] activeTab:', activeTab);
  console.log('[TabQueryContent] activeTab.itemId:', activeTab.itemId);
  console.log('[TabQueryContent] activeTab.id (tabId):', activeTab.id);

  let content;
  
  // Render content based on the active tab's type
  switch (activeTab.type) {
    case 'product': {
      // Since we don't have the product data here, pass the productId and let the component check isSaved
      console.log('[TabQueryContent] Rendering ProductQueryTabContent with productId:', activeTab.itemId);
      content = <ProductQueryTabContent key={activeTab.itemId} productId={activeTab.itemId} tabId={activeTab.id} />;
      break;
    }
    case 'interface': {
      content = <InterfaceQueryTabContent
        key={activeTab.itemId}
        interfaceId={activeTab.itemId}
        tabId={activeTab.id}
      />;
      break;
    }
    case 'feature': {
      console.log('[TabQueryContent] Rendering FeatureQueryTabContent', { itemId: activeTab.itemId });

      content = <FeatureQueryTabContent
        featureId={activeTab.itemId}
        tabId={activeTab.id}
      />;
      break;
    }
    case 'release': {
      content = <ReleaseQueryTabContent
        releaseId={activeTab.itemId}
        tabId={activeTab.id}
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

        content = <RoadmapSpecificTabContent
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

  return (
    <div
      key={activeTab.itemId}
      className="bg-[#0A0A0A] h-full"
      data-component="canvas-content"
      data-content-type={activeTab.type}
      data-tab-id={activeTab.id}
    >
      <div className="canvas-editor-content" data-section="canvas-editor-content">
        {content}
      </div>
    </div>
  );
}
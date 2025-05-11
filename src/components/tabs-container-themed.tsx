import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Pencil, Package, Layers, Puzzle, Calendar, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

export function TabsContainerThemed() {
  const theme = useAppTheme();
  const { tabs, activeTabId, activateTab, closeTab, updateTabTitle } = useTabsQuery();
  const featuresQuery = useFeaturesQuery();
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  if (tabs.length === 0) {
    return null;
  }

  // Function to handle tab closing that stops event propagation
  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };
  
  const handleEditStart = (e: React.MouseEvent, tab: typeof tabs[0]) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingValue(tab.title);
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };
  
  const handleEditSave = (tab: typeof tabs[0]) => {
    if (editingValue.trim() !== '' && editingValue !== tab.title) {
      // Only update if the value has changed and is not empty
      updateTabTitle(tab.itemId, tab.type, editingValue);
      
      // Update the appropriate store based on tab type
      if (tab.type === 'feature') {
        featuresQuery.updateFeatureName(tab.itemId, editingValue);
      } else if (tab.type === 'product') {
        productsQuery.updateProductName(tab.itemId, editingValue);
      } else if (tab.type === 'interface') {
        interfacesQuery.updateInterfaceName(tab.itemId, editingValue);
      }
    }
    
    // Reset editing state
    setEditingTabId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, tab: typeof tabs[0]) => {
    if (e.key === 'Enter') {
      handleEditSave(tab);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
    }
    
    // Stop propagation to prevent tab activation
    e.stopPropagation();
  };
  
  const handleInputClick = (e: React.MouseEvent) => {
    // Prevent tab activation when clicking in the input
    e.stopPropagation();
  };

  // Function to get the appropriate icon based on tab type
  const getTabIcon = (tabType: string) => {
    switch (tabType) {
      case 'product':
        return <Package className={theme.tabIcon} />;
      case 'interface':
        return <Layers className={theme.tabIcon} />;
      case 'feature':
        return <Puzzle className={theme.tabIcon} />;
      case 'release':
        return <Calendar className={theme.tabIcon} />;
      case 'roadmap':
        return <Map className={theme.tabIcon} />;
      default:
        return null;
    }
  };

  return (
    <div className={theme.tabsContainer}>
      <Tabs
        value={activeTabId || ''}
        className="w-full"
      >
        <TabsList className={theme.tabsList}>
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              className={theme.tabItem}
            >
              {editingTabId === tab.id ? (
                <div className="w-full px-4 pr-8 h-12 flex items-center justify-start">
                  <Input
                    value={editingValue}
                    onChange={handleEditChange}
                    onBlur={() => handleEditSave(tab)}
                    onKeyDown={(e) => handleKeyDown(e, tab)}
                    onClick={handleInputClick}
                    autoFocus
                    className={theme.tabInput}
                  />
                </div>
              ) : (
                <>
                  <TabsTrigger
                    value={tab.id}
                    onClick={() => activateTab(tab.id)}
                    className={theme.tabTrigger}
                  >
                    <div className="flex items-center truncate">
                      {getTabIcon(tab.type)}
                      <span className="truncate">{tab.title}</span>
                    </div>
                  </TabsTrigger>
                  
                  {/* Edit button - positioned absolutely */}
                  <button
                    onClick={(e) => handleEditStart(e, tab)}
                    className={theme.tabEditButton}
                    aria-label={`Edit ${tab.title} name`}
                  >
                    <Pencil className="h-3 w-3 text-[#a0a0a0]" />
                  </button>
                </>
              )}
              
              {/* Close button */}
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={theme.tabCloseButton}
                aria-label={`Close ${tab.title} tab`}
              >
                <X className="h-3.5 w-3.5 text-[#a0a0a0]" />
              </button>
            </div>
          ))}
          {/* Empty tab space filler for blank area */}
          <div className={theme.tabFiller}></div>
        </TabsList>
      </Tabs>
    </div>
  );
}
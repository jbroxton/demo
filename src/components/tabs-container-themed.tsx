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
    <div className={theme.tabsContainer} data-component="tabs-container-themed">
      <Tabs
        value={activeTabId || ''}
        className="w-full"
      >
        <TabsList className={`${theme.tabsList} h-14 py-2`} data-section="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`${theme.tabItem} min-w-[140px] max-w-[220px]`}
              data-tab-id={tab.id}
              data-tab-type={tab.type}
              data-tab-state={activeTabId === tab.id ? 'active' : 'inactive'}
            >
              {editingTabId === tab.id ? (
                <Input
                  value={editingValue}
                  onChange={handleEditChange}
                  onBlur={() => handleEditSave(tab)}
                  onKeyDown={(e) => handleKeyDown(e, tab)}
                  onClick={handleInputClick}
                  autoFocus
                  className={`${theme.tabInput} h-7 text-[13px]`}
                  data-action="edit-tab-name"
                />
              ) : (
                <TabsTrigger
                  value={tab.id}
                  onClick={() => activateTab(tab.id)}
                  className={theme.tabTrigger}
                  data-action="activate-tab"
                >
                  {getTabIcon(tab.type)}
                  <span className="truncate">{tab.title}</span>
                </TabsTrigger>
              )}

              {/* Tab Actions */}
              {editingTabId !== tab.id && (
                <button
                  onClick={(e) => handleEditStart(e, tab)}
                  className={`${theme.tabEditButton} p-1 right-6`}
                  aria-label={`Edit ${tab.title} name`}
                  data-action="edit-tab"
                >
                  <Pencil className="h-2.5 w-2.5 text-[#a0a0a0]" />
                </button>
              )}

              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={`${theme.tabCloseButton} p-1 right-1.5`}
                aria-label={`Close ${tab.title} tab`}
                data-action="close-tab"
              >
                <X className="h-2.5 w-2.5 text-[#a0a0a0]" />
              </button>
            </div>
          ))}

          {/* Tabs filler */}
          <div className={theme.tabFiller} data-section="tabs-filler"></div>
        </TabsList>
      </Tabs>
    </div>
  );
}
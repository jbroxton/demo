import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Pencil, Package, Layers, Puzzle, Calendar, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';

export function TabsContainer() {
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
    // Now supporting all editable tab types
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
        return <Package className="h-4 w-4 mr-1.5 text-white/50 flex-shrink-0 my-auto" />;
      case 'interface':
        return <Layers className="h-4 w-4 mr-1.5 text-white/50 flex-shrink-0 my-auto" />;
      case 'feature':
        return <Puzzle className="h-4 w-4 mr-1.5 text-white/50 flex-shrink-0 my-auto" />;
      case 'release':
        return <Calendar className="h-4 w-4 mr-1.5 text-white/50 flex-shrink-0 my-auto" />;
      case 'roadmap':
        return <Map className="h-4 w-4 mr-1.5 text-white/50 flex-shrink-0 my-auto" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0C0C0C] border-b border-white/[0.02] shadow-md shadow-black/20 relative z-10 rounded-t-lg">
      <Tabs
        value={activeTabId || ''}
        className="w-full"
      >
        <TabsList className="flex h-12 w-full rounded-none bg-transparent px-6 items-center">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={cn(
                "relative group flex-shrink-0 min-w-[160px] max-w-[240px]",
                "border-r border-white/[0.05]",
                "overflow-hidden flex items-center",
                "shadow-inner shadow-black/5"
              )}
            >
              {editingTabId === tab.id ? (
                <div className="w-full px-4 pr-8 flex items-center justify-start">
                  <Input
                    value={editingValue}
                    onChange={handleEditChange}
                    onBlur={() => handleEditSave(tab)}
                    onKeyDown={(e) => handleKeyDown(e, tab)}
                    onClick={handleInputClick}
                    autoFocus
                    className="text-[14px] tracking-[-0.006em] leading-[1.4] text-white bg-[#232326] border-[#2a2a2c] h-8"
                  />
                </div>
              ) : (
                <>
                  <TabsTrigger
                    value={tab.id}
                    onClick={() => activateTab(tab.id)}
                    className={cn(
                      "w-full px-3",
                      "flex items-center justify-start",
                      "text-[14px] tracking-[-0.006em] leading-[1.4]",
                      "hover:bg-[#161618]",
                      "data-[state=active]:bg-[#161618]",
                      "data-[state=active]:shadow-inner data-[state=active]:shadow-black/10"
                    )}
                  >
                    <div className="flex items-center justify-start truncate w-full">
                      {getTabIcon(tab.type)}
                      <span className="truncate text-white/70 my-auto">{tab.title}</span>
                    </div>
                  </TabsTrigger>

                  {/* Edit button for all tab types - positioned absolutely */}
                  <button
                    onClick={(e) => handleEditStart(e, tab)}
                    className={cn(
                      "absolute right-8 top-1/2 -translate-y-1/2 rounded-sm",
                      "p-1",
                      "opacity-0 hover:opacity-100 group-hover:opacity-50 transition-opacity"
                    )}
                    aria-label={`Edit ${tab.title} name`}
                  >
                    <Pencil className="h-4 w-4 text-[#a0a0a0]" />
                  </button>
                </>
              )}

              {/* Close button */}
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm",
                  "p-1 hover:bg-[#161618]",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                aria-label={`Close ${tab.title} tab`}
              >
                <X className="h-4 w-4 text-[#a0a0a0]" />
              </button>
            </div>
          ))}
          {/* Empty tab space filler for blank area */}
          <div className="flex-1 border-t border-white/[0.05]"></div>
        </TabsList>
      </Tabs>
    </div>
  );
}
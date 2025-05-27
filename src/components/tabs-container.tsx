import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Pencil, Package, Layers, Puzzle, Calendar, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import '@/styles/editor.css';

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
        return <Package className="h-4 w-4 flex-shrink-0 my-auto" />;
      case 'interface':
        return <Layers className="h-4 w-4 flex-shrink-0 my-auto" />;
      case 'feature':
        return <Puzzle className="h-4 w-4 flex-shrink-0 my-auto" />;
      case 'release':
        return <Calendar className="h-4 w-4 flex-shrink-0 my-auto" />;
      case 'roadmap':
        return <Map className="h-4 w-4 flex-shrink-0 my-auto" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-transparent relative rounded-t-lg pt-1 w-full" data-component="tabs-container">
      <Tabs
        value={activeTabId || ''}
        onValueChange={(value) => {
          activateTab(value);
        }}
        className="w-full"
      >
        <TabsList className="flex h-12 w-full rounded-none bg-transparent px-6 py-1.5 items-center overflow-x-auto scrollbar-hide" data-section="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="relative group flex-shrink-0 min-w-[140px] max-w-[220px] overflow-hidden flex items-center transition-all duration-150 mr-1"
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
                  className="text-xs tracking-[-0.006em] leading-[1.4] text-white bg-[#232326] border-[#2a2a2c] h-7 w-full px-3"
                  data-action="edit-tab-name"
                />
              ) : (
                <TabsTrigger
                  value={String(tab.id)}
                  className="w-full px-2 flex items-center justify-start text-xs tracking-[-0.006em] leading-[1.4] border border-transparent hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 data-[state=active]:bg-black/30 data-[state=active]:border data-[state=active]:border-white/30 data-[state=active]:text-white transition-all duration-200 rounded-[10px] py-1"
                  data-action="activate-tab"
                >
                  {getTabIcon(tab.type)}
                  <span className="truncate ml-1">{tab.title}</span>
                  {tab.hasChanges && (
                    <span className="inline-block w-1.5 h-1.5 bg-[#9333EA] rounded-full ml-1.5" aria-label="Unsaved changes" />
                  )}
                </TabsTrigger>
              )}

              {/* Tab Actions */}
              {editingTabId !== tab.id && (
                <button
                  onClick={(e) => handleEditStart(e, tab)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full p-1 border border-transparent hover:bg-black/20 hover:border hover:border-white/20 opacity-0 hover:opacity-100 group-hover:opacity-70 transition-all duration-200"
                  aria-label={`Edit ${tab.title} name`}
                  data-action="edit-tab"
                >
                  <Pencil className="h-2.5 w-2.5 text-[#a0a0a0] hover:text-[#9333EA] transition-colors" />
                </button>
              )}

              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 border border-transparent hover:bg-black/20 hover:border hover:border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/30"
                aria-label={`Close ${tab.title} tab`}
                data-action="close-tab"
              >
                <X className="h-2.5 w-2.5 text-[#a0a0a0] group-hover:text-[#9333EA] transition-colors" />
              </button>
            </div>
          ))}

          {/* Tabs filler */}
          <div className="flex-1" data-section="tabs-filler"></div>
        </TabsList>
      </Tabs>
    </div>
  );
}
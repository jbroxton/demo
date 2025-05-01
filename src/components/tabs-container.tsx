import React, { useState } from 'react';
import { useTabsStore } from '@/stores/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Pencil, Package, Layers, Puzzle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeaturesStore } from '@/stores/features';
import { useProductsStore } from '@/stores/products';
import { useInterfacesStore } from '@/stores/interfaces';
import { Input } from '@/components/ui/input';

export function TabsContainer() {
  const { tabs, activeTabId, activateTab, closeTab, updateTabTitle } = useTabsStore();
  const { updateFeatureName } = useFeaturesStore();
  const { updateProductName } = useProductsStore();
  const { updateInterfaceName } = useInterfacesStore();
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
        updateFeatureName(tab.itemId, editingValue);
      } else if (tab.type === 'product') {
        updateProductName(tab.itemId, editingValue);
      } else if (tab.type === 'interface') {
        updateInterfaceName(tab.itemId, editingValue);
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
        return <Package className="h-4 w-4 mr-1.5 text-muted-foreground" />;
      case 'interface':
        return <Layers className="h-4 w-4 mr-1.5 text-muted-foreground" />;
      case 'feature':
        return <Puzzle className="h-4 w-4 mr-1.5 text-muted-foreground" />;
      case 'release':
        return <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#161618] border-b border-[#232326]">
      <Tabs
        value={activeTabId || ''}
        className="w-full"
      >
        <TabsList className="flex h-12 w-full rounded-none bg-[#161618]">
          {tabs.map((tab, index) => (
            <div 
              key={tab.id}
              className={cn(
                "relative group flex-shrink-0 min-w-[140px] max-w-[200px]",
                "border-r border-[#232326]"
              )}
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
                    className="text-sm text-white bg-[#232326] border-[#2a2a2c] h-8"
                  />
                </div>
              ) : (
                <>
                  <TabsTrigger
                    value={tab.id}
                    onClick={() => activateTab(tab.id)}
                    className={cn(
                      "w-full px-4 pr-8 h-12",
                      "flex items-center justify-start",
                      "text-sm text-[#a0a0a0]",
                      "hover:bg-[#1e1e20]",
                      "data-[state=active]:bg-[#1e1e20] data-[state=active]:text-white"
                    )}
                  >
                    <div className="flex items-center truncate">
                      {getTabIcon(tab.type)}
                      <span className="truncate">{tab.title}</span>
                    </div>
                  </TabsTrigger>
                  
                  {/* Edit button for all tab types - positioned absolutely */}
                  <button
                    onClick={(e) => handleEditStart(e, tab)}
                    className={cn(
                      "absolute left-[calc(100%-24px-20px)] top-1/2 -translate-y-1/2 rounded-sm",
                      "p-0.5",
                      "opacity-0 hover:opacity-100 group-hover:opacity-50 transition-opacity"
                    )}
                    aria-label={`Edit ${tab.title} name`}
                  >
                    <Pencil className="h-3 w-3 text-[#a0a0a0]" />
                  </button>
                </>
              )}
              
              {/* Close button */}
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm",
                  "p-0.5 hover:bg-[#2a2a2c]",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                aria-label={`Close ${tab.title} tab`}
              >
                <X className="h-3.5 w-3.5 text-[#a0a0a0]" />
              </button>
            </div>
          ))}
          {/* Empty tab space filler for blank area */}
          <div className="flex-1 border-t border-[#232326]"></div>
        </TabsList>
      </Tabs>
    </div>
  );
} 
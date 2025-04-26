import React from 'react';
import { useTabsStore } from '@/stores/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TabsContainer() {
  const { tabs, activeTabId, activateTab, closeTab } = useTabsStore();

  if (tabs.length === 0) {
    return null;
  }

  // Function to handle tab closing that stops event propagation
  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
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
                {tab.title}
              </TabsTrigger>
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
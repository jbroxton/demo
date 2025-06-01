import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Pencil, Package, Layers, Puzzle, Calendar, Map, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageTypeIcon } from '@/utils/page-icons';
import { Input } from '@/components/ui/input';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import '@/styles/editor.css';

export function TabsContainer() {
  const { tabs, activeTabId, activateTab, closeTab, updateTabTitle } = useTabsQuery();
  const featuresQuery = useFeaturesQuery();
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const pagesQuery = usePagesQuery();
  const unifiedPagesState = useUnifiedPages();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Refs and state for scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Function to check scroll state and update arrow visibility
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isScrollable = container.scrollWidth > container.clientWidth;
    const atLeft = container.scrollLeft <= 0;
    const atRight = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 1);

    setIsOverflowing(isScrollable);
    setShowLeftArrow(isScrollable && !atLeft);
    setShowRightArrow(isScrollable && !atRight);
  };

  // Effect to set up resize observer and scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    updateScrollState();

    // Set up resize observer to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    // Observe both container and window size changes
    resizeObserver.observe(container);
    
    // Add scroll listener
    container.addEventListener('scroll', updateScrollState);
    
    // Add window resize listener for sidebar state changes
    const handleWindowResize = () => {
      // Small delay to allow layout to settle
      setTimeout(updateScrollState, 100);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [tabs.length]); // Re-run when tabs change

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 200; // Adjust based on typical tab width
    container.scrollTo({
      left: container.scrollLeft - scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 200;
    container.scrollTo({
      left: container.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };

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
    // Use live title for pages, cached title for others
    const currentTitle = tab.type === 'page' 
      ? (pagesQuery.getPageById(tab.itemId)?.title || tab.title)
      : tab.title;
    setEditingValue(currentTitle);
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
      } else if (tab.type === 'page') {
        unifiedPagesState.updatePageTitle(tab.itemId, editingValue);
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
  const getTabIcon = (tabType: string, page?: any) => {
    // For page tabs, use dynamic icon based on page type
    if (tabType === 'page' && page?.type) {
      const PageIcon = getPageTypeIcon(page.type);
      return <PageIcon className="h-4 w-4 flex-shrink-0 my-auto" />;
    }
    
    // For legacy entity tabs, use existing icons
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
      case 'page':
        return <FileText className="h-4 w-4 flex-shrink-0 my-auto" />; // Fallback
      default:
        return null;
    }
  };

  return (
    <div className="bg-transparent relative rounded-t-lg w-full h-12 max-h-12 overflow-hidden" data-component="tabs-container">
      <Tabs
        value={activeTabId || ''}
        onValueChange={(value) => {
          activateTab(value);
        }}
        className="w-full"
      >
        {/* Scroll arrows */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="scroll-arrow scroll-left"
            aria-label="Scroll tabs left"
            data-testid="scroll-left-arrow"
            data-action="scroll-tabs-left"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}
        
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="scroll-arrow scroll-right"
            aria-label="Scroll tabs right"
            data-testid="scroll-right-arrow"
            data-action="scroll-tabs-right"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="tabs-scroll-container h-12 max-h-12"
          data-testid="tabs-list-container"
          data-is-overflowing={isOverflowing}
          data-show-left-arrow={showLeftArrow}
          data-show-right-arrow={showRightArrow}
        >
          <TabsList className="flex h-12 max-h-12 rounded-none bg-transparent px-6 py-1 items-center flex-nowrap min-w-max" data-section="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="relative group flex-shrink-0 min-w-[140px] max-w-[220px] overflow-hidden flex items-center transition-all duration-150 mr-1"
              data-tab-id={tab.id}
              data-tab-type={tab.type}
              data-tab-state={activeTabId === tab.id ? 'active' : 'inactive'}
              data-testid={`tab-container-${tab.id}`}
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
                  data-testid="tab-name-input"
                />
              ) : (
                <TabsTrigger
                  value={String(tab.id)}
                  className="w-full px-2 flex items-center justify-start text-xs tracking-[-0.006em] leading-[1.4] border border-transparent hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 data-[state=active]:bg-black/30 data-[state=active]:border data-[state=active]:border-white/30 data-[state=active]:text-white transition-all duration-200 rounded-[10px] py-0.5 h-8"
                  data-action="activate-tab"
                  data-testid={`tab-button-${tab.id}`}
                >
                  {getTabIcon(tab.type, tab.type === 'page' ? unifiedPagesState.getPageById(tab.itemId) : undefined)}
                  <span className="truncate ml-1" data-testid={`tab-title-${tab.id}`}>
                    {(() => {
                      if (tab.type === 'page') {
                        const page = pagesQuery.getPageById(tab.itemId);
                        const liveTitle = page?.title || tab.title;
                        // Debug logging
                        console.log(`Tab ${tab.id}: itemId=${tab.itemId}, cachedTitle="${tab.title}", liveTitle="${liveTitle}"`);
                        return liveTitle;
                      }
                      return tab.title;
                    })()}
                  </span>
                  {tab.hasChanges && (
                    <span className="inline-block w-1.5 h-1.5 bg-[#9333EA] rounded-full ml-1.5" aria-label="Unsaved changes" data-testid={`tab-unsaved-dot-${tab.id}`} />
                  )}
                </TabsTrigger>
              )}

              {/* Tab Actions */}
              {editingTabId !== tab.id && (
                <button
                  onClick={(e) => handleEditStart(e, tab)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full p-1 border border-transparent hover:bg-black/20 hover:border hover:border-white/20 opacity-0 hover:opacity-100 group-hover:opacity-70 transition-all duration-200"
                  aria-label={`Edit ${tab.type === 'page' 
                    ? (pagesQuery.getPageById(tab.itemId)?.title || tab.title)
                    : tab.title} name`}
                  data-action="edit-tab"
                  data-testid={`tab-edit-button-${tab.id}`}
                >
                  <Pencil className="h-2.5 w-2.5 text-[#a0a0a0] hover:text-[#9333EA] transition-colors" />
                </button>
              )}

              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 border border-transparent hover:bg-black/20 hover:border hover:border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/30"
                aria-label={`Close ${tab.type === 'page' 
                  ? (pagesQuery.getPageById(tab.itemId)?.title || tab.title)
                  : tab.title} tab`}
                data-action="close-tab"
                data-testid={`tab-close-button-${tab.id}`}
              >
                <X className="h-2.5 w-2.5 text-[#a0a0a0] group-hover:text-[#9333EA] transition-colors" />
              </button>
            </div>
          ))}

            {/* Tabs filler */}
            <div className="flex-1" data-section="tabs-filler"></div>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
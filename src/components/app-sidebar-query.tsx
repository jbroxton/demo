"use client"

// Main navigation sidebar with unified state management

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Package,
  Layers,
  Target,
  CheckSquare,
  Rocket,
  Map,
  LogOut,
  Puzzle,
  Plus,
  Settings,
  Trash2,
  Inbox,
  Search
} from "lucide-react"
import { getPageTypeIcon } from "@/utils/page-icons"
import { getAllowedChildTypes, canHaveChildren } from "@/utils/page-parenting-rules"
import { useAuth } from "@/hooks/use-auth"
import { EntityCreator } from "@/components/entity-creator"
import { PageContextMenu } from "@/components/page-context-menu"
import { PageTypeCreator } from "@/components/page-type-creator"
import { useRouter } from "next/navigation"
import { useUIState } from "@/providers/ui-state-provider"
import { useTabsQuery } from "@/hooks/use-tabs-query"
import { usePagesQuery } from "@/hooks/use-pages-query"
import { useQueryClient } from "@tanstack/react-query"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PageChildrenRenderer } from './page-children-renderer'


// Data for Goals section
const goalsData = [
  {
    name: "Goals",
    icon: Target
  },
  {
    name: "Approvals",
    icon: CheckSquare
  },
  {
    name: "Launches",
    icon: Rocket
  },
  {
    name: "Roadmap",
    icon: Map
  }
];


export function AppSidebarQuery({ collapsed = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setNestedSidebar } = useUIState();
  
  // Track expanded IDs for each level of hierarchy
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [expandedInterfaces, setExpandedInterfaces] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({
    // Force some pages to be expanded for testing
    'ca65d02c-a60c-4bbd-b7cc-60a918428341': true, // Complex Block Structure Test
    '3cae60a0-6626-4650-adf9-eaadd889777a': true, // Authentication Platform  
    'b205ce13-f9eb-4c7b-af65-6c27882d9ea0': true, // New Page
    '7d10a308-be8c-4f5d-875b-d8a9640542e9': true, // New Page
  });
  
  // Stores with React Query
 
  const { openTab, closeTab, tabs } = useTabsQuery();
  
  // STEP 1: Pages queries - fetch all pages and filter locally for same cache
  const pagesQuery = usePagesQuery();
  
  // Pages queries now using optimized cache settings
  
  // Toggle product expansion
  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  // Toggle interface expansion
  const toggleInterfaceExpansion = (interfaceId: string) => {
    setExpandedInterfaces(prev => ({
      ...prev,
      [interfaceId]: !prev[interfaceId]
    }));
  };
  
  // Toggle feature expansion
  const toggleFeatureExpansion = (featureId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };
  
  // Toggle page expansion
  const togglePageExpansion = (pageId: string) => {
    setExpandedPages(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };

  // Handle page deletion with context-aware messaging
  const handlePageDelete = async (pageId: string, pageType: string, pageTitle: string) => {
    const pageTypeCapitalized = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const confirmMessage = `Are you sure you want to delete this ${pageTypeCapitalized}?\n\n"${pageTitle}"\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Delete the page from the database
        await pagesQuery.deletePage(pageId);
        
        // Close the tab if it's open
        const tabToClose = tabs.find(tab => tab.itemId === pageId);
        if (tabToClose) {
          await closeTab(tabToClose.id);
          console.log(`${pageTypeCapitalized} deleted and tab closed:`, pageTitle);
        } else {
          console.log(`${pageTypeCapitalized} deleted:`, pageTitle);
        }
      } catch (error) {
        console.error(`Failed to delete ${pageTypeCapitalized.toLowerCase()}:`, error);
        alert(`Failed to delete ${pageTypeCapitalized.toLowerCase()}. Please try again.`);
      }
    }
  };

  



  return (
    <div className={`h-full flex flex-col ${collapsed ? 'sidebar-collapsed' : ''}`} {...props} data-component="left-sidebar">
      {/* Logo header */}
      <div className="p-4" data-section="logo-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Speqq Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            {!collapsed && (
              <span className="text-xl font-bold text-white transition-opacity duration-200">
                Speqq
              </span>
            )}
          </div>
        </div>
      </div>

      {/* User greeting */}
      <div className={`p-3 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}
        data-section="user-greeting">
        {!collapsed && <span className="text-xs text-[#a0a0a0]">Welcome, {user?.name || 'User'}</span>}
        <button
          className="p-1.5 rounded-md text-white/60 hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 transition-all duration-200"
          onClick={logout}
          aria-label="Logout"
          data-action="logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation menu */}
      <div className="px-2 py-3" data-section="navigation-menu">
        <ul className="flex flex-col gap-0.5">
          {/* Search button - placed before Goals */}
          <li data-nav-item="search" data-testid="sidebar-search-button">
            <button
              className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-1.5 px-2 py-1.5 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
              onClick={() => {
                console.log('Search button clicked - opening nested sidebar');
                setNestedSidebar('pages-search');
              }}
              title="Search"
              data-action="navigate"
              data-nav-target="search"
            >
              <Search className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
              {!collapsed && <span className="truncate">Search</span>}
            </button>
          </li>
          {goalsData.map((item) => (
            <li key={item.name} data-nav-item={item.name.toLowerCase()}>
              {item.name === 'Roadmap' ? (
                <button
                  className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-1.5 px-2 py-1.5 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
                  onClick={async () => {
                    console.log('Roadmap button clicked directly');
                    try {
                      await openTab({
                        title: 'Roadmaps',
                        type: 'roadmap',
                        itemId: '00000000-0000-0000-0000-000000000001',
                        hasChanges: false
                      });
                      console.log('Tab opened successfully');
                    } catch (error) {
                      console.error('Error opening tab:', error);
                    }
                  }}
                  title={item.name}
                  data-action="navigate"
                  data-nav-target={item.name.toLowerCase()}
                >
                  <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </button>
              ) : (
                <button
                  className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-1.5 px-2 py-1.5 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
                  title={item.name}
                  data-action="navigate"
                  data-nav-target={item.name.toLowerCase()}
                >
                  <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </button>
              )}
            </li>
          ))}
          {/* Feedback button */}
          <li data-nav-item="feedback" data-testid="sidebar-feedback-button">
            <button
              className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-1.5 px-2 py-1.5 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
              onClick={() => {
                console.log('Feedback button clicked - opening nested sidebar');
                setNestedSidebar('feedback');
              }}
              title="Feedback"
              data-action="navigate"
              data-nav-target="feedback"
            >
              <Inbox className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
              {!collapsed && <span className="truncate">Feedback</span>}
            </button>
          </li>
        </ul>
      </div>
      
      {/* Pages section */}
      <div className="flex items-center px-3 py-2" data-section="pages-header" data-testid="pages-section-header">
        {!collapsed && <span className="text-xs font-medium text-[#a0a0a0] flex-grow uppercase tracking-wide">Pages</span>}
        <div className="flex gap-1">
          {/* Refresh button for debugging */}
          <button
            onClick={() => {
              console.log('🔄 CACHE CLEAR: Clearing pages cache and refetching...');
              // Clear the entire React Query cache for pages
              queryClient.invalidateQueries({ queryKey: ['pages'] });
              queryClient.removeQueries({ queryKey: ['pages'] });
              // Force refetch
              pagesQuery.refetch();
            }}
            className="w-4 h-4 p-0 rounded hover:bg-white/10 flex items-center justify-center transition-colors text-[#a0a0a0] hover:text-white"
            title="Clear cache and refresh pages"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div data-testid="add-page-button">
            <PageTypeCreator
              buttonClassName={`${collapsed ? 'mx-auto' : ''} w-4 h-4 p-0 rounded hover:bg-white/10 flex items-center justify-center transition-colors`}
              collapsed={collapsed}
            />
          </div>
        </div>
      </div>
      
      {/* Pages tree - EXACT COPY of Products tree structure */}
      <div className="px-2 py-2 overflow-y-auto" data-section="pages-tree" data-testid="pages-section">
        {pagesQuery.pages && pagesQuery.pages.length > 0 ? (
          <ul className="space-y-0.5" data-list="pages" data-testid="pages-list">
            {(pagesQuery.pages || []).filter(page => !page.parent_id && page.type !== 'feedback').map(page => {
              // Determine if the page type can have children
              const pageCanHaveChildren = canHaveChildren(page.type);
              const isExpanded = expandedPages[page.id] || false;

              return (
                <li
                  key={page.id}
                  className="group"
                  data-entity-type="page"
                  data-entity-id={page.id}
                  data-expanded={isExpanded ? "true" : "false"}
                  data-testid={`page-container-${page.id}`}>
                  <PageContextMenu
                    pageId={page.id}
                    pageType={page.type}
                    pageTitle={page.title}
                    onDelete={() => handlePageDelete(page.id, page.type, page.title)}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => togglePageExpansion(page.id)}>
                      {/* Page row - copy exact pattern from Product row */}
                      <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'h-8'}`} data-row="page" data-testid={`page-row-${page.id}`}>
                      {/* Expand/collapse button - copy exact pattern from Products */}
                      {!collapsed && (
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex items-center justify-center w-4 h-4 p-0 mr-0 hover:bg-white/10 rounded-sm transition-colors"
                            data-action="toggle"
                            data-testid={`page-expand-button-${page.id}`}
                            aria-label={isExpanded ? "Collapse" : "Expand"}>
                            {pageCanHaveChildren ?
                              isExpanded ? <ChevronDown className="h-3 w-3 text-[#a0a0a0]" /> :
                                          <ChevronRight className="h-3 w-3 text-[#a0a0a0]" /> :
                              <div className="w-3 h-3" />
                            }
                          </button>
                        </CollapsibleTrigger>
                      )}

                      {/* Page button - copy exact pattern from Product button */}
                      <button
                        className={`flex flex-1 items-center ${collapsed ? 'justify-center' : 'gap-1 pl-0 pr-2 py-1 text-left rounded hover:bg-white/10 transition-colors min-w-0'} text-sm text-[#e5e5e5] hover:text-white`}
                        onClick={() => openTab({
                          title: page.title,
                          type: 'page',
                          itemId: page.id,
                          hasChanges: false
                        })}
                        title={page.title}
                        data-action="open-tab"
                        data-entity-name={page.title}
                        data-testid={`page-button-${page.id}`}
                      >
                        {React.createElement(getPageTypeIcon(page.type), { 
                          className: `${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`
                        })}
                        {!collapsed && <span className="truncate font-medium" data-testid={`page-title-${page.id}`}>{page.title}</span>}
                      </button>

                      {/* Child page creator - copy exact pattern from Interface creator */}
                      {!collapsed && (
                        <div data-testid={`add-child-page-button-${page.id}`}>
                          <EntityCreator
                            entityType="page"
                            iconOnly={true}
                            buttonClassName="w-4 h-4 p-0 ml-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            buttonVariant="ghost"
                            context={{
                              parentId: page.id,
                              parentType: 'page',
                              parentName: page.title
                            }}
                          />
                        </div>
                      )}
                    </div>

                      {/* Children list - Render PageChildrenRenderer if expanded and can have children */}
                      {pageCanHaveChildren && !collapsed && isExpanded && (
                        <CollapsibleContent>
                          <PageChildrenRenderer parentId={page.id} collapsed={collapsed} />
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </PageContextMenu>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-sm text-[#a0a0a0] py-4" data-state="empty" data-testid="pages-empty-state">
            No pages available.
            <div data-testid="create-first-page-button">
              <EntityCreator
                entityType="page"
                buttonVariant="link"
                buttonSize="sm"
                buttonLabel="Create your first page"
                buttonClassName="text-indigo-400 block mx-auto mt-2"
                iconOnly={false}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Products header */}
      <div
        className="flex items-center px-3 py-2"
        data-section="products-header">
        {!collapsed && <span className="text-xs font-medium text-[#a0a0a0] flex-grow uppercase tracking-wide">Products</span>}
        <EntityCreator
          entityType="product"
          buttonVariant="ghost"
          buttonSize="icon"
          buttonClassName={`${collapsed ? 'mx-auto' : ''} w-4 h-4 p-0 rounded hover:bg-white/10 flex items-center justify-center transition-colors`}
          iconOnly={true}
        />
      </div>
      
     

      {/* Settings and Trash Section */}
      <div className="px-2 py-2 border-t border-white/10" data-section="settings-actions">
        <div className="space-y-1">
          {/* Settings Button */}
          <button
            className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-2 px-2 py-2 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
            title="Settings"
            data-action="open-settings"
            onClick={async () => {
              try {
                await openTab({
                  title: 'Settings',
                  type: 'settings',
                  itemId: '00000000-0000-0000-0000-000000000000', // Fixed ID for settings
                  hasChanges: false
                });
              } catch (error) {
                console.error('Error opening Settings tab:', error);
              }
            }}
          >
            <Settings className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
            {!collapsed && <span className="truncate">Settings</span>}
          </button>

          {/* Trash Button */}
          <button
            className={`flex w-full items-center ${collapsed ? 'justify-center p-2' : 'gap-2 px-2 py-2 text-left'} rounded text-sm text-[#e5e5e5] hover:text-white hover:bg-white/10 transition-colors`}
            title="Trash"
            data-action="open-trash"
          >
            <Trash2 className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
            {!collapsed && <span className="truncate">Trash</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
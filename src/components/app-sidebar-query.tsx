"use client"

// 🔴 FILE LOAD TEST - This should show when the file is imported
console.log('🔴 MODULE LOADING: app-sidebar-query.tsx file is being loaded!');

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
  Trash2
} from "lucide-react"
import { getPageTypeIcon } from "@/utils/page-icons"
import { PageContextMenu } from "@/components/page-context-menu"
import { getAllowedChildTypes, canHaveChildren } from "@/utils/page-parenting-rules"
import { useAuth } from "@/hooks/use-auth"
import { EntityCreator } from "@/components/entity-creator"
import { useRouter } from "next/navigation"
import { useProductsQuery } from "@/hooks/use-products-query"
import { useInterfacesQuery } from "@/hooks/use-interfaces-query"
import { useFeaturesQuery } from "@/hooks/use-features-query"
import { useReleasesQuery } from "@/hooks/use-releases-query"
import { useTabsQuery } from "@/hooks/use-tabs-query"
import { useRoadmapsQuery } from "@/hooks/use-roadmaps-query"
import { usePagesQuery } from "@/hooks/use-pages-query"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PageChildrenRenderer } from './page-children-renderer'
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuSub, 
  SidebarMenuSubItem, 
  SidebarMenuSubButton 
} from "@/components/ui/sidebar"

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
  console.log('🔵 COMPONENT START: AppSidebarQuery is being called!');
  
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // TEMP DEBUG: Log auth context
  console.log('🔐 AUTH DEBUG: Current user:', user);
  console.log('🔐 AUTH DEBUG: User tenant ID:', user?.tenantId);
  
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
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const featuresQuery = useFeaturesQuery();
  const releasesQuery = useReleasesQuery();
  const roadmapsQuery = useRoadmapsQuery();
  const { openTab } = useTabsQuery();
  
  // STEP 1: Pages queries - fetch only root pages initially
  const pagesQuery = usePagesQuery({ parentId: null });
  
  // TEMP DEBUG: Log what the component receives
  console.log('🎯 COMPONENT DEBUG: pagesQuery.pages:', pagesQuery.pages);
  console.log('🎯 COMPONENT DEBUG: pagesQuery.isLoading:', pagesQuery.isLoading);
  console.log('🎯 COMPONENT DEBUG: pagesQuery.error:', pagesQuery.error);
  
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

  
  // Loading state
  if (productsQuery.isLoading || interfacesQuery.isLoading ||
      featuresQuery.isLoading || releasesQuery.isLoading ||
      roadmapsQuery.isLoading || pagesQuery.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center" {...props}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-[#a0a0a0]">Loading data...</p>
      </div>
    );
  }

  // Error state
  if (productsQuery.error || interfacesQuery.error ||
      featuresQuery.error || releasesQuery.error ||
      roadmapsQuery.error || pagesQuery.error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4" {...props}>
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-red-400 text-center">
          {productsQuery.error ? String(productsQuery.error) :
           interfacesQuery.error ? String(interfacesQuery.error) :
           featuresQuery.error ? String(featuresQuery.error) :
           roadmapsQuery.error ? String(roadmapsQuery.error) :
           pagesQuery.error ? String(pagesQuery.error) :
           String(releasesQuery.error)}
        </p>
        <button
          onClick={() => {
            productsQuery.refetch();
            interfacesQuery.refetch();
            featuresQuery.refetch();
            releasesQuery.refetch();
            roadmapsQuery.refetch();
            pagesQuery.refetch();
          }}
          className="mt-4 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white"
        >
          Retry
        </button>
      </div>
    );
  }

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
        </ul>
      </div>
      
      {/* Pages section */}
      <div className="flex items-center px-3 py-2" data-section="pages-header">
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
          <EntityCreator
            entityType="page"
            buttonVariant="ghost"
            buttonSize="icon"
            buttonClassName={`${collapsed ? 'mx-auto' : ''} w-4 h-4 p-0 rounded hover:bg-white/10 flex items-center justify-center transition-colors`}
            iconOnly={true}
          />
        </div>
      </div>
      
      {/* Pages tree - EXACT COPY of Products tree structure */}
      <div className="px-2 py-2 overflow-y-auto" data-section="pages-tree">
        {pagesQuery.pages && pagesQuery.pages.length > 0 ? (
          <ul className="space-y-0.5" data-list="pages">
            {pagesQuery.pages.filter(page => !page.parent_id).map(page => {
              // Determine if the page type can have children
              const pageCanHaveChildren = canHaveChildren(page.type);
              const isExpanded = expandedPages[page.id] || false;

              return (
                <li
                  key={page.id}
                  className="group"
                  data-entity-type="page"
                  data-entity-id={page.id}
                  data-expanded={isExpanded ? "true" : "false"}>
                  <Collapsible open={isExpanded} onOpenChange={() => togglePageExpansion(page.id)}>
                    {/* Page row - copy exact pattern from Product row */}
                    <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'h-8'}`} data-row="page">
                      {/* Expand/collapse button - copy exact pattern from Products */}
                      {!collapsed && (
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex items-center justify-center w-4 h-4 p-0 mr-0 hover:bg-white/10 rounded-sm transition-colors"
                            data-action="toggle"
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
                      >
                        {React.createElement(getPageTypeIcon(page.type), { 
                          className: `${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`
                        })}
                        {!collapsed && <span className="truncate font-medium">{page.title}</span>}
                      </button>

                      {/* Child page creator - copy exact pattern from Interface creator */}
                      {!collapsed && (
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
                      )}
                    </div>

                    {/* Children list - Render PageChildrenRenderer if expanded and can have children */}
                    {pageCanHaveChildren && !collapsed && isExpanded && (
                      <CollapsibleContent>
                        <PageChildrenRenderer parentId={page.id} collapsed={collapsed} />
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-sm text-[#a0a0a0] py-4" data-state="empty">
            No pages available.
            <EntityCreator
              entityType="page"
              buttonVariant="link"
              buttonSize="sm"
              buttonLabel="Create your first page"
              buttonClassName="text-indigo-400 block mx-auto mt-2"
              iconOnly={false}
            />
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
      
      {/* Products tree */}
      <div
        className="px-2 py-2 overflow-y-auto flex-grow"
        data-section="products-tree">
        {productsQuery.products && productsQuery.products.length > 0 ? (
          <ul className="space-y-0.5" data-list="products">
            {productsQuery.products.map(product => {
              // Get interfaces for this product
              const productInterfaces = interfacesQuery.getInterfacesByProductId(product.id);
              const hasInterfaces = productInterfaces && productInterfaces.length > 0;
              const isExpanded = expandedProducts[product.id] || false;

              return (
                <li
                  key={product.id}
                  className="group"
                  data-entity-type="product"
                  data-entity-id={product.id}
                  data-expanded={isExpanded ? "true" : "false"}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleProductExpansion(product.id)}>
                    {/* Product row */}
                    <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'h-8'}`} data-row="product">
                      {/* Expand/collapse button - only show when not collapsed */}
                      {!collapsed && (
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex items-center justify-center w-4 h-4 p-0 mr-0 hover:bg-white/10 rounded-sm transition-colors"
                            data-action="toggle"
                            aria-label={isExpanded ? "Collapse" : "Expand"}>
                            {hasInterfaces ?
                              isExpanded ? <ChevronDown className="h-3 w-3 text-[#a0a0a0]" /> :
                                          <ChevronRight className="h-3 w-3 text-[#a0a0a0]" /> :
                              <div className="w-3 h-3" />
                            }
                          </button>
                        </CollapsibleTrigger>
                      )}

                      {/* Product button */}
                      <button
                        className={`flex flex-1 items-center ${collapsed ? 'justify-center' : 'gap-1 pl-0 pr-2 py-1 text-left rounded hover:bg-white/10 transition-colors min-w-0'} text-sm text-[#e5e5e5] hover:text-white`}
                        onClick={() => openTab({
                          title: product.name,
                          type: 'product',
                          itemId: product.id,
                          hasChanges: false
                        })}
                        title={product.name}
                        data-action="open-tab"
                        data-entity-name={product.name}
                      >
                        <Package className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 flex-shrink-0'} text-[#a0a0a0]`} />
                        {!collapsed && <span className="truncate font-medium">{product.name}</span>}
                      </button>

                      {/* Interface creator - only show when not collapsed */}
                      {!collapsed && (
                        <EntityCreator
                          entityType="interface"
                          iconOnly={true}
                          buttonClassName="w-4 h-4 p-0 ml-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          buttonVariant="ghost"
                          context={{
                            parentId: product.id,
                            parentType: 'product',
                            parentName: product.name
                          }}
                        />
                      )}
                    </div>

                    {/* Interface list */}
                    {hasInterfaces && !collapsed && (
                      <CollapsibleContent>
                        <ul className="ml-4 mt-0.5 space-y-0.5" data-list="interfaces">
                          {productInterfaces.map(interface_ => {
                            const interfaceFeatures = featuresQuery.getFeaturesByInterfaceId(interface_.id);
                            const hasFeatures = interfaceFeatures && interfaceFeatures.length > 0;
                            const isInterfaceExpanded = expandedInterfaces[interface_.id] || false;

                            return (
                              <li
                                key={interface_.id}
                                className="group"
                                data-entity-type="interface"
                                data-entity-id={interface_.id}
                                data-parent-id={product.id}
                                data-expanded={isInterfaceExpanded ? "true" : "false"}>
                                <Collapsible open={isInterfaceExpanded} onOpenChange={() => toggleInterfaceExpansion(interface_.id)}>
                                  {/* Interface row */}
                                  <div className="flex items-center h-7" data-row="interface">
                                    {/* Expand/collapse button */}
                                    <CollapsibleTrigger asChild>
                                      <button
                                        className="flex items-center justify-center w-4 h-4 p-0 mr-0 hover:bg-white/10 rounded-sm transition-colors"
                                        data-action="toggle"
                                        aria-label={isInterfaceExpanded ? "Collapse" : "Expand"}>
                                        {hasFeatures ?
                                          isInterfaceExpanded ? <ChevronDown className="h-3 w-3 text-[#a0a0a0]" /> :
                                                              <ChevronRight className="h-3 w-3 text-[#a0a0a0]" /> :
                                          <div className="w-3 h-3" />
                                        }
                                      </button>
                                    </CollapsibleTrigger>

                                    {/* Interface button */}
                                    <button
                                      className="flex flex-1 items-center gap-1 pl-0 pr-1.5 py-0.5 text-sm text-left rounded hover:bg-white/10 transition-colors min-w-0 text-[#e5e5e5] hover:text-white"
                                      data-action="open-tab"
                                      data-entity-name={interface_.name}
                                      onClick={() => openTab({
                                        title: interface_.name,
                                        type: 'interface',
                                        itemId: interface_.id,
                                        hasChanges: false
                                      })}
                                    >
                                      <Layers className="h-3.5 w-3.5 text-[#a0a0a0] flex-shrink-0" />
                                      <span className="truncate text-sm">{interface_.name}</span>
                                    </button>

                                    {/* Feature creator */}
                                    <EntityCreator
                                      entityType="feature"
                                      iconOnly={true}
                                      buttonClassName="w-4 h-4 p-0 ml-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                      buttonVariant="ghost"
                                      context={{
                                        parentId: interface_.id,
                                        parentType: 'interface',
                                        parentName: interface_.name
                                      }}
                                    />
                                  </div>

                                  {/* Feature list */}
                                  {hasFeatures && (
                                    <CollapsibleContent>
                                      <ul className="ml-4 mt-0.5 space-y-0.5">
                                        {interfaceFeatures.map(feature => {
                                          const featureReleases = releasesQuery.getReleasesByFeatureId(feature.id);
                                          const hasReleases = featureReleases && featureReleases.length > 0;
                                          const isFeatureExpanded = expandedFeatures[feature.id] || false;

                                          return (
                                            <li key={feature.id} className="group">
                                              <Collapsible open={isFeatureExpanded} onOpenChange={() => toggleFeatureExpansion(feature.id)}>
                                                {/* Feature row */}
                                                <div className="flex items-center h-7">
                                                  {/* Expand/collapse button */}
                                                  <CollapsibleTrigger asChild>
                                                    <button
                                                      className="flex items-center justify-center w-4 h-4 p-0 mr-0.5 hover:bg-white/10 rounded-sm transition-colors"
                                                      data-action="toggle"
                                                      aria-label={isFeatureExpanded ? "Collapse" : "Expand"}>
                                                      {hasReleases ?
                                                        isFeatureExpanded ? <ChevronDown className="h-3 w-3 text-[#a0a0a0]" /> :
                                                                          <ChevronRight className="h-3 w-3 text-[#a0a0a0]" /> :
                                                        <div className="w-3 h-3" />
                                                      }
                                                    </button>
                                                  </CollapsibleTrigger>

                                                  {/* Feature button */}
                                                  <button
                                                    className="flex flex-1 items-center gap-1 pl-0 pr-1.5 py-0.5 text-sm text-left rounded hover:bg-white/10 transition-colors min-w-0 text-[#e5e5e5] hover:text-white"
                                                    onClick={() => openTab({
                                                      title: feature.name,
                                                      type: 'feature',
                                                      itemId: feature.id,
                                                      hasChanges: false
                                                    })}
                                                  >
                                                    <Puzzle className="h-3.5 w-3.5 text-[#a0a0a0] flex-shrink-0" />
                                                    <span className="truncate text-sm">{feature.name}</span>
                                                  </button>

                                                  {/* Release creator */}
                                                  <EntityCreator
                                                    entityType="release"
                                                    iconOnly={true}
                                                    buttonClassName="w-4 h-4 p-0 ml-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    buttonVariant="ghost"
                                                    context={{
                                                      parentId: feature.id,
                                                      parentType: 'feature',
                                                      parentName: feature.name
                                                    }}
                                                  />
                                                </div>

                                                {/* Release list */}
                                                {hasReleases && (
                                                  <CollapsibleContent>
                                                    <ul className="ml-4 mt-0.5 space-y-0.5">
                                                      {featureReleases.map(release => (
                                                        <li key={release.id} className="group">
                                                          <div className="flex items-center h-7">
                                                            {/* Release spacer */}
                                                            <div className="w-4 mr-0" />
                                                            
                                                            {/* Release button */}
                                                            <button
                                                              className="flex flex-1 items-center gap-1 pl-0 pr-1.5 py-0.5 text-sm text-left rounded hover:bg-white/10 transition-colors min-w-0 text-[#e5e5e5] hover:text-white"
                                                              onClick={() => openTab({
                                                                title: release.name,
                                                                type: 'release',
                                                                itemId: release.id,
                                                                hasChanges: false
                                                              })}
                                                            >
                                                              <Calendar className="h-3.5 w-3.5 text-[#a0a0a0] flex-shrink-0" />
                                                              <span className="truncate text-sm">{release.name}</span>
                                                            </button>
                                                          </div>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </CollapsibleContent>
                                                )}
                                              </Collapsible>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </CollapsibleContent>
                                  )}
                                </Collapsible>
                              </li>
                            );
                          })}
                        </ul>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            className="text-center text-sm text-[#a0a0a0] py-4"
            data-state="empty">
            No products available.
            <EntityCreator
              entityType="product"
              buttonVariant="link"
              buttonSize="sm"
              buttonLabel="Create your first product"
              buttonClassName="text-indigo-400 block mx-auto mt-2"
              iconOnly={false}
            />
          </div>
        )}
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
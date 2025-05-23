"use client"

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
  Plus
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { EntityCreator } from "@/components/entity-creator"
import { useRouter } from "next/navigation"
import { useProductsQuery } from "@/hooks/use-products-query"
import { useInterfacesQuery } from "@/hooks/use-interfaces-query"
import { useFeaturesQuery } from "@/hooks/use-features-query"
import { useReleasesQuery } from "@/hooks/use-releases-query"
import { useTabsQuery } from "@/hooks/use-tabs-query"
import { useRoadmapsQuery } from "@/hooks/use-roadmaps-query"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  
  // Track expanded IDs for each level of hierarchy
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [expandedInterfaces, setExpandedInterfaces] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  
  // Stores with React Query
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const featuresQuery = useFeaturesQuery();
  const releasesQuery = useReleasesQuery();
  const roadmapsQuery = useRoadmapsQuery();
  const { openTab } = useTabsQuery();
  
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
  
  // Loading state
  if (productsQuery.isLoading || interfacesQuery.isLoading ||
      featuresQuery.isLoading || releasesQuery.isLoading ||
      roadmapsQuery.isLoading) {
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
      roadmapsQuery.error) {
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
           String(releasesQuery.error)}
        </p>
        <button
          onClick={() => {
            productsQuery.refetch();
            interfacesQuery.refetch();
            featuresQuery.refetch();
            releasesQuery.refetch();
            roadmapsQuery.refetch();
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
        <ul className="flex flex-col gap-1">
          {goalsData.map((item) => (
            <li key={item.name} data-nav-item={item.name.toLowerCase()}>
              {item.name === 'Roadmap' ? (
                <button
                  className={`flex w-full items-center ${collapsed ? 'justify-center' : 'gap-2'} border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 transition-all duration-200 ${collapsed ? 'px-1' : 'text-left'}`}
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
                  <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                  {!collapsed && <span>{item.name}</span>}
                </button>
              ) : (
                <button
                  className={`flex w-full items-center ${collapsed ? 'justify-center' : 'gap-2'} border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 transition-all duration-200 ${collapsed ? 'px-1' : 'text-left'}`}
                  title={item.name}
                  data-action="navigate"
                  data-nav-target={item.name.toLowerCase()}
                >
                  <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                  {!collapsed && <span>{item.name}</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Products header */}
      <div
        className="flex items-center px-4 py-2"
        data-section="products-header">
        {!collapsed && <span className="text-xs font-medium text-[#a0a0a0] flex-grow">Products</span>}
        <EntityCreator
          entityType="product"
          buttonVariant="ghost"
          buttonSize="icon"
          buttonClassName={`${collapsed ? 'mx-auto' : ''} h-5 w-5 border border-transparent rounded-sm hover:bg-black/20 hover:border-white/20 flex items-center justify-center`}
          iconOnly={true}
        />
      </div>
      
      {/* Products tree */}
      <div
        className="px-2 py-2 overflow-y-auto flex-grow"
        data-section="products-tree">
        {productsQuery.products && productsQuery.products.length > 0 ? (
          <ul className="space-y-1" data-list="products">
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
                    <div className="flex items-center" data-row="product">
                      {/* Expand/collapse button - only show when not collapsed */}
                      {!collapsed && (
                        <CollapsibleTrigger asChild>
                          <button
                            className="p-1 hover:bg-black/20 hover:border hover:border-white/20 rounded-sm transition-all duration-200"
                            data-action="toggle"
                            aria-label={isExpanded ? "Collapse" : "Expand"}>
                            {hasInterfaces ?
                              isExpanded ? <ChevronDown className="h-4 w-4 text-[#a0a0a0]" /> :
                                          <ChevronRight className="h-4 w-4 text-[#a0a0a0]" /> :
                              <div className="w-4" />
                            }
                          </button>
                        </CollapsibleTrigger>
                      )}

                      {/* Product button */}
                      <button
                        className={`flex flex-1 items-center ${collapsed ? 'justify-center' : 'gap-2'} border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20 hover:text-white/90 transition-all duration-200`}
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
                        <Package className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                        {!collapsed && <span>{product.name}</span>}
                      </button>

                      {/* Interface creator - only show when not collapsed */}
                      {!collapsed && (
                        <EntityCreator
                          entityType="interface"
                          iconOnly={true}
                          buttonClassName="h-5 w-5 border border-transparent rounded-sm hover:bg-black/20 hover:border-white/20 opacity-0 group-hover:opacity-100"
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
                        <ul className="pl-6 mt-1 space-y-1" data-list="interfaces">
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
                                  <div className="flex items-center" data-row="interface">
                                    {/* Expand/collapse button */}
                                    <CollapsibleTrigger asChild>
                                      <button
                            className="p-1 hover:bg-black/20 hover:border hover:border-white/20 rounded-sm"
                            data-action="toggle"
                            aria-label={isExpanded ? "Collapse" : "Expand"}>
                                        {hasFeatures ?
                                          isInterfaceExpanded ? <ChevronDown className="h-4 w-4 text-[#a0a0a0]" /> :
                                                              <ChevronRight className="h-4 w-4 text-[#a0a0a0]" /> :
                                          <div className="w-4" />
                                        }
                                      </button>
                                    </CollapsibleTrigger>

                                    {/* Interface button */}
                                    <button
                                      className="flex flex-1 items-center gap-2 border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20"
                                      data-action="open-tab"
                                      data-entity-name={interface_.name}
                                      onClick={() => openTab({
                                        title: interface_.name,
                                        type: 'interface',
                                        itemId: interface_.id,
                                        hasChanges: false
                                      })}
                                    >
                                      <Layers className="h-4 w-4 text-muted-foreground" />
                                      <span>{interface_.name}</span>
                                    </button>

                                    {/* Feature creator */}
                                    <EntityCreator
                                      entityType="feature"
                                      iconOnly={true}
                                      buttonClassName="h-5 w-5 border border-transparent rounded-sm hover:bg-black/20 hover:border-white/20 opacity-0 group-hover:opacity-100"
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
                                      <ul className="pl-6 mt-1 space-y-1">
                                        {interfaceFeatures.map(feature => {
                                          const featureReleases = releasesQuery.getReleasesByFeatureId(feature.id);
                                          const hasReleases = featureReleases && featureReleases.length > 0;
                                          const isFeatureExpanded = expandedFeatures[feature.id] || false;

                                          return (
                                            <li key={feature.id} className="group">
                                              <Collapsible open={isFeatureExpanded} onOpenChange={() => toggleFeatureExpansion(feature.id)}>
                                                {/* Feature row */}
                                                <div className="flex items-center">
                                                  {/* Expand/collapse button */}
                                                  <CollapsibleTrigger asChild>
                                                    <button
                            className="p-1 hover:bg-black/20 hover:border hover:border-white/20 rounded-sm"
                            data-action="toggle"
                            aria-label={isExpanded ? "Collapse" : "Expand"}>
                                                      {hasReleases ?
                                                        isFeatureExpanded ? <ChevronDown className="h-4 w-4 text-[#a0a0a0]" /> :
                                                                          <ChevronRight className="h-4 w-4 text-[#a0a0a0]" /> :
                                                        <div className="w-4" />
                                                      }
                                                    </button>
                                                  </CollapsibleTrigger>

                                                  {/* Feature button */}
                                                  <button
                                                    className="flex flex-1 items-center gap-2 border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20"
                                                    onClick={() => openTab({
                                                      title: feature.name,
                                                      type: 'feature',
                                                      itemId: feature.id,
                                                      hasChanges: false
                                                    })}
                                                  >
                                                    <Puzzle className="h-4 w-4 text-muted-foreground" />
                                                    <span>{feature.name}</span>
                                                  </button>

                                                  {/* Release creator */}
                                                  <EntityCreator
                                                    entityType="release"
                                                    iconOnly={true}
                                                    buttonClassName="h-5 w-5 border border-transparent rounded-sm hover:bg-black/20 hover:border-white/20 opacity-0 group-hover:opacity-100"
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
                                                    <ul className="pl-6 mt-1 space-y-1">
                                                      {featureReleases.map(release => (
                                                        <li key={release.id} className="group">
                                                          {/* Release button */}
                                                          <button
                                                            className="flex w-full items-center gap-2 border border-transparent rounded-md p-2 text-sm hover:bg-black/20 hover:border hover:border-white/20"
                                                            onClick={() => openTab({
                                                              title: release.name,
                                                              type: 'release',
                                                              itemId: release.id,
                                                              hasChanges: false
                                                            })}
                                                          >
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span>{release.name}</span>
                                                          </button>
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
    </div>
  )
}
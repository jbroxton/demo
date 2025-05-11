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
  Puzzle
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useProductsQuery } from "@/hooks/use-products-query"
import { useInterfacesQuery } from "@/hooks/use-interfaces-query"
import { useFeaturesQuery } from "@/hooks/use-features-query"
import { useReleasesQuery } from "@/hooks/use-releases-query"
import { useTabsQuery } from "@/hooks/use-tabs-query"
import { useRoadmapsQuery } from "@/hooks/use-roadmaps-query"
import { Button } from "@/components/ui/button"
import { EntityCreator } from "@/components/entity-creator"
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

export function AppSidebarQuery({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
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
    <div className="h-full flex flex-col" {...props}>
      {/* App header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Speqq Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <Image
              src="/text-logo.svg"
              alt="Speqq"
              width={80}
              height={24}
              priority
              className="h-6"
            />
          </div>
        </div>
      </div>
      
      {/* User info section */}
      <div className="p-3 border-b border-[#232326] flex justify-between items-center">
        <div className="text-xs text-[#a0a0a0]">
          Welcome, {user?.name || 'User'}
        </div>
        <button 
          className="p-1.5 rounded-md text-[#a0a0a0] hover:bg-[#232326] hover:text-white"
          onClick={() => {
            logout();
          }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main navigation section */}
      <div className="p-2">
        <div className="mb-2">
          <ul className="flex flex-col gap-1">
            {goalsData.map((item) => (
              <li key={item.name} className="group/menu-item relative">
                <button
                  className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden hover:bg-[#232326]"
                  onClick={() => {
                    // Special handling for Roadmap item
                    if (item.name === 'Roadmap') {
                      // Open the roadmap tab - the useRoadmapsQuery hook will handle fetching the data
                      openTab({
                        title: 'Roadmaps',
                        type: 'roadmap',
                        itemId: 'roadmaps' // Special itemId for the roadmaps tab
                      });
                    }
                    // Other items will be implemented later
                  }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Products header */}
      <div className="px-4 py-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-[#a0a0a0]">Products</span>
          <EntityCreator 
            entityType="product"
            iconOnly={true}
            buttonClassName="h-5 w-5 rounded-sm hover:bg-[#232326]"
          />
        </div>
      </div>
      
      {/* Products list */}
      <div className="px-2 py-2 overflow-y-auto flex-grow">
        {productsQuery.products && productsQuery.products.length > 0 ? (
          <ul className="space-y-1">
            {productsQuery.products.map(product => {
              // Get interfaces for this product
              const productInterfaces = interfacesQuery.getInterfacesByProductId(product.id);
              const hasInterfaces = productInterfaces && productInterfaces.length > 0;
              const isExpanded = expandedProducts[product.id] || false;
              
              return (
                <li key={product.id} className="group relative">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleProductExpansion(product.id)}
                  >
                    <div className="flex items-center">
                      <CollapsibleTrigger asChild>
                        <button className="p-1 hover:bg-[#232326] rounded-sm">
                          {hasInterfaces ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[#a0a0a0]" />
                            )
                          ) : (
                            <div className="w-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      
                      <button 
                        className="flex flex-1 items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-[#232326]"
                        onClick={() => openTab({
                          title: product.name,
                          type: 'product',
                          itemId: product.id,
                        })}
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{product.name}</span>
                      </button>
                      
                      {/* Interface creator for this product */}
                      <EntityCreator 
                        entityType="interface"
                        iconOnly={true}
                        buttonClassName="h-5 w-5 rounded-sm hover:bg-[#232326] opacity-0 group-hover:opacity-100"
                        buttonVariant="ghost"
                        context={{
                          parentId: product.id,
                          parentType: 'product',
                          parentName: product.name
                        }}
                      />
                    </div>
                    
                    {/* Show interfaces if expanded */}
                    {hasInterfaces && (
                      <CollapsibleContent>
                        <ul className="pl-6 mt-1 space-y-1">
                          {productInterfaces.map(interface_ => {
                            // Get features for this interface
                            const interfaceFeatures = featuresQuery.getFeaturesByInterfaceId(interface_.id);
                            const hasFeatures = interfaceFeatures && interfaceFeatures.length > 0;
                            const isInterfaceExpanded = expandedInterfaces[interface_.id] || false;
                            
                            return (
                              <li key={interface_.id} className="group relative">
                                <Collapsible
                                  open={isInterfaceExpanded}
                                  onOpenChange={() => toggleInterfaceExpansion(interface_.id)}
                                >
                                  <div className="flex items-center">
                                    <CollapsibleTrigger asChild>
                                      <button className="p-1 hover:bg-[#232326] rounded-sm">
                                        {hasFeatures ? (
                                          isInterfaceExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-[#a0a0a0]" />
                                          )
                                        ) : (
                                          <div className="w-4" />
                                        )}
                                      </button>
                                    </CollapsibleTrigger>
                                    
                                    <button 
                                      className="flex flex-1 items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-[#232326]"
                                      onClick={() => openTab({
                                        title: interface_.name,
                                        type: 'interface',
                                        itemId: interface_.id,
                                      })}
                                    >
                                      <Layers className="h-4 w-4 text-muted-foreground" />
                                      <span>{interface_.name}</span>
                                    </button>
                                    
                                    {/* Feature creator for this interface */}
                                    <EntityCreator 
                                      entityType="feature"
                                      iconOnly={true}
                                      buttonClassName="h-5 w-5 rounded-sm hover:bg-[#232326] opacity-0 group-hover:opacity-100"
                                      buttonVariant="ghost"
                                      context={{
                                        parentId: interface_.id,
                                        parentType: 'interface',
                                        parentName: interface_.name
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Show features if expanded */}
                                  {hasFeatures && (
                                    <CollapsibleContent>
                                      <ul className="pl-6 mt-1 space-y-1">
                                        {interfaceFeatures.map(feature => {
                                          // Get releases for this feature
                                          const featureReleases = releasesQuery.getReleasesByFeatureId(feature.id);
                                          const hasReleases = featureReleases && featureReleases.length > 0;
                                          const isFeatureExpanded = expandedFeatures[feature.id] || false;
                                          
                                          return (
                                            <li key={feature.id} className="group relative">
                                              <Collapsible
                                                open={isFeatureExpanded}
                                                onOpenChange={() => toggleFeatureExpansion(feature.id)}
                                              >
                                                <div className="flex items-center">
                                                  <CollapsibleTrigger asChild>
                                                    <button className="p-1 hover:bg-[#232326] rounded-sm">
                                                      {hasReleases ? (
                                                        isFeatureExpanded ? (
                                                          <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
                                                        ) : (
                                                          <ChevronRight className="h-4 w-4 text-[#a0a0a0]" />
                                                        )
                                                      ) : (
                                                        <div className="w-4" />
                                                      )}
                                                    </button>
                                                  </CollapsibleTrigger>
                                                  
                                                  <button 
                                                    className="flex flex-1 items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-[#232326]"
                                                    onClick={() => openTab({
                                                      title: feature.name,
                                                      type: 'feature',
                                                      itemId: feature.id,
                                                    })}
                                                  >
                                                    <Puzzle className="h-4 w-4 text-muted-foreground" />
                                                    <span>{feature.name}</span>
                                                  </button>
                                                  
                                                  {/* Release creator for this feature */}
                                                  <EntityCreator 
                                                    entityType="release"
                                                    iconOnly={true}
                                                    buttonClassName="h-5 w-5 rounded-sm hover:bg-[#232326] opacity-0 group-hover:opacity-100"
                                                    buttonVariant="ghost"
                                                    context={{
                                                      parentId: feature.id,
                                                      parentType: 'feature',
                                                      parentName: feature.name
                                                    }}
                                                  />
                                                </div>
                                                
                                                {/* Show releases if expanded */}
                                                {hasReleases && (
                                                  <CollapsibleContent>
                                                    <ul className="pl-6 mt-1 space-y-1">
                                                      {featureReleases.map(release => (
                                                        <li key={release.id} className="group relative flex items-center">
                                                          <button 
                                                            className="flex flex-1 items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-[#232326]"
                                                            onClick={() => openTab({
                                                              title: release.name,
                                                              type: 'release',
                                                              itemId: release.id,
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
          <div className="text-center text-sm text-[#a0a0a0] py-4">
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
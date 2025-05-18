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
import { useSidenavTheme } from "@/providers/sidenav-theme-provider"

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

export function AppSidebarQueryThemed({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const theme = useSidenavTheme();
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
  const { openTab, tabs, activeTabId } = useTabsQuery();

  // Get active tab information
  const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) : null;
  
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
      <div className={theme.sidenav + " justify-center items-center"} {...props}>
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
      <div className={theme.sidenav + " justify-center items-center p-4"} {...props}>
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
    <div className={theme.sidenav} {...props}>
      {/* App header with logo */}
      <div className={theme.sidenavHeader}>
        <div className={theme.sidenavLogo}>
          <Image 
            src="/logo.svg" 
            alt="Speqq Logo" 
            width={24} 
            height={24} 
            priority
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
      
      {/* User info section */}
      <div className={theme.sidenavUser}>
        <div className={theme.sidenavUserInfo}>
          Welcome, {user?.name || 'User'}
        </div>
        <button 
          className={theme.sidenavLogout}
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main navigation section */}
      <div className={theme.sidenavContent}>
        <div className={theme.sidenavSection}>
          <div className={theme.sidenavMenu}>
            {goalsData.map((item) => (
              <div
                key={item.name}
                className={`group ${theme.sidenavItem}`}
                onClick={() => {
                  if (item.name === 'Roadmap') {
                    openTab({
                      title: 'Roadmaps',
                      type: 'roadmap',
                      itemId: 'roadmaps',
                      hasChanges: false
                    });
                  }
                }}
              >
                <div className={theme.sidenavItemIcon}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Products header */}
        <div className={theme.sidenavSection}>
          <div className={theme.sidenavSectionHeader}>
            <span className={theme.sidenavSectionTitle}>Products</span>
            <EntityCreator 
              entityType="product"
              iconOnly={true}
              buttonClassName={theme.sidenavAddButton}
            />
          </div>
          
          {/* Products list */}
          {productsQuery.products && productsQuery.products.length > 0 ? (
            <div className={theme.sidenavMenu}>
              {productsQuery.products.map(product => {
                // Get interfaces for this product
                const productInterfaces = interfacesQuery.getInterfacesByProductId(product.id);
                const hasInterfaces = productInterfaces && productInterfaces.length > 0;
                const isExpanded = expandedProducts[product.id] || false;
                
                return (
                  <div key={product.id} className={theme.sidenavGroup}>
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleProductExpansion(product.id)}
                    >
                      <div className={theme.sidenavGroupHeader}>
                        <CollapsibleTrigger asChild>
                          <button className={theme.sidenavGroupToggle + (isExpanded ? ' ' + theme.sidenavGroupToggleExpanded : '')}>
                            {hasInterfaces ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            ) : (
                              <div className="w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        
                        <div 
                          className={theme.sidenavGroupButton}
                          onClick={() => openTab({
                            title: product.name,
                            type: 'product',
                            itemId: product.id,
                            hasChanges: false
                          })}
                        >
                          <div className={theme.sidenavItemIcon}>
                            <Package className="h-4 w-4" />
                          </div>
                          <span>{product.name}</span>
                        </div>
                        
                        {/* Interface creator for this product */}
                        <EntityCreator 
                          entityType="interface"
                          iconOnly={true}
                          buttonClassName={theme.sidenavAddButton + " opacity-0 group-hover:opacity-100"}
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
                        <CollapsibleContent className={theme.sidenavGroupContent}>
                          <div className={theme.sidenavMenu}>
                            {productInterfaces.map(interface_ => {
                              // Get features for this interface
                              const interfaceFeatures = featuresQuery.getFeaturesByInterfaceId(interface_.id);
                              const hasFeatures = interfaceFeatures && interfaceFeatures.length > 0;
                              const isInterfaceExpanded = expandedInterfaces[interface_.id] || false;
                              
                              return (
                                <div key={interface_.id} className={theme.sidenavGroup}>
                                  <Collapsible
                                    open={isInterfaceExpanded}
                                    onOpenChange={() => toggleInterfaceExpansion(interface_.id)}
                                  >
                                    <div className={theme.sidenavGroupHeader}>
                                      <CollapsibleTrigger asChild>
                                        <button className={theme.sidenavGroupToggle + (isInterfaceExpanded ? ' ' + theme.sidenavGroupToggleExpanded : '')}>
                                          {hasFeatures ? (
                                            isInterfaceExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )
                                          ) : (
                                            <div className="w-4" />
                                          )}
                                        </button>
                                      </CollapsibleTrigger>
                                      
                                      <div 
                                        className={theme.sidenavGroupButton}
                                        onClick={() => openTab({
                                          title: interface_.name,
                                          type: 'interface',
                                          itemId: interface_.id,
                                          hasChanges: false
                                        })}
                                      >
                                        <div className={theme.sidenavItemIcon}>
                                          <Layers className="h-4 w-4" />
                                        </div>
                                        <span>{interface_.name}</span>
                                      </div>
                                      
                                      {/* Feature creator for this interface */}
                                      <EntityCreator 
                                        entityType="feature"
                                        iconOnly={true}
                                        buttonClassName={theme.sidenavAddButton + " opacity-0 group-hover:opacity-100"}
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
                                      <CollapsibleContent className={theme.sidenavGroupContent}>
                                        <div className={theme.sidenavMenu}>
                                          {interfaceFeatures.map(feature => {
                                            // Get releases for this feature
                                            const featureReleases = releasesQuery.getReleasesByFeatureId(feature.id);
                                            const hasReleases = featureReleases && featureReleases.length > 0;
                                            const isFeatureExpanded = expandedFeatures[feature.id] || false;
                                            
                                            return (
                                              <div key={feature.id} className={theme.sidenavGroup}>
                                                <Collapsible
                                                  open={isFeatureExpanded}
                                                  onOpenChange={() => toggleFeatureExpansion(feature.id)}
                                                >
                                                  <div className={theme.sidenavGroupHeader}>
                                                    <CollapsibleTrigger asChild>
                                                      <button className={theme.sidenavGroupToggle + (isFeatureExpanded ? ' ' + theme.sidenavGroupToggleExpanded : '')}>
                                                        {hasReleases ? (
                                                          isFeatureExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                          ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                          )
                                                        ) : (
                                                          <div className="w-4" />
                                                        )}
                                                      </button>
                                                    </CollapsibleTrigger>
                                                    
                                                    <div
                                                      className={theme.sidenavGroupButton}
                                                      onClick={() => openTab({
                                                        title: feature.name,
                                                        type: 'feature',
                                                        itemId: feature.id,
                                                        hasChanges: false
                                                      })}
                                                    >
                                                      <div className={theme.sidenavItemIcon}>
                                                        <Puzzle className="h-4 w-4" />
                                                      </div>
                                                      <span>{feature.name}</span>
                                                    </div>
                                                    
                                                    {/* Release creator for this feature */}
                                                    <EntityCreator 
                                                      entityType="release"
                                                      iconOnly={true}
                                                      buttonClassName={theme.sidenavAddButton + " opacity-0 group-hover:opacity-100"}
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
                                                    <CollapsibleContent className={theme.sidenavGroupContent}>
                                                      <div className={theme.sidenavMenu}>
                                                        {featureReleases.map(release => (
                                                          <div
                                                            key={release.id}
                                                            className={`group ${theme.sidenavItem}`}
                                                            onClick={() => openTab({
                                                              title: release.name,
                                                              type: 'release',
                                                              itemId: release.id,
                                                              hasChanges: false
                                                            })}
                                                          >
                                                            <div className={theme.sidenavItemIcon}>
                                                              <Calendar className="h-4 w-4" />
                                                            </div>
                                                            <span>{release.name}</span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </CollapsibleContent>
                                                  )}
                                                </Collapsible>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </CollapsibleContent>
                                    )}
                                  </Collapsible>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={theme.sidenavEmpty}>
              No products available.
              <EntityCreator 
                entityType="product"
                buttonVariant="link"
                buttonSize="sm"
                buttonLabel="Create your first product"
                buttonClassName={theme.sidenavEmptyAction + " block mx-auto mt-2"}
                iconOnly={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
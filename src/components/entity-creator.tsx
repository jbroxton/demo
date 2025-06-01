"use client"

import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useReleasesQuery } from '@/hooks/use-releases-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import type { Product, Interface, Feature, Release } from '@/types/models';
import type { Roadmap } from '@/types/models/Roadmap';
import type { Page } from '@/types/models/Page';

// Define all possible entity types
export type EntityType = 'product' | 'interface' | 'feature' | 'release' | 'roadmap' | 'page';

// Props for entity context
type EntityContextProps = {
  parentId?: string; // For entities that need a parent (e.g., interface needs product)
  parentType?: EntityType; // Type of the parent entity
  parentName?: string; // Name of the parent entity
};

// Props for the entity creator component
interface EntityCreatorProps {
  entityType: EntityType;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'ghost' | 'outline' | 'link' | 'destructive' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
  iconOnly?: boolean;
  context?: EntityContextProps;
}

export function EntityCreator({
  entityType,
  buttonLabel,
  buttonVariant = 'ghost',
  buttonSize = 'icon',
  buttonClassName = '',
  iconOnly = false,
  context
}: EntityCreatorProps) {
  console.log('=== EntityCreator MOUNTED ===', { entityType });
  
  const { openTab } = useTabsQuery();
  const productsQuery = useProductsQuery();
  const interfacesQuery = useInterfacesQuery();
  const featuresQuery = useFeaturesQuery();
  const releasesQuery = useReleasesQuery();
  const roadmapsQuery = useRoadmapsQuery();
  const pagesQuery = usePagesQuery();
  const auth = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Default button labels based on entity type
  const getDefaultLabel = () => {
    switch (entityType) {
      case 'product': return 'Add Product';
      case 'interface': return 'Add Interface';
      case 'feature': return 'Add Feature';
      case 'release': return 'Add Release';
      case 'roadmap': return 'Add Roadmap';
      case 'page': return 'Add Page';
      default: return 'Add New';
    }
  };
  
  // Define typed entities returned from mutations
  type CreatedEntity = Product | Interface | Feature | Release | Roadmap | Page;
  
  // Create a new entity tab
  const createEntityTab = async () => {
    console.log('=== createEntityTab CALLED ===');
    console.log('Creating entity tab for:', entityType);
    console.log('Auth state:', {
      isAuthenticated: auth.isAuthenticated,
      currentTenant: auth.currentTenant,
      allowedTenants: auth.allowedTenants,
      user: auth.user
    });
    setIsCreating(true);
    
    try {
      let newEntity: CreatedEntity | undefined;
      
      // Create the entity in the database first
      switch (entityType) {
        case 'product':
          console.log('Creating new product...');
          // Note: tenantId is automatically added by the API handler from authentication
          newEntity = await productsQuery.addProduct({
            name: `New Product`,
            description: '',
            isSaved: false,
            savedAt: null
          });
          console.log('Created product:', newEntity);
          
          // Wait a bit to ensure the product is propagated through the backend
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Invalidate and refetch to ensure the new product is in the cache
          try {
            await productsQuery.invalidateQueries();
            await productsQuery.refetch();
            console.log('Products query refetched');
          
            // Double check the product exists in the cache
            const verifyProduct = productsQuery.getProductById(newEntity.id);
            console.log('Verify product in cache:', verifyProduct);
            
            if (!verifyProduct) {
              console.warn('Product not found in cache after refetch, tab might show empty');
            }
          } catch (error) {
            console.error('Error refreshing products:', error);
          }
          break;
          
        case 'interface':
          // Ensure parent ID is valid for interface creation
          if (!context?.parentId) {
            throw new Error('Interface requires a parent product');
          }
          newEntity = await interfacesQuery.addInterface({
            name: `New Interface`,
            description: '',
            productId: context.parentId,
            isSaved: false,
            savedAt: null
          });
          break;
          
        case 'feature':
          // Ensure parent ID is valid for feature creation
          if (!context?.parentId) {
            throw new Error('Feature requires a parent interface');
          }
          newEntity = await featuresQuery.addFeature({
            name: `New Feature`,
            description: '',
            priority: 'Med',  // Default priority
            interfaceId: context.parentId,
            isSaved: false,
            savedAt: null
          });
          break;
          
        case 'release':
          // Ensure parent ID is valid for release creation
          if (!context?.parentId) {
            throw new Error('Release requires a parent feature');
          }
          newEntity = await releasesQuery.addRelease({
            name: `New Release`,
            description: '',
            featureId: context.parentId,
            priority: 'Med',  // Default priority
            releaseDate: new Date().toISOString().split('T')[0],  // Today's date in ISO format
            isSaved: false,
            savedAt: null
          });
          break;
          
        case 'roadmap':
          // Create new roadmap in the database first
          console.log('Creating new roadmap...');
          
          // Explicitly check tenant ID before attempting creation
          if (!auth.currentTenant) {
            console.error('No tenant selected. Current auth state:', {
              isAuthenticated: auth.isAuthenticated,
              currentTenant: auth.currentTenant,
              allowedTenants: auth.allowedTenants,
            });
            
            // Try to get tenant ID from user if available
            const tenantId = auth?.user?.tenantId || auth?.user?.currentTenant;
            if (!tenantId) {
              throw new Error('Cannot create roadmap: No tenant selected');
            }
            
            console.log('Using tenant ID from user:', tenantId);
          }
          
          // tenant ID is automatically added by the API handler from the auth system
          newEntity = await roadmapsQuery.addRoadmap({
            name: 'New Roadmap',
            description: '',
            is_default: false
          });
          console.log('Created roadmap:', newEntity);
          
          // Wait a bit to ensure the roadmap is propagated through the backend
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Refresh roadmaps to ensure the new roadmap is in the cache
          try {
            await roadmapsQuery.roadmapsRefetch();
            console.log('Roadmaps query refetched');
            
            // Double check the roadmap exists in the cache
            const verifyRoadmap = roadmapsQuery.getRoadmapById(newEntity.id);
            console.log('Verify roadmap in cache:', verifyRoadmap);
            
            if (!verifyRoadmap) {
              console.warn('Roadmap not found in cache after refetch, tab might show empty');
            }
          } catch (error) {
            console.error('Error refreshing roadmaps:', error);
          }
          break;

        case 'page':
          console.log('Creating new page...', context);
          
          // Determine page type based on context
          let pageType: import('@/types/models/Page').PageType = 'feature'; // Default fallback
          let title = 'New Page';
          
          if (context?.parentId && context?.parentType === 'page') {
            // This is a child page, determine appropriate type
            // For now, default to 'feature' for all child pages
            // TODO: Could implement smart type selection based on parent type
            pageType = 'feature';
            title = 'New Feature';
          }
          
          // Create new page in the database
          newEntity = await pagesQuery.addPage({
            type: pageType,
            title,
            parent_id: context?.parentId,
            properties: {},
            blocks: []
          });
          console.log('Created page:', newEntity);
          
          // Wait a bit to ensure the page is propagated through the backend
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Refresh pages to ensure the new page is in the cache
          try {
            await pagesQuery.refetch();
            console.log('Pages query refetched');
            
            // Double check the page exists in the cache
            const verifyPage = pagesQuery.getPageById(newEntity.id);
            console.log('Verify page in cache:', verifyPage);
            
            if (!verifyPage) {
              console.warn('Page not found in cache after refetch, tab might show empty');
            }
          } catch (error) {
            console.error('Error refreshing pages:', error);
          }
          break;
          
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
      
      // Validate the created entity
      if (!newEntity || !newEntity.id) {
        throw new Error(`Failed to create ${entityType}: Invalid response from server`);
      }
      
      // Create title based on entity type and context
      let title = `New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
      if (context?.parentName) {
        title += ` for ${context.parentName}`;
      }
      
      console.log('Opening tab with real entity:', { title, type: entityType, id: newEntity.id });
      
      // Open the tab with the real entity ID
      console.log('EntityCreator - about to open tab with entity ID:', newEntity.id);
      
      // Ensure the tab opening completes before closing the dialog
      await openTab({
        title,
        type: entityType,
        itemId: newEntity.id,
        hasChanges: false  // New entities start without changes
      });
      
      console.log('EntityCreator - tab opened successfully');
      
      // Small delay to ensure smooth UI transition
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Close the dialog
      setIsOpen(false);
      console.log('EntityCreator - dialog closed');
      
      // Show success message
      toast.success(`Created new ${entityType}`);
    } catch (error) {
      console.error('Failed to create entity:', error);
      
      // Log detailed auth state for debugging
      console.error('Auth state during entity creation error:', {
        isAuthenticated: auth.isAuthenticated,
        hasTenants: auth.allowedTenants?.length > 0,
        currentTenant: auth.currentTenant,
        userEmail: auth?.user?.email,
        tenantId: auth?.user?.tenantId,
      });
      
      // Check if the entity was actually created in the DB but had client-side errors
      if (entityType === 'roadmap' && error instanceof Error && 
          (error.message.includes('tenant') || 
           error.message.includes('oldData is not iterable'))) {
        
        toast.warning("Roadmap created in database but encountered display issues. Please refresh to see it.");
        
        // Close dialog to prevent multiple attempts
        setIsOpen(false);
        return;
      }
      
      // Provide more specific error messages
      let errorMessage = error instanceof Error ? error.message : `Failed to create ${entityType}`;
      
      // Only check tenant issues if there's no specific error message
      if (errorMessage === `Failed to create ${entityType}`) {
        // First check if currentTenant exists - this is more important than allowedTenants
        if (!auth.currentTenant && !auth?.user?.tenantId) {
          errorMessage = `Cannot create ${entityType}: No tenant selected`;
        } 
        // Only check allowedTenants if we don't have a current tenant
        else if (auth.allowedTenants.length === 0 && !auth.currentTenant && !auth?.user?.tenantId) {
          errorMessage = `Cannot create ${entityType}: No tenants available`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClassName}
            title={buttonLabel || getDefaultLabel()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant={buttonVariant} 
            size={buttonSize}
            className={buttonClassName}
          >
            <Plus className="h-4 w-4 mr-2" />
            {buttonLabel || getDefaultLabel()}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-[#232326] border-[#333336] text-white">
        <DialogHeader>
          <DialogTitle>Create New {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-[#a0a0a0] mb-4">
            This will create a new tab where you can define the {entityType} details.
            {context?.parentName && (
              <span> This {entityType} will be associated with {context.parentName}.</span>
            )}
          </p>
          
          {/* Show parent entity information if available */}
          {context?.parentName && context?.parentType && (
            <div className="mb-4">
              <Label className="text-xs text-[#a0a0a0]">Parent {context.parentType}</Label>
              <div className="px-3 py-2 bg-[#1e1e1f] rounded-md text-sm">
                {context.parentName}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="bg-[#1e1e1f] border-[#333336] text-[#a0a0a0]">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={() => {
              console.log('=== CREATE BUTTON CLICKED ===');
              console.log('entityType:', entityType);
              console.log('isCreating:', isCreating);
              createEntityTab();
            }}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
"use client"

import React from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

// Define all possible entity types
export type EntityType = 'product' | 'interface' | 'feature' | 'release';

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
  const { openTab } = useTabsQuery();
  const [isOpen, setIsOpen] = useState(false);
  
  // Default button labels based on entity type
  const getDefaultLabel = () => {
    switch (entityType) {
      case 'product': return 'Add Product';
      case 'interface': return 'Add Interface';
      case 'feature': return 'Add Feature';
      case 'release': return 'Add Release';
      default: return 'Add New';
    }
  };
  
  // Create a new entity tab
  const createEntityTab = () => {
    const timestamp = Date.now();
    let itemId = `new-${entityType}-${timestamp}`;
    
    // Add parent context if available
    if (context?.parentId) {
      itemId += `-${context.parentId}`;
    }
    
    // Create title based on entity type and context
    let title = `New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
    if (context?.parentName) {
      title += ` for ${context.parentName}`;
    }
    
    // Open the tab for the new entity
    openTab({
      title,
      type: entityType,
      itemId
    });
    
    // Close the dialog
    setIsOpen(false);
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
            onClick={createEntityTab}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
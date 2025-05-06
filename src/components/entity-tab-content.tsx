import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X, Trash2 } from 'lucide-react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LucideIcon } from 'lucide-react';

interface EntityTabContentProps {
  id: string;
  tabId: string;
  isNew: boolean;
  entityType: 'product' | 'interface' | 'feature' | 'release';
  name: string;
  icon: LucideIcon;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  onNameChange: (name: string) => void;
  isSaving: boolean;
  isValid: boolean;
  children?: React.ReactNode;
}

export function EntityTabContent({
  id,
  tabId,
  isNew,
  entityType,
  name,
  icon: Icon,
  onSave,
  onDelete,
  onCancel,
  onNameChange,
  isSaving,
  isValid,
  children
}: EntityTabContentProps) {
  // Local state
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(name);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNameValue(newName);
    onNameChange(newName);
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      await onSave();
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      if (isEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error(`Failed to save ${entityType}:`, error);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      await onDelete();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error(`Failed to delete ${entityType}:`, error);
    }
  };
  
  // Toggle edit mode
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save when exiting edit mode
      if (!isNew) {
        handleSave();
      }
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section with entity name and action buttons */}
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        {/* Column 1: Entity name */}
        <div className="flex items-center">
          <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder={`Enter ${entityType} name`}
              />
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
            </h1>
          )}
        </div>
        
        {/* Column 2: Action buttons */}
        <div className="flex items-center justify-end space-x-2">
          {/* Custom action buttons slot */}
          
          {!isNew && !isEditing && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleToggleEditMode}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
          
          {(isNew || isEditing) && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || !isValid}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
        
        {showSaveSuccess && (
          <div className="col-span-2 text-sm text-green-500 mt-1 transition-opacity duration-300">
            Saved successfully!
          </div>
        )}
      </div>
      
      {/* Main content section */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">{entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details</h2>
          
          {/* Entity content */}
          {children}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#232326] border-[#2a2a2c] text-white">
          <DialogHeader>
            <DialogTitle>Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure you want to delete this {entityType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? `Deleting...` : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reusable component for entity actions like "Add Feature", "Add Release", etc.
interface EntityActionProps {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
}

export function EntityAction({ label, onClick, icon: Icon }: EntityActionProps) {
  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}

// Reusable component for entity item lists (features, releases, etc.)
interface EntityItemProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage: string;
}

export function EntityItemList<T>({ items, renderItem, emptyMessage }: EntityItemProps<T>) {
  const hasItems = items && items.length > 0;
  
  return (
    <>
      {hasItems ? (
        <div className="bg-[#232326] rounded-md p-2 space-y-1">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {renderItem(item)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </>
  );
}

// Reusable entity section component
interface EntitySectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function EntitySection({ title, action, children }: EntitySectionProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[#a0a0a0] text-sm">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
} 
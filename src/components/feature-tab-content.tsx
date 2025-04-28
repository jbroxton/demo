import React, { useEffect, useState } from 'react';
import { useFeaturesStore, Feature, Requirement } from '@/stores/features';
import { useInterfacesStore } from '@/stores/interfaces';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Puzzle, Save, X, Plus, FileText, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeatureDescriptionEditor } from './feature-description-editor';
import { RequirementsPlaceholder } from './requirements-placeholder';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeatureTabContentProps {
  featureId: string;
  tabId: string;
  isNew?: boolean;
  selectedInterfaceId?: string;
}

export function FeatureTabContent({ 
  featureId, 
  tabId,
  isNew = false,
  selectedInterfaceId 
}: FeatureTabContentProps) {
  // Store hooks
  const { 
    getFeatureById, 
    updateFeatureName, 
    updateFeatureDescription, 
    addFeature,
    toggleRequirementsVisibility,
    deleteFeature
  } = useFeaturesStore();
  const { getInterfaceById, getInterfaces, updateInterfaceWithFeature } = useInterfacesStore();
  const { updateTabTitle, closeTab, updateNewTabToSavedItem, activateTab } = useTabsStore();
  
  // State hooks - declare ALL hooks at the top before any conditional logic
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [priorityValue, setPriorityValue] = useState<'High' | 'Med' | 'Low'>('Med');
  const [interfaceId, setInterfaceId] = useState(selectedInterfaceId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  
  // Get feature data
  const feature = !isNew ? getFeatureById(featureId) : null;
  const interfaces = getInterfaces();
  const selectedInterface = interfaceId ? getInterfaceById(interfaceId) : null;
  
  // Determine if we should show requirements
  const shouldShowRequirements = isNew 
    ? showRequirements 
    : feature?.showRequirements;
  
  // Initialize from feature data on component mount
  useEffect(() => {
    setIsClient(true);
    
    // Initialize values from feature when we have a feature
    if (feature) {
      setNameValue(feature.name);
      setDescriptionValue(feature.description || '');
      setPriorityValue(feature.priority);
      setInterfaceId(feature.interfaceId);
    }
  }, [feature]);
  
  // Event handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handlePriorityChange = (value: string) => {
    setPriorityValue(value as 'High' | 'Med' | 'Low');
  };
  
  const handleInterfaceChange = (value: string) => {
    setInterfaceId(value);
  };
  
  const handleSaveFeature = () => {
    if (!isNew && feature) {
      if (nameValue.trim() !== feature.name) {
        updateFeatureName(featureId, nameValue);
        updateTabTitle(featureId, 'feature', nameValue);
      }
      
      if (descriptionValue !== feature.description) {
        updateFeatureDescription(featureId, descriptionValue);
      }
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setIsEditing(false);
    }
  };
  
  const handleToggleRequirements = () => {
    if (!isNew && feature) {
      toggleRequirementsVisibility(featureId);
    } else {
      // For new features, just track in local state until saved
      setShowRequirements(true);
    }
  };
  
  const handleDeleteFeature = () => {
    if (!isNew && feature) {
      const success = deleteFeature(featureId);
      if (success) {
        toast.success('Feature deleted successfully');
        // Close this specific tab using the tabId prop, not the featureId
        closeTab(tabId);
      } else {
        toast.error('Failed to delete feature');
      }
    }
  };
  
  const handleSaveNewFeature = async () => {
    if (!nameValue.trim() || !interfaceId) {
      console.warn("Save prevented: Name and Interface are required.");
      return;
    }
    
    setIsSaving(true);
    setShowSaveSuccess(false);
    
    try {
      const newFeatureData: Omit<Feature, 'id'> = {
        name: nameValue.trim(),
        description: descriptionValue,
        priority: priorityValue,
        interfaceId: interfaceId,
        showRequirements: showRequirements
      };

      const savedFeature = await addFeature(newFeatureData);

      if (savedFeature && savedFeature.id) {
        const temporaryTabId = tabId; 
        
        console.log('[FeatureTabContent] Calling updateNewTabToSavedItem with type:', 'feature');
        updateNewTabToSavedItem(temporaryTabId, savedFeature.id, savedFeature.name, 'feature');
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);

        updateInterfaceWithFeature(interfaceId, savedFeature.id); 
        
        setIsEditing(false);
        console.log('New Feature saved successfully. Tab updated.');

      } else {
         console.error('Failed to get new feature details after saving.');
      }

    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (!isNew && feature) {
        handleSaveFeature();
      }
    } else {
      // Enter edit mode - reset form values to current feature values
      if (feature) {
        setNameValue(feature.name);
        setDescriptionValue(feature.description || '');
        setPriorityValue(feature.priority);
      }
      setIsEditing(true);
    }
  };
  
  const handleCancelNewFeature = () => {
    if (isNew) {
      closeTab(featureId);
    } else {
      // Reset to feature values and exit edit mode
      if (feature) {
        setNameValue(feature.name);
        setDescriptionValue(feature.description || '');
        setPriorityValue(feature.priority);
      }
      setIsEditing(false);
    }
  };
  
  // Show "not found" for non-existent features
  if (!isNew && !feature) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Feature not found or not loaded yet.
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section with feature name and action buttons */}
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        {/* Column 1: Feature name */}
        <div className="flex items-center">
          <Puzzle className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter feature name"
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
          <Button
            size="sm"
            variant="outline"
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
            onClick={handleToggleRequirements}
          >
            <FileText className="h-4 w-4 mr-1" />
            Add Requirement
          </Button>
          
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
                onClick={handleCancelNewFeature}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={isNew ? handleSaveNewFeature : handleToggleEditMode}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || (!nameValue.trim() || (isNew && !interfaceId))}
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
      
      {/* Main content area with metadata, description, and optional requirements */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Row 1: Metadata - Priority and Interface selector */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#a0a0a0] text-sm mb-1 block">Priority</label>
            {isEditing ? (
              <Select
                value={priorityValue}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="bg-[#232326] border-[#2a2a2c] text-white">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Med">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-white">{priorityValue}</div>
            )}
          </div>
          
          {isNew && (
            <div>
              <label className="text-[#a0a0a0] text-sm mb-1 block">Interface</label>
              <Select
                value={interfaceId}
                onValueChange={handleInterfaceChange}
              >
                <SelectTrigger className="bg-[#232326] border-[#2a2a2c] text-white">
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                  {interfaces.map(interface_ => (
                    <SelectItem key={interface_.id} value={interface_.id}>
                      {interface_.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {!isNew && !isEditing && (
            <div>
              <label className="text-[#a0a0a0] text-sm mb-1 block">Interface</label>
              <div className="text-white">{selectedInterface?.name || 'None'}</div>
            </div>
          )}
        </div>
        
        {/* Row 2: Description */}
        <div>
          <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
          {isEditing ? (
            <div className="border border-[#2a2a2c] rounded-md overflow-hidden">
              <FeatureDescriptionEditor
                initialContent={descriptionValue}
                onChange={(value) => setDescriptionValue(value)}
                placeholder="Enter feature description..."
              />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none px-2 py-1 rounded-md border border-transparent min-h-[50px]">
              {isClient && feature?.description ? (
                <div 
                  className="flex-1 quill-editor-display ql-editor"
                  dangerouslySetInnerHTML={{ __html: feature.description }}
                />
              ) : (
                <div className="text-[#a0a0a0] italic">No description provided.</div>
              )}
            </div>
          )}
        </div>
        
        {/* Row 3: Requirements (optional) */}
        {shouldShowRequirements && (
          <div>
            <RequirementsPlaceholder 
              requirements={feature?.requirements}
              isEditing={isEditing}
            />
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1e1e20] border-[#2a2a2c] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Feature</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFeature}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
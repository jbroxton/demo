'use client'

import React, { useState, useEffect } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Map, Pencil, Save, X, Trash2, Check } from 'lucide-react';
import { RoadmapFeaturesTable } from './roadmap/roadmap-features-table';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface RoadmapSpecificTabContentProps {
  roadmapId: string;
  tabId: string;
  isNew?: boolean;
}

export function RoadmapSpecificTabContent({
  roadmapId,
  tabId,
  isNew = false
}: RoadmapSpecificTabContentProps) {
  // Tabs query hook
  const { updateTabTitle, closeTab, updateNewTabToSavedItem, tabs } = useTabsQuery();
  
  // State hooks
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isDefaultValue, setIsDefaultValue] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // For form validation
  const [nameError, setNameError] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // React Query hooks
  const { 
    roadmaps, 
    getRoadmapById, 
    addRoadmap, 
    updateRoadmap, 
    deleteRoadmap,
    isLoading
  } = useRoadmapsQuery();
  
  // Get roadmap data
  const roadmap = !isNew ? getRoadmapById(roadmapId) : null;
  
  // Initialize from roadmap data on component mount
  useEffect(() => {
    // Initialize values from roadmap when we have a roadmap
    if (roadmap && !isEditing) {
      setNameValue(roadmap.name || '');
      setDescriptionValue(roadmap.description || '');
      setIsDefaultValue(roadmap.is_default === 1);
    }
  }, [roadmap, isEditing, roadmapId]);
  
  // Event handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameValue(value);

    // Clear validation error if value is now valid
    if (value.trim()) {
      setNameError('');
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };
  
  const handleSaveRoadmap = async () => {
    if (!isNew && roadmap) {
      try {
        const updates: {
          name?: string;
          description?: string;
          is_default?: boolean;
        } = {};
        
        if (nameValue !== roadmap.name) {
          updates.name = nameValue;
        }
        
        if (descriptionValue !== roadmap.description) {
          updates.description = descriptionValue;
        }
        
        if (isDefaultValue !== (roadmap.is_default === 1)) {
          updates.is_default = isDefaultValue;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateRoadmap(roadmapId, updates);
          
          // Update tab title if name changed
          if (updates.name) {
            updateTabTitle(roadmapId, 'roadmap', nameValue);
          }
        }
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to save roadmap:', error);
        toast.error('Failed to save roadmap');
      }
    }
  };
  
  const handleDeleteRoadmap = async () => {
    if (!isNew && roadmap) {
      try {
        await deleteRoadmap(roadmapId);
        toast.success('Roadmap deleted successfully');
        closeTab(tabId);
      } catch (error) {
        console.error('Error deleting roadmap:', error);
        toast.error('Failed to delete roadmap');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleSaveNewRoadmap = async () => {
    // Reset validation errors
    setNameError('');

    // Validate form values
    if (!nameValue || !nameValue.trim()) {
      setNameError('Name is required');
      toast.error('Name is required');
      return;
    }

    try {
      // Prepare the data with minimal fields and explicit types
      const newRoadmapData = {
        name: nameValue.trim(),
        description: '', // Start with empty string
        is_default: false // Default value
      };

      // Only add non-empty description
      if (descriptionValue && typeof descriptionValue === 'string') {
        newRoadmapData.description = descriptionValue;
      }

      // Only add is_default if it's true
      if (isDefaultValue === true) {
        newRoadmapData.is_default = true;
      }

      // Debug logging
      console.log('Saving roadmap data:', JSON.stringify(newRoadmapData));

      try {
        // Call the API
        const savedRoadmap = await addRoadmap(newRoadmapData);
        console.log('API response:', savedRoadmap);

        if (savedRoadmap && savedRoadmap.id) {
          // Find the current tab (temporary tab)
          const currentTab = tabs.find(tab => tab.id === tabId);

          if (currentTab) {
            console.log('[RoadmapSpecificTabContent] Found current tab:', currentTab);
            updateNewTabToSavedItem(currentTab.id, savedRoadmap.id, nameValue.trim(), 'roadmap');
            console.log('New Roadmap saved successfully. Tab updated to ID:', savedRoadmap.id);

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
            setIsEditing(false);
          } else {
            console.error('Current tab not found:', tabId);
          }
        } else {
          console.error('Failed to get new roadmap details after saving.');
          toast.error('Failed to create roadmap');
        }
      } catch (error) {
        console.error('API error:', error);
        toast.error('Failed to save roadmap');
      }
    } catch (error) {
      console.error('Error in save handler:', error);
      toast.error('Failed to save roadmap');
    }
  };
  
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (!isNew && roadmap) {
        handleSaveRoadmap();
      }
    } else {
      // Enter edit mode - reset form values to current roadmap values
      if (roadmap) {
        setNameValue(roadmap.name);
        setDescriptionValue(roadmap.description || '');
        setIsDefaultValue(roadmap.is_default === 1);
      }
      setIsEditing(true);
    }
  };
  
  const handleCancelNewRoadmap = () => {
    if (isNew) {
      closeTab(tabId);
    } else {
      // Reset to roadmap values and exit edit mode
      if (roadmap) {
        setNameValue(roadmap.name);
        setDescriptionValue(roadmap.description || '');
        setIsDefaultValue(roadmap.is_default === 1);
      }
      setIsEditing(false);
    }
  };
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading roadmap...
      </div>
    );
  }
  
  // Show "not found" for non-existent roadmaps
  if (!isNew && !roadmap) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Roadmap not found or not loaded yet.
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section with roadmap name and action buttons */}
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        {/* Column 1: Roadmap name */}
        <div className="flex items-center">
          <Map className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex flex-col w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className={`text-xl font-medium text-white bg-[#232326] border-[#2a2a2c] ${nameError ? 'border-red-500' : ''}`}
                placeholder="Enter roadmap name"
              />
              {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
              {!isNew && roadmap?.is_default === 1 && (
                <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </h1>
          )}
        </div>
        
        {/* Column 2: Action buttons */}
        <div className="flex items-center justify-end space-x-2">
          {!isNew && !isEditing && (
            <>
              {!roadmap?.is_default && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                  onClick={async () => {
                    try {
                      await updateRoadmap(roadmapId, { is_default: true });
                      setIsDefaultValue(true);
                      toast.success('Set as default roadmap');
                    } catch (error) {
                      console.error('Error setting default roadmap:', error);
                      toast.error('Failed to set as default');
                    }
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Set as Default
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleToggleEditMode}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              {!roadmap?.is_default && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
          
          {(isNew || isEditing) && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleCancelNewRoadmap}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={isNew ? handleSaveNewRoadmap : handleToggleEditMode}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!nameValue.trim() || nameError !== ''}
              >
                <Save className="h-4 w-4 mr-1" />
                {isNew ? 'Create Roadmap' : 'Save'}
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
      
      {/* Main content area with description and features */}
      <div className="space-y-4 p-4 pt-0 flex flex-col flex-grow h-full overflow-auto">
        {/* Description */}
        <div className="flex-shrink-0 mb-4">
          {isEditing ? (
            <div className="space-y-2">
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              <Textarea
                value={descriptionValue}
                onChange={handleDescriptionChange}
                className="bg-[#232326] border-[#2a2a2c] text-white min-h-24"
                placeholder="Enter roadmap description"
              />
              {!isNew && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={isDefaultValue}
                    onChange={(e) => setIsDefaultValue(e.target.checked)}
                    className="rounded bg-[#232326] border-[#2a2a2c]"
                  />
                  <label htmlFor="is_default" className="text-sm">Set as default roadmap</label>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              <div className="p-3 bg-[#232326] rounded-md">
                {descriptionValue || <span className="text-[#a0a0a0]">No description</span>}
              </div>
            </div>
          )}
        </div>
        
        {/* Features - only show if not in edit mode and not a new roadmap */}
        {!isEditing && !isNew && (
          <div className="w-full flex-grow">
            <h3 className="text-lg font-medium mb-4">Features</h3>
            <RoadmapFeaturesTable roadmapId={roadmapId} />
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1e1e20] border-[#2a2a2c] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure? This cannot be undone. Features on this roadmap will no longer be associated with it.
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
              onClick={handleDeleteRoadmap}
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
import React, { useEffect, useState } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Puzzle, Save, X, Plus, FileText, Trash2, Paperclip, Calendar, ClipboardCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeatureDescriptionEditor } from './feature-description-editor';
import { FeatureRequirementsSectionQuery } from './feature-requirements-section-query';
import { StagesApprovalTable } from './stages-approval-table';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useReleasesQuery } from '@/hooks/use-releases-query';
import { useEntityApprovalsQuery } from '@/hooks/use-entity-approvals-query';

interface FeatureTabContentProps {
  featureId: string;
  tabId: string;
  isNew?: boolean;
  selectedInterfaceId?: string;
}

export function FeatureQueryTabContent({ 
  featureId, 
  tabId,
  isNew = false,
  selectedInterfaceId 
}: FeatureTabContentProps) {
  // Tabs query hook
  const { updateTabTitle, closeTab, updateNewTabToSavedItem, openTab } = useTabsQuery();
  
  // State hooks - declare ALL hooks at the top before any conditional logic
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [priorityValue, setPriorityValue] = useState<'High' | 'Med' | 'Low'>('Med');
  const [interfaceId, setInterfaceId] = useState(selectedInterfaceId || '');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  
  // React Query hooks
  const featuresQuery = useFeaturesQuery();
  const interfacesQuery = useInterfacesQuery();
  const releasesQuery = useReleasesQuery();
  
  // Approvals query - only enabled when showApprovals is true and not a new feature
  const { 
    hasApprovals,
    initializeApprovalsMutation 
  } = useEntityApprovalsQuery(
    !isNew && showApprovals ? featureId : undefined, 
    'feature'
  );
  
  // Get feature data
  const feature = !isNew ? featuresQuery.getFeatureById(featureId) : null;
  const interfaces = interfacesQuery.getInterfaces();
  const selectedInterface = interfaceId ? interfacesQuery.getInterfaceById(interfaceId) : null;
  
  // Get releases for this feature if not new
  const featureReleases = !isNew ? releasesQuery.getReleasesByFeatureId(featureId) : [];
  const hasReleases = featureReleases && featureReleases.length > 0;
  
  // Loading states
  const isLoading = featuresQuery.isLoading || interfacesQuery.isLoading || releasesQuery.isLoading;
  const isSaving = 
    featuresQuery.addFeatureMutation.isPending || 
    featuresQuery.updateFeatureNameMutation.isPending ||
    featuresQuery.updateFeatureDescriptionMutation.isPending;
  
  // Initialize from feature data on component mount
  useEffect(() => {
    setIsClient(true);
    
    // Initialize values from feature when we have a feature
    if (feature && !isEditing) { // Only update if not in edit mode
      setNameValue(feature.name || '');
      setDescriptionValue(feature.description || '');
      setPriorityValue(feature.priority || 'Med');
      setInterfaceId(feature.interfaceId || '');
      
      // Load approval tracking preference from localStorage
      if (typeof window !== 'undefined' && !isNew) {
        const showApprovalsPreference = localStorage.getItem(`feature_approvals_${featureId}`);
        if (showApprovalsPreference !== null) {
          setShowApprovals(showApprovalsPreference === 'true');
        }
      }
    }
  }, [feature, isEditing, featureId, isNew]); // Add isEditing as a dependency
  
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
  
  const handleSaveFeature = async () => {
    if (!isNew && feature) {
      try {
        if (nameValue.trim() !== feature.name) {
          await featuresQuery.updateFeatureName(featureId, nameValue);
          updateTabTitle(featureId, 'feature', nameValue);
        }
        
        if (descriptionValue !== feature.description) {
          await featuresQuery.updateFeatureDescription(featureId, descriptionValue);
        }
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to save feature:', error);
        toast.error('Failed to save feature');
      }
    }
  };
  
  const handleDeleteFeature = async () => {
    if (!isNew && feature) {
      try {
        await featuresQuery.deleteFeatureMutation.mutateAsync(featureId);
        toast.success('Feature deleted successfully');
        // Close this specific tab using the tabId prop, not the featureId
        closeTab(tabId);
      } catch (error) {
        console.error('Error deleting feature:', error);
        toast.error('Failed to delete feature');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleSaveNewFeature = async () => {
    if (!nameValue.trim() || !interfaceId) {
      console.warn("Save prevented: Name and Interface are required.");
      return;
    }
    
    try {
      const newFeatureData = {
        name: nameValue.trim(),
        description: descriptionValue,
        priority: priorityValue,
        interfaceId: interfaceId,
        showRequirements: true
      };

      const savedFeature = await featuresQuery.addFeature(newFeatureData);

      if (savedFeature && savedFeature.id) {
        const temporaryTabId = tabId; 
        
        console.log('[FeatureQueryTabContent] Calling updateNewTabToSavedItem with type:', 'feature');
        updateNewTabToSavedItem(temporaryTabId, savedFeature.id, savedFeature.name, 'feature');
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);

        interfacesQuery.updateInterfaceWithFeature(interfaceId, savedFeature.id);
        
        setIsEditing(false);
        console.log('New Feature saved successfully. Tab updated.');

      } else {
         console.error('Failed to get new feature details after saving.');
      }

    } catch (error) {
      console.error('Failed to save feature:', error);
      toast.error('Failed to save feature');
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
      closeTab(tabId);
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
  
  // Add a handler for the attach file button
  const handleAttachFile = () => {
    toast.info("File attachment feature will be implemented soon");
  };
  
  // Handler for creating a new release
  const handleCreateRelease = () => {
    if (!isNew && feature) {
      // Create a temporary ID with timestamp and feature ID
      const timestamp = Date.now();
      const temporaryItemId = `new-release-${timestamp}-${featureId}`;
      
      openTab({
        title: 'New Release',
        type: 'release',
        itemId: temporaryItemId
      });
    }
  };
  
  // Handler for opening an existing release
  const handleOpenRelease = (releaseId: string, releaseName: string) => {
    console.log('Opening release:', releaseId, releaseName);
    openTab({
      title: releaseName,
      type: 'release',
      itemId: releaseId
    });
  };
  
  const handleOpenInterface = (interfaceId: string, interfaceName: string) => {
    console.log('Opening interface:', interfaceId, interfaceName);
    openTab({
      title: interfaceName,
      type: 'interface',
      itemId: interfaceId
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Toggle approval tracking
  const handleToggleApprovals = () => {
    const newState = !showApprovals;
    setShowApprovals(newState);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined' && !isNew && featureId) {
      localStorage.setItem(`feature_approvals_${featureId}`, newState.toString());
    }
    
    // If turning on approvals, initialize them if they don't exist yet
    if (newState && featureId) {
      // Just set the state and let the table component handle initialization
      toast.loading('Enabling approval tracking...');
      // We'll let the approval table component handle the initialization
    } else if (newState) {
      toast.success('Approval tracking enabled');
    } else {
      toast.info('Approval tracking disabled');
    }
  };
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading feature...
      </div>
    );
  }
  
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
            onClick={handleAttachFile}
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Attach File
          </Button>
          
          {!isNew && !isEditing && (
            <>
              <Button
                size="sm"
                variant={showApprovals ? "default" : "outline"}
                className={showApprovals 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                }
                onClick={handleToggleApprovals}
                title={showApprovals ? "Disable approval tracking" : "Enable approval tracking"}
              >
                <ClipboardCheck className="h-4 w-4 mr-1" />
                Approvals
              </Button>
              
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
      <div className="space-y-4 p-4 pt-0 flex flex-col flex-grow h-full overflow-auto">
        {/* Row 1: Feature metadata */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="flex items-center">
            <span className="text-[#a0a0a0] mr-2">Priority:</span>
            {isEditing ? (
              <Select
                value={priorityValue}
                onValueChange={handlePriorityChange}
                disabled={isSaving}
              >
                <SelectTrigger className="w-24 h-8 bg-[#232326] border-[#2a2a2c]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Med">Med</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                priorityValue === 'High' 
                  ? 'bg-red-900/20 text-red-300' 
                  : priorityValue === 'Med' 
                    ? 'bg-yellow-900/20 text-yellow-300' 
                    : 'bg-blue-900/20 text-blue-300'
              }`}>
                {priorityValue}
              </span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex items-center">
              <span className="text-[#a0a0a0] mr-2">Interface:</span>
              <Select
                value={interfaceId}
                onValueChange={handleInterfaceChange}
                disabled={isSaving || (!isNew && !!interfaceId)}
              >
                <SelectTrigger className="w-60 h-8 bg-[#232326] border-[#2a2a2c]">
                  <SelectValue placeholder="Select Interface" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                  {interfaces.map(iface => (
                    <SelectItem key={iface.id} value={iface.id}>
                      {iface.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isNew && !!interfaceId && (
                <span className="text-xs text-[#a0a0a0] ml-2">(can't change)</span>
              )}
            </div>
          )}
          
          {!isEditing && interfaceId && selectedInterface && (
            <div className="flex items-center">
              <span className="text-[#a0a0a0] mr-2">Interface:</span>
              <span 
                className="px-2 py-1 rounded cursor-pointer hover:bg-[#232326]"
                onClick={() => handleOpenInterface(interfaceId, selectedInterface.name)}
              >
                {selectedInterface.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Row 2: Description */}
        <div className="flex-shrink-0">
          <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
          <FeatureDescriptionEditor
            initialContent={descriptionValue}
            onChange={setDescriptionValue}
            readOnly={!isEditing}
          />
        </div>
        
        {/* Row 3: Requirements - always show (moved up to just after description) */}
        <div className="w-full">
          <FeatureRequirementsSectionQuery 
            featureId={featureId}
            isNew={isNew}
          />
        </div>
        
        {/* Row 4: Approvals (if tracking is enabled and not a new feature) */}
        {!isNew && showApprovals && (
          <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[#a0a0a0] text-sm">Approvals & Status</p>
            </div>
            <StagesApprovalTable
              entityId={featureId}
              entityType="feature"
              onToggle={setShowApprovals}
              shouldInitialize={true}
            />
          </div>
        )}
        
        {/* Row 5: Releases (if not a new feature) */}
        {!isNew && (
          <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[#a0a0a0] text-sm">Releases</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                onClick={handleCreateRelease}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Release
              </Button>
            </div>
            
            {hasReleases ? (
              <div className="bg-[#232326] rounded-md p-2 space-y-1">
                {featureReleases.map(release => (
                  <div 
                    key={release.id} 
                    className="p-2 hover:bg-[#2a2a2c] rounded-md cursor-pointer flex justify-between items-center"
                    onClick={() => handleOpenRelease(release.id, release.name)}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{release.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-[#a0a0a0] mr-3">{formatDate(release.releaseDate)}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        release.priority === 'High' ? 'bg-red-500' : 
                        release.priority === 'Med' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No releases connected to this feature.</p>
            )}
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
              disabled={featuresQuery.deleteFeatureMutation.isPending}
            >
              {featuresQuery.deleteFeatureMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
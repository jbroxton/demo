import React, { useEffect, useState } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Pencil, Puzzle, Save, X, Plus, FileText, Trash2, Paperclip, Calendar, ClipboardCheck } from 'lucide-react';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedSelect, ThemedSelectItem } from '@/components/ui/themed-select';
import { ThemedButton } from '@/components/ui/themed-button';
import { FeatureDescriptionEditor } from './feature-description-editor';
import { FeatureRequirementsSectionQueryThemed } from './feature-requirements-section-query-themed';
import { ThemedStagesApprovalTable } from './themed-stages-approval-table';
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
import { useAppTheme } from '@/providers/sidenav-theme-provider';

interface FeatureTabContentProps {
  featureId: string;
  tabId: string;
  isNew?: boolean;
  selectedInterfaceId?: string;
}

export function FeatureQueryTabContentThemed({ 
  featureId, 
  tabId,
  isNew = false,
  selectedInterfaceId 
}: FeatureTabContentProps) {
  // Get theme
  const theme = useAppTheme();
  
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
        showRequirements: true,
        isSaved: false,
        savedAt: null,
        tenantId: 'org1'
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
        itemId: temporaryItemId,
        hasChanges: false
      });
    }
  };
  
  // Handler for opening an existing release
  const handleOpenRelease = (releaseId: string, releaseName: string) => {
    console.log('Opening release:', releaseId, releaseName);
    openTab({
      title: releaseName,
      type: 'release',
      itemId: releaseId,
      hasChanges: false
    });
  };
  
  const handleOpenInterface = (interfaceId: string, interfaceName: string) => {
    console.log('Opening interface:', interfaceId, interfaceName);
    openTab({
      title: interfaceName,
      type: 'interface',
      itemId: interfaceId,
      hasChanges: false
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

    // Save preference to localStorage first, BEFORE updating state
    if (typeof window !== 'undefined' && !isNew && featureId) {
      try {
        localStorage.setItem(`feature_approvals_${featureId}`, newState.toString());
        console.log(`Saved approval preference for feature ${featureId}: ${newState}`);
      } catch (e) {
        console.error('Error saving approval preference to localStorage:', e);
      }
    }

    // Update state after storage is handled
    setShowApprovals(newState);

    // Show appropriate toast message - use IDs to manage toast state
    if (newState) {
      // Use a unique ID for the toast to be able to dismiss it
      const toastId = 'approval-toggle-' + Date.now();

      // First show a loading toast
      toast.loading('Enabling stages tracking...', { id: toastId });

      // Then dismiss it and show success after a short delay
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.success('Stages tracking enabled');
      }, 1500);
    } else {
      toast.info('Stages tracking disabled');
    }
  };
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading feature...
      </div>
    );
  }
  
  // Show "not found" for non-existent features
  if (!isNew && !feature) {
    return (
      <div className="flex items-center justify-center h-full text-[#a0a0a0]">
        Feature not found or not loaded yet.
      </div>
    );
  }

  // Note: The main change here is removing the hardcoded bg-[#1e1e20] from the container
  // And using the theme's bgTertiary for inner components when needed
  
  return (
    <div className="flex flex-col h-full">
      {/* Header section with feature name and action buttons */}
      <div className="px-6 py-4 border-b border-white/[0.05] grid grid-cols-2">
        {/* Column 1: Feature name */}
        <div className="flex items-center">
          <Puzzle className="h-7 w-7 mr-3 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <ThemedInput
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                variant="large"
                placeholder="Enter feature name"
              />
            </div>
          ) : (
            <h1 className="text-3xl font-medium text-white/90">
              {nameValue}
            </h1>
          )}
        </div>
        
        {/* Column 2: Action buttons - Themed */}
        <div className={theme.actionBar + " justify-end py-0"}>
          <button
            onClick={handleAttachFile}
            className={theme.buttonSecondary}
          >
            <div className={theme.buttonIcon}>
              <Paperclip className="h-4 w-4" />
            </div>
            <span>Attach</span>
          </button>

          {!isNew && !isEditing && (
            <>
              <button
                onClick={handleToggleApprovals}
                className={theme.buttonSecondary}
                title={showApprovals ? "Disable stages tracking" : "Enable stages tracking"}
              >
                <div className={theme.buttonIcon}>
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <span>{showApprovals ? "Remove Stages" : "Add Stages"}</span>
              </button>

              <button
                onClick={handleToggleEditMode}
                className={theme.buttonSecondary}
              >
                <div className={theme.buttonIcon}>
                  <Pencil className="h-4 w-4" />
                </div>
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className={theme.buttonDanger}
              >
                <div className={theme.buttonIcon}>
                  <Trash2 className="h-4 w-4" />
                </div>
                <span>Delete</span>
              </button>
            </>
          )}

          {(isNew || isEditing) && (
            <>
              <button
                onClick={handleCancelNewFeature}
                className={theme.buttonSecondary}
              >
                <div className={theme.buttonIcon}>
                  <X className="h-4 w-4" />
                </div>
                <span>Cancel</span>
              </button>

              <button
                onClick={isNew ? handleSaveNewFeature : handleToggleEditMode}
                className={(!nameValue.trim() || (isNew && !interfaceId)) ? theme.buttonDisabled : theme.buttonPrimary}
                disabled={isSaving || (!nameValue.trim() || (isNew && !interfaceId))}
              >
                <div className={theme.buttonIcon}>
                  <Save className="h-4 w-4" />
                </div>
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
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
              <ThemedSelect
                value={priorityValue}
                onValueChange={handlePriorityChange}
                disabled={isSaving}
                width="w-24"
                placeholder="Priority"
              >
                <ThemedSelectItem value="High">High</ThemedSelectItem>
                <ThemedSelectItem value="Med">Med</ThemedSelectItem>
                <ThemedSelectItem value="Low">Low</ThemedSelectItem>
              </ThemedSelect>
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
              <ThemedSelect
                value={interfaceId}
                onValueChange={handleInterfaceChange}
                disabled={isSaving || (!isNew && !!interfaceId)}
                width="w-60"
                placeholder="Select Interface"
              >
                {interfaces.map(iface => (
                  <ThemedSelectItem key={iface.id} value={iface.id}>
                    {iface.name}
                  </ThemedSelectItem>
                ))}
              </ThemedSelect>
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
          <FeatureRequirementsSectionQueryThemed
            featureId={featureId}
            isNew={isNew}
          />
        </div>
        
        {/* Row 4: Approvals (if tracking is enabled and not a new feature) */}
        {!isNew && showApprovals && (
          <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[#a0a0a0] text-sm">Stages</p>
            </div>
            <ThemedStagesApprovalTable
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
              <p className="text-white/70 text-sm">Releases</p>
              <ThemedButton
                variant="secondary"
                onClick={handleCreateRelease}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Release
              </ThemedButton>
            </div>
            
            {hasReleases ? (
              <div className={`${theme.card} p-2 space-y-1`}>
                {featureReleases.map(release => (
                  <div
                    key={release.id}
                    className="p-2 hover:bg-[#121218] rounded-md cursor-pointer flex justify-between items-center border border-transparent hover:border-white/[0.04] transition-all duration-150 ease-in-out"
                    onClick={() => handleOpenRelease(release.id, release.name)}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-white/60" />
                      <span className="text-white/80">{release.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-white/60 mr-3">{formatDate(release.releaseDate)}</span>
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
              <div className={`${theme.card} p-4 text-white/60 text-center`}>
                No releases connected to this feature.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0F0F0F] border-white/[0.1] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Feature</DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className={theme.buttonSecondary}
            >
              <span>Cancel</span>
            </button>
            <button
              onClick={handleDeleteFeature}
              className={featuresQuery.deleteFeatureMutation.isPending ? theme.buttonDisabled : theme.buttonDanger}
              disabled={featuresQuery.deleteFeatureMutation.isPending}
            >
              <div className={theme.buttonIcon}>
                <Trash2 className="h-4 w-4" />
              </div>
              <span>{featuresQuery.deleteFeatureMutation.isPending ? 'Deleting...' : 'Delete'}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
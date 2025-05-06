import React, { useEffect, useState } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Calendar, Save, X, Trash2, ClipboardCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Feature } from '@/types/models';
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
import { useReleasesQuery } from '@/hooks/use-releases-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useEntityApprovalsQuery } from '@/hooks/use-entity-approvals-query';

interface ReleaseQueryTabContentProps {
  releaseId: string;
  tabId: string;
  isNew?: boolean;
  selectedFeatureId?: string;
}

export function ReleaseQueryTabContent({
  releaseId,
  tabId,
  isNew = false,
  selectedFeatureId
}: ReleaseQueryTabContentProps) {
  // Tabs query hook
  const { updateTabTitle, closeTab, tabs, updateNewTabToSavedItem } = useTabsQuery();
  
  // State
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [nameValue, setNameValue] = useState(isNew ? 'New Release' : '');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [featureId, setFeatureId] = useState(selectedFeatureId || '');
  const [releaseDate, setReleaseDate] = useState(isNew ? new Date().toISOString().split('T')[0] : '');
  const [priority, setPriority] = useState<'High' | 'Med' | 'Low'>('Med');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  
  // React Query hooks
  const releasesQuery = useReleasesQuery();
  const featuresQuery = useFeaturesQuery();
  
  // Approvals query - only enabled when showApprovals is true and not a new release
  const { 
    hasApprovals,
    initializeApprovalsMutation 
  } = useEntityApprovalsQuery(
    !isNew && showApprovals ? releaseId : undefined, 
    'release'
  );
  
  // Get data from React Query hooks
  const release = isNew ? null : releasesQuery.getReleaseById(releaseId);
  const features = featuresQuery.features; // Use the features property directly
  const selectedFeature = featureId ? featuresQuery.getFeatureById(featureId) : null;
  
  // Loading states
  const isLoading = releasesQuery.isLoading || featuresQuery.isLoading;
  const isSaving = 
    releasesQuery.addReleaseMutation.isPending || 
    releasesQuery.updateReleaseNameMutation.isPending || 
    releasesQuery.updateReleaseDescriptionMutation.isPending;
  
  useEffect(() => {
    setIsClient(true);
    
    if (release) {
      setNameValue(release.name);
      setDescriptionValue(release.description || '');
      setFeatureId(release.featureId);
      setReleaseDate(new Date(release.releaseDate).toISOString().split('T')[0]);
      setPriority(release.priority);
      
      // Load approval tracking preference from localStorage
      if (typeof window !== 'undefined' && !isNew) {
        const showApprovalsPreference = localStorage.getItem(`release_approvals_${releaseId}`);
        if (showApprovalsPreference !== null) {
          setShowApprovals(showApprovalsPreference === 'true');
        }
      }
    }
  }, [release, releaseId, isNew]);
  
  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading release...
      </div>
    );
  }
  
  // Release not found
  if (!isNew && !release) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Release not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };
  
  const handleFeatureChange = (value: string) => {
    setFeatureId(value);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReleaseDate(e.target.value);
  };
  
  const handlePriorityChange = (value: string) => {
    setPriority(value as 'High' | 'Med' | 'Low');
  };
  
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (!isNew && release) {
        handleSaveRelease();
      }
    } else {
      // Enter edit mode - reset form values to current release values
      if (release) {
        setNameValue(release.name);
        setDescriptionValue(release.description || '');
      }
      setIsEditing(true);
    }
  };
  
  const handleCancelEdit = () => {
    if (isNew) {
      closeTab(tabId);
    } else {
      // Reset to release values and exit edit mode
      if (release) {
        setNameValue(release.name);
        setDescriptionValue(release.description || '');
      }
      setIsEditing(false);
    }
  };
  
  const handleDeleteRelease = async () => {
    if (!isNew && release) {
      try {
        await releasesQuery.deleteRelease(releaseId);
        toast.success('Release deleted successfully');
        // Close this specific tab using the tabId prop
        closeTab(tabId);
      } catch (error) {
        console.error('Failed to delete release:', error);
        toast.error('Failed to delete release');
      }
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleSaveRelease = async () => {
    if (!nameValue.trim()) {
      return;
    }
    
    try {
      if (isNew) {
        if (!featureId) {
          return;
        }
        
        const isoDate = new Date(releaseDate).toISOString();
        const savedRelease = await releasesQuery.addRelease({
          name: nameValue.trim(),
          description: descriptionValue.trim(),
          featureId: featureId,
          releaseDate: isoDate,
          priority: priority
        });
        
        if (savedRelease && savedRelease.id) {
          // Find the current tab (temporary tab)
          const currentTab = tabs.find(tab => tab.id === tabId);
          if (currentTab) {
            updateNewTabToSavedItem(currentTab.id, savedRelease.id, nameValue.trim(), 'release');
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
          }
        }
      } else if (release) {
        // Update existing release
        if (nameValue.trim() !== release.name) {
          await releasesQuery.updateReleaseName(releaseId, nameValue);
          updateTabTitle(releaseId, 'release', nameValue);
        }
        
        if (descriptionValue.trim() !== release.description) {
          await releasesQuery.updateReleaseDescription(releaseId, descriptionValue);
        }
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save release:', error);
      toast.error('Failed to save release');
    }
  };
  
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
    if (typeof window !== 'undefined' && !isNew && releaseId) {
      localStorage.setItem(`release_approvals_${releaseId}`, newState.toString());
    }
    
    // If turning on approvals, initialize them if they don't exist yet
    if (newState && releaseId) {
      // Just set the state and let the table component handle initialization
      toast.loading('Enabling approval tracking...');
      // We'll let the approval table component handle the initialization
    } else if (newState) {
      toast.success('Approval tracking enabled');
    } else {
      toast.info('Approval tracking disabled');
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                placeholder="Enter release name"
              />
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
            </h1>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-2">
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
                disabled={releasesQuery.deleteReleaseMutation.isPending}
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
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleSaveRelease}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving || !nameValue.trim() || (isNew && !featureId)}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          
          {showSaveSuccess && (
            <div className="text-sm text-green-500 transition-opacity duration-300">
              Saved successfully!
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">Release Details (DB Version)</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              {isEditing ? (
                <Textarea
                  value={descriptionValue}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#232326] border-[#2a2a2c] text-white resize-none"
                  placeholder="Enter release description"
                  rows={4}
                />
              ) : (
                <p>{release && release.description ? release.description : "No description provided."}</p>
              )}
            </div>
            
            {/* Approvals section */}
            {!isNew && showApprovals && (
              <div>
                <p className="text-[#a0a0a0] text-sm mb-2">Approvals & Status</p>
                <StagesApprovalTable
                  entityId={releaseId}
                  entityType="release"
                  onToggle={setShowApprovals}
                  shouldInitialize={true}
                />
              </div>
            )}
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Feature</p>
              {isNew ? (
                <div className="max-w-md">
                  <Select
                    value={featureId}
                    onValueChange={handleFeatureChange}
                    disabled={features.length === 0}
                  >
                    <SelectTrigger className="bg-[#232326] border-[#2a2a2c] text-white">
                      <SelectValue placeholder="Select a feature" />
                    </SelectTrigger>
                    <SelectContent>
                      {features.map((feature: Feature) => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {features.length === 0 && (
                    <p className="text-sm text-red-400 mt-1">
                      No features available. Create a feature first.
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  {selectedFeature ? `Connected to feature: ${selectedFeature.name}` : "No feature connected"}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Release Date</p>
              {isNew ? (
                <div className="max-w-md">
                  <Input
                    type="date"
                    value={releaseDate}
                    onChange={handleDateChange}
                    className="bg-[#232326] border-[#2a2a2c] text-white"
                  />
                </div>
              ) : (
                <p>
                  {release ? formatDate(release.releaseDate) : "No release date set"}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Priority</p>
              {isNew ? (
                <div className="max-w-md">
                  <Select
                    value={priority}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger className="bg-[#232326] border-[#2a2a2c] text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>High</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Med">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Low">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>Low</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    release?.priority === 'High' ? 'bg-red-500' : 
                    release?.priority === 'Med' ? 'bg-yellow-500' : 'bg-blue-500'
                  } mr-2`}></div>
                  <span>{release?.priority}</span>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#232326] border-[#2a2a2c] text-white">
          <DialogHeader>
            <DialogTitle>Delete Release</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Are you sure you want to delete this release? This action cannot be undone.
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
              onClick={handleDeleteRelease}
              disabled={releasesQuery.deleteReleaseMutation.isPending}
            >
              {releasesQuery.deleteReleaseMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
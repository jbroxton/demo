'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Puzzle, Save, X, Plus, FileText, Trash2, Paperclip, Calendar, ClipboardCheck, ChevronRight, ChevronLeft, ChevronDown, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleEditor } from './simple-editor.jsx';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useInterfacesQuery } from '@/hooks/use-interfaces-query';
import { useReleasesQuery } from '@/hooks/use-releases-query';
import { useEntityApprovalsQuery } from '@/hooks/use-entity-approvals-query';
import { useAttachmentsQuery } from '@/hooks/use-attachments-query';
import { useDocumentQuery } from '@/hooks/use-documents-query';
import { AttachmentButton } from './attachment-button';
import { AttachmentDialog } from './attachment-dialog';
import { AttachmentList } from './attachment-list';
import { Attachment, Document } from '@/types/models';
import debounce from 'lodash/debounce';

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
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [priorityValue, setPriorityValue] = useState<'High' | 'Med' | 'Low'>('Med');
  const [interfaceId, setInterfaceId] = useState(selectedInterfaceId || '');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  // Create refs to track initial load and unsaved changes
  const isInitialLoad = useRef(true);
  const hasUnsavedChanges = useRef(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // React Query hooks
  const featuresQuery = useFeaturesQuery();
  const interfacesQuery = useInterfacesQuery();

  // Get feature data - define this BEFORE using it in useEffect
  const feature = !isNew ? featuresQuery.getFeatureById(featureId) : null;
  const interfaces = interfacesQuery.getInterfaces();

  // Document query for feature content
  const {
    document: docData,
    updateContent,
    updateTitle: updateDocTitle,
    isSavingContent,
    isSavingTitle,
    error: docError,
    createDocument,
    isCreating,
  } = useDocumentQuery(isNew ? undefined : featureId);

  // Attachments query - only enabled when not a new feature
  const {
    attachments,
    isLoading: isLoadingAttachments,
    addAttachment: addAttachmentMutation,
    removeAttachment,
    isAddingAttachment,
  } = useAttachmentsQuery(!isNew ? featureId : undefined, 'feature');

  // Loading states
  const isLoading = featuresQuery.isLoading || interfacesQuery.isLoading;
  const isSaving =
    featuresQuery.addFeatureMutation.isPending ||
    featuresQuery.updateFeatureNameMutation.isPending ||
    featuresQuery.updateFeatureDescriptionMutation.isPending;

  // Create debounced save function for document content
  const debouncedSaveContent = useCallback(
    debounce((content: string) => {
      if (!isNew && featureId && featureId !== 'new') {
        console.log('Auto-saving document content...');
        try {
          // Try to parse the content if it's a JSON string
          let jsonContent;
          try {
            jsonContent = JSON.parse(content);
          } catch (e) {
            // If parsing fails, use the raw content
            jsonContent = content;
          }

          updateContent(jsonContent)
            .then(() => {
              console.log('Auto-saved document:', new Date().toLocaleTimeString());
              hasUnsavedChanges.current = false;
            })
            .catch(error => {
              console.error('Failed to auto-save content:', error);
              if (error.message && !error.message.includes('network')) {
                toast.error('Failed to auto-save content');
              }
            });
        } catch (e) {
          console.error('Error in debouncedSaveContent:', e);
        }
      }
    }, 2000), // 2 second debounce to avoid performance issues
    [featureId, isNew, updateContent]
  );

  // Initialize from feature data on component mount
  useEffect(() => {
    setIsClient(true);

    // Initialize values from feature and document when we have them
    if (feature) {
      setNameValue(feature.name || '');
      setPriorityValue(feature.priority || 'Med');
      setInterfaceId(feature.interfaceId || '');

      // Use document content if available, otherwise fall back to feature description
      if (docData && docData.content) {
        // If we have document content, use it
        setDescriptionValue(JSON.stringify(docData.content));
      } else {
        // Otherwise fall back to feature description
        setDescriptionValue(feature.description || '');
      }
    }

    // Cleanup debounced function
    return () => {
      debouncedSaveContent.cancel();
    };
  }, [feature, featureId, isNew, docData, debouncedSaveContent]); // All dependencies now defined before useEffect

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
        // Save feature name if changed
        if (nameValue.trim() !== feature.name) {
          await featuresQuery.updateFeatureName(featureId, nameValue);
          updateTabTitle(featureId, 'feature', nameValue);
        }

        // Save document content - first trying to parse as JSON
        try {
          // Try to parse the content as JSON first
          let jsonContent;
          try {
            jsonContent = JSON.parse(descriptionValue);
          } catch (e) {
            // If parsing fails, use it as raw text
            jsonContent = descriptionValue;
          }

          // Update document content in DB
          await updateContent(jsonContent);

          // Also update document title if it's different from feature name
          if (docData && docData.title !== nameValue.trim()) {
            await updateDocTitle(nameValue.trim());
          }

          // If there is no document yet, create one
          if (!docData && descriptionValue) {
            await createDocument({
              title: nameValue.trim(),
              content: jsonContent,
              featureId: featureId,
            });
          }
        } catch (docError) {
          console.error('Failed to save document:', docError);
          // Fall back to saving description in feature
          if (descriptionValue !== feature.description) {
            await featuresQuery.updateFeatureDescription(featureId, descriptionValue);
          }
        }

        // Show success message but stay in edit mode
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);

        // Reset unsaved changes flag
        hasUnsavedChanges.current = false;
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

        console.log('New Feature saved successfully. Tab updated.');

      } else {
         console.error('Failed to get new feature details after saving.');
      }

    } catch (error) {
      console.error('Failed to save feature:', error);
      toast.error('Failed to save feature');
    }
  };

  const handleCancelNewFeature = () => {
    if (isNew) {
      closeTab(tabId);
    } else {
      // Reset to feature values but stay in edit mode
      if (feature) {
        setNameValue(feature.name);
        setDescriptionValue(feature.description || '');
        setPriorityValue(feature.priority);
      }
    }
  };

  // Handler for the attachments button
  const handleAttachments = () => {
    setIsAttachmentDialogOpen(true);
  };

  // Handler for the details drawer
  const toggleDetailsDrawer = () => {
    setIsDetailsDrawerOpen(!isDetailsDrawerOpen);
  };

  // Create adapter function for attachments to match expected signature
  const addAttachment = async (url: string, title?: string): Promise<Attachment> => {
    const result = await addAttachmentMutation({ url, title });
    return result;
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
    <div className="flex flex-col h-full bg-[#0A0A0A] relative">
      {/* Floating Notion-like header with feature name and action buttons - full width */}
      <div className="px-4 py-6 flex justify-between items-center">
        {/* Feature name */}
        <div className="flex items-center">
          <Puzzle className="h-7 w-7 mr-3 text-white/50" />
          <div className="flex items-center w-full max-w-xl">
            <Input
              value={nameValue}
              onChange={handleNameChange}
              autoFocus
              className="text-3xl font-medium text-white bg-transparent border-none focus:ring-0 focus-visible:ring-0 shadow-none px-0 placeholder:text-white/40 h-auto py-1"
              placeholder="Untitled"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/80 flex items-center gap-2 h-[2rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
            onClick={handleCancelNewFeature}
          >
            <X className="h-4 w-4 shrink-0" />
            <span>Cancel</span>
          </button>

          <button
            className="bg-[#0C0C0C] text-white/80 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/90 flex items-center gap-2 h-[2rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:opacity-50 disabled:pointer-events-none"
            onClick={isNew ? handleSaveNewFeature : handleSaveFeature}
            disabled={isSaving || (!nameValue.trim() || (isNew && !interfaceId))}
          >
            <Save className="h-4 w-4 shrink-0" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {!isNew && (
            <button
              className="bg-[#0C0C0C] text-[#F87171]/80 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-[#F87171]/90 flex items-center gap-2 h-[2rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-900/40"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {showSaveSuccess && (
        <div className="px-6 py-1 text-sm text-green-500 transition-opacity duration-300 border-b border-[#1a1a1a]">
          Saved successfully!
        </div>
      )}

      {/* Metadata header - closer to title style */}
      <div className="px-6 py-1 bg-[#0A0A0A] flex items-center">
        {/* Metadata toggle and title */}
        <button
          className="text-white/50 hover:text-white/90 transition-colors mr-2"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
        >
          {isMetadataExpanded ?
            <ChevronDown className="h-4 w-4" /> :
            <ChevronRight className="h-4 w-4" />
          }
        </button>
        <span className="text-white/50 text-xs font-medium tracking-wide">Metadata</span>
      </div>

      {/* Expandable metadata fields */}
      {isMetadataExpanded && (
        <div className="px-6 py-3 bg-[#0A0A0A] border-t border-[#1a1a1a]/10 flex flex-wrap items-center gap-4">
          {/* Priority */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-2">Priority:</span>
            <Select
              value={priorityValue}
              onValueChange={handlePriorityChange}
              disabled={isSaving}
            >
              <SelectTrigger className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/80 h-[1.75rem] w-24 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F0F] border border-white/[0.03] text-white rounded-md">
                <SelectItem value="High" className="text-red-400">High</SelectItem>
                <SelectItem value="Med" className="text-yellow-400">Med</SelectItem>
                <SelectItem value="Low" className="text-green-400">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-2">Owner:</span>
            <Select
              value={"teamMember1"}
              disabled={isSaving}
            >
              <SelectTrigger className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/80 h-[1.75rem] w-36 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20">
                <SelectValue placeholder="Select Owner" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F0F] border border-white/[0.03] text-white rounded-md">
                <SelectItem value="teamMember1">Justin Wilson</SelectItem>
                <SelectItem value="teamMember2">Sarah Chen</SelectItem>
                <SelectItem value="teamMember3">Michael Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-2">Status:</span>
            <div className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] h-[1.75rem] flex items-center gap-2">
              <div className="rounded-full h-2 w-2 bg-green-500 shrink-0"></div>
              <span>Active</span>
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-2">Updated:</span>
            <div className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] h-[1.75rem] flex items-center">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action buttons - no margin between, just use gap from parent */}
          <button
            className="bg-[#0C0C0C] text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] transition-all duration-150 hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/80 flex items-center gap-2 h-[1.75rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
            onClick={handleAttachments}
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span>Attachments ({attachments?.length || 0})</span>
          </button>

          <button
            className={`py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium border transition-all duration-150 flex items-center gap-2 h-[1.75rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
              isDetailsDrawerOpen
                ? 'bg-[#232326] text-white border-[#3b82f6]/30 shadow-[inset_0_0.5px_0_0_rgba(59,130,246,0.1)]'
                : 'bg-[#0C0C0C] text-white/70 border-white/[0.02] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)] hover:bg-[#121218] hover:border-white/[0.04] hover:text-white/80'
            }`}
            onClick={toggleDetailsDrawer}
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Details</span>
          </button>
        </div>
      )}

      {/* Main content area with editor - adjust padding based on drawer state */}
      <div className="flex-1 flex mt-6">
        <div className="flex-1 flex flex-col h-full overflow-visible transition-all duration-300">
          <div className="flex-1 flex flex-col relative">
            <SimpleEditor
              initialContent={descriptionValue}
              onChange={setDescriptionValue}
              readOnly={false}
              placeholder="Start writing about this feature..."
              className="overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1a1a1a] text-white max-w-md">
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
              className="bg-[#121212] border-[#1a1a1a] hover:bg-[#181818] text-white"
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

      {/* Attachment dialog */}
      {!isNew && (
        <AttachmentDialog
          open={isAttachmentDialogOpen}
          onOpenChange={setIsAttachmentDialogOpen}
          onAdd={addAttachment}
          isLoading={isAddingAttachment}
        />
      )}

      {/* Details Drawer - Notion style */}
      <div
        className={`fixed top-[60px] bottom-0 right-[var(--right-sidebar-width-collapsed)] max-w-[400px] bg-[#0A0A0A] border-l border-[#1a1a1a]/20 overflow-hidden transition-all duration-300 z-10 transform-gpu ${
          isDetailsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '400px', display: isDetailsDrawerOpen ? 'block' : 'none', opacity: isDetailsDrawerOpen ? 1 : 0 }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#1a1a1a]/20">
            <h3 className="text-white text-lg font-medium">Details</h3>
            <p className="text-[#a0a0a0] text-sm mt-1">
              Additional information about this feature
            </p>
          </div>
          <div className="p-4 flex-grow overflow-y-auto">
            {/* The drawer is intentionally empty as requested */}
            {/* Will be populated with additional metadata and controls later */}
            <div className="text-[#a0a0a0] text-sm">
              <p>Details drawer content will be added here.</p>
              <p className="mt-4">You can continue editing the document while this drawer is open.</p>
            </div>
          </div>
          <button 
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white"
            onClick={toggleDetailsDrawer}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
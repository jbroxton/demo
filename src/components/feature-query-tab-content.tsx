'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Puzzle, Save, X, Plus, FileText, Trash2, Paperclip, Calendar, ClipboardCheck, ChevronRight, ChevronLeft, ChevronDown, Info, MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleEditor } from './simple-editor';
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
import { useDocumentQuery, useDocumentsQuery } from '@/hooks/use-documents-query';
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
  const { updateTabTitle, closeTab, updateNewTabToSavedItem, openTab, updateTab } = useTabsQuery();

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
  // Add state to track if title is being edited to disable auto-save
  const [isTitleFocused, setIsTitleFocused] = useState(false);

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

  // Get documents for this feature using the feature ID
  const {
    documents: featureDocuments,
    updateDocument,
    isLoading: isLoadingDocuments,
    error: docsError,
    createDocument
  } = useDocumentsQuery(isNew ? undefined : featureId);  
  
  // Get the first document for this feature (there should be only one)
  const docData = featureDocuments && featureDocuments.length > 0 ? featureDocuments[0] : null;
  
  // Helper functions for document operations
  const updateContent = useCallback(
    async (content: any) => {
      if (!docData) {
        console.error('Cannot update content: No document exists yet');
        throw new Error('Document not found');
      }
      return updateDocument(docData.id, { content });
    },
    [docData, updateDocument]
  );
  
  const updateDocTitle = useCallback(
    async (title: string) => {
      if (!docData) {
        console.error('Cannot update title: No document exists yet');
        throw new Error('Document not found');
      }
      
      try {
        if (!title || title.trim() === '') {
          console.warn('Attempted to update document title with empty string, using fallback');
          title = 'Untitled';
        }
        
        console.log(`Updating document ${docData.id} title to: "${title}"`);
        return updateDocument(docData.id, { title: title.trim() });
      } catch (error) {
        console.error('Error in updateDocTitle:', error);
        throw new Error('Failed to update document title');
      }
    },
    [docData, updateDocument]
  );
  
  const isSavingContent = false; // We don't have this information from useDocumentsQuery
  const isSavingTitle = false;   // We don't have this information from useDocumentsQuery
  
  // Track document creation state
  const [isCreating, setIsCreating] = useState(false);
  
  // Create a separate debounce function just for title updates
  const debouncedTitleUpdate = useCallback(
    debounce((newTitle: string) => {
      console.log('Debounced title update:', newTitle);
      
      // Only proceed if we have a valid feature ID and not creating a new feature
      if (!isNew && featureId && featureId !== 'new') {
        // First update the tab title (UI only operation)
        updateTabTitle(featureId, 'feature', newTitle);
        
        // We no longer update the document title during typing
        // This will be handled when the feature is saved to reduce errors
        console.log('Title update in UI only - document title will be updated on save');
      }
    }, 500), // Slightly longer delay to reduce update frequency
    [featureId, isNew, updateTabTitle]
  );

  // Attachments query - only enabled when not a new feature
  const {
    attachments,
    isLoading: isLoadingAttachments,
    addAttachment: addAttachmentMutation,
    removeAttachment,
    isAddingAttachment,
  } = useAttachmentsQuery(!isNew ? featureId : undefined, 'feature');

  // Loading states
  const isLoading = featuresQuery.isLoading || interfacesQuery.isLoading || isLoadingDocuments;
  const isSaving =
    featuresQuery.addFeatureMutation.isPending ||
    featuresQuery.updateFeatureNameMutation.isPending ||
    featuresQuery.updateFeatureDescriptionMutation.isPending;

  // Create debounced save function for document content with shorter delay
  const debouncedSaveContent = useCallback(
    debounce((content: string) => {
      // Always mark that there are unsaved changes
      hasUnsavedChanges.current = true;
      
      // Check if we should save
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

          if (docData) {
            // Skip save if title input is focused
            if (isTitleFocused) {
              console.log('Auto-save skipped because title is focused');
              return;
            }
            
            // Simply update the content - no special handling needed anymore
            // with the optimistic updates in place, this won't cause refreshes
            updateContent(jsonContent)
              .then(() => {
                // We don't need to log all the autosaves anymore
                
                // Update tab title
                if (featureId) {
                  updateTabTitle(featureId, 'feature', nameValue);
                }
                
                hasUnsavedChanges.current = false;
              })
              .catch(error => {
                console.error('Failed to auto-save content:', error);
                if (error.message && !error.message.includes('network')) {
                  toast.error('Failed to auto-save content');
                }
              });
          } else {
            console.log('No document exists yet, changes will be saved when you click Save');
            hasUnsavedChanges.current = true;
          }
        } catch (e) {
          console.error('Error in debouncedSaveContent:', e);
        }
      }
    }, 1500), // Extended to 1.5 seconds to reduce autosave frequency when typing in tables
    [featureId, isNew, updateContent, docData, isTitleFocused, nameValue, updateTabTitle]
  );

  // Track if we've done the initial setup to prevent constant feature name updates
  const initialSetupDone = useRef(false);

  // Initialize from feature data on component mount
  useEffect(() => {
    setIsClient(true);

    // Initialize values from feature and document when we have them
    if (feature && !initialSetupDone.current) {
      console.log("Initial setup with feature name:", feature.name);
      setNameValue(feature.name || '');
      setPriorityValue(feature.priority || 'Med');
      setInterfaceId(feature.interfaceId || '');
      initialSetupDone.current = true;

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
  // Removed handleNameChange since we're handling it directly in the input

  const handlePriorityChange = (value: string) => {
    setPriorityValue(value as 'High' | 'Med' | 'Low');
  };

  const handleInterfaceChange = (value: string) => {
    setInterfaceId(value);
  };

  const handleSaveFeature = async () => {
    if (!isNew && feature) {
      try {
        // First update feature name in the database and tab title
        if (nameValue.trim() !== feature.name) {
          console.log('Updating feature name from', feature.name, 'to', nameValue.trim());
          await featuresQuery.updateFeatureName(featureId, nameValue);
          // Update the tab title when saving - this is the right time to sync them
          updateTabTitle(featureId, 'feature', nameValue);
        }

        // Now prepare document content for saving
        try {
          // Try to parse the content as JSON first
          let jsonContent;
          try {
            jsonContent = JSON.parse(descriptionValue);
          } catch (e) {
            // If parsing fails, use it as raw text
            jsonContent = descriptionValue;
          }

          // Check if document exists first before trying to update it
          if (docData) {
            // Document exists, batch update both title and content together
            console.log('Updating existing document:', docData.id);
            
            // Create updates object with both title and content
            const updates: Partial<Document> = { content: jsonContent };
            
            // Always sync title with feature name on save to ensure consistency
            // This will update title even if it hasn't changed, for consistency
            updates.title = nameValue.trim();
            
            console.log('Updating document with title and content:', updates);
            try {
              // Single update call with both fields to avoid race conditions
              await updateDocument(docData.id, updates);
              console.log('Document title and content updated successfully');
            } catch (updateError) {
              console.error('Error updating document:', updateError);
              toast.error('Failed to update document');
              throw updateError;
            }
          } 
          // If there is no document yet, create one
          else if (descriptionValue) {
            console.log('Creating new document for feature:', featureId);
            try {
              setIsCreating(true);
              const newDoc = await createDocument({
                title: nameValue.trim() || 'Untitled',
                content: jsonContent,
                featureId: featureId,
              });
              console.log('Successfully created document:', newDoc);
              setIsCreating(false);
            } catch (createError) {
              console.error('Failed to create document for feature:', createError);
              toast.error('Failed to create document, saving description to feature instead');
              // Fall back to direct feature description update
              await featuresQuery.updateFeatureDescription(featureId, typeof descriptionValue === 'string' ? descriptionValue : JSON.stringify(descriptionValue));
            }
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
      // Use the current name value from the input for the feature name
      // This ensures what the user typed is what gets saved
      const featureName = nameValue.trim();
      
      // Get the tenant ID from the auth context instead of hardcoding
      const newFeatureData = {
        name: featureName,
        description: descriptionValue,
        priority: priorityValue,
        interfaceId: interfaceId,
        showRequirements: true,
        isSaved: false,
        savedAt: null
        // The tenantId should be handled by the service layer using the auth context
      };

      const savedFeature = await featuresQuery.addFeature(newFeatureData);

      if (savedFeature && savedFeature.id) {
        const temporaryTabId = tabId;

        console.log('[FeatureQueryTabContent] Calling updateNewTabToSavedItem with type:', 'feature');
        // Use our local name value to ensure consistency
        updateNewTabToSavedItem(temporaryTabId, savedFeature.id, featureName, 'feature');

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
      <div className="px-4 py-1 flex justify-between items-center">
        {/* Feature name */}
        <div className="flex items-center">
          <Puzzle className="h-7 w-7 mr-3 text-white/50" />
          <div className="flex items-center w-full max-w-xl">
            <input
              type="text"
              // Use value instead of defaultValue to fully control the input
              value={nameValue}
              // Direct event handler without calling setNameValue to avoid interference
              onChange={(e) => {
                console.log("Input change:", e.target.value);
                // This is the only place we update the nameValue
                const newValue = e.target.value;
                setNameValue(newValue);
                hasUnsavedChanges.current = true;
                
                // Update the tab title and document title with a short debounce
                // The debounced function now handles both tab and document title updates
                debouncedTitleUpdate(newValue);
              }}
              autoFocus
              onFocus={() => {
                console.log("Input focused");
                setIsTitleFocused(true);
              }}
              onBlur={(e) => {
                console.log("Input blur:", e.target.value);
                setIsTitleFocused(false);
                hasUnsavedChanges.current = true;
                
                // On blur, update only the tab title for immediate visual feedback
                if (!isNew && featureId && featureId !== 'new') {
                  debouncedTitleUpdate.cancel(); // Cancel any pending debounced updates
                  
                  // Just update tab title immediately in UI
                  updateTabTitle(featureId, 'feature', e.target.value);
                  
                  // Log that we're deferring document title updates to save operation
                  console.log('Title changes will be saved when saving the feature');
                }
              }}
              className="text-3xl font-medium text-white bg-transparent border-none focus:ring-0 focus-visible:ring-0 focus:outline-none shadow-none px-0 placeholder:text-white/40 h-auto py-1 w-full"
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

      {/* Metadata header - sub-heading style */}
      <div className="ml-7 mt-1 !bg-[#0A0A0A] flex items-center">
        {/* Metadata toggle */}
        <button
          className="text-white/50 hover:text-white/90 transition-colors p-0"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
        >
          {isMetadataExpanded ?
            <ChevronDown className="h-4 w-4" /> :
            <ChevronRight className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Expandable metadata fields */}
      {isMetadataExpanded && (
        <div className="ml-7 !bg-[#0A0A0A] flex flex-wrap items-center gap-1">
          {/* Priority */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-1">Priority:</span>
            <Select
              value={priorityValue}
              onValueChange={handlePriorityChange}
              disabled={isSaving}
            >
              <SelectTrigger className="!bg-transparent text-white/70 py-0 px-1 pr-1 rounded text-xs font-medium border-0 transition-all duration-150 hover:!bg-white/10 hover:text-white/80 h-6 w-14 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3">
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
            <span className="text-white/50 text-xs mr-1">Owner:</span>
            <Select
              value={"teamMember1"}
              disabled={isSaving}
            >
              <SelectTrigger className="!bg-transparent text-white/70 py-0 px-1 pr-1 rounded text-xs font-medium border-0 transition-all duration-150 hover:!bg-white/10 hover:text-white/80 h-6 w-28 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3">
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
            <span className="text-white/50 text-xs mr-1">Status:</span>
            <div className="!bg-transparent text-white/70 py-0 px-2 rounded text-xs font-medium h-6 flex items-center gap-1">
              <div className="rounded-full h-2 w-2 bg-green-500 shrink-0"></div>
              <span>Active</span>
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-center">
            <span className="text-white/50 text-xs mr-1">Updated:</span>
            <div className="!bg-transparent text-white/70 py-0 px-2 rounded text-xs font-medium h-6 flex items-center">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Details button - three dots */}
          <button
            className={`py-0 px-0 rounded text-xs font-medium transition-all duration-150 flex items-center justify-center h-6 w-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
              isDetailsDrawerOpen
                ? '!bg-white/10 text-white'
                : '!bg-transparent text-white/70 hover:!bg-white/10 hover:text-white/80'
            }`}
            onClick={toggleDetailsDrawer}
            title="Details"
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Main content area with editor - adjust padding based on drawer state */}
      <div className="flex-1 flex mt-3">
        <div className="flex-1 flex flex-col h-full overflow-visible transition-all duration-300">
          <div className="flex-1 flex flex-col relative">
            <SimpleEditor
              initialContent={descriptionValue}
              onChange={setDescriptionValue}
              readOnly={false}
              placeholder="What are we building today? Start writing about this feature..."
              className="overflow-hidden"
              persistenceKey={`feature-${featureId}`}
              onBlur={() => {
                // Only trigger save if title is not focused
                if (!isTitleFocused && !isNew && featureId && hasUnsavedChanges.current) {
                  console.log('Editor blur - saving because title is not focused');
                  handleSaveFeature();
                } else if (isTitleFocused) {
                  console.log('Editor blur - not saving because title is focused');
                }
              }}
              saveDocument={async () => {
                // Only save if title is not focused
                if (!isTitleFocused && !isNew && featureId && hasUnsavedChanges.current) {
                  console.log('Save document - proceeding because title is not focused');
                  await handleSaveFeature();
                  return Promise.resolve();
                } else if (isTitleFocused) {
                  console.log('Save document - skipping because title is focused');
                }
                return Promise.resolve();
              }}
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
            {/* Attachments section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white text-sm font-medium">Attachments</h4>
                <button
                  className="!bg-transparent text-white/70 py-[0.4rem] px-[0.875rem] rounded-[0.25rem] text-[0.8125rem] font-medium transition-all duration-150 hover:!bg-white/10 hover:text-white/80 flex items-center gap-2 h-[1.75rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                  onClick={handleAttachments}
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  <span>Add Attachment</span>
                </button>
              </div>
              
              {/* Attachments list */}
              {attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip className="h-3 w-3 text-white/50 shrink-0" />
                        <span className="text-white/70 text-sm truncate">{attachment.title || attachment.url}</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-white/40 hover:text-red-400 transition-colors p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#a0a0a0] text-sm">No attachments yet.</p>
              )}
            </div>
            
            {/* Additional details content */}
            <div className="text-[#a0a0a0] text-sm">
              <p>Additional details content will be added here.</p>
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
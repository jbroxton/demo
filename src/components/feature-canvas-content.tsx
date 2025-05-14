"use client";

/**
 * Feature Canvas Content
 * 
 * A modernized feature view that uses a document-style canvas for editing.
 * This component integrates the document editor with feature metadata and
 * provides a Notion-like experience for working with features.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import debounce from 'lodash/debounce';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentEditorToolbar } from './document-editor-toolbar';
import { AttachmentButton } from './attachment-button';
import { AttachmentDialog } from './attachment-dialog';
import { AttachmentList } from './attachment-list';
import { toast } from 'sonner';

// Hooks and services
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';
import { useAttachmentsQuery } from '@/hooks/use-attachments-query';
import { useDocumentsQuery } from '@/hooks/use-documents-query';
import { useDocumentQuery } from '@/hooks/use-documents-query';

// Icons
import {
  Pencil,
  Save,
  X,
  Check,
  FileText,
  Trash2,
  Puzzle,
  Plus
} from 'lucide-react';

// Types
import { Attachment, Document } from '@/types/models';

// Component props
interface FeatureCanvasContentProps {
  featureId: string;
  isNew?: boolean;
  productId?: string;
}

export function FeatureCanvasContent({
  featureId,
  isNew = false,
  productId
}: FeatureCanvasContentProps) {
  // Router
  const router = useRouter();
  
  // Tabs query hook
  const { updateTabTitle, updateNewTabToSavedItem } = useTabsQuery();
  
  // State hooks
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Always start in edit mode for canvas view
  const [nameValue, setNameValue] = useState(isNew ? 'New Feature' : '');
  const [priorityValue, setPriorityValue] = useState<'High' | 'Med' | 'Low'>('Med');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  // Create refs to track initial load and unsaved changes
  const isInitialLoad = useRef(true);
  const hasUnsavedChanges = useRef(false);
  
  // Query hooks for data
  const featuresQuery = useFeaturesQuery();
  const productsQuery = useProductsQuery();
  
  // Get feature data
  const feature = !isNew ? featuresQuery.getFeatureById(featureId) : null;
  const product = productId ? productsQuery.getProductById(productId) : null;
  
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
    isUpdatingAttachment,
  } = useAttachmentsQuery(!isNew ? featureId : undefined, 'feature');
  
  // Create adapter function to match expected signature for AttachmentDialog
  const addAttachment = async (url: string, title?: string): Promise<Attachment> => {
    const result = await addAttachmentMutation({ url, title });
    if (result && !showAttachments) {
      setShowAttachments(true);
    }
    return result;
  };
  
  // Helper function to check if docData is a valid Document
  const isValidDocument = (doc: any): doc is Document => {
    return doc && typeof doc === 'object' && 'title' in doc && 'content' in doc;
  };
  
  // Set up the Tiptap editor with performance optimizations
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
        dropcursor: {
          width: 2,
          color: 'rgba(0, 0, 255, 0.5)',
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'min-w-full border-collapse border border-[#2a2a2c]',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing about this feature...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    content: isNew
      ? `
        <h1>Feature Overview</h1>
        <p>Describe the feature here. You can use formatting, tables, and other elements to structure your content.</p>
        <h2>Requirements</h2>
        <p>Add key requirements below:</p>
        <ul>
          <li>Requirement 1</li>
          <li>Requirement 2</li>
          <li>Requirement 3</li>
        </ul>
      `
      : null,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none p-4 focus:outline-none min-h-[500px]',
      },
    },
  });
  
  // Create debounced save function
  const debouncedSaveContent = useCallback(
    debounce((content: any) => {
      if (!isNew && featureId && featureId !== 'new') {
        console.log('Auto-saving document content...');
        updateContent(content)
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
      }
    }, 3000), // 3 second debounce to avoid performance issues
    [featureId, isNew, updateContent]
  );

  // Handle editor update events - auto-save on changes
  useEffect(() => {
    if (!editor || isInitialLoad.current) return;

    const handleUpdate = ({ editor }: { editor: any }) => {
      // Set flag for unsaved changes
      hasUnsavedChanges.current = true;

      // Only trigger auto-save when not creating a new feature
      if (!isNew && featureId && featureId !== 'new') {
        // Get current content as JSON
        const currentContent = editor.getJSON();
        debouncedSaveContent(currentContent);
      }
    };

    // Register the update handler
    if (editor) {
      editor.on('update', handleUpdate);
    }

    // Clean up the event listener
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.off('update', handleUpdate);
      }
    };
  }, [editor, featureId, isNew, debouncedSaveContent]);
  
  // Load document content into editor when available
  useEffect(() => {
    if (isValidDocument(docData) && editor && !editor.isDestroyed) {
      // Set title
      setNameValue(docData.title);
      
      // Set editor content only if it's different from current content
      // or on initial load to prevent cursor position reset during editing
      if (isInitialLoad.current) {
        // Set content on initial load
        editor.commands.setContent(docData.content);
        isInitialLoad.current = false;
      }
    }
  }, [docData, editor, isValidDocument]);
  
  // Initialize from feature data on component mount
  useEffect(() => {
    setIsClient(true);
    
    // Initialize values from feature when we have one
    if (feature) {
      setNameValue(feature.name || '');
      setPriorityValue(feature.priority || 'Med');
      
      // Load attachments display preference from localStorage
      if (typeof window !== 'undefined' && !isNew) {
        const showAttachmentsPreference = localStorage.getItem(`feature_attachments_${featureId}`);
        if (showAttachmentsPreference !== null) {
          setShowAttachments(showAttachmentsPreference === 'true');
        } else {
          // Only show attachments section if there are attachments
          const hasAttachments = attachments && attachments.length > 0;
          setShowAttachments(hasAttachments);
          localStorage.setItem(`feature_attachments_${featureId}`, hasAttachments.toString());
        }
      }
    }
    
    // Cleanup debounced function
    return () => {
      debouncedSaveContent.cancel();
    };
  }, [feature, featureId, isNew, attachments, debouncedSaveContent]);
  
  // Event handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handlePriorityChange = (value: string) => {
    setPriorityValue(value as 'High' | 'Med' | 'Low');
  };
  
  const handleSaveFeature = async () => {
    if (!isNew && feature && editor) {
      try {
        // Save feature name if changed
        if (nameValue.trim() !== feature.name) {
          await featuresQuery.updateFeatureName(featureId, nameValue);
          updateTabTitle(featureId, 'feature', nameValue);
        }
        
        // Save document content
        await updateContent(editor.getJSON());
        
        // Update document title if different from feature name
        if (docData && docData.title !== nameValue.trim()) {
          await updateDocTitle(nameValue.trim());
        }
        
        // Show success message
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        
        // Reset unsaved changes flag
        hasUnsavedChanges.current = false;
        
        toast.success('Feature saved successfully');
      } catch (error) {
        console.error('Failed to save feature:', error);
        toast.error('Failed to save feature');
      }
    }
  };
  
  const handleSaveNewFeature = async () => {
    if (!nameValue.trim() || !productId || !editor) {
      toast.error('Feature name and product are required');
      return;
    }
    
    try {
      // 1. Create the feature first
      const newFeatureData = {
        name: nameValue.trim(),
        priority: priorityValue,
        interfaceId: null, // In this flow, features are direct children of products
        productId: productId,
        showRequirements: true, // Always show requirements
        description: '', // Description is now in the document
      };
      
      const savedFeature = await featuresQuery.addFeature(newFeatureData);
      
      if (savedFeature && savedFeature.id) {
        // 2. Create the document with the feature content
        await createDocument({
          title: nameValue.trim(),
          content: editor.getJSON(),
          featureId: savedFeature.id,
        });
        
        // 3. Show success message
        toast.success('Feature created successfully');
        
        // 4. Redirect to the feature canvas with the new ID
        router.push(`/dashboard/products/feature-canvas?id=${savedFeature.id}&productId=${productId}`);
      } else {
        console.error('Failed to get new feature details after saving.');
        toast.error('Failed to create feature');
      }
    } catch (error) {
      console.error('Failed to save feature:', error);
      toast.error('Failed to save feature');
    }
  };
  
  // Loading state
  if ((!isClient) || (featuresQuery.isLoading && !isNew)) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading feature...
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Feature header with metadata and saving controls */}
      <div className="px-6 py-4 border-b border-[#232326] flex flex-wrap items-center gap-4">
        {/* Feature name input - always editable in canvas view */}
        <div className="flex items-center flex-grow">
          <Puzzle className="h-5 w-5 mr-2 text-muted-foreground" />
          <input
            type="text"
            value={nameValue}
            onChange={handleNameChange}
            className="text-xl font-medium text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded w-full max-w-lg"
            placeholder="Enter feature name"
          />
        </div>
        
        {/* Priority selector */}
        <div className="flex items-center">
          <span className="text-[#a0a0a0] mr-2">Priority:</span>
          <Select
            value={priorityValue}
            onValueChange={handlePriorityChange}
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
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Attachments button - only for saved features */}
          {!isNew && (
            <AttachmentButton
              count={attachments?.length || 0}
              onClick={() => setIsAttachmentDialogOpen(true)}
              variant="outline"
              size="sm"
            />
          )}
          
          {/* Save button */}
          <Button
            size="sm"
            onClick={isNew ? handleSaveNewFeature : handleSaveFeature}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={
              isCreating || 
              isSavingContent || 
              isSavingTitle || 
              !nameValue.trim()
            }
          >
            <Save className="h-4 w-4 mr-1" />
            {isCreating || isSavingContent || isSavingTitle ? 'Saving...' : 'Save'}
          </Button>
        </div>
        
        {/* Save confirmation */}
        {showSaveSuccess && (
          <div className="ml-2 text-sm text-green-500 transition-opacity duration-300 flex items-center">
            <Check className="h-4 w-4 mr-1" />
            Saved
          </div>
        )}
      </div>
      
      {/* Main content area with document editor */}
      <div className="flex-grow overflow-auto">
        <div className="max-w-4xl mx-auto my-4">
          {/* Document editor */}
          <div className="bg-[#1e1e20] border border-[#2a2a2c] rounded-md mb-4">
            {/* Editor toolbar */}
            {editor && <DocumentEditorToolbar editor={editor} />}
            
            {/* Editor content */}
            <div className="border-t border-[#2a2a2c]">
              <EditorContent editor={editor} />
            </div>
          </div>
          
          {/* Attachments section - only for saved features */}
          {!isNew && (
            <div className="bg-[#232326] rounded-md p-4 mb-4">
              <AttachmentList
                attachments={attachments || []}
                onRemove={removeAttachment}
                onAdd={addAttachment}
                isLoading={isLoadingAttachments}
                isAddingAttachment={isAddingAttachment}
                showAddButton={true}
                emptyState={
                  <div className="text-center py-4">
                    <p className="text-[#a0a0a0] mb-2">
                      Add attachments to this feature like design files, links, or documents.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAttachmentDialogOpen(true)}
                      className="bg-[#1e1e20] border-[#2a2a2c]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Attachment
                    </Button>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Attachment dialog */}
      {!isNew && (
        <AttachmentDialog
          open={isAttachmentDialogOpen}
          onOpenChange={setIsAttachmentDialogOpen}
          onAdd={addAttachment}
          isLoading={isAddingAttachment}
        />
      )}
    </div>
  );
}
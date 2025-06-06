import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Markdown } from 'tiptap-markdown';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantSettings } from '@/hooks/use-tenant-settings';
import { useTabsQuery } from '@/hooks/use-tabs-query';

interface SettingsDocumentEditorProps {
  tabId: string;
}

export function SettingsDocumentEditor({ tabId }: SettingsDocumentEditorProps) {
  const { 
    getEffectiveSpeqqInstructions,
    updateSpeqq,
    updateSpeqqOptimistic,
    autoSave,
    isLoading,
    isUpdating,
    isAutoSaving,
    settingsExists 
  } = useTenantSettings();

  const { updateTab } = useTabsQuery();
  
  // Local state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');

  // Create a separate editor for just the Speqq content
  const speqqEditor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: 'Start writing your company context...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const content = editor.getText();
      handleSpeqqContentChange(content);
    },
    editorProps: {
      attributes: {
        class: 'speqq-document-editor',
      },
    },
  });

  // Create the TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'readonly-heading',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your settings...',
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'section-divider',
        },
      }),
    ],
    content: '', // Will be set after we load the content
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      handleContentChange(content);
    },
    editorProps: {
      attributes: {
        class: 'settings-form-editor focus:outline-none px-6 pt-2 pb-6 min-h-[500px]',
      },
      handleKeyDown: (view, event) => {
        // Get the current selection
        const { from, to } = view.state.selection;
        const node = view.state.doc.nodeAt(from);
        
        // Check if we're in a heading node
        if (node && (node.type.name === 'heading')) {
          // Prevent any editing of headings
          event.preventDefault();
          return true;
        }
        
        // Check if selection spans a heading
        view.state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === 'heading') {
            event.preventDefault();
            return false; // Stop iteration
          }
        });
        
        return false;
      },
      handleClick: (view, pos, event) => {
        const node = view.state.doc.nodeAt(pos);
        if (node && node.type.name === 'heading') {
          // Prevent clicking into headings
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
  });

  // Build the initial settings document structure
  const buildSettingsDocument = useMemo(() => {
    return (speqqContent: string) => `
      <div class="form-section">
        <h2 class="section-heading">Integration Settings</h2>
        <div class="form-field">
          <label class="field-label">API Keys</label>
          <div class="field-textarea" contenteditable="true" data-placeholder="SLACK_WEBHOOK=https://hooks.slack.com/...">SLACK_WEBHOOK=https://hooks.slack.com/...
ANALYTICS_ID=GA-123456789
CUSTOM_PROMPT=You are an expert...</div>
        </div>
      </div>
    `;
  }, []);

  // Extract Speqq content from the document
  const extractSpeqqContent = useCallback((htmlContent: string) => {
    // Find the content within the speqq-content div
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const speqqDiv = doc.querySelector('.speqq-content');
    
    if (speqqDiv) {
      // Convert HTML back to markdown-like text
      return speqqDiv.textContent || (speqqDiv as HTMLElement).innerText || '';
    }
    
    return '';
  }, []);

  // Track if we've initialized to prevent re-initialization
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editor && speqqEditor && !isLoading && !isInitialized) {
      const effectiveInstructions = getEffectiveSpeqqInstructions();
      
      // Set main settings document content
      const documentContent = buildSettingsDocument('');
      editor.commands.setContent(documentContent);
      
      // Set Speqq editor content separately
      speqqEditor.commands.setContent(effectiveInstructions);
      
      setLastSavedContent(effectiveInstructions);
      setIsInitialized(true);
    }
  }, [editor, speqqEditor, isLoading, isInitialized, getEffectiveSpeqqInstructions, buildSettingsDocument]);

  // Note: Removed manual DOM mounting - using EditorContent component instead

  // Handle Speqq content changes specifically
  const handleSpeqqContentChange = useCallback((newContent: string) => {
    if (!speqqEditor) return;
    
    // Update optimistically for immediate UI feedback
    updateSpeqqOptimistic(newContent);
    
    // Track changes
    const hasChanges = newContent !== lastSavedContent;
    setHasUnsavedChanges(hasChanges);
    
    // Update tab state immediately
    updateTab(tabId, { hasChanges });
  }, [speqqEditor, lastSavedContent, updateSpeqqOptimistic, updateTab, tabId]);

  // Manual save only - no auto-save for Settings

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (!editor) return;
    
    // Extract Speqq content for optimistic updates
    const speqqContent = extractSpeqqContent(newContent);
    updateSpeqqOptimistic(speqqContent);
    
    // Track changes
    const hasChanges = newContent !== lastSavedContent;
    setHasUnsavedChanges(hasChanges);
    
    // Update tab state immediately
    updateTab(tabId, { hasChanges });
  }, [editor, lastSavedContent, extractSpeqqContent, updateSpeqqOptimistic, updateTab, tabId]);

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges || !speqqEditor) return;

    try {
      const currentContent = speqqEditor.getText();
      
      await updateSpeqq(currentContent);
      setLastSavedContent(currentContent);
      setHasUnsavedChanges(false);
      await updateTab(tabId, { hasChanges: false });
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  }, [speqqEditor, hasUnsavedChanges, updateSpeqq, updateTab, tabId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[#a0a0a0]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a1a1c] bg-[#0A0A0A]">
        <div className="px-6 py-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="h-6 w-6 text-[#a0a0a0] flex-shrink-0" />
              <h1 className="settings-title-text">Settings</h1>
            </div>
          
            <div className="ml-auto flex items-center gap-2 text-sm text-[#a0a0a0]">
              {isUpdating && (
                <span className="text-blue-400">Saving...</span>
              )}
              {hasUnsavedChanges && !isUpdating && (
                <span className="text-yellow-400">Unsaved changes</span>
              )}
              {!hasUnsavedChanges && !isUpdating && settingsExists && (
                <span className="text-green-400">Saved</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isUpdating}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Speqq Editor Section */}
        <div className="flex-1 p-6 bg-[#0A0A0A]">
          <div className="form-section">
            <h2 className="speqq-section-heading">
              Speqq.md
            </h2>
            <div className="text-sm text-[#a0a0a0] mb-4 italic">
              Define your company and product context to help Speqq provide personalized guidance. This gets combined with Speqq&apos;s base instructions and sent to the AI.
            </div>
            
            <div className="speqq-document-container">
              <EditorContent 
                editor={speqqEditor} 
                className="speqq-document-editor"
              />
            </div>
          </div>
        </div>

        <style jsx global>{`
          .settings-title-text {
            font-size: 2.25rem;
            font-weight: bold;
            color: white;
            background-color: transparent;
            border: none;
            outline: none;
            padding: 0;
            margin: 0 0 0.5rem 0;
          }

          .settings-form-editor {
            color: #ffffff;
            background: #0A0A0A;
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          .settings-title {
            font-size: 1.875rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 2rem 0;
            border-bottom: 1px solid #2A2A2A;
            padding-bottom: 1rem;
          }
          
          .form-section {
            margin-bottom: 2.5rem;
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
          }
          
          .section-heading {
            font-size: 1.25rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #333333;
            user-select: none;
            pointer-events: none;
          }

          .speqq-section-heading {
            font-size: 1.25rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 1.5rem 0;
            padding: 0;
            border: none;
          }
          
          .form-field {
            margin-bottom: 1.25rem;
          }
          
          .field-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #a0a0a0;
            margin-bottom: 0.5rem;
            user-select: none;
            pointer-events: none;
            -webkit-user-modify: read-only;
            -moz-user-modify: read-only;
            user-modify: read-only;
          }
          
          .field-input {
            width: 100%;
            padding: 0.75rem;
            background: #1A1A1A;
            border: 1px solid #404040;
            border-radius: 6px;
            color: #ffffff;
            font-size: 0.875rem;
            transition: border-color 0.2s, background-color 0.2s;
          }
          
          .field-input:hover {
            border-color: #505050;
            background: #2A2A2A;
          }
          
          .field-input:focus {
            outline: none;
            border-color: #0ea5e9;
            background: #2A2A2A;
          }
          
          .field-input[data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #666666;
            font-style: italic;
          }
          
          .field-textarea {
            width: 100%;
            min-height: 6rem;
            padding: 0.75rem;
            background: #1A1A1A;
            border: 1px solid #404040;
            border-radius: 6px;
            color: #ffffff;
            font-size: 0.875rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            transition: border-color 0.2s, background-color 0.2s;
            white-space: pre-wrap;
          }
          
          .field-textarea:hover {
            border-color: #505050;
            background: #2A2A2A;
          }
          
          .field-textarea:focus {
            outline: none;
            border-color: #0ea5e9;
            background: #2A2A2A;
          }
          
          .checkbox-field {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            color: #ffffff;
            cursor: pointer;
            user-select: none;
          }
          
          .checkbox-field input[type="checkbox"] {
            margin-right: 0.5rem;
            width: 1rem;
            height: 1rem;
            accent-color: #0ea5e9;
          }
          
          .form-description {
            font-size: 0.875rem;
            color: #a0a0a0;
            margin-bottom: 1rem;
            font-style: italic;
            user-select: none;
            pointer-events: none;
            -webkit-user-modify: read-only;
            -moz-user-modify: read-only;
            user-modify: read-only;
          }
          
          .speqq-document-container {
            background: transparent;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 0;
            min-height: 400px;
            overflow: hidden;
          }
          
          .speqq-document-editor {
            background: transparent;
            color: #ffffff;
            min-height: 400px;
          }
          
          .speqq-document-editor .ProseMirror {
            padding: 1.5rem;
            outline: none;
            min-height: 380px;
            color: #ffffff;
            background: transparent;
            line-height: 1.6;
          }
          
          .speqq-document-editor .ProseMirror h1,
          .speqq-document-editor .ProseMirror h2,
          .speqq-document-editor .ProseMirror h3 {
            color: #ffffff;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          
          .speqq-document-editor .ProseMirror h1:first-child,
          .speqq-document-editor .ProseMirror h2:first-child,
          .speqq-document-editor .ProseMirror h3:first-child {
            margin-top: 0;
          }
          
          .speqq-document-editor .ProseMirror h1 {
            font-size: 1.5rem;
          }
          
          .speqq-document-editor .ProseMirror h2 {
            font-size: 1.25rem;
          }
          
          .speqq-document-editor .ProseMirror h3 {
            font-size: 1.125rem;
          }
          
          .speqq-document-editor .ProseMirror p {
            margin: 0.75rem 0;
            color: #e0e0e0;
          }
          
          .speqq-document-editor .ProseMirror strong {
            color: #ffffff;
            font-weight: 600;
          }
          
          .speqq-document-editor .ProseMirror ul,
          .speqq-document-editor .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
          
          .speqq-document-editor .ProseMirror li {
            margin: 0.25rem 0;
            color: #e0e0e0;
          }
          
          /* Section dividers */
          .section-divider, hr.section-divider {
            border: none;
            height: 1px;
            background: #2A2A2A;
            margin: 2rem 0;
            user-select: none;
            pointer-events: none;
            -webkit-user-modify: read-only;
            -moz-user-modify: read-only;
            user-modify: read-only;
          }

          /* Make headings non-editable */
          .settings-title,
          .section-heading,
          .readonly-heading {
            -webkit-user-modify: read-only !important;
            -moz-user-modify: read-only !important;
            user-modify: read-only !important;
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            contenteditable: false !important;
          }
          
          .settings-form-editor .ProseMirror h1,
          .settings-form-editor .ProseMirror h2 {
            font-size: 1.25rem !important;
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            cursor: default !important;
          }
          
          .settings-form-editor .ProseMirror h1::before,
          .settings-form-editor .ProseMirror h2::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            user-select: none;
          }
        `}</style>
        
        <div className="h-full bg-[#0A0A0A]">
          <Card className="h-full bg-[#0A0A0A] border-none">
            <CardContent className="h-full p-0 bg-[#0A0A0A]">
              <div className="h-full overflow-hidden bg-[#0A0A0A]">
                <div className="h-full overflow-y-auto bg-[#0A0A0A]">
                  <EditorContent 
                    editor={editor} 
                    className="h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
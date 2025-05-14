"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { DocumentEditorToolbar } from './document-editor-toolbar';
import { useAppTheme } from '@/providers/sidenav-theme-provider';
import debounce from 'lodash/debounce';

interface FeatureDescriptionEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function FeatureDescriptionEditor({
  initialContent,
  onChange,
  placeholder = 'Enter feature description...',
  readOnly = false
}: FeatureDescriptionEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const initialJsonContent = useRef<any>(null);
  const initialStringContent = useRef(initialContent);
  const hasInitializedEditor = useRef(false);
  const appTheme = useAppTheme();

  // Try to parse the initial HTML content to JSON, or create a default structure
  useEffect(() => {
    if (initialContent && !hasInitializedEditor.current) {
      try {
        // Check if the content is already JSON
        if (typeof initialContent === 'string' && (
            initialContent.startsWith('{') || initialContent.startsWith('[')
        )) {
          try {
            // Try to parse if it's a JSON string
            initialJsonContent.current = JSON.parse(initialContent);
          } catch (e) {
            // If it fails, it's probably HTML content
            initialJsonContent.current = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: initialContent
                    }
                  ]
                }
              ]
            };
          }
        } else {
          // It's HTML, create a default document structure with the HTML content
          initialJsonContent.current = {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: initialContent
                  }
                ]
              }
            ]
          };
        }
      } catch (e) {
        console.error('Error parsing initial content:', e);
        // Fallback to empty content
        initialJsonContent.current = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: []
            }
          ]
        };
      }
      hasInitializedEditor.current = true;
    }
  }, [initialContent]);

  // Set up the TipTap editor
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
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    content: initialJsonContent.current || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none p-6 focus:outline-none min-h-full h-full',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const jsonString = JSON.stringify(json);
      if (jsonString !== initialStringContent.current) {
        onChange(jsonString);
      }
    },
    editable: !readOnly,
  });

  // Initialize client side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load new content into editor when initialContent changes
  useEffect(() => {
    if (editor && !editor.isDestroyed && initialContent !== initialStringContent.current) {
      try {
        // Try to parse if it's a JSON string, otherwise use as is
        let content;
        try {
          if (typeof initialContent === 'string' && (
              initialContent.startsWith('{') || initialContent.startsWith('[')
          )) {
            content = JSON.parse(initialContent);
          } else {
            // Handle HTML content by creating a paragraph
            content = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: initialContent
                    }
                  ]
                }
              ]
            };
          }
        } catch (e) {
          console.error('Error parsing content update:', e);
          content = initialContent;
        }

        // Set the content in the editor
        editor.commands.setContent(content);
        initialStringContent.current = initialContent;
      } catch (e) {
        console.error('Error updating editor content:', e);
      }
    }
  }, [editor, initialContent]);

  // Show loading state on server or while initializing
  if (!isClient || !editor) {
    return (
      <div className={`${appTheme.editor} p-4`}>
        <div className="text-white/60">Loading editor...</div>
      </div>
    );
  }

  // Render the editor in read-only mode
  if (readOnly) {
    return (
      <div className={`tiptap-editor-read-only ${appTheme.editor} border-0 h-full`}>
        <EditorContent editor={editor} className="h-full" />
      </div>
    );
  }

  // Render the editable editor with floating toolbar
  return (
    <div className="flex flex-col h-full w-full overflow-visible">
      <DocumentEditorToolbar editor={editor} />
      <div className="flex-1 flex flex-col relative">
        <div className="tiptap-wrapper flex-1 flex flex-col relative overflow-hidden rounded-[12px]">
          <EditorContent
            editor={editor}
            className="flex-1 h-full overflow-auto bg-[#0A0A0A]"
          />
        </div>
      </div>
    </div>
  );
}
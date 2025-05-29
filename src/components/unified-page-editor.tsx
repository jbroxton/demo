"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';
import '@/styles/code-highlight.css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import debounce from 'lodash/debounce';

// Create a lowlight instance with common languages
const lowlight = createLowlight(common);

// Register additional languages
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sh', bash);

// Lucide React Icons for UI actions
import {
  Save,
  Trash2,
  Plus,
  CircleDot,
  FileText,
  Calendar,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Undo,
  Redo,
  Code,
  FileCode,
  Quote,
  Table as TableIcon,
  RowsIcon,
  ColumnsIcon,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  Combine,
  Split,
  Grid
} from 'lucide-react';

import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type { PageType } from '@/types/models/Page';
import { getPageTypeIcon } from '@/utils/page-icons';
import { useTabsQuery } from '@/hooks/use-tabs-query';

interface UnifiedPageEditorProps {
  pageId?: string;
  pageType: PageType;
  initialTitle?: string;
  initialContent?: any;
  initialProperties?: Record<string, any>;
  onChange?: (content: string) => void;
  onSave?: () => Promise<void>;
  onDelete?: () => void;
  className?: string;
  persistenceKey?: string;
}

/**
 * Unified Page Editor - Single TipTap instance for entire page
 * Architecture: Everything is the editor - title, metadata, and content flow as one document
 * Philosophy: Notion meets VSCode for Product Managers
 */
export function UnifiedPageEditor({
  pageId,
  pageType,
  initialTitle = 'Untitled',
  initialContent = '',
  initialProperties = {},
  onChange,
  onSave,
  onDelete,
  className = '',
  persistenceKey
}: UnifiedPageEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(initialTitle);
  
  // Get tabs query for title synchronization
  const { updateTabTitle } = useTabsQuery();
  
  // Track editor state
  const hasInitialized = useRef(false);
  const isApplyingTransaction = useRef(false);
  const lastContent = useRef<string>('');

  // Get page type icon
  const PageIcon = getPageTypeIcon(pageType);

  // Process initial content into unified document structure
  const createUnifiedDocument = useCallback(() => {
    return {
      type: 'doc',
      content: [
        // Start with content directly - title is handled in the header
        ...(initialContent?.content || [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Start writing your content here...'
              }
            ]
          }
        ])
      ]
    };
  }, [initialContent]);

  // Create debounced onChange to track unsaved changes
  const debouncedOnChange = useRef(
    debounce((content: string) => {
      setHasUnsavedChanges(true);
      if (onChange) {
        onChange(content);
      }
    }, 500)
  ).current;

  // Editor instance with unified document structure
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        blockquote: {},
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
      }),
      Typography,
      UnderlineExtension,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'rounded-md bg-[#1a1a1c] p-4 my-2 font-mono text-sm overflow-auto',
          spellcheck: 'false',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2 list-none',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-700',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border-b-2 border-gray-600 bg-gray-800 text-left p-2 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-700 p-2',
        },
      }),
      Placeholder.configure({
        placeholder: 'What are we building today?',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: createUnifiedDocument(),
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none min-h-full unified-page-editor text-left',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isApplyingTransaction.current) {
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        
        lastContent.current = jsonString;
        debouncedOnChange(jsonString);
        
        // Save to localStorage for recovery
        if (persistenceKey && window.localStorage) {
          localStorage.setItem(`unified-page-${persistenceKey}`, jsonString);
        }
      }
    },
    onTransaction: ({ transaction }) => {
      if (transaction.getMeta('isExternalContentUpdate')) {
        isApplyingTransaction.current = true;
        setTimeout(() => {
          isApplyingTransaction.current = false;
        }, 0);
      }
    },
    editable: true,
  });

  // Set client side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update header title when initialTitle changes
  useEffect(() => {
    setHeaderTitle(initialTitle);
  }, [initialTitle]);

  // Handle save action
  const handleSave = async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this page?')) {
      onDelete();
    }
  };

  // Handle title change with debouncing
  const debouncedTitleUpdate = useCallback(
    debounce((newTitle: string) => {
      if (pageId) {
        // Update tab title immediately for UI responsiveness
        updateTabTitle(pageId, 'page', newTitle);
        
        // Mark as having unsaved changes
        setHasUnsavedChanges(true);
      }
    }, 300),
    [pageId, updateTabTitle]
  );

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setHeaderTitle(newTitle);
    debouncedTitleUpdate(newTitle);
  };

  // Add new block
  const addBlock = () => {
    if (!editor) return;
    
    // Insert a new paragraph at the end
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, {
      type: 'paragraph',
      content: []
    }).run();
  };

  // Helper functions for editor interactions
  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addCodeBlock = () => {
    if (!editor) return;

    // Toggle code block first
    editor.chain().focus().toggleCodeBlock().run();

    // If a code block was created (not toggled off), prompt for language
    if (editor.isActive('codeBlock')) {
      const availableLanguages = [
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'HTML', value: 'html' },
        { name: 'CSS', value: 'css' },
        { name: 'Python', value: 'python' },
        { name: 'JSON', value: 'json' },
        { name: 'Bash/Shell', value: 'bash' },
      ];

      // Create language options for the user
      const options = availableLanguages
        .map((lang, i) => `${i + 1}. ${lang.name}`)
        .join('\n');

      const selection = window.prompt(
        `Select a language by number:\n${options}\n\nOr type a language name directly:`,
        '1'
      );

      if (selection) {
        let language;

        // Check if user selected by number
        const numSelection = parseInt(selection, 10);
        if (!isNaN(numSelection) && numSelection > 0 && numSelection <= availableLanguages.length) {
          language = availableLanguages[numSelection - 1].value;
        } else {
          // User typed a language name directly
          language = selection.toLowerCase();
        }

        editor.chain().focus().updateAttributes('codeBlock', { language }).run();
      }
    }
  };

  // Table operations helper
  const tableOperations = {
    // Add a row above current position
    addRowBefore: () => {
      if (!editor) return;
      editor.chain().focus().addRowBefore().run();
    },
    
    // Add a row below current position
    addRowAfter: () => {
      if (!editor) return;
      editor.chain().focus().addRowAfter().run();
    },
    
    // Add a column to the left of current position
    addColumnBefore: () => {
      if (!editor) return;
      editor.chain().focus().addColumnBefore().run();
    },
    
    // Add a column to the right of current position
    addColumnAfter: () => {
      if (!editor) return;
      editor.chain().focus().addColumnAfter().run();
    },
    
    // Delete current row
    deleteRow: () => {
      if (!editor) return;
      editor.chain().focus().deleteRow().run();
    },
    
    // Delete current column
    deleteColumn: () => {
      if (!editor) return;
      editor.chain().focus().deleteColumn().run();
    },
    
    // Delete entire table
    deleteTable: () => {
      if (!editor) return;
      editor.chain().focus().deleteTable().run();
    },
    
    // Toggle header row
    toggleHeaderRow: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderRow().run();
    },
    
    // Toggle header column
    toggleHeaderColumn: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderColumn().run();
    },
    
    // Toggle header cell
    toggleHeaderCell: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderCell().run();
    },
    
    // Merge cells
    mergeCells: () => {
      if (!editor) return;
      editor.chain().focus().mergeCells().run();
    },
    
    // Split cells
    splitCell: () => {
      if (!editor) return;
      editor.chain().focus().splitCell().run();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // Loading state
  if (!isClient || !editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0A0A0A] rounded-lg">
        <div className="text-white/60">Loading editor...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full w-full bg-[#0A0A0A] ${className}`}>
        {/* Everything is in the Editor - No external header */}
        
        {/* Header Section: Title + Action Bar */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 mr-[350px]">
          {/* Page Title and Type */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <PageIcon className="w-6 h-6 text-white/70 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={headerTitle || 'Untitled'}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full min-w-0"
                placeholder="Untitled"
              />
              <span className="text-sm text-white/70 capitalize">{pageType}</span>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-orange-400 text-xs flex items-center gap-1 mr-2">
                <CircleDot className="w-3 h-3" />
                Unsaved
              </span>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isSaving ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={addBlock}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4" />
              Add Block
            </Button>
            
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
        

        {/* Main Content Area: Toolbar + Editor */}
        <div className="flex-1 flex flex-col h-full">
          {/* Toolbar */}
          <div className="px-6 py-3">
            <div className="flex flex-wrap items-center gap-1">
                    {/* Text Formatting */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-200 ${editor?.isActive('bold') ? 'bg-black/60 text-white border border-white/30' : 'text-white/60 hover:text-white/80 hover:bg-black/20'}`}
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bold</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-200 ${editor?.isActive('italic') ? 'bg-black/60 text-white border border-white/30' : 'text-white/60 hover:text-white/80 hover:bg-black/20'}`}
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italic</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('underline') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                          >
                            <UnderlineIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Underline</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('strike') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleStrike().run()}
                          >
                            <Strikethrough className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Strikethrough</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('code') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleCode().run()}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Inline Code</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 1 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          >
                            <Heading1 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 1</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 2 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          >
                            <Heading2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 2</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 3 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          >
                            <Heading3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 3</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Lists and Blockquote */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('bulletList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bullet List</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('orderedList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ordered List</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('taskList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleTaskList().run()}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Task List</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('blockquote') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                          >
                            <Quote className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Blockquote</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Media, Links, Tables, and Code */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={addImage}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Image</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('link') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={addLink}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Link</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('table') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => {
                              // Insert a table with 3 rows and 3 columns
                              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                            }}
                          >
                            <TableIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Table</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('codeBlock') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={addCodeBlock}
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Code Block</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* History */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={() => editor?.chain().focus().undo().run()}
                            disabled={!editor?.can().undo()}
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={() => editor?.chain().focus().redo().run()}
                            disabled={!editor?.can().redo()}
                          >
                            <Redo className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                      </Tooltip>
                    </div>
            </div>
          </div>
          
          {/* Editor Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <EditorContent
                editor={editor}
                className="unified-page-content min-h-full"
              />
            </div>
          </div>
        </div>

      {/* Enhanced bubble menu that appears when text is selected */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        shouldShow={({ editor, view, state, from, to }) => {
          // Only show the text formatting menu when text is selected and not in a table
          return from !== to && !editor.isActive('table')
        }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex"
      >
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('bold') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('italic') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('underline') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('strike') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('code') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('link') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </BubbleMenu>
      
      {/* Special bubble menu for tables */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        shouldShow={({ editor }) => editor.isActive('table')}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] p-2"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/70 text-xs">Table Controls</span>
          </div>
          
          {/* Row operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addRowBefore}
                >
                  <ChevronsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row Before</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addRowAfter}
                >
                  <ChevronsDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row After</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.deleteRow}
                >
                  <RowsIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Row</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Column operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addColumnBefore}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column Before</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addColumnAfter}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column After</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.deleteColumn}
                >
                  <ColumnsIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Column</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Cell operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.toggleHeaderCell}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Header Cell</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.mergeCells}
                >
                  <Combine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Merge Cells</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.splitCell}
                >
                  <Split className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Split Cell</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Table operations */}
          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-[#323232]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-red-900/20 text-red-400/70 hover:text-red-400 h-8 w-8 p-0"
                  onClick={tableOperations.deleteTable}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Table</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </BubbleMenu>

      {/* Horizontal floating menu that appears on empty lines */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex flex-row py-1 px-1"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 1</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 2</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Blockquote</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => {
                // Insert a table with 3 rows and 3 columns
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Table</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={addCodeBlock}
            >
              <FileCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>
      </FloatingMenu>

      {/* Custom styles for unified editor */}
      <style jsx global>{`
        .unified-page-editor {
          line-height: 1.6;
          text-align: left;
        }
        
        .unified-page-editor h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
          border: none;
          outline: none;
          text-align: left;
          margin-left: 0;
          padding-left: 0;
        }
        
        .unified-page-editor h1:first-child {
          /* Keep the title visible in the editor */
          margin-top: 0;
          padding-top: 0;
          text-align: left;
        }
        
        .unified-page-content {
          text-align: left;
          color: white;
        }
        
        /* Clean editor layout - force left alignment */
        .unified-page-content {
          text-align: left !important;
        }
        
        .unified-page-content .ProseMirror {
          outline: none;
          min-height: 400px;
          text-align: left !important;
          max-width: none !important;
        }
        
        /* Override prose centering and all text alignment */
        .unified-page-content.prose {
          max-width: none !important;
          text-align: left !important;
        }
        
        .unified-page-content .ProseMirror p,
        .unified-page-content .ProseMirror h1,
        .unified-page-content .ProseMirror h2,
        .unified-page-content .ProseMirror h3,
        .unified-page-content .ProseMirror h4,
        .unified-page-content .ProseMirror h5,
        .unified-page-content .ProseMirror h6,
        .unified-page-content .ProseMirror div,
        .unified-page-content .ProseMirror ul,
        .unified-page-content .ProseMirror ol,
        .unified-page-content .ProseMirror li {
          text-align: left !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        
        .unified-page-content p {
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .unified-page-content h2,
        .unified-page-content h3 {
          color: white;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .is-editor-empty:first-child::before {
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      </div>
    </TooltipProvider>
  );
}
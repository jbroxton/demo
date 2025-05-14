"use client";

import React, { useCallback, useEffect, useState } from 'react';
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

// Lucide React Icons
import {
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
  FileCode
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SimpleEditorProps {
  initialContent?: any;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function SimpleEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  className = ''
}: SimpleEditorProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Process initialContent if it's a JSON string
  const processedContent = useCallback(() => {
    if (typeof initialContent === 'string') {
      try {
        if (initialContent.startsWith('{') || initialContent.startsWith('[')) {
          return JSON.parse(initialContent);
        }
      } catch (e) {
        console.error('Error parsing initial content:', e);
      }
    }
    return initialContent;
  }, [initialContent]);

  // Editor instance with extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable the default code block as we'll use the lowlight version
        codeBlock: false,
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
        types: ['heading', 'paragraph'],
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
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: processedContent(),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none p-6 focus:outline-none min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(JSON.stringify(json));
    },
    editable: !readOnly,
  });

  // Set client side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle content updates
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const content = processedContent();
      editor.commands.setContent(content);
    }
  }, [editor, initialContent, processedContent]);

  // Define helper functions for editor interactions
  // Not using useCallback since it causes issues with hook order
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


  // Loading state
  if (!isClient || !editor) {
    return (
      <div className="bg-[#0A0A0A] p-4">
        <div className="text-white/60">Loading editor...</div>
      </div>
    );
  }

  // Read-only view
  if (readOnly) {
    return (
      <div className={`bg-[#0A0A0A] border-0 h-full ${className}`}>
        <EditorContent editor={editor} className="h-full" />
      </div>
    );
  }

  // Main editable editor with toolbar and bubble menu
  return (
    <div className={`flex flex-col h-full w-full bg-[#0A0A0A] rounded-[12px] ${className}`}>
      {/* Toolbar */}
      <div
        className="px-3 py-2.5 mx-4 mt-0 mb-3 bg-[#161618] bg-gradient-to-b from-[#1A1A1C] to-[#161618] border border-[#1a1a1a] rounded-[12px] flex flex-wrap items-center gap-2 backdrop-blur-sm"
        style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}
      >
        <TooltipProvider>
          {/* Text Formatting */}
          <div className="flex items-center space-x-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('bold') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleBold().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('italic') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('underline') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('strike') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('code') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inline Code</TooltipContent>
            </Tooltip>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('heading', { level: 1 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('heading', { level: 2 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('heading', { level: 3 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('bulletList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('orderedList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('taskList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Task List</TooltipContent>
            </Tooltip>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justify</TooltipContent>
            </Tooltip>
          </div>

          {/* Media, Links, and Code */}
          <div className="flex items-center space-x-1 mr-2">
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('link') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
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
                  className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('codeBlock') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                  onClick={addCodeBlock}
                >
                  <FileCode className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Block</TooltipContent>
            </Tooltip>
          </div>

          {/* History */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
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
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Bubble menu that appears when text is selected */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex"
      >
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor.isActive('bold') ? 'bg-[#232326]' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor.isActive('italic') ? 'bg-[#232326]' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor.isActive('link') ? 'bg-[#232326]' : ''}`}
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </BubbleMenu>

      {/* Floating menu that appears on empty lines */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex flex-col py-1"
      >
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4 mr-2" />
          <span>Heading 1</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4 mr-2" />
          <span>Heading 2</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4 mr-2" />
          <span>Bullet List</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          <span>Task List</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="justify-start"
          onClick={addCodeBlock}
        >
          <FileCode className="h-4 w-4 mr-2" />
          <span>Code Block</span>
        </Button>
      </FloatingMenu>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden rounded-[12px]">
        <EditorContent
          editor={editor}
          className="flex-1 h-full overflow-auto bg-[#0A0A0A] rounded-[12px]"
        />
      </div>
    </div>
  );
}
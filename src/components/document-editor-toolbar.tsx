"use client";

import React from 'react';
import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Heading1,
  Heading2,
  Code,
  Link,
  Plus,
  Trash2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentEditorToolbarProps {
  editor: Editor | null;
}

export function DocumentEditorToolbar({ editor }: DocumentEditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const addRowAfter = () => {
    editor
      .chain()
      .focus()
      .addRowAfter()
      .run();
  };

  const addColumnAfter = () => {
    editor
      .chain()
      .focus()
      .addColumnAfter()
      .run();
  };

  const deleteRow = () => {
    editor
      .chain()
      .focus()
      .deleteRow()
      .run();
  };

  const deleteColumn = () => {
    editor
      .chain()
      .focus()
      .deleteColumn()
      .run();
  };

  const deleteTable = () => {
    editor
      .chain()
      .focus()
      .deleteTable()
      .run();
  };

  return (
    <div
      className="tiptap-toolbar px-3 py-2.5 mx-4 mt-0 mb-3 bg-[#161618] bg-gradient-to-b from-[#1A1A1C] to-[#161618] border border-[#1a1a1a] rounded-[12px] flex flex-wrap items-center gap-2 backdrop-blur-sm"
      style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}
    >
      <TooltipProvider>
        {/* Text formatting */}
        <div className="flex items-center space-x-1 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor.isActive('bold') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                style={{ borderRadius: '6px' }}
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
                className={editor.isActive('italic') ? 'bg-[#2a2a2c]' : ''}
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
                className={editor.isActive('code') ? 'bg-[#2a2a2c]' : ''}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={editor.isActive('link') ? 'bg-[#2a2a2c]' : ''}
                onClick={() => {
                  // Check if a link is already selected
                  const isActive = editor.isActive('link');

                  if (isActive) {
                    // If a link is active, remove it
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  } else {
                    // If no link is active, create one
                    const url = window.prompt('URL');
                    if (url) {
                      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    }
                  }
                }}
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
        </div>

        {/* Paragraph formatting */}
        <div className="flex items-center space-x-1 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={editor.isActive('heading', { level: 1 }) ? 'bg-[#2a2a2c]' : ''}
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
                className={editor.isActive('heading', { level: 2 }) ? 'bg-[#2a2a2c]' : ''}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={editor.isActive('bulletList') ? 'bg-[#2a2a2c]' : ''}
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
                className={editor.isActive('orderedList') ? 'bg-[#2a2a2c]' : ''}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={editor.isActive({ textAlign: 'left' }) ? 'bg-[#2a2a2c]' : ''}
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
                className={editor.isActive({ textAlign: 'center' }) ? 'bg-[#2a2a2c]' : ''}
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
                className={editor.isActive({ textAlign: 'right' }) ? 'bg-[#2a2a2c]' : ''}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
        </div>

        {/* Table controls - only show specific controls when inside a table */}
        <div className="flex items-center space-x-1">
          {!editor.isActive('table') ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addTable}
                >
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Table</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addRowAfter}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="ml-1">Row</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Row</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addColumnAfter}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="ml-1">Column</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Column</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deleteRow}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">Row</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Row</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deleteColumn}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">Column</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Column</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deleteTable}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">Table</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Table</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { Page, AnyPropertyValue, PageType } from '@/types/models/Page';
import { Block, BlockType } from '@/types/models/Block';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2 } from 'lucide-react';
import { getPageTypeIcon, getPageTypeIconName } from '@/utils/page-icons';
import debounce from 'lodash/debounce';

// Create lowlight instance
const lowlight = createLowlight(common);

interface PageEditorProps {
  pageId: string;
  onClose?: () => void;
}

export function PageEditor({ pageId, onClose }: PageEditorProps) {
  const { usePageQuery, updatePage, addBlock, updateBlock, deleteBlock } = usePagesQuery();
  const { updateTabTitle } = useTabsQuery();
  const { data: page, isLoading, error } = usePageQuery(pageId);
  
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState<PageType>('feature');
  const [editingProperties, setEditingProperties] = useState<Record<string, AnyPropertyValue>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state when page loads
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setPageType(page.type);
      setEditingProperties(page.properties || {});
    }
  }, [page]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (updates: any) => {
      if (!page) return;
      
      setIsSaving(true);
      try {
        await updatePage(page.id, updates);
      } catch (error) {
        console.error('Error saving page:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500),
    [page, updatePage]
  );

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  // Handle property changes
  const handlePropertyChange = (key: string, value: AnyPropertyValue) => {
    const newProperties = { ...editingProperties, [key]: value };
    setEditingProperties(newProperties);
    debouncedSave({ properties: newProperties });
  };

  // Add new block
  const handleAddBlock = async (type: BlockType) => {
    if (!page) return;

    const newBlockContent = getDefaultContentForBlockType(type);
    
    try {
      await addBlock(page.id, {
        type,
        content: newBlockContent,
      });
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  // Delete block
  const handleDeleteBlock = async (blockId: string) => {
    if (!page) return;

    try {
      await deleteBlock(page.id, blockId);
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  // Handle page type change
  const handlePageTypeChange = async (newType: PageType) => {
    if (!page || newType === pageType) return;

    console.log(`=== PAGE TYPE CHANGE ===`);
    console.log(`Current type: ${pageType}`);
    console.log(`New type: ${newType}`);
    console.log(`Page ID (prop): ${pageId}`);
    console.log(`Page ID (from query): ${page?.id}`);

    setPageType(newType);
    setIsSaving(true);

    try {
      // Update the page type in the database
      console.log('Calling updatePage with pageId:', pageId, 'type:', newType);
      const result = await updatePage(pageId, { 
        type: newType
      });
      console.log('UpdatePage result:', result);

      // Update the tab title to trigger icon refresh
      updateTabTitle(pageId, 'page', page?.title || 'Page');
      
      console.log(`Page type successfully changed from ${pageType} to ${newType}`);
    } catch (error) {
      console.error('Error updating page type:', error);
      console.error('Error details:', error);
      // Revert on error
      setPageType(pageType);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading page...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Failed to load page</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Page Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Type:</label>
            <Select value={pageType} onValueChange={handlePageTypeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon(pageType), { className: "h-4 w-4" })}
                    <span className="capitalize">{pageType}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon('product'), { className: "h-4 w-4" })}
                    <span>Product</span>
                  </div>
                </SelectItem>
                <SelectItem value="project">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon('project'), { className: "h-4 w-4" })}
                    <span>Project</span>
                  </div>
                </SelectItem>
                <SelectItem value="feature">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon('feature'), { className: "h-4 w-4" })}
                    <span>Feature</span>
                  </div>
                </SelectItem>
                <SelectItem value="release">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon('release'), { className: "h-4 w-4" })}
                    <span>Release</span>
                  </div>
                </SelectItem>
                <SelectItem value="roadmap">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPageTypeIcon('roadmap'), { className: "h-4 w-4" })}
                    <span>Roadmap</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isSaving && <span className="text-sm text-muted-foreground">Saving...</span>}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Title */}
      <div>
        <Input
          value={title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Page title..."
          className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
        />
      </div>

      {/* Properties */}
      <PropertiesEditor
        pageType={page.type}
        properties={editingProperties}
        onChange={handlePropertyChange}
      />

      {/* Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Content Blocks</h3>
          <BlockTypeSelector onSelect={handleAddBlock} />
        </div>

        {(page.blocks || []).map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
            pageId={page.id}
            onUpdate={updateBlock}
            onDelete={() => handleDeleteBlock(block.id!)}
          />
        ))}

        {(!page.blocks || page.blocks.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No content blocks yet. Add your first block above.
          </div>
        )}
      </div>
    </div>
  );
}

// Properties editor component
interface PropertiesEditorProps {
  pageType: string;
  properties: Record<string, AnyPropertyValue>;
  onChange: (key: string, value: AnyPropertyValue) => void;
}

function PropertiesEditor({ pageType, properties, onChange }: PropertiesEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Status property */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={properties?.status?.select?.name || 'Draft'}
              onValueChange={(value) => 
                onChange('status', {
                  type: 'select',
                  select: { name: value, color: getStatusColor(value) }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority property */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={properties?.priority?.select?.name || 'Medium'}
              onValueChange={(value) => 
                onChange('priority', {
                  type: 'select',
                  select: { name: value, color: getPriorityColor(value) }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Block editor component
interface BlockEditorProps {
  block: Block;
  pageId: string;
  onUpdate: (pageId: string, blockId: string, updates: any) => void;
  onDelete: () => void;
}

function BlockEditor({ block, pageId, onUpdate, onDelete }: BlockEditorProps) {
  const [content, setContent] = useState(block.content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      UnderlineExtension,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: getEditorContent(block),
    onUpdate: ({ editor }) => {
      const newContent = getBlockContentFromEditor(block.type, editor);
      setContent(newContent);
      debouncedUpdate(newContent);
    },
  });

  const debouncedUpdate = useCallback(
    debounce(async (newContent: any) => {
      if (!block.id) return;
      
      try {
        await onUpdate(pageId, block.id, { content: newContent });
      } catch (error) {
        console.error('Error updating block:', error);
      }
    }, 500),
    [block.id, pageId, onUpdate]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{block.type}</Badge>
          {block.type === 'requirement' && (block.content as import('@/types/models/Block').RequirementContent).name && (
            <span className="text-sm font-medium">{(block.content as import('@/types/models/Block').RequirementContent).name}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {block.type === 'document' ? (
          <EditorContent editor={editor} className="prose max-w-none" />
        ) : (
          <StructuredBlockEditor
            block={block}
            content={content}
            onChange={setContent}
            onSave={(newContent) => onUpdate(pageId, block.id!, { content: newContent })}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Structured block editor for non-document blocks
interface StructuredBlockEditorProps {
  block: Block;
  content: any;
  onChange: (content: any) => void;
  onSave: (content: any) => void;
}

function StructuredBlockEditor({ block, content, onChange, onSave }: StructuredBlockEditorProps) {
  const debouncedSave = useCallback(
    debounce((newContent: any) => onSave(newContent), 500),
    [onSave]
  );

  const handleChange = (field: string, value: any) => {
    const newContent = { ...content, [field]: value };
    onChange(newContent);
    debouncedSave(newContent);
  };

  if (block.type === 'requirement') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Requirement Name</label>
          <Input
            value={content.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Requirement name..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            value={content.cuj || ''}
            onChange={(e) => handleChange('cuj', e.target.value)}
            placeholder="As a user, I want..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={content.priority || 'Medium'}
              onValueChange={(value) => handleChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={content.status || 'Draft'}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'criteria') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            value={content.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Acceptance criteria description..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Acceptance Test</label>
          <Input
            value={content.acceptance_test || ''}
            onChange={(e) => handleChange('acceptance_test', e.target.value)}
            placeholder="How to test this criteria..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground">
      Editor for {block.type} blocks not implemented yet.
    </div>
  );
}

// Block type selector
interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
}

function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  return (
    <Select onValueChange={(value) => onSelect(value as BlockType)}>
      <SelectTrigger className="w-48">
        <Plus className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Add block..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="document">Document</SelectItem>
        <SelectItem value="requirement">Requirement</SelectItem>
        <SelectItem value="criteria">Criteria</SelectItem>
        <SelectItem value="heading">Heading</SelectItem>
        <SelectItem value="list">List</SelectItem>
        <SelectItem value="code">Code</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Helper functions
function getDefaultContentForBlockType(type: BlockType) {
  switch (type) {
    case 'document':
      return {
        tiptap_content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: []
            }
          ]
        },
        word_count: 0
      };
    case 'requirement':
      return {
        name: '',
        priority: 'Medium',
        owner: '',
        cuj: '',
        status: 'Draft'
      };
    case 'criteria':
      return {
        description: '',
        acceptance_test: '',
        status: 'Draft'
      };
    case 'heading':
      return {
        text: '',
        level: 1
      };
    case 'bulleted_list':
    case 'numbered_list':
      return {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'List item'
            }
          }
        ]
      };
    default:
      return {};
  }
}

function getEditorContent(block: Block) {
  if (block.type === 'document' && (block.content as import('@/types/models/Block').DocumentContent).tiptap_content) {
    return (block.content as import('@/types/models/Block').DocumentContent).tiptap_content;
  }
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

function getBlockContentFromEditor(blockType: BlockType, editor: any): import('@/types/models/Block').BlockContent {
  if (blockType === 'document') {
    const json = editor.getJSON();
    return {
      tiptap_content: json,
      word_count: editor.storage.characterCount?.words() || 0
    };
  }
  
  // Return default content for other block types
  switch (blockType) {
    case 'paragraph':
    case 'bulleted_list':
    case 'numbered_list':
      return {
        rich_text: [
          {
            type: 'text',
            text: {
              content: editor.getText() || ''
            }
          }
        ]
      };
    case 'heading':
      return {
        rich_text: [
          {
            type: 'text',
            text: {
              content: editor.getText() || 'Heading'
            }
          }
        ],
        level: 2
      };
    case 'goal':
      return {
        title: editor.getText() || 'New Goal',
        description: '',
        status: 'not_started'
      };
    case 'criteria':
      return {
        description: editor.getText() || '',
        acceptance_test: '',
        status: 'draft'
      };
    case 'attachment':
      return {
        url: '',
        title: editor.getText() || 'New Attachment'
      };
    case 'requirement':
      return {
        name: editor.getText() || 'New Requirement',
        priority: 'Medium',
        status: 'Draft'
      };
    case 'table':
      return {
        table_width: 3,
        has_column_header: true,
        has_row_header: false,
        children: []
      };
    default:
      // Fallback to paragraph content
      return {
        rich_text: [
          {
            type: 'text',
            text: {
              content: editor.getText() || ''
            }
          }
        ]
      };
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Draft': 'gray',
    'In Progress': 'blue',
    'Active': 'green',
    'Completed': 'purple',
    'Archived': 'red'
  };
  return colors[status] || 'gray';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'High': 'red',
    'Medium': 'yellow',
    'Low': 'green'
  };
  return colors[priority] || 'gray';
}
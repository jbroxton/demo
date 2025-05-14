# Requirements as Documents: Notion-like Editing Experience

## Instructions for AI Assistants
This document provides specifications for implementing a document-based editing experience for requirements in an existing Next.js application. To correctly implement this feature:

1. **Read CLAUDE.md first** - It contains critical project patterns and coding standards
2. **Understand the application context**:
   - This is a requirements management application using Next.js App Router, React Query, shadcn/ui, and Tailwind CSS
   - The app has a tabs-based interface where users work with features, requirements, releases and interfaces
   - The data is stored in SQLite and accessed through React Query hooks following a consistent pattern
   - All UI follows a dark theme with consistent styling conventions

The implementation should strictly follow the project's established patterns for:
- Component structure and naming
- State management with React Query
- Styling with Tailwind CSS (no custom CSS)
- Error handling and loading states
- TypeScript type safety

## Overview
This document outlines a plan for transforming the Requirements Table into a flexible, document-based editing experience similar to Notion, where structured tables are embedded within a fluid document flow.

## Design Vision
Instead of a traditional table interface, we'll create a document-first experience where:
- Users can freely write narrative text and context
- Requirements tables exist as embedded, interactive blocks
- The entire document feels cohesive and natural to edit
- Structure and data integrity are preserved

## UI Behavior Specification

### Core Interactions

1. **Document Editing**
   - Text editing should feel like a standard rich text editor (similar to Google Docs)
   - Users should be able to type continuously, with formatting applied immediately
   - Document should auto-save changes after brief inactivity (debounced, 1 second)
   - Cursor position should be maintained during auto-save operations
   - Links should be clickable in read mode, editable in edit mode

2. **Table Interactions**
   - Tables must be selectable as blocks (click and drag should select the whole table)
   - Individual cells should be editable with a single click
   - Tab key should navigate between cells (left-to-right, then down to next row)
   - Arrow keys should navigate within cell text when editing
   - Arrow keys should navigate between cells when not in edit mode
   - Enter key should confirm edits and move to cell below (similar to Excel)
   - Shift+Enter should insert a line break within a cell
   - Escape key should cancel edits and restore previous cell value

3. **Block Operations**
   - "/" key should open a slash command menu for inserting blocks
   - Hover over a block should reveal control buttons (delete, move, etc.)
   - Blocks should be movable by drag-and-drop with a clear visual indicator
   - Block selection should be indicated with a subtle highlight border
   - Block deletion should have a confirmation if the block contains significant content

4. **Visual Feedback**
   - Editing state should be clearly indicated (cursor, highlight color)
   - Validation errors should appear inline with clear visual cues
   - Saving state should be indicated with a subtle indicator (not disruptive)
   - Required fields should be visually distinct from optional ones
   - Focus should be visually indicated with a border matching the project style

### State Transitions

1. **Document Loading**
   - Show a loading skeleton matching the document structure
   - Maintain UI stability (no layout shifts) when content loads
   - Display error state if document fails to load

2. **Edit to View Mode**
   - Transition should be smooth with no flickering
   - Content should maintain exact position/scroll during transition
   - Format changes should apply immediately when switching to view mode

3. **New Document Creation**
   - Start with a minimal template (title + description)
   - Focus should automatically be placed in the title field
   - Required fields should be pre-populated with sensible defaults

4. **Document Saving**
   - Auto-save should run after 1 second of inactivity
   - Save status indicator should be unobtrusive (in header)
   - Failed saves should show an error with retry option
   - Manual save button should also be available

## Implementation Plan

### Version 0: Functional Prototype Using Release Tab (1-2 days)
We'll create a quick prototype based on the existing release tab to test the natural editing experience:

1. **Core Focus**
   - **Leverage Release Tab**: Use the existing ReleaseQueryTabContent component structure
   - **Editable Table**: Implement a fully functional editable table within the document
   - **Natural Editing Flow**: Prioritize the feeling of seamless editing between text and structured data
   - **Raw Functionality**: Focus on editing capabilities rather than visual polish

2. **V0 Specifications**
   - **Starting Point**: Copy and modify the ReleaseQueryTabContent component (src/components/release-query-tab-content.tsx)
   - **Modification Target**: Replace the description textarea with a Tiptap editor
   - **Requirement Block**: Fully editable table with these capabilities:
     - Direct inline cell editing (click to edit)
     - Add/remove rows
     - Tab navigation between cells
     - Table persists within document content
   - **Minimal Styling**: Use the existing dark theme colors and Tailwind classes
   - **No Backend Integration**: Use local state only for the prototype

3. **V0 Implementation Details**
   - Create a new component file: `src/components/document-editor-tab-content.tsx`
   - Follow the component structure pattern in the project:
     - "use client" directive at the top
     - React/Next.js imports first
     - External libraries next (Tiptap)
     - Internal components/hooks next
     - TypeScript interfaces defined adjacent to component
     - All hooks at the top of the component
     - Event handlers next
     - JSX return at the bottom
   - Replace the description Textarea with Tiptap editor
   - Add table-related toolbar buttons

```typescript
// src/components/document-editor-tab-content.tsx
"use client";

// 1. React/Next.js imports
import React, { useEffect, useState } from 'react';

// 2. External libraries
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// 3. Internal components and hooks
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Calendar, Plus, Table as TableIcon } from 'lucide-react';

// 4. TypeScript interfaces for component props (adjacent to component)
interface DocumentEditorTabContentProps {
  releaseId: string;
  tabId: string;
  isNew?: boolean;
}

export function DocumentEditorTabContent({ 
  releaseId, 
  tabId, 
  isNew = false 
}: DocumentEditorTabContentProps) {
  // 5. Hooks at the top (following project pattern)
  const { updateTabTitle, closeTab } = useTabsQuery();
  
  // State hooks
  const [nameValue, setNameValue] = useState('Document Prototype');
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Set up the Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: `
      <h2>Document Overview</h2>
      <p>This is an editable document with embedded tables for requirements.</p>
      <p>You can freely write content here to provide context about requirements.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // Handle client-side effects
  useEffect(() => {
    // Set client-side state or load data if needed
  }, []);

  // 6. Event handlers (using handleX pattern from project)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };

  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    
    // Insert header content
    editor?.chain().focus()
      .selectCell(0, 0)
      .insertContent('Requirement')
      .selectCell(0, 1)
      .insertContent('Description')
      .selectCell(0, 2)
      .insertContent('Priority')
      .selectCell(1, 0) // Position cursor in first data cell
      .run();
  };

  const handleAddTableRow = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  // 7. JSX return (structure similar to ReleaseQueryTabContent)
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section (following ReleaseQueryTabContent structure) */}
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
                placeholder="Enter document name"
              />
            </div>
          ) : (
            <h1 className="text-xl font-medium text-white">
              {nameValue}
            </h1>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          {/* Document editor controls */}
          <Button
            size="sm"
            variant="outline"
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
            onClick={handleInsertTable}
          >
            <TableIcon className="h-4 w-4 mr-1" />
            Insert Table
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
            onClick={handleAddTableRow}
            disabled={!editor?.can().addRowAfter()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>
      
      {/* Main content area (following ReleaseQueryTabContent structure) */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-white">
          <div className="space-y-6">
            {/* Document editor replaces description field */}
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Document Editor</p>
              <div className="rounded-md border border-[#2a2a2c] bg-[#232326] p-4">
                <EditorContent editor={editor} />
              </div>
            </div>
            
            {/* Testing instructions panel */}
            <div className="bg-[#232326] rounded-md p-4 mt-4">
              <h3 className="text-white mb-2 font-medium">Testing Instructions</h3>
              <ul className="list-disc pl-5 text-sm text-[#a0a0a0] space-y-1">
                <li>Click "Insert Table" to add a requirements table</li>
                <li>Click inside cells to edit content directly</li>
                <li>Use Tab key to navigate between cells</li>
                <li>Click "Add Row" to add new requirements</li>
                <li>Try writing text above and below the table</li>
                <li>Test how natural it feels to edit both text and table data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

4. **Integration Steps**
   - Create the prototype page file: `/src/app/prototype/document-requirements/page.tsx`
   - Use the client component pattern with "use client" directive:

   ```typescript
   // src/app/prototype/document-requirements/page.tsx
   "use client";
   
   import React from 'react';
   import { DocumentEditorTabContent } from '@/components/document-editor-tab-content';
   
   export default function DocumentRequirementsPage() {
     return (
       <DocumentEditorTabContent 
         releaseId="prototype" 
         tabId="prototype" 
       />
     );
   }
   ```

   - Install Tiptap dependencies with exact versions for compatibility:
   ```bash
   npm install @tiptap/react@2.1.0 @tiptap/starter-kit@2.1.0 @tiptap/extension-table@2.1.0 @tiptap/extension-table-row@2.1.0 @tiptap/extension-table-cell@2.1.0 @tiptap/extension-table-header@2.1.0
   ```

   - Add necessary prose styling in globals.css (if not already present):
   ```css
   /* In src/app/globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* Add Tiptap-specific styles */
   .ProseMirror:focus {
     outline: none;
   }
   
   .ProseMirror p {
     margin: 0.5em 0;
   }
   
   .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
     margin: 1em 0 0.5em;
   }
   
   .ProseMirror table {
     border-collapse: collapse;
     width: 100%;
     table-layout: fixed;
     margin: 1em 0;
   }
   
   .ProseMirror th, .ProseMirror td {
     border: 1px solid #2a2a2c;
     padding: 0.5em;
     position: relative;
   }
   
   .ProseMirror th {
     background: #232326;
     font-weight: bold;
   }
   ```

5. **Tailwind Configuration Check**
   - Ensure tailwind.config.js has prose plugin enabled:
   ```js
   // Check if this is already configured
   module.exports = {
     // ...other config
     plugins: [
       require('@tailwindcss/typography'),
       // ...other plugins
     ],
   }
   ```
   - Add the plugin if not already present:
   ```bash
   npm install --save-dev @tailwindcss/typography
   ```

6. **Testing and Evaluation**
   - Load the prototype in the browser at `/prototype/document-requirements`
   - Test these specific interactions:
     - Adding and editing text outside tables
     - Inserting tables and editing cells
     - Tab navigation between cells
     - Adding rows and columns
     - Text formatting within cells

## Complete Component Architecture

### Core Components

1. **Document Editor Module**
   - `document-editor-tab-content.tsx` - Main container following project's tab pattern
   - `document-editor-toolbar.tsx` - Formatting toolbar (bold, italic, headers, etc.)
   - `document-content-editor.tsx` - Wrapper for Tiptap editor with common configuration
   - `document-editor-context.tsx` - Provider for shared editor state

2. **Requirements Table Components**
   - `requirement-table-view.tsx` - Custom node view for requirement tables
   - `requirement-cell-view.tsx` - Custom cell renderer with validation
   - `requirement-actions.tsx` - Action buttons for table operations
   - `requirement-context-menu.tsx` - Right-click menu for table operations

3. **UI Components**
   - `editor-floating-menu.tsx` - Contextual formatting menu that appears on selection
   - `slash-command-menu.tsx` - Menu that appears when typing "/"
   - `block-controls.tsx` - Move/delete controls that appear on block hover
   - `document-status-indicator.tsx` - Shows saving/saved state

4. **Container/Layout Components**
   - `editor-layout.tsx` - Main layout with editor and sidebar
   - `editor-sidebar.tsx` - Optional sidebar with document structure/metadata
   - `document-header.tsx` - Title and main actions

### Component Hierarchy

```
DocumentEditorTabContent
├── DocumentHeader (title, save/edit buttons)
├── EditorLayout
│   ├── DocumentContentEditor
│   │   ├── TipTap (EditorContent)
│   │   │   ├── EditorToolbar
│   │   │   ├── EditorFloatingMenu
│   │   │   ├── SlashCommandMenu
│   │   │   └── Custom Node Views
│   │   │       ├── RequirementTableView
│   │   │       │   ├── RequirementCellView
│   │   │       │   └── RequirementActions
│   │   │       └── Other custom blocks...
│   │   └── DocumentStatusIndicator
│   └── Optional: EditorSidebar
└── DocumentFooter (additional actions)
```

## Hooks and State Management Architecture

### Custom Hooks

1. **Document Data and Persistence**
   ```typescript
   // src/hooks/use-documents-query.ts
   export function useDocumentsQuery(documentId?: string) {
     // React Query implementation following project patterns
     // Will get/save documents from the database
     return {
       document,
       isLoading,
       error,
       saveDocument,
       isSaving,
       // Other operations and states
     };
   }
   ```

2. **Editor State Management**
   ```typescript
   // src/hooks/use-document-editor.ts
   export function useDocumentEditor(initialContent: any, onChange?: (content: any) => void) {
     // Setup Tiptap editor with configuration
     // Handle content changes, history, etc.
     return {
       editor,
       isEditing,
       setIsEditing,
       content,
       setContent,
       // Other editor state and methods
     };
   }
   ```

3. **Requirements Table Operations**
   ```typescript
   // src/hooks/use-requirement-table.ts
   export function useRequirementTable(editor: Editor) {
     // Operations for requirement tables
     return {
       insertRequirementTable,
       addRequirementRow,
       deleteRequirementRow,
       updateRequirementCell,
       // Other table operations
     };
   }
   ```

### Context Providers

1. **Document Editor Context**
   ```typescript
   // src/providers/document-editor-provider.tsx
   import { createContext, useContext, useMemo, useState } from 'react';
   
   interface DocumentEditorContextType {
     activeDocumentId: string | null;
     setActiveDocumentId: (id: string | null) => void;
     selectedBlockId: string | null;
     setSelectedBlockId: (id: string | null) => void;
     editorMode: 'edit' | 'view';
     setEditorMode: (mode: 'edit' | 'view') => void;
     // Other shared state
   }
   
   const DocumentEditorContext = createContext<DocumentEditorContextType | null>(null);
   
   export function DocumentEditorProvider({ children }: { children: React.ReactNode }) {
     const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
     const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
     const [editorMode, setEditorMode] = useState<'edit' | 'view'>('view');
     
     // Memoize value to prevent unnecessary re-renders
     const value = useMemo(() => ({
       activeDocumentId,
       setActiveDocumentId,
       selectedBlockId,
       setSelectedBlockId,
       editorMode,
       setEditorMode,
     }), [activeDocumentId, selectedBlockId, editorMode]);
     
     return (
       <DocumentEditorContext.Provider value={value}>
         {children}
       </DocumentEditorContext.Provider>
     );
   }
   
   // Custom hook to use the context
   export function useDocumentEditorContext() {
     const context = useContext(DocumentEditorContext);
     if (!context) {
       throw new Error('useDocumentEditorContext must be used within a DocumentEditorProvider');
     }
     return context;
   }
   ```

2. **Document UI State Context**
   ```typescript
   // src/providers/document-ui-provider.tsx
   // For UI-specific state like sidebar visibility, active tab, etc.
   // Implementation follows same pattern as above
   ```

## Services Architecture

### Database Layer

1. **Documents Database Service**
   ```typescript
   // src/services/documents-db.ts
   import { getDb } from './db.server';
   import { Document } from '@/types/models';
   
   // CRUD operations for documents
   export function getDocumentFromDb(id: string) {
     try {
       const db = getDb();
       const doc = db.prepare(`
         SELECT * FROM documents WHERE id = ?
       `).get(id);
       
       return {
         success: true,
         data: doc ? mapDocumentFromDb(doc) : null
       };
     } catch (error) {
       console.error('Error getting document:', error);
       return {
         success: false,
         error: 'Failed to retrieve document'
       };
     }
   }
   
   export function createDocumentInDb(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) {
     try {
       const db = getDb();
       const now = new Date().toISOString();
       const id = crypto.randomUUID();
       
       db.prepare(`
         INSERT INTO documents (id, title, content, feature_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
       `).run(
         id,
         document.title,
         JSON.stringify(document.content),
         document.featureId || null,
         now,
         now
       );
       
       return {
         success: true,
         data: {
           id,
           title: document.title,
           content: document.content,
           featureId: document.featureId,
           createdAt: now,
           updatedAt: now
         }
       };
     } catch (error) {
       console.error('Error creating document:', error);
       return {
         success: false,
         error: 'Failed to create document'
       };
     }
   }
   
   // Other operations (update, delete, etc.)
   
   // Helper function for mapping DB columns to camelCase properties
   function mapDocumentFromDb(row: any): Document {
     return {
       id: row.id,
       title: row.title,
       content: JSON.parse(row.content),
       featureId: row.feature_id,
       createdAt: row.created_at,
       updatedAt: row.updated_at
     };
   }
   ```

2. **Document Requirements Service**
   ```typescript
   // src/services/document-requirements-db.ts
   // For extracting and persisting requirements from documents
   // Implementation follows similar patterns as above
   ```

### API Layer

1. **Documents API Routes**
   ```typescript
   // src/app/api/documents-db/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { getDocumentFromDb, createDocumentInDb, updateDocumentInDb, deleteDocumentFromDb } from '@/services/documents-db';
   
   // GET - Retrieve document by ID
   export async function GET(request: NextRequest) {
     const searchParams = request.nextUrl.searchParams;
     const id = searchParams.get('id');
     
     if (!id) {
       return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
     }
     
     const result = getDocumentFromDb(id);
     
     if (!result.success) {
       return NextResponse.json({ error: result.error }, { status: 500 });
     }
     
     return NextResponse.json(result.data);
   }
   
   // POST - Create new document
   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       
       if (!body.title) {
         return NextResponse.json({ error: 'Title is required' }, { status: 400 });
       }
       
       const result = createDocumentInDb(body);
       
       if (!result.success) {
         return NextResponse.json({ error: result.error }, { status: 500 });
       }
       
       return NextResponse.json(result.data);
     } catch (error) {
       console.error('Error in documents-db POST:', error);
       return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
     }
   }
   
   // Other handlers (PUT, DELETE, etc.)
   ```

## Database Schema Evolution

```sql
-- Documents table schema
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON stringified content
  feature_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id)
);

-- Document requirements view 
-- (virtual table that extracts requirements from document content)
CREATE VIEW IF NOT EXISTS document_requirements AS
SELECT 
  d.id as document_id,
  d.feature_id,
  json_extract(value, '$.id') as requirement_id,
  json_extract(value, '$.name') as name,
  json_extract(value, '$.description') as description,
  json_extract(value, '$.priority') as priority
FROM 
  documents d,
  json_each(json_extract(d.content, '$.requirements')) as req;
```

## TypeScript Types

```typescript
// src/types/models/Document.ts
export interface Document {
  id: string;
  title: string;
  content: DocumentContent;
  featureId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentContent {
  type: 'doc';
  content: DocumentNode[];
}

export type DocumentNode = 
  | ParagraphNode
  | HeadingNode
  | RequirementsTableNode
  | BulletListNode;

export interface ParagraphNode {
  type: 'paragraph';
  content: TextNode[];
}

export interface HeadingNode {
  type: 'heading';
  attrs: {
    level: 1 | 2 | 3;
  };
  content: TextNode[];
}

export interface RequirementsTableNode {
  type: 'requirementsTable';
  attrs: {
    featureId?: string;
  };
  content: TableRowNode[];
}

export interface TableRowNode {
  type: 'tableRow';
  content: TableCellNode[];
}

export interface TableCellNode {
  type: 'tableCell';
  attrs?: {
    colspan?: number;
    rowspan?: number;
  };
  content: (ParagraphNode | BulletListNode)[];
}

export interface TextNode {
  type: 'text';
  text: string;
  marks?: Mark[];
}

export interface Mark {
  type: 'bold' | 'italic' | 'link';
  attrs?: {
    href?: string;
  };
}

export interface BulletListNode {
  type: 'bulletList';
  content: ListItemNode[];
}

export interface ListItemNode {
  type: 'listItem';
  content: ParagraphNode[];
}
```

## Phase 1: Core Functionality (1 week)

1. **Custom Requirement Block Extension**
   - Create a specialized extension by extending the Tiptap Table:
   ```typescript
   // src/lib/tiptap/requirement-table-extension.ts
   import { Node, mergeAttributes } from '@tiptap/core'
   import Table from '@tiptap/extension-table'
   
   export const RequirementTable = Table.extend({
     name: 'requirementTable',
     
     addAttributes() {
       return {
         ...this.parent?.(),
         // Add requirement-specific attributes
         featureId: {
           default: null,
         }
       }
     },
     
     // Additional configuration and methods
   })
   ```

   - Add priority selection dropdown within cells:
   ```typescript
   // Use shadcn/ui Select component within cell view
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   
   // Implementation in cell view component
   ```

   - Implement rich text in description fields with appropriate serialization

2. **Document Structure Components**
   - Create slash command menu for block insertion:
   ```typescript
   // Example of slash command extension
   import { Extension } from '@tiptap/core'
   import Suggestion from '@tiptap/suggestion'
   
   export const SlashCommands = Extension.create({
     name: 'slashCommands',
     
     addProseMirrorPlugins() {
       return [
         Suggestion({
           editor: this.editor,
           char: '/',
           items: () => [
             { title: 'Heading 1', command: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run() },
             { title: 'Requirements Table', command: () => this.editor.chain().focus().insertRequirementTable().run() },
             // Additional command items
           ],
           // Render a component for suggestions
           render: () => {
             // Use shadcn/ui components for menu
           }
         })
       ]
     }
   })
   ```

   - Add keyboard shortcuts following the project's conventions
   - Implement block controls that match the project's styling

3. **Editor Component Refinement**
   - Create a proper toolbar component matching the app's design language:
   ```typescript
   // src/components/document/editor-toolbar.tsx
   "use client";
   
   import React from 'react';
   import { Editor } from '@tiptap/react';
   import { Button } from '@/components/ui/button';
   import { Bold, Italic, List, ListOrdered, Table } from 'lucide-react';
   
   interface EditorToolbarProps {
     editor: Editor | null;
   }
   
   export function EditorToolbar({ editor }: EditorToolbarProps) {
     if (!editor) return null;
     
     return (
       <div className="flex items-center space-x-1 bg-[#232326] p-1 rounded-md border border-[#2a2a2c]">
         <Button 
           size="sm" 
           variant="ghost" 
           onClick={() => editor.chain().focus().toggleBold().run()}
           className={editor.isActive('bold') ? 'bg-[#2a2a2c]' : ''}
         >
           <Bold className="h-4 w-4" />
         </Button>
         {/* Additional toolbar buttons */}
       </div>
     );
   }
   ```

   - Use TwoColumnLayout component pattern for editor/preview:
   ```typescript
   <TwoColumnLayout
     left={<EditorContent editor={editor} />}
     right={<DocumentPreview content={editor.getHTML()} />}
   />
   ```

## Phase 2: Enhanced Features (1-2 weeks)

1. **Data Integration with React Query**
   - Create dedicated query hook following the project pattern:
   ```typescript
   // src/hooks/use-documents-query.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   
   export function useDocumentsQuery(documentId?: string) {
     const queryClient = useQueryClient();
     const documentsKey = ['documents'];
     const documentKey = documentId ? ['documents', documentId] : null;
     
     // Main query
     const documentQuery = useQuery({
       queryKey: documentKey,
       queryFn: () => fetchDocument(documentId as string),
       enabled: !!documentId,
     });
     
     // Mutations in the same file
     const saveDocumentMutation = useMutation({
       mutationFn: (data: DocumentData) => saveDocument(data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: documentsKey });
         if (documentKey) {
           queryClient.invalidateQueries({ queryKey: documentKey });
         }
       },
     });
     
     // Return combined result (following project pattern)
     return {
       document: documentQuery.data,
       isLoading: documentQuery.isLoading,
       error: documentQuery.error,
       saveDocument: saveDocumentMutation.mutateAsync,
       isSaving: saveDocumentMutation.isPending,
     };
   }
   ```

   - Create document data transformation helpers:
   ```typescript
   // Convert Tiptap JSON to database format and back
   const serializeDocument = (content: any): SerializedDocument => ({
     // Transform logic here
   });
   
   const deserializeDocument = (serialized: SerializedDocument): any => ({
     // Transform logic here
   });
   ```

   - Add auto-save with debouncing using the project's conventions:
   ```typescript
   // Debounced save function
   const debouncedSave = useCallback(
     debounce((content: any) => {
       saveDocument({
         id: documentId,
         content: serializeDocument(content),
       });
     }, 1000),
     [documentId, saveDocument]
   );
   ```

2. **Advanced Table Features**
   - Implement sortable columns using Tiptap extensions
   - Create view toggle (table/card view) following the project's existing UI patterns
   - Add inline validation within cells using the shadcn/ui components

3. **UI/UX Refinements**
   - Ensure consistent keyboard navigation
   - Add focus indicators matching the existing project styles
   - Implement hover states for interactive elements

## Testing Approach

1. **Manual Testing**
   - Test keyboard navigation thoroughly
   - Verify table editing works smoothly
   - Check document saving/loading functionality 

2. **User Feedback Collection**
   - Create a structured feedback form for testers
   - Collect metrics on time spent editing
   - Identify pain points in the editing experience

## Success Metrics

1. **Quantitative Metrics**
   - Time to create/edit requirements (compared to current interface)
   - Number of clicks required to perform common tasks
   - Frequency of errors during editing

2. **Qualitative Feedback**
   - User satisfaction with the document-based approach
   - Perceived ease of use compared to traditional tables
   - Completeness and quality of requirements documentation

## Next Steps After Prototype

1. **Gather feedback from prototype users**
2. **Refine the approach based on feedback**
3. **Implement Phase 1 with core functionality**
4. **Test with real users**
5. **Implement Phase 2 with enhanced features**
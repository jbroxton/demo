# Requirements as Documents: Notion-like Editing Experience

## Overview
This document outlines a plan for transforming the Requirements Table into a flexible, document-based editing experience similar to Notion, where structured tables are embedded within a fluid document flow.

## Design Vision
Instead of a traditional table interface, we'll create a document-first experience where:
- Users can freely write narrative text and context
- Requirements tables exist as embedded, interactive blocks
- The entire document feels cohesive and natural to edit
- Structure and data integrity are preserved

## Implementation Plan

### Version 0: Functional Prototype Using Release Tab (1-2 days)
We'll create a quick prototype based on the existing release tab to test the natural editing experience:

1. **Core Focus**
   - **Leverage Release Tab**: Use the existing release tab UI structure as our foundation
   - **Editable Table**: Implement a fully functional editable table within the document
   - **Natural Editing Flow**: Prioritize the feeling of seamless editing between text and structured data
   - **Raw Functionality**: Focus on editing capabilities rather than visual polish

2. **V0 Specifications**
   - **Starting Point**: Copy and modify the release tab component
   - **Modification Target**: Replace the release description area with a Tiptap editor
   - **Requirement Block**: Fully editable table with these capabilities:
     - Direct inline cell editing (click to edit)
     - Add/remove rows
     - Tab navigation between cells
     - Table persists within document content
   - **Minimal Styling**: Just enough to make the interface usable
   - **No Backend Integration**: Use local state only for the prototype

3. **V0 Implementation Details**
   - Create a new version of the release content component using the release tab as a template
   - Replace `FeatureDescriptionEditor` with a `DocumentEditor` component
   - Use Tiptap's built-in table extension for the editable table
   - Create a simple toolbar for table operations

```typescript
// Example component structure for V0 based on release tab
import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Plus, Table as TableIcon, Save, X } from 'lucide-react';

// Starting with a copy of the ReleaseQueryTabContent and modifying it
function DocumentReleaseTabContent({ releaseId, tabId }) {
  // Use the existing release tab state structure
  const [nameValue, setNameValue] = useState('Release Name');
  const [isEditing, setIsEditing] = useState(false);
  
  // Set up the Tiptap editor (replaces the description field)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: false, // Keep it simple for V0
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: `
      <h2>Release Overview</h2>
      <p>This release focuses on core improvements to the user experience.</p>
      <p>Write free-form text here to provide context about this release.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // Insert an editable requirements table
  const insertRequirementsTable = () => {
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

  // Add a new row to the table
  const addTableRow = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      {/* Header section with release name and action buttons - keep from original */}
      <div className="px-6 py-4 border-b border-[#232326] grid grid-cols-2">
        <div className="flex items-center">
          {/* Same header structure as release tab */}
          <h1 className="text-xl font-medium text-white">
            {nameValue} - Document Prototype
          </h1>
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          {/* Add controls for the document editor */}
          <Button
            size="sm"
            variant="outline"
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
            onClick={insertRequirementsTable}
          >
            <TableIcon className="h-4 w-4 mr-1" />
            Insert Table
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
            onClick={addTableRow}
            disabled={!editor?.can().addRowAfter()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>
      
      {/* Main content area - replace with document editor */}
      <div className="space-y-4 p-4 pt-0 flex flex-col flex-grow h-full overflow-auto">
        {/* Document editor replaces description field */}
        <div className="flex-shrink-0 mt-4">
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
  );
}
```

4. **Integration Steps**
   - Create a new route for the prototype: `/prototype/document-requirements`
   - Copy the release tab component as a starting point
   - Modify it to include the Tiptap editor and table functionality
   - Keep the existing styling and layout structure for consistency

5. **Key Evaluation Criteria**
   - How natural does editing feel when switching between text and table?
   - Is inline table editing intuitive for users?
   - Does the tab navigation between cells work smoothly?
   - Can users easily understand the document+table concept?
   - What usability issues arise when editing the table within the document?

### Phase 1: Core Functionality (1 week)

1. **Custom Requirement Block**
   - Develop a specialized table extension for requirements
   - Add requirement-specific capabilities (priority dropdown, etc.)
   - Maintain data structure with clear React Query integration path
   - Support rich text in description fields

2. **Document Structure Refinement**
   - Implement slash commands for block insertion
   - Add support for other block types (headings, lists, etc.)
   - Create consistent editing experience across block types
   - Implement basic block controls (move, delete)

3. **Styling and UX**
   - Refine the visual design of embedded tables
   - Improve editing indicators and focus states
   - Ensure smooth transitions between editing states
   - Add keyboard shortcuts for common operations

### Phase 2: Enhanced Features (1-2 weeks)

1. **Data Integration**
   - Connect document content with database via React Query
   - Implement document serialization/deserialization
   - Add auto-save functionality with debouncing
   - Set up proper data validation

2. **Advanced Table Features**
   - Add filtering and sorting capabilities
   - Support view switching (table/board/list)
   - Implement inline validation and error handling
   - Add attachment support within requirements

3. **Collaboration and Organization**
   - Add collapsible sections
   - Implement commenting on blocks
   - Add user attribution for changes
   - Basic version history

## Technical Approach

### Foundation: Tiptap Document Editor

1. **Tiptap as the Core Engine**
   - Based on ProseMirror but with React-friendly API
   - Excellent TypeScript support for type safety
   - Extensive extension ecosystem
   - Support for custom node types and blocks

2. **Document Schema**
   - Define a custom document schema with:
     - Paragraph blocks for narrative text
     - Heading blocks for document structure
     - Table blocks for requirements data
     - List blocks for bullet points
     - Image/attachment blocks
     - Code blocks for technical requirements

3. **Custom Requirement Block**
   - Create a custom Tiptap extension for requirements
   - Support both table view and card view
   - Maintain data structure while providing intuitive editing
   - Integrate with existing data model and React Query

## Technical Architecture

### Component Structure

1. **`DocumentEditor`** - The main wrapper component
   - Manages document state and persistence
   - Handles saving and loading

2. **`EditorContent`** - The Tiptap editor instance
   - Configures Tiptap with extensions
   - Provides the editable surface

3. **`RequirementTableExtension`** - Custom Tiptap extension
   - Extends the basic table extension with requirement-specific functionality
   - Handles specialized rendering and interactions
   - Manages data structure for requirements

4. **`RequirementCellView`** - Custom cell components
   - Specialized cells for different requirement attributes
   - Priority selection dropdown
   - Rich text description support
   - Owner assignment interface

### Data Flow

1. **Document State**: The document structure in Tiptap's internal format
2. **Block Data**: JSON representation of requirements within blocks
3. **API Integration**: Transform document data to/from API format using React Query

## Integration with Existing Stack

1. **React Query Integration**
   - Use existing hooks for data fetching
   - Add transformations between document and API formats
   - Implement optimistic updates for seamless editing

2. **shadcn/ui Components**
   - Use within custom block views
   - Maintain consistent UI language
   - Leverage existing component patterns

3. **Styling**
   - Use Tailwind CSS for styling the editor
   - Match existing dark theme and color palette
   - Create Tiptap-specific extensions for styling

## Technical Considerations

### Performance
- Optimize rendering for large documents
- Use virtualization for long tables within documents
- Efficiently handle document serialization

### Accessibility
- Ensure keyboard navigation throughout the editor
- Maintain semantic structure for screen readers
- Support all standard accessibility patterns

### Mobile Experience
- Adapt editing interface for touch interactions
- Create responsive layouts for different screen sizes
- Simplify toolbar options on smaller screens

## Success Metrics
- Reduced time to create and edit requirements
- Higher user satisfaction with document flow
- Improved completeness of requirement documentation
- Positive feedback on the Notion-like experience

## Open Questions

1. How should we handle permissions in the document context?
2. Should we support real-time collaboration features?
3. How should versioning work for the document-based approach?
4. How will we handle migrations from the existing table structure?

---

## Appendix: Implementation Path

### V0 Setup Steps

1. **Create prototype route and component:**
   ```
   /src/app/prototype/document-requirements/page.tsx
   ```

2. **Copy release tab component as starting template:**
   ```typescript
   // Start with a copy of ReleaseQueryTabContent as our foundation
   // At a minimum, we'll need to install these dependencies:
   // npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
   ```

3. **Modify the component as described in the implementation details:**
   - Replace description editor with Tiptap
   - Add table insertion functionality
   - Keep overall structure and styling the same

4. **Test and gather feedback:**
   - Demo to stakeholders
   - Focus on the editing experience
   - Take notes on usability issues and opportunities
   
### Structure For Expanded Implementation

```typescript
// Full implementation structure for future phases

// 1. Custom extensions for requirement blocks
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import RequirementBlockView from './requirement-block-view'

const RequirementBlock = Node.create({
  name: 'requirementBlock',
  group: 'block',
  content: 'block+',
  
  addAttributes() {
    return {
      featureId: { default: null },
      requirements: { default: [] },
      // Other attributes...
    }
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="requirement-block"]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'requirement-block', ...HTMLAttributes }, 0]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(RequirementBlockView)
  }
})

// 2. Document editor component with full integration
function DocumentEditor({ initialContent, onSave }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      RequirementBlock,
      // Other extensions...
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Implement auto-save logic
    },
    // Other configuration...
  })
  
  // Toolbar and commands...
  
  return (
    <div className="document-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
```
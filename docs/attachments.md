# Attachments Feature Design

## Overview
This document outlines the design for implementing attachment capabilities in Speqq, specifically focused on supporting the needs of Product Managers.

## Purpose
To enable users to add file attachments and links to specific entities within Speqq, enhancing documentation, collaboration, and information sharing while preserving contextual relationships.

## User Needs Analysis

### Attachment Use Cases
Product Managers need to attach various reference materials to provide context and support for features, requirements, and releases:

- **Design mockups/wireframes** - Visual representations of features
- **User research documents** - Insights from user testing and research
- **Competitive analysis reports** - Market positioning information
- **Market research data** - Target audience and market fit documentation
- **Technical specifications** - Detailed technical requirements
- **Meeting notes/recordings** - Stakeholder decisions and discussions

### Target Entities for Attachments
Attachments will be supported for the following entities:
- Features
- Requirements
- Releases

Products and Interfaces will not support attachments in the initial implementation.

### Enhanced Workflows
The attachments feature will enhance the following Product Management workflows:
- Documentation of requirements with supporting materials
- Providing reference materials for development teams
- Sharing context with stakeholders through linked resources
- Preserving design decisions and history with attached artifacts

### Key Considerations
Based on Product Manager needs, the following considerations are important:

1. **Quick Accessibility**
   - Fast access to attachments from entity views
   - Minimal clicks to view attached content

2. **Organization/Categorization**
   - Ability to categorize attachments by type
   - Clear labeling of attachments

3. **Live References**
   - Support for live links to documents (e.g., Figma, Google Docs)
   - Updates to linked content should be reflected without requiring attachment replacement

4. **Previews**
   - Inline previews for supported file types (e.g., images, PDFs)
   - Enhanced preview capabilities for specialized files (e.g., Figma) when possible

5. **Size Limitations**
   - Implement industry best practices for attachment size limits
   - Consider optimization for common attachment types

## Technical Approach

### Attachment Types to Support
1. **Direct Links**
   - URLs to external resources (Figma, Google Docs, Miro, etc.)
   - Integration with common design/PM tools when possible

2. **Uploaded Files** (if needed)
   - Images (.png, .jpg, .svg)
   - Documents (.pdf, .docx, .xlsx)
   - Presentation files (.pptx)
   - Other common formats

### Inline Preview Capabilities
- Implement inline previews for common file types (images, PDFs)
- Explore embed options for external services (Figma, Google Docs)
- Fallback to generic attachment representation when preview isn't possible

## UI/UX Design

### Entry Points

#### Primary Entry Points
- **Entity Header Action Bar**: Each entity page (Feature, Requirement, Release) will include an "Attachments" button in the header action bar
  - Button includes a paperclip icon and badge showing attachment count
  - Positioned consistently with other action buttons (Edit, Delete, etc.)
  - Example: `<AttachmentButton count={attachments.length} onClick={handleOpenDialog} />`

#### Secondary Entry Points
- **Attachments Section**: Dedicated section on entity detail pages showing attached resources
  - Located below the description section and above requirements/related items
  - Includes a section header with title "Attachments" and count
  - Collapsible in mobile view to save space

### Attachment CRUD Operations

#### Create Flow
1. **Trigger**: User clicks "Attachments" button in entity header or "Add Attachment" button in attachments section
2. **Dialog Display**: System shows the `AttachmentDialog` modal centered on screen
3. **Form Input**:
   - URL field (required) with validation for proper URL format
   - Optional title field (will be auto-extracted if left blank)
   - Clear field validation with inline error messages
4. **Submission**:
   - "Add Attachment" button becomes disabled during submission with loading indicator
   - On success: dialog closes and attachment list refreshes with new item
   - On error: dialog remains open with error message displayed

#### Read/View Flow
1. **Attachment List View**:
   - Grid layout on desktop (3 columns)
   - List layout on mobile (single column)
   - Each attachment displayed as a card with title, URL preview, and type indicator
   - Consistent with existing card patterns in the application

2. **Card Components**:
   - Type icon in top-right corner (Figma, Google Doc, PDF, etc.)
   - Title displayed prominently
   - URL preview (truncated with ellipsis)
   - "Open" and "Remove" actions in card footer
   - Hover state consistent with other UI cards

3. **Attachment Preview**:
   - Clicking attachment card (not action buttons) opens preview
   - Preview modal centered on screen with appropriate sizing
   - Close button and escape key dismissal
   - External link button to open in new tab

#### Update Flow
- This version does not support editing attachments after creation
- Users must delete and recreate attachments to update

#### Delete Flow
1. **Trigger**: User clicks "Remove" button on attachment card
2. **Confirmation**: System shows confirmation dialog using the existing `ConfirmationDialog` component
   - Title: "Remove Attachment"
   - Message: "Are you sure you want to remove this attachment? This action cannot be undone."
   - Cancel and Confirm buttons
3. **Processing**:
   - Confirm button shows loading state during deletion
   - On success: dialog closes and attachment is removed from list
   - On error: dialog shows error message

### Attachment Previews

#### Preview Types
- **Images**: Direct inline preview within a modal dialog
- **PDFs**: Embedded PDF viewer if browser supports, otherwise link to open
- **Figma Designs**: Embedded Figma preview using their embed API
- **Google Docs**: Embedded preview using Google Docs embed API
- **Generic Links**: Website favicon, title, and description with link to open

#### Preview Component
- `AttachmentPreview` component handles different content types
- Adapts layout based on content type and available metadata
- Consistent modal UI across all preview types
- Fallback to simple link display for unsupported types

### Error States & Empty States

#### Error Handling
- **Network Errors**:
  - Non-blocking toast notifications using `toast` from UI library
  - Retry mechanism for failed operations
  - Error details logged to console, user-friendly messages displayed

- **Invalid URLs**:
  - Form validation prevents submission with clear error message
  - Auto-correction suggestions when possible (adding https://, etc.)

- **Permission Errors**:
  - Clear messaging when user lacks permission to add/remove attachments
  - Disabled UI elements with tooltip explanations

#### Empty States
- **No Attachments**:
  - Friendly empty state message: "No attachments yet"
  - "Add Attachment" button prominently displayed
  - Consistent with other empty states in the application
  - Example illustration or icon matching the application style

### Placement on Entity Pages

#### Feature Entity Page
- **Attachments Section**: Located below feature description, above requirements list
- **Section Layout**: Full width with "Attachments" heading and attachment cards in grid/list
- **Card Layout**: 3-column grid on desktop, single column on mobile/tablet
- **Add Button**: "+ Add Attachment" button aligned with section heading

#### Requirement Entity Page
- **Attachments Section**: Located below requirement details, above acceptance criteria
- **Inheritance**: Shows attachments from parent feature with visual indication (tag/badge)
- **Section Layout**: Similar to feature page but with parent attachment distinction

#### Release Entity Page
- **Attachments Section**: Below release notes, above feature list
- **Section Layout**: Identical to feature page layout for consistency

### Responsive Behavior

#### Desktop (1024px+)
- Full attachment grid (3 columns)
- Preview dialog sized to 60% of viewport
- Attachment cards show all metadata and actions

#### Tablet (768px - 1023px)
- Reduced attachment grid (2 columns)
- Preview dialog sized to 80% of viewport
- Card layout maintained with slight size reduction

#### Mobile (< 768px)
- Single column list view for attachments
- Full-screen preview dialog
- Collapsed sections with expand/collapse toggle
- Simplified card layout with essential information

### Accessibility Considerations

- All interactive elements accessible via keyboard
- ARIA labels for attachment cards and controls
- Focus management in dialogs follows established patterns
- Color contrast meets WCAG 2.1 AA standards
- Screen reader-friendly attachment representations

### Visual Design Elements

#### Attachment Type Indicators
- **Figma**: Figma logo icon in blue
- **Google Docs**: Google Docs icon in appropriate color
- **PDF**: Document icon in red
- **Image**: Image icon in green
- **Generic**: Link icon in gray

#### Dialog Design
- Follows existing dialog design patterns from shadcn/ui
- Consistent padding, typography, and button styling
- Dark theme compatibility with proper color variables

#### Attachment Cards
- Consistent with existing card designs
- Light hover effect matching other interactive cards
- Clear visual hierarchy of information
- Type indication through both icon and subtle color coding

### Usage Patterns & Best Practices

1. **Attachment Button**
   - Always visible in entity header action bar
   - Badge indicator only shows when count > 0
   - Consistent placement across all entity types

2. **Attachment Section**
   - Always present on entity pages even when empty
   - Collapsible on mobile when space is limited
   - Consistent heading style matching other sections

3. **Attachment Dialog**
   - Focused, simple interface for adding links
   - URL field receives focus automatically on open
   - Tab order follows logical progression

4. **Preview Experience**
   - Non-disruptive, modal-based approach
   - Optimized for the specific content type
   - Always provides fallback to external viewing

This UI/UX design ensures the attachments feature fits seamlessly into the existing application patterns while providing an intuitive and consistent experience across all entity types and viewport sizes.

## Engineering Design

### Data Model

#### TypeScript Types and Interfaces

The following types should be defined in `/src/types/models/Attachment.ts` to ensure consistency across the application:

```typescript
/**
 * Types of entities that can have attachments
 */
export type EntityType = 'feature' | 'requirement' | 'release';

/**
 * Supported attachment types with specific handling
 */
export type AttachmentType =
  'figma' | 'googleDoc' | 'image' | 'pdf' | 'miro' | 'generic' | 'other';

/**
 * Core Attachment Entity
 */
export interface Attachment {
  id: string;                  // Unique identifier
  title: string;               // User-provided or auto-extracted title
  url: string;                 // Link to external resource
  type: AttachmentType;        // File type or service (Figma, Google Docs, etc.)
  thumbnailUrl?: string;       // Optional thumbnail image URL
  createdAt: string;           // Creation timestamp
  updatedAt: string;           // Last update timestamp
  entityId: string;            // ID of the parent entity (feature, requirement, etc.)
  entityType: EntityType;      // Type of the parent entity
  metadata?: Record<string, any>; // Additional service-specific metadata
}

/**
 * Request shape for creating a new attachment
 */
export interface CreateAttachmentRequest {
  url: string;
  title?: string;
  entityId: string;
  entityType: EntityType;
  thumbnailUrl?: string;
}

/**
 * Response shape for attachment operations
 */
export interface AttachmentResponse {
  success: boolean;
  data?: Attachment | Attachment[];
  error?: string;
}

/**
 * Props for attachment component interfaces
 */
export interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export interface AttachmentCardProps {
  attachment: Attachment;
  onRemove: (id: string) => Promise<void> | void;
  onView?: (attachment: Attachment) => void;
}

export interface AttachmentButtonProps {
  count: number;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export interface AttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string, title?: string) => Promise<void> | void;
  isLoading?: boolean;
}

/**
 * Type for extracted URL metadata
 */
export interface UrlMetadata {
  title?: string;
  type: AttachmentType;
  thumbnailUrl?: string;
  favicon?: string;
  description?: string;
  serviceSpecific?: Record<string, any>;
}
```

#### Database Schema
```sql
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (entity_id) REFERENCES features(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Additional foreign key constraints would be added for requirements and releases
```

### Component Architecture

#### 1. Attachment System Components

Following the project's pattern of flat component organization and naming conventions:

```
/src/providers/
  └── attachment-provider.tsx      # Context provider for attachment functions

/src/components/
  ├── attachment-button.tsx        # Header button component using shadcn Button
  ├── attachment-list.tsx          # Main container for displaying attachments
  ├── attachment-card.tsx          # Individual attachment display using shadcn Card
  ├── attachment-dialog.tsx        # Dialog using shadcn Dialog (note: renamed from modal to dialog)
  ├── attachment-form.tsx          # Form using shadcn Form components
  ├── attachment-preview.tsx       # Preview component with type-specific rendering
  └── attachment-utils.ts          # Utility functions for attachment handling
```

#### 2. Hooks Architecture

The hooks layer follows the project's existing pattern of using React Query for data fetching and mutations. Following the project's flat hook organization:

```
/src/hooks/
  ├── use-attachments-query.ts      # Core hook for attachment operations
  └── use-entity-attachments-query.ts # Hook for retrieving parent entity attachments
```

Hooks should follow these design principles:
- Focus on a single responsibility
- Use React Query for data fetching and state management
- Follow the existing pattern of other query hooks in the project
- Use TypeScript for strict typing

```typescript
// Hook for entity-specific attachment operations
export function useAttachmentsQuery(entityId: string, entityType: EntityType) {
  const queryClient = useQueryClient();
  const queryKey = ['attachments', entityId, entityType];

  // Query for fetching attachments
  const attachmentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(
        `/api/attachments-db?entityId=${entityId}&entityType=${entityType}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attachments');
      }

      return await response.json() as Attachment[];
    },
    enabled: !!entityId && !!entityType,
  });

  // Mutation for adding an attachment
  const addAttachmentMutation = useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const response = await fetch('/api/attachments-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title,
          entityId,
          entityType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add attachment');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refetch attachments
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for removing an attachment
  const removeAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await fetch(
        `/api/attachments-db?id=${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove attachment');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refetch attachments
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    attachments: attachmentsQuery.data || [],
    isLoading: attachmentsQuery.isLoading,
    error: attachmentsQuery.error,
    addAttachment: addAttachmentMutation.mutateAsync,
    removeAttachment: removeAttachmentMutation.mutateAsync,
    isAddingAttachment: addAttachmentMutation.isLoading,
    isRemovingAttachment: removeAttachmentMutation.isLoading,
  };
}
```

#### 3. Integration with Entity Components

```typescript
// Example usage in FeatureContent component
function FeatureContent({ featureId }: { featureId: string }) {
  // Use our hooks at the top of the component
  const {
    attachments,
    isLoading,
    addAttachment,
    removeAttachment,
    isAddingAttachment
  } = useAttachmentsQuery(featureId, 'feature');

  // Local state management
  const [open, setOpen] = useState(false);

  // Handle error and loading states
  if (isLoading) {
    return <div className="p-4">Loading attachments...</div>;
  }

  // Extract complex rendering to keep JSX clean
  const renderAttachmentsList = () => {
    if (attachments.length === 0) {
      return <div className="text-muted-foreground">No attachments yet</div>;
    }

    return (
      <AttachmentList
        attachments={attachments}
        onRemove={removeAttachment}
        isLoading={isLoading}
      />
    );
  };

  // Keep component JSX clean with minimal nesting
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{feature.name}</h1>
        <div className="flex items-center space-x-2">
          <AttachmentButton
            count={attachments.length}
            onClick={() => setOpen(true)}
          />
          {/* Other action buttons */}
        </div>
      </div>

      {/* Feature description section */}

      {/* Attachments section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attachments</h2>
        {renderAttachmentsList()}
      </div>

      {/* Use shadcn Dialog component through our wrapper */}
      <AttachmentDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={addAttachment}
        isLoading={isAddingAttachment}
      />

      {/* Requirements section would come after */}
    </div>
  );
}
```

### Service Layer Design

The service layer is responsible for database operations and business logic related to attachments. Following the project's flat service organization pattern:

```
/src/services/
  └── attachments-db.ts          # Core attachment database operations with metadata utilities
```

Service layer patterns:
- Use clear, descriptive function names that indicate the operation and target
- Handle errors consistently with try/catch blocks
- Return structured responses with success/error indicators
- Use TypeScript for parameter and return type safety
- Follow the same patterns as other database services in the project

#### 1. Attachment Service

```typescript
// src/services/attachments-db.ts

// Create a new attachment
export async function createAttachmentInDb(attachment: Omit<Attachment, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  try {
    // Extract metadata if URL is from a known service
    let metadata = {};
    let type = 'generic';

    if (attachment.url.includes('figma.com')) {
      type = 'figma';
      metadata = await extractFigmaMetadata(attachment.url);
    } else if (attachment.url.includes('docs.google.com')) {
      type = 'googleDoc';
      metadata = await extractGoogleDocMetadata(attachment.url);
    }
    // Add more service detection as needed

    db.prepare(`
      INSERT INTO attachments (
        id, title, url, type, thumbnail_url,
        created_at, updated_at, entity_id, entity_type, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      attachment.title || 'Untitled',
      attachment.url,
      attachment.type || type,
      attachment.thumbnailUrl || null,
      now,
      now,
      attachment.entityId,
      attachment.entityType,
      JSON.stringify(metadata)
    );

    return {
      success: true,
      data: {
        id,
        ...attachment,
        type: attachment.type || type,
        createdAt: now,
        updatedAt: now,
        metadata
      }
    };
  } catch (error) {
    console.error('Error creating attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get attachments for an entity
export async function getAttachmentsForEntityFromDb(entityId: string, entityType: EntityType) {
  const db = getDb();

  try {
    // Apply pagination for better performance with large datasets
    const page = 1;
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const attachments = db.prepare(`
      SELECT * FROM attachments
      WHERE entity_id = ? AND entity_type = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(entityId, entityType, pageSize, offset);

    // Map database column names to camelCase property names
    const formattedAttachments = attachments.map(att => ({
      id: att.id,
      title: att.title,
      url: att.url,
      type: att.type,
      thumbnailUrl: att.thumbnail_url,
      createdAt: att.created_at,
      updatedAt: att.updated_at,
      entityId: att.entity_id,
      entityType: att.entity_type,
      metadata: att.metadata ? JSON.parse(att.metadata) : {}
    }));

    return { success: true, data: formattedAttachments };
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Additional functions for updating, deleting, etc.
```

#### 2. URL Metadata Extraction

We'll implement URL metadata functions in the same file to maintain a flat structure:

```typescript
// In src/services/attachments-db.ts

export async function extractUrlMetadata(url: string): Promise<{
  title: string;
  type: AttachmentType;
  thumbnailUrl?: string;
  metadata?: any;
}> {
  // For external APIs, we'd use a server endpoint to avoid CORS issues

  // Basic implementation that extracts from URL patterns
  if (url.includes('figma.com')) {
    return extractFigmaMetadata(url);
  } else if (url.includes('docs.google.com')) {
    return extractGoogleDocsMetadata(url);
  } else if (url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
    return {
      title: getFileNameFromUrl(url),
      type: 'image',
      thumbnailUrl: url
    };
  }

  // Default generic handling
  return {
    title: getFileNameFromUrl(url) || 'Untitled Link',
    type: 'generic'
  };
}

function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    // Remove extension and replace hyphens/underscores with spaces
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  } catch (e) {
    return '';
  }
}
```

### API Routes Design

#### 1. Attachment Routes

Following the project's pattern for API routes:

```typescript
// src/app/api/attachments-db/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  createAttachmentInDb,
  getAttachmentsForEntityFromDb,
  deleteAttachmentFromDb
} from '@/services/attachments-db';

// GET handler for fetching attachments
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Entity ID and type are required' },
        { status: 400 }
      );
    }

    const result = await getAttachmentsForEntityFromDb(
      entityId,
      entityType as EntityType
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in attachments GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new attachment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.url || !body.entityId || !body.entityType) {
      return NextResponse.json(
        { error: 'URL, entity ID, and entity type are required' },
        { status: 400 }
      );
    }

    const result = await createAttachmentInDb({
      title: body.title,
      url: body.url,
      type: body.type,
      thumbnailUrl: body.thumbnailUrl,
      entityId: body.entityId,
      entityType: body.entityType,
      metadata: body.metadata
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in attachments POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing an attachment
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteAttachmentFromDb(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in attachments DELETE:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### Handling Inheritance Between Entities

For displaying attachments from parent entities (e.g., showing feature attachments in requirements), we'll implement a specialized API endpoint following the project's naming convention:

```typescript
// src/app/api/attachments-inherited-db/route.ts

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Entity ID and type are required' },
        { status: 400 }
      );
    }

    // For requirements, get the parent feature's attachments
    if (entityType === 'requirement') {
      const requirement = await getRequirementById(entityId);
      if (requirement?.featureId) {
        const result = await getAttachmentsForEntityFromDb(
          requirement.featureId,
          'feature'
        );

        if (result.success) {
          return NextResponse.json({
            parentType: 'feature',
            parentId: requirement.featureId,
            attachments: result.data
          });
        }
      }
    }

    // Return empty array if no parent or no attachments
    return NextResponse.json({
      parentType: null,
      parentId: null,
      attachments: []
    });
  } catch (error) {
    console.error('Error in inherited attachments GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### Implementation Strategy for Code Reuse and Consistency

#### Reusing Existing shadcn/ui Components

Rather than building custom UI components from scratch, the attachment system will leverage existing shadcn/ui components, following the project's best practices:

1. **Component Composition Over Creation**
   - Use existing shadcn/ui components as building blocks
   - Create wrapper components that compose these building blocks instead of creating new basic UI elements

2. **Examples of Component Reuse**

   a) **AttachmentButton** - Uses `Button` from shadcn/ui:
   ```tsx
   import { Button } from "@/components/ui/button";
   import { Paperclip } from "lucide-react";
   import { Badge } from "@/components/ui/badge";

   interface AttachmentButtonProps {
     count: number;
     onClick: () => void;
   }

   export function AttachmentButton({ count, onClick }: AttachmentButtonProps) {
     return (
       <Button variant="outline" size="sm" onClick={onClick} className="relative">
         <Paperclip className="h-4 w-4 mr-2" />
         Attachments
         {count > 0 && (
           <Badge variant="secondary" className="ml-2">
             {count}
           </Badge>
         )}
       </Button>
     );
   }
   ```

   b) **AttachmentDialog** - Uses `Dialog` and Form from shadcn/ui:
   ```tsx
   import { zodResolver } from "@hookform/resolvers/zod";
   import { useForm } from "react-hook-form";
   import * as z from "zod";
   import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
     DialogDescription,
     DialogFooter
   } from "@/components/ui/dialog";
   import { Button } from "@/components/ui/button";
   import {
     Form,
     FormControl,
     FormField,
     FormItem,
     FormLabel,
     FormMessage
   } from "@/components/ui/form";
   import { Input } from "@/components/ui/input";

   // Define form schema with zod
   const formSchema = z.object({
     url: z.string().url({ message: "Please enter a valid URL" }),
     title: z.string().optional(),
   });

   type AttachmentFormValues = z.infer<typeof formSchema>;

   interface AttachmentDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     onAdd: (url: string, title?: string) => Promise<void>;
     isLoading?: boolean;
   }

   export function AttachmentDialog({
     open,
     onOpenChange,
     onAdd,
     isLoading
   }: AttachmentDialogProps) {
     // Initialize form with react-hook-form and zod validation
     const form = useForm<AttachmentFormValues>({
       resolver: zodResolver(formSchema),
       defaultValues: {
         url: "",
         title: "",
       },
     });

     async function onSubmit(values: AttachmentFormValues) {
       await onAdd(values.url, values.title);
       form.reset();
       onOpenChange(false);
     }

     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add Attachment</DialogTitle>
             <DialogDescription>
               Add a link to an external resource or file.
             </DialogDescription>
           </DialogHeader>

           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField
                 control={form.control}
                 name="url"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>URL</FormLabel>
                     <FormControl>
                       <Input placeholder="https://..." {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               <FormField
                 control={form.control}
                 name="title"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Title (Optional)</FormLabel>
                     <FormControl>
                       <Input placeholder="Descriptive title" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               <DialogFooter>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => onOpenChange(false)}
                 >
                   Cancel
                 </Button>
                 <Button type="submit" disabled={isLoading}>
                   {isLoading ? "Adding..." : "Add Attachment"}
                 </Button>
               </DialogFooter>
             </form>
           </Form>
         </DialogContent>
       </Dialog>
     );
   }
   ```

   c) **AttachmentCard** - Uses `Card` from shadcn/ui:
   ```tsx
   import { Card, CardContent, CardFooter } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   import { ExternalLink, Trash2 } from "lucide-react";

   interface AttachmentCardProps {
     attachment: Attachment;
     onRemove: (id: string) => Promise<void>;
   }

   export function AttachmentCard({ attachment, onRemove }: AttachmentCardProps) {
     return (
       <Card>
         <CardContent className="p-4">
           <div className="flex items-start justify-between">
             <div>
               <h3 className="font-medium">{attachment.title}</h3>
               <p className="text-sm text-muted-foreground truncate max-w-xs">{attachment.url}</p>
             </div>
             <div className="flex-shrink-0">
               {/* Thumbnail or type icon here */}
             </div>
           </div>
         </CardContent>
         <CardFooter className="flex justify-between p-4 pt-0">
           <Button variant="ghost" size="sm" asChild>
             <a href={attachment.url} target="_blank" rel="noopener noreferrer">
               <ExternalLink className="h-4 w-4 mr-1" /> Open
             </a>
           </Button>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => onRemove(attachment.id)}
             className="text-destructive hover:text-destructive/90"
           >
             <Trash2 className="h-4 w-4 mr-1" /> Remove
           </Button>
         </CardFooter>
       </Card>
     );
   }
   ```

3. **Focused Custom Components**
   - Custom components should focus solely on business logic specific to attachments
   - UI elements should always use the shadcn/ui component library
   - Follow Tailwind class naming conventions for consistency

4. **Consistent Component Props**
   - Follow shadcn/ui component prop patterns (e.g., `open/onOpenChange` for modals)
   - Maintain consistent naming and event handler patterns
   - Use TypeScript interfaces to document expected props

5. **Design for Composition**
   - Make components small and focused on a single responsibility
   - Allow flexibility in how components are composed together
   - Use React context for sharing attachment-related state and functions

6. **Establish Clear Patterns**
   - Create a consistent UI pattern across all entity types
   - Standardize prop names and callback patterns
   - Document component usage with examples

This architecture promotes code reuse, maintains consistency across entity types, follows the existing design system, and allows for future extension to other entity types as needed.

## Storage and Security
- **Size Limits**: Implement maximum size limits for attachments (e.g., 10MB per attachment)
- **Validation**: Validate URLs before storage to prevent abuse
- **CORS Policy**: Implement proper CORS settings for external resource access
- **Content Security**: Apply content security policies for embedded content
- **Access Control**: No special sharing permissions required in initial implementation
- **Tenant Awareness**: Ensure attachments respect multi-tenant isolation when implemented

## Implementation Phases

### Phase 1: Core Functionality
- Basic attachment support for Features, Requirements, and Releases
- Support for external links (URLs)
- Simple list view of attachments
- Core database schema and API implementation
- Unit tests for attachment service functions

### Phase 2: Enhanced Preview
- Inline previews for supported file types
- Improved organization and categorization
- Error handling and edge case improvements
- Performance optimizations

### Phase 3: Specialized Integrations
- Enhanced previews for design tools (Figma, etc.)
- Additional attachment capabilities based on user feedback
- Accessibility improvements
- Integration with notification system when available

## Testing Strategy

### Unit Tests
- Test all database service functions with Jest
- Test URL metadata extraction with mock responses
- Test attachment business logic in isolation

### Integration Tests
- Test API endpoints with mock database calls
- Verify data flow through hooks to components

### Component Tests
- Test UI components with React Testing Library
- Verify accessibility compliance

### Error Handling
- Test boundary conditions and error paths
- Verify graceful degradation when services are unavailable
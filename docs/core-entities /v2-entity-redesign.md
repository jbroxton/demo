# Entity Redesign: Notion-Style Architecture

## Overview
Replace specialized entities (Products, Features, Releases, etc.) with a unified Page + Block system inspired by Notion's API architecture.

## Core Entities

### Pages
- **Primary containers** for all content
- **Types**: `roadmap`, `feature`, `release`, `project` (enforced at database level)
- **Hierarchy**: Pages reference other pages via `parent_id` field
- **Properties**: Type-specific metadata stored as structured JSON following Notion's property value patterns
- **Association**: Blocks connect to pages via `parent_id` foreign key

### Blocks
- **Content units** within pages
- **Types**: `paragraph`, `heading`, `goal`, `criteria`, `attachment`, `requirement`, `table`
- **Parent Relationship**: Every block has `parent_id` pointing to a page (or nested block)
- **Ordering**: Sequential `position` field determines display order within parent
- **Nesting**: Blocks can contain child blocks (e.g., list items within lists)

## Hierarchy Rules

### Page Relationships
- Any page type can be a child of any other page type
- Pages can exist at workspace root (no parent)
- Maximum nesting depth: 5 levels
- Parent changes preserve all child relationships

### Examples
```
Workspace
├── Roadmap: "2024 Platform"
│   ├── Feature: "User Authentication"
│   └── Feature: "Dashboard v2"
├── Project: "Mobile App"
│   ├── Feature: "Login Flow"
│   └── Release: "v1.0"
└── Feature: "Standalone Feature"
```

## Block Attachment Rules

### Block-to-Page Binding
- Blocks belong to exactly one page
- Blocks cannot exist without a parent page
- Block types are unrestricted by page type

### Block Ordering
- Position-based ordering within page
- Reordering updates position values
- Gaps in position numbers are acceptable

### Block Content Structure
Blocks follow Notion's polymorphic pattern with type-specific content:
```
Goal Block: { type: 'goal', content: { title, description, status, assignee } }
Criteria Block: { type: 'criteria', content: { description, acceptance_test, status } }
Attachment Block: { type: 'attachment', content: { url, title, file_type } }
Requirement Block: { type: 'requirement', content: { name, priority, owner, cuj } }
Paragraph Block: { type: 'paragraph', content: { rich_text: [...] } }
```

### Property Value System
Page properties use Notion's property value structure for type safety:
```
Priority Property: { type: 'select', select: { name: 'High', color: 'red' } }
Owner Property: { type: 'person', people: [{ id: 'user123', name: 'John' }] }
Due Date Property: { type: 'date', date: { start: '2024-03-15', end: null } }
Roadmap Relation: { type: 'relation', relation: [{ id: 'roadmap-q1' }] }
OKR Relation: { type: 'relation', relation: [{ id: 'okr-growth' }] }
Release Relation: { type: 'relation', relation: [{ id: 'release-v2' }] }
```

### Cross-Cutting Relationships
Pages use **relation properties** for cross-organizational assignments:
- **Primary hierarchy**: Single `parent_id` for organizational structure
- **Secondary relationships**: Relation properties for planning contexts

Example Feature with multiple relationships:
```
Feature "User Authentication" {
  parent_id: "product-platform",  // Organizational home
  properties: {
    roadmap: { type: "relation", relation: [{ id: "roadmap-q1-2024" }] },
    okr: { type: "relation", relation: [{ id: "okr-user-growth" }] },
    release: { type: "relation", relation: [{ id: "release-v2-1" }] },
    priority: { type: "select", select: { name: "High", color: "red" } }
  }
}
```

## Migration Strategy

### Entity Mapping
- Products → Pages (type: `project`)
- Interfaces → Pages (type: `feature`, parent: project)
- Features → Pages (type: `feature`)
- Releases → Pages (type: `release`)
- Requirements → Blocks (type: `requirement`)
- Documents → Convert to multiple blocks

### Relationship Preservation
- Maintain existing parent-child relationships
- Convert entity-specific content to appropriate block types
- Preserve all metadata as page/block properties

## Data Schema Design

### Final Schema: JSON Block Storage (Implemented)

**Chosen Approach**: Store blocks as JSONB array within pages table for optimal performance and simplicity.

### Page Table Structure (Supabase)
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('roadmap', 'feature', 'release', 'project')),
  title TEXT NOT NULL,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  block_count INTEGER DEFAULT 0,
  last_block_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_edited_by UUID REFERENCES auth.users(id)
);
```

### Block Structure (JSON within pages.blocks)
Each block in the JSONB array follows this structure:
```typescript
interface Block {
  id: string;                    // UUID generated when block is created
  type: BlockType;              // 'paragraph', 'heading', 'requirement', 'document', etc.
  content: Record<string, any>; // Type-specific content (see examples below)
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

### Block Content Examples
```typescript
// Document block (TipTap integration)
{
  id: "block-001",
  type: "document",
  content: {
    tiptap_content: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Rich text content..." }] }
      ]
    },
    word_count: 45,
    character_count: 250
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}

// Requirement block
{
  id: "block-002", 
  type: "requirement",
  content: {
    name: "Secure Login Flow",
    priority: "High",
    owner: "John Doe",
    cuj: "As a user, I want to securely log into the platform",
    status: "In Progress"
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}

// Criteria block
{
  id: "block-003",
  type: "criteria", 
  content: {
    description: "User must be able to log in within 3 seconds",
    acceptance_test: "Login form accepts valid credentials and redirects",
    status: "Draft"
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### Schema Benefits

**Performance Advantages:**
- Single database query to get page + all blocks
- Atomic updates for block operations
- Efficient JSONB indexing for block content searches
- Reduced JOIN complexity

**AI Query Capabilities:**
- Full-text search across block content: `WHERE blocks::text ILIKE '%search_term%'`
- Type-specific queries: `WHERE blocks @> '[{"type": "requirement"}]'`
- Property-based filtering: `WHERE blocks @> '[{"content": {"priority": "High"}}]'`

**Operational Benefits:**
- Simplified backup/restore (single table)
- Easier replication and caching
- Block operations are transactional by default
- Automatic block_count and last_block_update tracking

### Versioning Strategy
Following Notion's approach:
- **Simple timestamp tracking** on pages and blocks
- No complex version history in MVP
- `updated_at` and `last_edited_by` for basic change tracking
- Can add version snapshots later if needed

## AI Query Benefits

### Semantic Clarity Preserved
- Strong typing via `type` field enables precise AI queries
- Property schemas ensure consistent data structures
- Clear parent-child relationships via `parent_id` associations

### Query Examples
```sql
-- "Show me high priority features"
SELECT * FROM pages 
WHERE type = 'feature' 
AND properties->'priority'->'select'->>'name' = 'High';

-- "What features are in Q1 roadmap?"
SELECT * FROM pages 
WHERE type = 'feature' 
AND properties->'roadmap'->'relation' @> '[{"id": "roadmap-q1-2024"}]';

-- "Show features supporting the growth OKR"
SELECT * FROM pages 
WHERE type = 'feature' 
AND properties->'okr'->'relation' @> '[{"id": "okr-user-growth"}]';

-- "What requirements are in the auth feature?"
SELECT b.* FROM blocks b 
JOIN pages p ON b.parent_id = p.id 
WHERE p.type = 'feature' AND p.title ILIKE '%auth%' 
AND b.type = 'requirement';

-- "Roadmap progress: completed features"
SELECT COUNT(*) FROM pages 
WHERE properties->'roadmap'->'relation' @> '[{"id": "roadmap-q1-2024"}]'
AND properties->'status'->'select'->>'name' = 'Complete';
```

## Benefits

### Development
- Single page editor replaces 5+ entity-specific components
- Unified CRUD operations for all content types
- Consistent UI patterns across all entity types
- Type-safe property system prevents data inconsistencies

### User Experience
- Flexible content organization with enforced business rules
- Uniform editing experience across all entity types
- Natural content nesting and relationships
- Rich content mixing (text, tables, attachments) in any page

### Scalability
- Easy addition of new page/block types without schema changes
- Simplified AI agent integration with semantic clarity
- Reduced codebase complexity (~70% reduction)
- Property system extensible without database migrations

## Implementation Plan

### Phase 1: Database Foundation
**Goal**: Establish new schema and migration from existing entities

**Tasks:**
1. **Database Migration**
   - Create `pages` table with type constraints
   - Create `blocks` table with position ordering
   - Add indexes for performance queries
   - Implement database constraints for valid hierarchies

2. **Data Migration Script**
   - Convert existing Products → Pages (type: 'project')
   - Convert existing Features → Pages (type: 'feature')
   - Convert existing Requirements → Blocks (type: 'requirement')
   - Preserve relationships via parent_id and relation properties

3. **Service Layer Foundation**
   - Create `pages-db.ts` service with CRUD operations
   - Create `blocks-db.ts` service with CRUD operations
   - Implement property validation logic
   - Add multi-tenant isolation

**Phase 1 Tests (Real Data Required):**
- Test 1: Create project page with feature children, verify hierarchy via parent_id
- Test 2: Add roadmap relation property to feature, query features by roadmap
- Test 3: Create requirement blocks under feature page, verify ordering by position
- Test 4: Test property validation - reject invalid select values, enforce required fields
- Test 5: Verify tenant isolation - user A cannot access user B's pages/blocks

### Phase 2: API Routes & Core Operations
**Goal**: Build REST API endpoints for pages and blocks

**Tasks:**
1. **API Routes**
   - Create `/api/pages/route.ts` (GET, POST)
   - Create `/api/pages/[id]/route.ts` (GET, PATCH, DELETE)
   - Create `/api/pages/[id]/blocks/route.ts` (GET, POST)
   - Create `/api/blocks/[id]/route.ts` (GET, PATCH, DELETE)

2. **Property System**
   - Implement property schema validation per page type
   - Add relation property query helpers
   - Create property value transformation utilities

3. **Business Logic**
   - Implement hierarchy depth validation (max 5 levels)
   - Add circular reference prevention
   - Create orphan cleanup for deleted pages

**Phase 2 Tests (Real Data Required):**
- Test 6: POST new feature page with roadmap relation, verify via GET request
- Test 7: PATCH page properties, verify only valid properties allowed per type
- Test 8: DELETE page with children, verify children become orphaned or cascade deleted
- Test 9: Create blocks via API, verify position ordering maintained
- Test 10: Test relation queries - find all features for specific roadmap

### Phase 3: React Hooks & State Management
**Goal**: Create React Query hooks for pages and blocks

**Tasks:**
1. **Query Hooks**
   - Create `usePageQuery(id)` hook for single pages
   - Create `usePagesQuery(filters)` hook for page collections
   - Create `useBlocksQuery(pageId)` hook for page contents
   - Add optimistic updates and caching

2. **Mutation Hooks**
   - Implement page CRUD mutations with invalidation
   - Implement block CRUD mutations with position management
   - Add property update mutations with validation

3. **Specialized Hooks**
   - Create `usePageHierarchy(pageId)` for tree navigation
   - Create `useRelatedPages(pageId, relationType)` for relations
   - Add `usePagesByType(type)` for type-specific queries

**Phase 3 Tests (Real Data Required):**
- Test 11: Hook returns real page data with correct type and properties
- Test 12: Mutation hook creates page, cache updates, optimistic UI works
- Test 13: Block reordering via mutation maintains position consistency
- Test 14: Relation property updates trigger related page cache invalidation
- Test 15: Page deletion removes from all related caches and updates UI

### Phase 4: Unified Components
**Goal**: Replace entity-specific components with unified page/block editors

**Tasks:**
1. **Core Components**
   - Create `<PageEditor pageId={id} />` component
   - Create `<BlockEditor blockId={id} />` component
   - Implement property editing based on page type
   - Add drag-and-drop block reordering

2. **Specialized Views**
   - Create `<PageHierarchy />` tree navigation component
   - Create `<RelationSelector />` for linking pages
   - Add `<PropertyEditor />` with type-specific forms

3. **Legacy Replacement**
   - Replace `EntityCreator` with unified page creation
   - Replace tab content components with `<PageEditor />`
   - Update navigation to use page hierarchy

**Phase 4 Tests (Real Data Required):**
- Test 16: PageEditor loads real feature data and allows editing all properties
- Test 17: Block reordering in UI updates database positions correctly
- Test 18: Property relation selector shows only valid target pages
- Test 19: Page creation with parent selection creates proper hierarchy
- Test 20: Legacy entity tabs replaced with new PageEditor, same functionality

### Success Criteria
Each phase must pass all tests with **real production data** before proceeding to next phase. Tests should use actual database operations, not mocks, to validate the full data flow from database to UI.

**Focus Areas for MVP:**
- **CRUD Operations**: Create, read, update, delete pages and blocks
- **Organization**: Proper hierarchy and relation management  
- **Tab Rendering**: Unified page editor replaces entity-specific tabs
- **UI Responsiveness**: Real-time updates and optimistic UI
- **Database Performance**: Efficient queries and proper indexing

**Out of Scope for Initial Implementation:**
- AI integration (Phase 5)
- Advanced search features
- Complex workflow automation
- Bulk operations

## Implementation Notes

**Status**: Phase 1-3 partially implemented (functional CRUD operations)

### What Was Implemented
1. **Database**: Pages table exists with JSONB block storage (via Supabase migration)
2. **Service Layer**: `pages-db.ts` using unified Supabase client pattern (matches `features-db.ts`)
3. **API Routes**: `/api/pages-db/route.ts` with authenticated handler following proven pattern
4. **React Hooks**: `use-pages-query.ts` with React Query integration
5. **UI Integration**: 
   - EntityCreator supports page creation
   - Tab system renders pages via PageEditor
   - Sidebar navigation shows pages list
   - Page opening/editing works end-to-end

### Key Implementation Patterns
- **Authentication**: Uses same `authenticatedHandler` as working entities (features/products)
- **Validation**: Uses existing `validateRequired` utility (returns `string | null`)
- **State Management**: React Query with optimistic updates and cache management
- **Type System**: Added `'page'` to Tab union type for tab integration

### Discovered Patterns (For Future Entity Updates)
1. **Service Layer**: Must import `{ supabase }` from `./supabase` (service role key)
2. **API Routes**: Must use `{ tenantId, body }` from `authenticatedHandler` (body pre-parsed)
3. **Validation**: Use `validateRequired(body, fields)` returning `string | null`
4. **Tab Integration**: Add entity type to Tab type definition + tab content renderer

### Ready for Production Use
- ✅ Page CRUD operations work
- ✅ Pages appear in sidebar navigation  
- ✅ Pages open in tabs and render correctly
- ✅ Authentication and tenant isolation working
- ✅ Follows established codebase patterns

### Next Steps for Full Migration
1. Update remaining entities (products, features, etc.) to use same patterns
2. Implement block operations within pages (currently basic JSONB array)
3. Add property validation and page type schemas
4. Replace entity-specific components with unified PageEditor
# Modular Architecture for Speqq

## Overview

This document outlines the transition from Speqq's current fixed hierarchy (Product > Interface > Feature > Release) to a flexible, modular "building block" architecture that allows teams to create arbitrary hierarchies according to their specific needs.

## Core Concepts

### Building Blocks vs Fixed Entities

**Current Architecture:**
- Fixed hierarchy with predefined entity types
- Rigid parent-child relationships
- Each entity type has predefined properties and behaviors

**Modular Architecture:**
- Generic "Block" entities that can be composed in any hierarchy
- Flexible relationships (parent-child, sibling, reference)
- Property sets that can be attached to any block type

### Block Types

Instead of hardcoded entity types, we'll have:

1. **Blocks** - Core entities that can be arranged in any hierarchy
2. **BlockTypes** - Templates defining common block configurations 
3. **BlockRelationships** - Define how blocks connect to each other
4. **BlockProperties** - Data fields attached to blocks

## Database Schema

### Core Tables

```sql
-- Define types of blocks
CREATE TABLE block_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- The actual block instances
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  block_type_id TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (block_type_id) REFERENCES block_types(id),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Define relationships between blocks
CREATE TABLE block_relationships (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  relation_type TEXT NOT NULL, -- e.g., "contains", "references", "depends_on"
  order_index INTEGER NOT NULL, -- For maintaining order of children
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES blocks(id),
  FOREIGN KEY (child_id) REFERENCES blocks(id),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Property definitions (templates)
CREATE TABLE property_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL, -- "string", "number", "date", "boolean", "enum", "richtext"
  block_type_id TEXT, -- NULL means can apply to any block type
  required BOOLEAN NOT NULL DEFAULT 0,
  default_value TEXT,
  enum_values TEXT, -- JSON array for enum types
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (block_type_id) REFERENCES block_types(id),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Actual property values for blocks
CREATE TABLE block_properties (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL,
  property_definition_id TEXT NOT NULL,
  value TEXT, -- Stored as text, interpreted based on property_definition.data_type
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id),
  FOREIGN KEY (property_definition_id) REFERENCES property_definitions(id),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);
```

## UI Component Architecture

### Generic Block Component

Create a flexible `BlockComponent` that can:
- Render any block type based on its properties
- Show appropriate editing controls for each property type
- Support drag-and-drop for rearranging blocks in hierarchy
- Lazy-load child blocks for performance

### Property Editors

Build a library of property editors based on data types:
- Text fields (with rich text support)
- Number inputs with validation
- Date pickers
- Dropdown selectors
- Boolean toggles
- Custom property types (requirements, approvals, etc.)

### Block Type Templates

Pre-configured templates for common product entities:
- Product block type
- Feature block type
- Requirement block type
- Release block type
- Custom block types created by users

## Migration Strategy

### Phase 1: Parallel Systems

1. Build the modular system alongside existing entities
2. Start by allowing modular blocks to be attached to Products
3. New projects can use either the fixed hierarchy or the modular approach

### Phase 2: Data Migration

1. Create conversion utilities to transform fixed entities into blocks
2. Develop a migration wizard for users to transition existing projects
3. Implement data integrity validation to ensure no information is lost

### Phase 3: UI Transition

1. Gradually replace entity-specific UI with modular block components
2. Add new capabilities only to the modular system
3. Eventually deprecate the fixed-hierarchy system

## Prototype Implementation

### Minimal Viable Prototype

1. Create the core database tables for the modular system
2. Implement basic CRUD APIs for blocks and relationships
3. Build a simple UI for creating and arranging blocks
4. Start with a limited set of property types
5. Test with one or two sample use cases

### Integration Points with Current System

1. Allow Products to contain both Interfaces (old system) and Blocks (new system)
2. Build adapters to display legacy entities in the new UI
3. Ensure both systems can coexist during transition

## Questions to Resolve

1. How will we handle approval workflows in the modular system?
2. What migration path will offer the least disruption to users?
3. How do we balance flexibility with usability (too many options can be overwhelming)?
4. What performance considerations exist for deeply nested hierarchies?
5. How will permissions work with arbitrary hierarchies?

## Next Steps

1. Create database migrations for the new tables
2. Build basic API endpoints for managing blocks
3. Develop prototype UI for block creation and management
4. Test with sample product structures
5. Gather feedback and iterate on the design
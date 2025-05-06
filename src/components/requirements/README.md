# Requirements Table Components

This directory contains components for the Shadcn UI-based data table implementation for requirements.

## Components Overview

- `requirements-table.tsx` - Main component for displaying requirements, with filtering, sorting and pagination
- `data-table.tsx` - Reusable table component that can be used with any data type
- `data-table-toolbar.tsx` - Table toolbar with filtering and actions
- `data-table-pagination.tsx` - Pagination controls for the table
- `columns.tsx` - Column definitions for the requirements table
- `requirements-placeholder.tsx` - Wrapper component used by feature requirements section

## Cell Renderers

- `cell-renderers/editable-cell.tsx` - Cell component with in-place editing capabilities

## Usage

To use the requirements table in a feature context:

```tsx
import { RequirementsTable } from '@/components/requirements/requirements-table';

// For feature-specific requirements
<RequirementsTable featureId="feature-123" />

// For release-specific requirements
<RequirementsTable releaseId="release-456" />
```

## Features

- Row selection
- Column visibility control
- Sorting
- Pagination
- Filtering
- In-place cell editing
- Add new requirement
- Delete selected requirements

## Implementation Notes

This table implementation uses:

1. **React Query** via the `useRequirementsQuery` hook for data fetching and mutations
2. **Shadcn UI components** for UI elements
3. **TanStack Table** (via Shadcn implementation) for table functionality
4. **Tailwind CSS** for styling

It replaces the previous Material React Table implementation to provide better performance, styling consistency, and developer experience.
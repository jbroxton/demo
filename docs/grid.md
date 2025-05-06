# Requirements Grid Styling Plan

## Overview

This document outlines the plan to standardize styling for the Requirements Grid and Action Bar components by removing all local styling and implementing consistent global CSS. This ensures maintainability, consistency, and proper styling across the application.

## Product Requirements

The Requirements Grid serves product managers for adding and viewing product requirements. It must:

1. **Handle Variable Content**: Support both short titles and potentially long description text
2. **Display Minimum 10 Rows**: Expand vertically to show at least 10 rows when available
3. **Support Scrolling**: Allow vertical scrolling for many requirements and horizontal scrolling if needed
4. **Be Extensible**: Accommodate additional columns that might be added in the future
5. **Maintain Readability**: Ensure text remains readable regardless of content length

## Current Components

1. **RequirementsQueryGrid**: The main table component displaying requirements
2. **RequirementActionBar**: The action buttons displayed above the table

## Styling Principles

- **Text Handling**: 
  - Support variable-length text in descriptions
  - Truncate with ellipsis when needed, but allow expansion
  - Header text: Left-aligned
  - Content text: Left-aligned
  - Priority labels: Centered in their container

- **Sizing**:
  - Description column: Allow expansion for long text
  - Table height: Show minimum 10 rows with vertical scrolling for more
  - Column widths: Responsive with minimum widths to prevent content squishing
  - Container: Takes full width of parent with horizontal scrolling when needed

- **Colors**:
  - Background: #1e1e20 (dark mode table background)
  - Header row: #232326 (slightly lighter than background)
  - Cell backgrounds: rgba(35, 35, 38, 0.8) (semi-transparent)
  - Text: White for high contrast
  - Priority labels: Color-coded (High: red, Medium: yellow, Low: blue)

- **Spacing**:
  - Cell padding: 8px 12px (vertical, horizontal)
  - Header padding: 12px 16px (vertical, horizontal)
  - Container margins: 0px (flush with container)
  - Row height: Minimum 48px but allowed to expand for multi-line content

- **Borders**:
  - Header row: Solid color with no internal borders
  - Between rows: 1px solid #2a2a2c
  - Between columns: None (spacing created by background color)

- **Scrolling Behavior**:
  - Vertical scrolling: Enabled with fixed header
  - Horizontal scrolling: Enabled when necessary
  - Scroll indicators: Visible when content overflows

## Detailed Implementation Plan

### 1. Analysis of Local Styling to Remove

#### RequirementActionBar Component:
- Remove inline `style={}` props
- Remove Material UI `sx={}` props
- Remove local className references
- Move all styling to globals.css

#### RequirementsQueryGrid Component:
- Remove container inline styles
- Remove Material React Table styling configuration:
  - muiTableHeadProps
  - muiTableHeadCellProps
  - muiTableBodyProps
  - muiTableContainerProps
  - muiTopToolbarProps
- Remove column definition styling
- Move all styling to globals.css

### 2. Global CSS Implementation

Create global CSS classes and selectors in globals.css for:

```css
/* Table Container */
.requirements-grid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px; /* Accommodate at least 10 rows */
  background-color: #1e1e20;
  border-radius: 0.375rem;
  width: 100%;
  overflow: hidden;
}

/* Table Core Elements */
.MuiTable-root {
  border-collapse: collapse;
  background-color: #1e1e20;
  width: 100%;
  min-width: 750px; /* Minimum width to ensure proper column sizing */
}

/* Header Styling */
.MuiTableHead-root {
  position: sticky;
  top: 0;
  z-index: 2;
}

.MuiTableHead-root .MuiTableCell-head {
  background-color: #232326;
  color: white;
  font-weight: 600;
  border: none;
  padding: 12px 16px;
  text-align: left;
  height: 56px; /* Fixed height for header row */
  white-space: nowrap; /* Prevent header text wrapping */
}

/* Main container for scrolling */
.MuiTableContainer-root {
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
  height: 100%;
  min-height: 500px; /* Ensure enough room for 10+ rows */
}

/* Cell Styling */
.MuiTableBody-root .MuiTableCell-root {
  background-color: rgba(35, 35, 38, 0.8);
  border: none;
  border-bottom: 1px solid #2a2a2c;
  padding: 8px 16px;
  text-align: left;
  min-height: 48px;
  height: auto; /* Allow rows to expand with content */
}

/* Name cell styling */
.MuiTableCell-root[data-column-id="name"] {
  font-weight: 500;
}

/* Description cell styling - optimized for long text */
.MuiTableCell-root[data-column-id="description"] {
  white-space: normal; /* Allow text wrapping */
  word-break: break-word;
  max-height: 120px; /* Maximum height before scrolling */
  overflow-y: auto; /* Allow scrolling within the cell */
}

/* Priority Cell Styling */
.MuiTableCell-root[data-column-id="priority"] span {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
  white-space: nowrap; /* Prevent wrapping of priority labels */
}

/* Action Bar Styling */
.requirement-action-bar {
  display: flex;
  padding: 8px 16px;
  gap: 8px;
  align-items: center;
  background-color: #1e1e20;
  border-bottom: 1px solid #2a2a2c;
}

/* Action Buttons */
.requirement-add-button {
  background-color: #232326;
  color: white;
  border: 1px solid #2a2a2c;
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 500;
}

.requirement-delete-button {
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #2a2a2c;
  padding: 6px 16px;
  border-radius: 4px;
}

.requirement-delete-button:disabled {
  color: #666;
  border-color: #444;
}

/* Pagination controls for navigating many requirements */
.MuiTablePagination-root {
  color: white;
  background-color: #1e1e20;
  border-top: 1px solid #2a2a2c;
}

/* Ensure the scrollbars are visible but subtle */
.MuiTableContainer-root::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.MuiTableContainer-root::-webkit-scrollbar-track {
  background: #1e1e20;
}

.MuiTableContainer-root::-webkit-scrollbar-thumb {
  background-color: #2a2a2c;
  border-radius: 4px;
}

/* Support for future columns with horizontal scrolling */
@media (max-width: 1200px) {
  .MuiTableContainer-root {
    overflow-x: auto;
  }
}
```

### 3. Column Configuration

The table columns should be configured with the following parameters:

| Column     | Min Width | Target Width | Max Width | Content Handling |
|------------|-----------|--------------|-----------|------------------|
| Name       | 180px     | 25%          | 300px     | Truncate with ellipsis |
| Description| 300px     | 60%          | none      | Wrap and expand row height |
| Priority   | 120px     | 15%          | 150px     | No wrapping, centered label |

### 4. Responsive Behavior

Media queries will be used to adjust column proportions:

- **Large screens** (≥1200px):
  - Container: Full width
  - Description: 60% of available space
  - All columns visible with proper spacing

- **Medium screens** (768px-1199px):
  - Container: Full width with horizontal scroll if needed
  - Fixed min-widths ensure column readability
  - Description column maintains at least 300px width

- **Small screens** (≤767px):
  - Horizontal scrolling enabled
  - Minimum column widths preserved to ensure readability
  - No column becomes too narrow to be usable

### 5. Ensuring Support for 10+ Rows

- Table container has min-height of 600px (sufficient for 10+ rows)
- Vertical scrolling enabled for overflow
- Pagination configuration to show 10, 20, 50 rows per page
- Sticky header ensures column titles remain visible when scrolling

### 6. Future-Proofing for Additional Columns

- Table width can extend beyond container with horizontal scrolling
- Column sizing preserves readability when new columns are added
- CSS rules use attribute selectors that will apply to new columns

## Testing Plan

After implementation, we will verify that:

1. Long description text properly wraps and expands row height
2. Table displays at least 10 rows without truncation
3. Vertical and horizontal scrolling work properly
4. Header row remains sticky when scrolling vertically
5. Priority labels maintain their color-coding and styling
6. Table is properly responsive at all breakpoints
7. Action buttons maintain their styling and functionality
8. Description column handles varying amounts of text gracefully
9. Table can accommodate future column additions

## Next Steps

1. Review this plan to ensure alignment on styling approach
2. Implement changes to remove local styling
3. Add necessary global CSS
4. Test with varying amounts of text and rows
5. Verify scrolling behavior works as expected
6. Test responsiveness on different screen sizes
7. Verify against the product management requirements 
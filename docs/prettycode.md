# Pretty Code: DOM Structure and Naming Convention Cleanup

## Objective

Document the cleanup process for the DOM structure and naming conventions in the application, with a focus on the workspace layout and UI components. Provide guidance for further refactoring using the BEM methodology.

## Background

In May 2024, we implemented several changes to clean up the DOM structure and improve naming conventions:

1. **Component Renaming**:
   - Renamed `DashboardLayoutQuery` component to `WorkspaceLayout`
   - Renamed CSS classes from location-based names to semantic function-based names:
     - `dashboard-grid` → `workspace-grid`
     - `grid-left-sidebar` → `navigator-panel`
     - `grid-header` → `canvas-tabs`
     - `grid-main-content` → `canvas-editor`
     - `grid-right-sidebar` → `utility-panel`

2. **DOM Structure Simplification**:
   - Removed unnecessary nesting in the canvas area
   - Changed to a cleaner CSS Grid layout for both main layout and canvas container
   - Eliminated redundant wrapper elements
   - Simplified tab container structure

3. **Data Attribute System**:
   - Added component identifiers: `data-component="workspace"`, `data-component="canvas-content"`
   - Added section identifiers: `data-section="navigator"`, `data-section="canvas-tabs"`, etc.
   - Added state indicators: `data-state="empty"`, `data-expanded="true|false"`
   - Added action identifiers: `data-action="toggle-navigator"`, `data-action="open-tab"`
   - Added entity identifiers: `data-entity-type="product|feature"`, `data-entity-id={id}`

4. **CSS Changes**:
   - Rewrote the grid template to use semantic area names
   - Added proper CSS Grid layout for canvas content area
   - Standardized naming in variable references

These changes create a foundation for future BEM implementation while immediately improving code clarity and maintainability.

## About

This document outlines the changes made to the DOM structure and naming conventions in the application, with a particular focus on the main layout components. It also provides recommendations for future improvements to create a more consistent, maintainable, and semantically meaningful codebase.

## Goals/Non Goals

### Goals

- Simplify DOM structure by removing unnecessary nesting
- Create a consistent, semantic naming convention for UI components
- Document the changes made to the layout system
- Provide a roadmap for further improvements using the BEM methodology
- Make the codebase more maintainable and easier to understand

### Non Goals

- Complete refactoring of all components to BEM at this stage
- Changing the core functionality of any components
- Refactoring the entire codebase at once
- Renaming all file names (this can be done in a subsequent phase)

## Functional Requirements/Documentation

### Current Changes Implemented

#### Component Renaming

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `dashboard-grid` | `workspace-grid` | Main application layout container |
| `grid-left-sidebar` | `navigator-panel` | Left navigation sidebar |
| `grid-header` | `canvas-tabs` | Tabs navigation area |
| `grid-main-content` | `canvas-editor` | Main content editing area |
| `grid-right-sidebar` | `utility-panel` | Right utility sidebar |
| `editor-container` | `canvas-editor-content` | Centered content container |
| `tab-content-container` | `canvas-content` | Tab content wrapper |

#### Data Attributes

Added semantic data attributes for better component identification:

```html
<!-- Component level -->
<div data-component="workspace">...</div>
<div data-component="canvas-content">...</div>

<!-- Section level -->
<div data-section="navigator">...</div>
<div data-section="canvas-tabs">...</div>
<div data-section="canvas-editor">...</div>
<div data-section="utility-panel">...</div>

<!-- State indicators -->
<div data-state="empty">...</div>
<div data-expanded="true">...</div>

<!-- Action indicators -->
<button data-action="toggle-navigator">...</button>
<button data-action="open-tab">...</button>
```

#### Grid Structure Simplification

Changed the grid layout structure:

```css
.workspace-grid {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns:
    [navigator-start] var(--left-sidebar-width-expanded)
    [navigator-end canvas-start] 1fr
    [canvas-end utility-start] var(--right-sidebar-width-collapsed)
    [utility-end];
  grid-template-areas: "navigator canvas utility";
}

.canvas-container {
  grid-area: canvas;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "canvas-tabs"
    "canvas-editor";
}
```

### Future BEM Implementation

For a future transition to BEM methodology, we would refactor according to these principles:

```css
/* Block */
.workspace {}
.navigator {}
.canvas {}
.utility {}

/* Elements */
.workspace__grid {}
.navigator__panel {}
.navigator__toggle {}
.canvas__tabs {}
.canvas__editor {}
.canvas__content {}
.utility__panel {}

/* Modifiers */
.workspace--expanded {}
.navigator--collapsed {}
.canvas__tab--active {}
.utility--open {}
```

## Implementation Design

### Current Implementation

The current implementation uses a combination of grid layouts and semantic naming to create a clear, maintainable structure:

1. **Outer Grid**: `workspace-grid` defines the overall layout with three columns:
   - `navigator-panel` (left sidebar)
   - `canvas-container` (main content)
   - `utility-panel` (right sidebar)

2. **Inner Grid**: `canvas-container` uses a nested grid with two rows:
   - `canvas-tabs` (top row for tabs)
   - `canvas-editor` (bottom row for content)

3. **Content Container**: `canvas-editor-content` provides a centered container for editing content

4. **Data Attributes**: Used throughout to provide semantic meaning and clarity

### BEM Implementation Design

In a future BEM implementation, the HTML structure would look like:

```html
<div class="workspace">
  <div class="navigator">
    <div class="navigator__panel">...</div>
    <button class="navigator__toggle">...</button>
  </div>
  
  <div class="canvas">
    <div class="canvas__tabs">...</div>
    <div class="canvas__editor">
      <div class="canvas__content">...</div>
    </div>
  </div>
  
  <div class="utility">
    <div class="utility__panel">...</div>
  </div>
</div>
```

This structure clarifies the relationships between components and makes the code more maintainable.

## Implementation Steps

To fully transition to a BEM-based system, we recommend the following steps:

1. **File Renaming**:
   - Rename `dashboard-layout-query.tsx` to `workspace-layout.tsx`
   - Update imports in all affected files

2. **CSS Variable Naming Consistency**:
   - Rename CSS variables to match component names
   - Example: `--left-sidebar-width-expanded` to `--navigator-width-expanded`

3. **CSS Class Refactoring**:
   - Convert current classes to BEM format
   - Update all component references

4. **Component Props Alignment**:
   - Ensure component props match BEM naming conventions
   - Update component interfaces

5. **Documentation Updates**:
   - Update component documentation to reflect BEM structure
   - Create a component library guide

## Lessons Learned

### DOM Structure Best Practices

1. **Flatten Where Possible**: Reduce nesting by removing unnecessary container divs that don't serve a layout purpose.

2. **Semantic Naming**: Use names that describe the component's purpose rather than its appearance or position.

3. **Consistent Patterns**: Apply the same patterns throughout the codebase to make it predictable and maintainable.

4. **Grid vs. Flexbox**: Use CSS Grid for two-dimensional layouts and Flexbox for one-dimensional arrangements.

5. **Data Attributes**: Add data attributes for semantic information rather than relying on class names alone.

### Naming Convention Benefits

1. **Readability**: Clear, consistent naming makes code easier to read and understand.

2. **Maintainability**: Well-named components are easier to maintain and refactor.

3. **Developer Experience**: New developers can quickly understand the purpose of components.

4. **Debugging**: Easier to debug issues when components have clear, semantic names.

5. **Component Reuse**: Well-named components are more likely to be reused correctly.

### BEM Advantages

1. **Clear Relationships**: BEM clearly demonstrates the relationships between components.

2. **Reduced Specificity Issues**: BEM helps avoid CSS specificity conflicts.

3. **Modular Structure**: Components can be moved and reused without breaking styling.

4. **Self-Documentation**: The naming convention itself serves as documentation.

5. **Scalability**: Works well for small and large codebases alike.

The migration to BEM should be gradual, starting with the most frequently used components and expanding outward. This ensures that the codebase maintains consistency while undergoing improvements.
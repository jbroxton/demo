The Grid is a Material React Table used to support features and releases.

About:
Material React Table implementation for managing requirements within features. The grid provides an interactive interface for users to create, view, update, and delete requirements. Each requirement can be assigned to a release and includes properties like name, description, priority, and acceptance criteria. The grid is designed with a dark theme to match the application's overall styling.

User flow:
1. User navigates to a Feature detail page
2. User clicks "Show Requirements" button to display the requirements grid
3. The grid appears with requirements data or empty state for new feature
4. User can add new requirements by clicking "Add" button
5. User fills in requirement details (name, description, priority, etc.)
6. User can assign requirements to a release using the release dropdown
7. User can edit existing requirements
8. User can delete selected requirements
9. Changes are reflected immediately in both the UI and database

Required Features:
- Sorting: Users must be able to sort by any column (name, priority, etc.)
- CRUD Operations: Full Create, Read, Update, Delete support for requirements
- Validation: Basic validation for required fields and data formats
- Inline Editing: Allow direct editing of cells
- Dark Theme: Match application's dark theme styling
- Persistence: Save changes to the database automatically

Future Features (Not Initial Implementation):
- Drag and Drop: Column reordering and row reordering
- Column Resizing: Adjust column widths
- Filtering: Advanced filtering capabilities
- Column Visibility: Toggle column visibility
- Export: Export data to CSV/PDF

Front End Components:
- RequirementsGrid: Core Material React Table component for requirements management
- RequirementActionBar: Container for requirement-related actions (Add, Delete)
- FeatureRequirementsSection: Container that manages visibility state of the grid

Server Components:
- Requirements Zustand Store (useRequirementsStore): Manages requirements state and CRUD operations (stores/requirements)
- Store API Route: Handles persistence of requirements data (api/routes)
- Database Schema: Requirements table with relationships to features and releases (services/db.server.ts)

DB Components:
- requirements table: Stores requirements data
  - id: Primary key
  - name: Requirement name
  - owner: Person responsible for the requirement
  - description: Detailed explanation
  - priority: High/Med/Low
  - featureId: Foreign key to features table
  - releaseId: Optional foreign key to releases table
  - cuj: Customer user journey information
  - acceptanceCriteria: Conditions for requirement completion
- requirements_state table: Supports state persistence for the requirements store

Styling:
- Dark Theme: Follow application's dark theme
- Header Background: #182226
- Header Text: #FFFFFF
- Cell Background: #0C0C0D
- Cell Text: #EAECF1
- Borders: #2a2a2c
- Buttons: Match application's button styling

Spacing and Layout:
- The grid is shown in the feature content page under description
- Zero state: by default the grid is not shown
- New Feature: When a feature is new, user must save it before adding requirements
- Add Requirement: Clicking the "Add" button creates a new empty row
- Delete: Selecting rows and clicking "Delete" removes the selected requirements
- Inline Editing: Direct editing within the cells

Sizing:
- The table should fit in the content area
- Horizontal scrolling for narrow viewports
- Responsive to page resizing
- Minimum height of 400px

Documentation & Implementation Notes:
------------------------------------

## Material React Table Documentation

### Core Documentation Links:
- Main Documentation: https://www.material-react-table.com/
- Installation Guide: https://www.material-react-table.com/docs/getting-started/install
- Basic Usage: https://www.material-react-table.com/docs/getting-started/usage
- Table Props & Options: https://www.material-react-table.com/docs/api/props-and-options

### Feature-Specific Documentation:
- CRUD Editing: https://www.material-react-table.com/docs/examples/editing-crud
- Sorting: https://www.material-react-table.com/docs/guides/sorting
- Column Ordering: https://www.material-react-table.com/docs/examples/column-ordering
- Cell Editing: https://www.material-react-table.com/docs/examples/editing-crud/inline-cell-editing
- Row Actions: https://www.material-react-table.com/docs/guides/row-actions
- Dark Mode: https://www.material-react-table.com/docs/guides/customize-components#dark-mode

## Implementation Notes

### Basic Setup
```jsx
// Core imports
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

// Define columns with proper options
const columns = useMemo(
  () => [
    {
      accessorKey: 'name',
      header: 'Name',
      muiEditTextFieldProps: { required: true }
    },
    // other columns...
  ],
  []
);

// Create table instance with options
const table = useMaterialReactTable({
  columns,
  data,
  enableRowSelection: true,
  enableColumnOrdering: false, // enable later
  enableEditing: true,
  editDisplayMode: 'cell', // 'modal', 'row', 'table'
  onEditingRowSave: handleSaveRow,
  initialState: { density: 'compact' },
});

// Render the table
return <MaterialReactTable table={table} />;
```

### CRUD Operations
- Use editDisplayMode option to choose between modal, row, cell, or table editing
- Implement validation in muiEditTextFieldProps for each editable column
- Handle row creation with a toolbar button and createRow helper
- For edits, use onEditingRowSave callback to persist changes
- For deletion, add a delete button in the row actions with confirmation dialog

### State Management
Material React Table manages most of its own state, but we'll need to:
1. Store actual data in our Zustand store (useRequirementsStore)
2. Sync table data with our store when users make changes
3. Save changes to the backend via API calls

### TypeScript Integration
Define proper types for requirement rows and column definitions:
```tsx
type Requirement = {
  id: string;
  name: string;
  description: string;
  priority: 'High' | 'Med' | 'Low';
  // other fields...
};

// Column definition with proper typing
const columns = useMemo<MRT_ColumnDef<Requirement>[]>(
  () => [
    // column definitions...
  ],
  []
);
```

### Styling Notes
Material React Table works with Material UI theming. Create a custom theme with:
```jsx
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0C0C0D',
      paper: '#182226',
    },
    text: {
      primary: '#EAECF1',
    },
    // other customizations...
  },
});

// Wrap the table with ThemeProvider
<ThemeProvider theme={darkTheme}>
  <MaterialReactTable table={table} />
</ThemeProvider>
```

## Existing Backend Components

The following backend components already exist to support the requirements table functionality:

### Data Stores (Zustand)

1. **Requirements Store**
   - **Path**: `src/stores/requirements.ts`
   - **Purpose**: Core store managing requirements data and operations
   - **Key Features**:
     - Defines `Requirement` type with properties (id, name, description, priority, etc.)
     - CRUD operations (add, get, update, delete requirements)
     - Methods to filter requirements by feature or release
     - Persists data using hybrid storage

2. **Features Store**
   - **Path**: `src/stores/features.ts`
   - **Purpose**: Manages features which contain requirements
   - **Key Features**:
     - Toggles requirements visibility within features
     - Has embedded requirements management operations
     - Persists data using hybrid storage
     - Links features with requirements

3. **Releases Store**
   - **Path**: `src/stores/releases.ts`
   - **Purpose**: Manages releases which can be assigned to requirements
   - **Key Features**:
     - Provides releases data for requirement assignment
     - Used in requirements dropdown selection

### Backend Services & Utilities

1. **Hybrid Storage System**
   - **Path**: `src/utils/hybrid-storage.ts`
   - **Purpose**: Custom storage adapter for Zustand persistence
   - **Key Features**:
     - Works in browser and server contexts
     - Caches data in memory for performance
     - Persists data to backend API
     - Handles SSR scenarios

2. **Store API Route**
   - **Path**: `src/app/api/store/route.ts`
   - **Purpose**: REST API for persisting store data
   - **Key Features**:
     - GET/POST/DELETE operations for store data
     - Creates SQLite tables as needed
     - Special handling for requirements data
     - Loads and saves persistent state

3. **Database Service**
   - **Path**: `src/services/db.server.ts` (referenced but not directly examined)
   - **Purpose**: SQLite database connection and operations
   - **Key Features**:
     - Provides connection to the database
     - Used by store API routes

### Database Schema

The requirements data is persisted in SQLite with the following tables:

1. **requirements_state**
   - Stores serialized Zustand state for requirements
   - Structure: `key TEXT PRIMARY KEY, value TEXT NOT NULL`

2. **features_state**
   - Stores serialized Zustand state for features which include requirements
   - Structure: `key TEXT PRIMARY KEY, value TEXT NOT NULL`

3. **releases_state**
   - Stores serialized Zustand state for releases that can be assigned to requirements
   - Structure: `key TEXT PRIMARY KEY, value TEXT NOT NULL`

### Component Structure

These backend components are used by the frontend Requirements Grid components:

1. **RequirementsGrid**: Main grid component consuming the stores
2. **FeatureRequirementsSection**: Container component managing visibility of requirements
3. **RequirementActionBar**: Actions for manipulating requirements


# Product Hierarchy Data Table

## About
The data table provides CRUD operations for product hierarchy management. It allows users to have a systematic view of the overall product structure:
- Product (highest level)
- Interface (second level)
- Feature (third level)
- Component (lowest level)

## Technical Stack
- Install AG Grid (since Shadcn does not have a similar component)
- Build with React and TypeScript
- Apply TailwindCSS for styling
- Set up Zustand for state management

## MVP Scope
- Build basic Create and Read features only
- Cut Update and Delete features from initial release

## UI Integration
- Remove existing dashboard cards
- Insert data table into dashboard main content area
- Fit table within layout without excess styling
- Focus on functionality over visual polish

## Data Structure

### Column Requirements
1. **Hierarchy Column** (main column):
   - Structure hierarchical items with proper indentation
   - Order items sequentially: Product → Interface → Feature → Component

2. **Owner Column**:
   - Add field for responsibility assignment
   - Build as simple text input

3. **Description Column**:
   - Create text field for additional details
   - Cut long text with ellipsis for readability

### Hierarchy Management
- Build tree view with indentation showing parent-child relationships
- Insert "+" buttons on row hover to create child items
- Add "Create Product" button at bottom for top-level items
- Lock each level to create only valid child types (e.g., Products can only create Interfaces)

## Visual Design

### Hierarchy Display
- Set 15-20px indentation per level for hierarchy clarity
- Add expand/collapse arrows for child item visibility control
- Mark each level type with distinct visual treatment (Product, Interface, Feature, Component)

### Cell Display
- Strip styling to minimal borders and clean typography
- Cut long text with ellipsis in description field
- Highlight rows on hover to signal interactivity

## Interactive Features

### Adding Items
- Insert "+" button on row hover
- Create form with:
  * Force name field as required
  * Restrict type selection to valid child types only
  * Add owner field
  * Include description field
- Insert newly created items at correct hierarchy position

### Basic Editing
- Build inline editing for all fields
- Check for empty names and block submission if invalid
- Save changes automatically after edit completion

## State Management
- Create Zustand store for hierarchy data
- Enforce parent-child relationships in data structure
- Save state to localStorage between sessions

## Implementation Priorities
1. Build basic hierarchy display with proper structure
2. Add create functionality for all levels
3. Insert expand/collapse functionality
4. Build basic inline editing
5. Set up data persistence

## Sample Data Structure
```typescript
interface HierarchyItem {
  id: string;
  name: string;
  type: 'product' | 'interface' | 'feature' | 'component';
  owner: string;
  description: string;
  children?: HierarchyItem[];
  parentId: string | null;
  expanded?: boolean;
}
```


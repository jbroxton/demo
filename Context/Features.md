#Create a new feauture
Allows the Product Manager (user) to add a new feature to specky. 

# V1
Click path
1. User clicks the new feature button in the side nav
2. new feature drawer opens
3. User inputs data
4. User clicks save
5. the new feature is added to the features table for the user
6. The new feature is visible in the Features list (used to be files) in the side nav
6. Release will be worked out later - skip for now to the features and shows up in the side nav. 

Data Model
Feature Details
- ID (auto assigned)
- Name (required)
- Priority (High, Med, Low)
- Description (long text field)
- Product Name (text field)
- ReleaseID (auto assigned)
- Artifacts (links)

A Feature has a 1:n relationship with Release. 
A Feature has a 1:n relationship with Artifacts. 

Data Storage
- All data will be stored client-side based on Ruled.md
- Use Zustand store with localStorage persistence (following existing auth pattern)
- Create a basic features store with add/get functionality

Release
- ID (auto assigned)
- Name: (required)
- Release Date: 
- Priority: (High, Med, Low)
- Feature ID
- Release Stage (sorted by release date)
- Artifacts  

A Release has a 1:n relationship with Artifacts. 
Defer Artifacts and Release connections for later iterations



Side Nav
- Features appear in the side nav in the content section
- Rename "Files" to Features
- Features are containers that contain releases

UI Updates
- Render features in the sidebar after creation
Update the sidebar to replace "Files" with "Features" section
The drawer already has most of the UI elements needed (dont make if ones if they already exist)

Implementation Steps:
Create src/stores/features.ts for state management
Update the drawer form in app-sidebar.tsx to match requirements
Implement form submission handling
Update sidebar navigation to display features instead of files


#Constrians
- Rules.md
- Themes.md
- When implementing the feature, do not make extra changes. Just do the lease to get the feature working, so as not to grow the codebase too fast. 

#Notes
- This basic implementation focuses on the "C" in CRUD, allowing users to create features while deferring the Read, Update, Delete functionality for later as suggested. The form is already in place in the drawer component; we just need to tailor it to the feature data model and implement the storage and display logic.


We need to update the feature page.
- Change the feature drawer to upon in the page within a tab
- the page consists of two parts
    - A text editor
    - A details panel

# V2
- For V2 we just needd to make a tab open if New feature is clicked or an existing feature is clicked
- When the tab is open I want the user to see a text editor with a pre poulated field called New Feature 
 
## Implementation Steps for V2

1. **Create Text Editor Component Using React Quill**
   - Use React Quill for a simple yet enhanced text editing experience
   - Install the package: `npm install react-quill`
   - Create a new component in src/components/feature-editor.tsx
   - Configure with minimal toolbar options for basic formatting
   - Add autofocus for immediate typing when the tab opens

2. **Setup Feature Tab Content**
   - Create a component that renders when a feature tab is selected
   - Include the React Quill editor as the main content
   - Add a simple save button below the editor
   - Create this component in src/components/feature-tab-content.tsx
   - Layout should be responsive and fill the available tab content area

3. **Connect to Feature Store**
   - Update the feature store to include a "content" field for text
   - Add a function to save editor content to the feature's data
   - Load existing content when opening an existing feature
   - Modify src/stores/features.ts to add the content field and update functions
   - Example structure: { id, name, priority, description, content, ... }

4. **Implement Tab Navigation Logic**
   - Ensure clicking "New Feature" or an existing feature opens a tab
   - Pre-populate with "New Feature" text for new features
   - Show existing content for previously saved features
   - Modify the handleAddFeature and handleFeatureClick functions in app-sidebar.tsx
   - Update the tab store to include content information

5. **Add Save Functionality**
   - Implement a save button that persists editor content
   - Add visual feedback when content is saved
   - Ensure content persists between tab switches
   - Add a saveFeatureContent function to the features store
   - Use a simple toast or status indicator for save confirmation

6. **Basic Styling**
   - Import React Quill default styles and customize as needed
   - Ensure the editor fills the available space
   - Set appropriate height and padding
   - Match the existing application theme
   - Minimum height should be 300px

## Implementation Details

## Implementation Notes for V2

### Implementation Summary
We've successfully implemented a text editor for features using React Quill, which provides a lightweight and easy-to-use rich text editing experience. The implementation includes:

1. **React Quill Integration**
   - Switched from react-quill to react-quill-new to fix the "react_dom_1.default.findDOMNode is not a function" error in React 19
   - Used Next.js dynamic import with `{ ssr: false }` to prevent "document is not defined" errors during server-side rendering
   - Added client-side only rendering with proper loading states
   - Installed with `--legacy-peer-deps` to handle React 19 compatibility
   - Configured minimal formatting options (bold, italic, underline)
   - Added custom CSS to ensure proper rendering in the dark theme

2. **Feature Content Management**
   - Added a `content` field to the Feature interface in the features store
   - Implemented `saveFeatureContent` function to persist editor content
   - Added visual feedback for save operations (saving, saved, error states)

3. **UI Components Created**
   - `FeatureEditor`: A reusable component that handles the editing experience
   - `FeatureTabContent`: A wrapper that displays feature metadata and the editor
   - Created a custom hook `useQuill` to safely load React Quill on the client side

4. **Tab System Integration**
   - Updated `TabContent` to use the new `FeatureTabContent` for feature tabs
   - Maintained existing tab navigation behavior
   - Added client-side detection to prevent hydration errors

### Potential Improvements for Future Iterations
1. Add autosave functionality to reduce manual saves
2. Implement content versioning to track changes
3. Expand formatting options based on user feedback
4. Add collaboration features (comments, shared editing)

### Known Limitations
1. Using react-quill-new instead of react-quill since the original package is not compatible with React 19
2. React Quill only works on the client side and requires special handling for Next.js server components
3. Content is stored in localStorage, which has size limitations
4. No offline editing capabilities with automatic sync

### Usage Instructions
To edit a feature's content:
1. Click on a feature in the sidebar to open its tab
2. Use the editor to add or modify content
3. Click "Save Changes" to persist your work
4. The save status will be displayed below the editor

# V3
Make the Feature Name Fields Editable in all places:
  1. The tab in the editor
  2. The top of the document 
  3. The nested tree in sidebar
- All name fields should be in sync when updated
- Auto-save the new name when a user enters the name and clicks out

## Implementation Plan for V3

1. **Update Feature Store**
   - Add a `updateFeatureName` function to the features store
   - Ensure this function triggers necessary UI updates across components
   - Implement optimistic updates for a responsive user experience

2. **Make Tab Names Editable**
   - Update `TabsTrigger` component to include an editable name field
   - Add blur and keyboard (Enter key) event handlers to save changes
   - Ensure tab names update immediately upon save
   - Update the tab store to handle name changes

3. **Make Feature Header Editable**
   - Update the heading in `FeatureTabContent` to be an editable field
   - Style it to match the current design when not in edit mode
   - Add visual indication when editing is active
   - Implement auto-save on blur or Enter key press

4. **Update Sidebar Tree**
   - Modify the feature tree item component to support inline editing
   - Ensure edits in the sidebar sync with tabs and header
   - Add click-to-edit functionality with appropriate UI cues
   - Maintain current tree structure and nesting during edits

5. **Implement Synchronized State**
   - Ensure all components listen to the same store for feature name changes
   - Implement proper error handling for failed updates
   - Add loading/saving indicators where appropriate
   - Create utility functions for consistent name formatting

6. **Add User Experience Enhancements**
   - Include subtle animations for edit state transitions
   - Add validation to prevent empty or duplicate names
   - Implement keyboard shortcuts for quick editing
   - Ensure focus management follows a natural flow

## Technical Approach

1. **State Management**
   - Use the existing Zustand store as the single source of truth
   - Implement a publish/subscribe pattern for name change events
   - Optimize for minimal re-renders when names change

2. **Component Updates**
   - Create a reusable `EditableText` component for consistent behavior
   - Use controlled inputs with local state for editing experience
   - Ensure all editable fields have consistent styling and behavior

3. **Auto-Save Mechanism**
   - Implement debounced auto-save to prevent excessive updates
   - Add visual feedback during and after save operations
   - Handle error states gracefully with appropriate user feedback

## Acceptance Criteria

- ✅ Users can edit feature names by clicking on them in any of the three locations
- ✅ Name changes are immediately reflected in all three places:
  - In the tab name
  - In the feature header
  - In the sidebar tree
- ✅ Names automatically save when the user clicks away or presses Enter
- ✅ There is appropriate visual feedback during editing and saving
- ✅ Name validations prevent empty names or other invalid entries
- ✅ The editing experience is intuitive and consistent across all locations
- ✅ All components maintain their existing styling when not in edit mode
- ✅ Performance remains smooth even with many features and tabs open
- ✅ The implementation preserves all existing V2 functionality
- Only pre-built compoenents are used in implementation, no custom components
- No bugs exist 
- App is fully functional
- Implemntation notes are updated with learnings and best practices
- Name is persistent through sessions
- Data models details are updated if needed. 

## Implementation Notes for V3

### Implementation Summary

We've successfully implemented editable feature names that are synchronized across all parts of the UI. The implementation includes:

1. **Enhanced State Management**
   - Added `updateFeatureName` function to the features store for centralized name updates
   - Implemented `updateTabTitle` function in the tabs store to keep tab titles in sync
   - Used existing localStorage persistence for name persistence across sessions

2. **UI Updates for Editable Fields**
   - Made feature names editable in three key locations:
     - The feature tab title in the tab bar
     - The feature header in the feature content area
     - The feature name in the sidebar tree
   - Used existing UI components (Input) from the shadcn/UI library
   - Implemented consistent editing experience across all locations

3. **Synchronization System**
   - Established a central update flow where all name changes go through the store
   - Ensured changes in one location are immediately reflected in all other locations
   - Prevented empty names from being saved

4. **User Experience Improvements**
   - Added edit indicators with pencil icons for better discoverability
   - Implemented keyboard shortcuts (Enter to save, Escape to cancel)
   - Added auto-save on blur (clicking away)
   - Maintained focus management for a smooth editing experience

### Technical Details

1. **Store Updates**
   - The `updateFeatureName` function in the features store now serves as the single source of truth
   - The `updateTabTitle` function in the tabs store keeps tabs in sync with feature name changes
   - Both functions validate input to prevent empty names

2. **Component Implementation**
   - All three locations use controlled inputs with local state for editing
   - Edit mode is toggled with a dedicated state variable
   - Auto-save is triggered on blur events or Enter key press
   - All inputs maintain appropriate styling consistent with the application theme

3. **Event Handling**
   - Implemented proper event propagation control to prevent unintended side effects
   - Used `stopPropagation()` to ensure clicking edit buttons doesn't trigger other actions
   - Managed focus correctly with refs to auto-focus inputs when editing starts

### Lessons Learned

1. **State Synchronization Patterns**
   - Using a central store as the single source of truth simplifies synchronization
   - Updating all UI elements from a single update function ensures consistency
   - Local component state for editing provides better user experience

2. **Working with Pre-built Components**
   - Shadcn/UI components were easily adapted for inline editing scenarios
   - The Input component was flexible enough for all editing contexts with custom styling
   - Using pre-built components ensured consistent behavior and accessibility

3. **UX Considerations**
   - Visual cues like pencil icons improve discoverability of editing functionality
   - Proper keyboard support (Enter/Escape) enhances usability
   - Validation prevents empty or invalid names, improving data integrity

### Future Improvements
1. Add debouncing for very rapid edits if needed
2. Implement more advanced validation (e.g., preventing duplicate names)
3. Add more visual feedback for saving state (saved/saving indicators)
4. Consider optimistic UI updates for larger datasets




# TipTap Editor Integration

This document describes the implementation and customization of the TipTap rich text editor in our application.

## Functional Requirements

1. **Content Persistence Between Tab Switches**
   - Users must not lose their work when switching tabs
   - Content should be automatically saved when tab focus is lost
   - Content should be restored when returning to the editor

2. **Manual Save Integration**
   - When the user clicks "Save", content should be persisted to the Supabase database
   - Manual save should update the document in the database while maintaining local backup
   - System must update existing documents rather than creating new ones when features are renamed
   - When a feature is renamed, the existing document title should be updated instead of creating a new document

3. **Visual Feedback**
   - Users should see clear indication of unsaved changes
   - Users should see feedback when content is saved to the database

4. **Performance Requirements**
   - Editor performance must not degrade during typing
   - Saving operations should not interrupt the user's typing experience

5. **Implementation Requirements**
   - Use off-the-shelf solutions where possible
   - Minimize custom code
   - Ensure compatibility with existing React Query and Supabase setup

# Technical Requirements



## Dependencies

### Server Dependencies


### Client Dependencies


### Additional Extensions


## Current State

The document editing system in our application consists of two primary components:

1. **SimpleEditor (src/components/simple-editor.tsx)**:
   - A rich text editor based on TipTap that provides a comprehensive WYSIWYG editing experience
   - Includes a toolbar with formatting options (bold, italic, headings, lists, etc.)
   - Features a bubble menu that appears on text selection
   - Features a floating menu that appears on empty lines
   - Supports code blocks with syntax highlighting for multiple languages
   - Implements image and link insertion
   - Uses JSON to store document content structure
   - Triggers onChange events with stringified JSON content when edits occur

2. **FeatureQueryTabContent (src/components/feature-query-tab-content.tsx)**:
   - Uses the SimpleEditor component to edit feature descriptions
   - Implements auto-save functionality with a 2-second debounce
   - Manages document state including creation, updating content, and updating title
   - Handles the relationship between features and their associated documents
   - Provides UI for document editing, metadata management, and feature properties

### Auto-Save Implementation

The current auto-save implementation in FeatureQueryTabContent works as follows:

1. **Debounced Save Function**:
   - A debounced save function is created using lodash's debounce with a 2-second delay
   - This prevents excessive API calls when users are actively typing
   - The function is recreated when dependencies change

2. **Content Change Handling**:
   - When SimpleEditor content changes, it triggers the onChange callback
   - The editor serializes its content as JSON and passes it as a string
   - The component stores this content in local state

3. **Auto-Save Logic**:
   - The debounced function checks if we're editing an existing feature (not a new one)
   - It attempts to parse the content as JSON (since it's stored as a stringified JSON)
   - For existing documents, it calls updateContent() to save changes to the database
   - If no document exists yet, it sets a flag to indicate unsaved changes
   - Success/error handling includes console logs and toast notifications

4. **Manual Save**:
   - The Save button triggers an immediate save without debounce
   - It handles both document content updates and feature metadata updates
   - For new features without documents, it creates a document when saving

5. **Cleanup**:
   - The debounced function is properly cleaned up in the useEffect return function

6. **UX Indicators**:
   - Success messages when content is saved
   - Error toasts when saving fails
   - Console logging for tracking save operations

This implementation balances user experience with server load by efficiently batching save operations while ensuring data is not lost.

## Implementation Plan

☐ Create a custom implementation plan for document persistence
     ☐ Install required Hocuspocus and Y.js dependencies
     ☐ Create Supabase table structure for document persistence
     ☐ Implement TipTap editor with Collaboration extension
     ☐ Set up Hocuspocus server with Supabase database extension
     ☐ Implement document fetch and store functions for persistence
     ☐ Update SimpleEditor component to use Collaboration extension
     ☐ Create authentication hooks to validate user tokens
     ☐ Add visibility change handler for tab switch persistence
     ☐ Test document persistence across tab switches




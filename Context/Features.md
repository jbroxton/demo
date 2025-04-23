#Create a new feauture
Allows the Product Manager (user) to add a new feature to specky. 

# Click path
1. User clicks the new feature button in the side nav
2. new feature drawer opens
3. User inputs data
4. User clicks save
5. the new feature is added to the features table for the user
6. The new feature is visible in the Features list (used to be files) in the side nav
6. Release will be worked out later - skip for now to the features and shows up in the side nav. 

#Data Model
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

 
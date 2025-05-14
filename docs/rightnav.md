# Right Navigation Sidebar Requirements

## Introduction for AI Implementation Partner

Speqq is a product requirements management platform with a modern dashboard interface. Here are the key aspects you need to know:

1. Built with Next.js 13+ using App Router and TypeScript
2. Uses shadcn/ui components for consistent design language
3. Tailwind CSS for styling with a dark theme (#0A0A0A background)
4. React Query for server state management via QueryProvider
5. SQLite database with REST API routes
6. Existing left sidebar navigation structure
7. Component-focused architecture with strict separation of concerns
8. GPU-accelerated animations for performance
9. Mobile-responsive design using Tailwind breakpoints
10. Lucide React for consistent iconography



Your task is to implement a collapsible right sidebar that will complement the existing left sidebar navigation. The right sidebar will provide access to Chat and TODO functionality while maintaining the application's design language and performance standards. Create a dedicated UI state provider for sidebar state rather than using component-level state.

## Objective

Implement a collapsible right sidebar component in the Speqq dashboard that provides users with access to Chat and TODO functionality while maintaining a consistent UI experience with the existing application design language.

## About

The right navigation sidebar will be a collapsible panel positioned on the right edge of the viewport, complementing the existing left sidebar to create a balanced UI layout. This component will provide a streamlined interface for users to access communication and task management features without navigating away from their current view.

## Goals/Non-Goals

### Goals

- Create a visually consistent right sidebar that matches Speqq's design language
- Implement performant expand/collapse animations using GPU-accelerated transforms
- Provide a simple tab interface to switch between Chat and TODO views
- Ensure responsive behavior across different viewport sizes
- Maintain accessibility standards for keyboard navigation and screen readers

### Non-Goals

- Implementing actual chat functionality or message display
- Creating TODO item creation, editing, or management features
- Building data persistence layer for chat messages or TODO items
- Developing backend API integration
- Supporting user preferences for sidebar state persistence
- Adding advanced features like notifications or unread counts

## Functional Requirements/Structured Technical Requirements Documentation

### Layout and Positioning Requirements
- **MUST**: Position the right sidebar on the right edge of the viewport, opposite to the existing left sidebar
- **MUST**: Implement dynamic adjustment of the dashboard content area and left sidebar in response to the right sidebar's state changes
- **MUST**: Maintain proper z-index hierarchy (main content: z-10, left sidebar: z-20, right sidebar: z-30) to prevent overlap issues
- **MUST**: Use fixed positioning to ensure the sidebar remains visible during page scrolling

### Default State Requirements
- **MUST**: Initialize the sidebar in a collapsed state by default
- **MUST**: Display only icon buttons for Chat (MessageSquare) and TODO (CheckSquare) from Lucide React in collapsed state
- **MUST**: Set collapsed sidebar width to 48px (w-12) to show only icons
- **MUST**: Ensure the main dashboard layout uses its standard width when the sidebar is collapsed
- **SHOULD**: Provide visual affordances (hover states) to indicate interactivity of icon buttons

### Expanded State Requirements
- **MUST**: Expand the sidebar to 320px (w-80) width when activated
- **MUST**: Display content based on the active tab selection (Chat or TODO)
- **MUST**: Show a clear header with the tab name ("Chat" or "TODO") in expanded state
- **MUST**: Include a close/collapse button positioned at the top-left of the expanded sidebar
- **MUST**: Adjust the main content area position to accommodate the expanded sidebar
- **SHOULD**: Apply consistent typography and spacing with the rest of the application

### Interaction Model Requirements
- **MUST**: Implement dual functionality for tab icons in collapsed state (expand sidebar and activate tab)
- **MUST**: Transition to collapsed state when the collapse button is clicked
- **MUST**: Use smooth GPU-accelerated animations following Speqq's design language
- **MUST**: Keep both tabs accessible in expanded state via tab buttons at the top of the sidebar
- **SHOULD**: Provide tooltip hints for icons in collapsed state for better usability
- **SHOULD**: Support keyboard navigation and focus management

## Client

### Component Architecture

1. **RightSidebarContainer (`/src/components/rightsidebar/right-sidebar.tsx`)**
   - **Purpose**: Root component that manages expand/collapse behavior
   - **Responsibilities**:
     - Adhere to shadcn component composition pattern
     - Utilize fixed positioning with proper z-index coordination
     - House both navigation and content sections
     - Consume UIState context for sidebar state management
     - Handle responsive behavior across breakpoints

2. **TabNavigation (`/src/components/rightsidebar/tab-navigation.tsx`)**
   - **Purpose**: Component responsible for tab switching interface
   - **Responsibilities**:
     - Implement compact/expanded tab UI states
     - Utilize Lucide React icons (MessageSquare, CheckSquare) consistently
     - Implement shadcn Tooltip component for accessibility
     - Maintain consistent active/inactive tab styling with the application theme
     - Handle tab selection and activation

3. **ContentPanel (`/src/components/rightsidebar/content-panel.tsx`)**
   - **Purpose**: Component for displaying active tab content
   - **Responsibilities**:
     - Render conditionally based on active tab selection
     - Implement smooth opacity transitions during expand/collapse
     - Use custom-scrollbar class for consistent scrolling UX
     - Maintain consistent typography with the main application
     - Handle content-specific layouts for each tab type

### Implementation Details

#### Component Selection
- Utilize shadcn UI components aligned with Speqq's existing UI architecture:
  - **Custom `Sidebar`** component - Following shadcn composition pattern
  - **`Sheet`** component from shadcn/ui - For small-screen mobile implementation
  - **Custom `RightSidebarProvider`** - For encapsulated state management
  - **Lucide React** icons - Maintaining icon consistency with the rest of the application
  - **shadcn `Tooltip`** - For enhanced accessibility in collapsed state

#### State Management
- Implement a dedicated `UIStateProvider` component in `/src/providers/ui-state-provider.tsx`
- Use React's Context API with proper TypeScript interfaces
- Expose a custom hook (`useUIState`) for consuming components

#### Animation Implementation
- Implement GPU-accelerated animations using CSS transforms (`transform: translateX()`) rather than width changes
- Utilize the Speqq standard transition timing: `transition-transform duration-300 ease-out`
- Apply `will-change: transform` CSS property for hardware acceleration
- Add subtle opacity transitions for content fade-in/out with 50ms staggered timing
- Match existing Speqq animation patterns used in dialog/modal components

#### Dashboard Integration
- Extend the existing dashboard layout in `/src/components/dashboard-layout-query.tsx`
- Integrate with the existing `ThemedSidebarWrapper` pattern used for the left sidebar
- Maintain consistent z-index hierarchy (main content: z-10, left sidebar: z-20, right sidebar: z-30)
- Implement coordinated state between sidebar components using the UIState provider
- Preserve current dashboard layout's responsive behavior while adding right sidebar support

### Layout Adjustments

When the right sidebar expands or collapses, the layout should adjust as follows:

#### Implementation Approach
- Use CSS transform properties for optimal animation performance
- Apply transition effects to both the sidebar and main content area
- Use a fixed sidebar width (320px) and adjust content spacing accordingly

#### Layout Behavior Specifications
- **Dashboard Content Area**: Apply `transform: translateX(-320px)` when the right sidebar expands to maintain fixed width and prevent content reflow issues
- **Left Sidebar (existing)**: Maintain current fixed positioning (`position: fixed; left: 0; top: 0;`) with unchanged z-index
- **Right Sidebar (new)**: Implement `position: fixed; right: 0; top: 0; z-index: 30;` with transform-based slide animation
- **Root Container**: Add `overflow-x: hidden` to the main dashboard wrapper to prevent horizontal scrolling during sidebar transitions
- **Height Consistency**: Match the height of both sidebars using `h-screen` for consistent full-height appearance

#### Animation Details
- Use `transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1)` for smooth motion
- Apply the same transition timing to all moving elements
- Add a slight delay (50ms) to the content transition for a more polished feel

## Database

No database changes are required for this implementation as it focuses solely on UI components. Future iterations that implement actual Chat and TODO functionality will require database schema updates.

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Browser Viewport                               │
│                                                                         │
│  ┌──────────┐  ┌──────────────────────────────────────────┐  ┌─────────┐  │
│  │         │  │                                         │  │         │  │
│  │         │  │                                         │  │         │  │
│  │         │  │                                         │  │   Tab   │  │
│  │  Left   │  │                                         │  │   Nav   │  │
│  │ Sidebar │  │           Main Content Area            │  │    +    │  │
│  │         │  │                                         │  │ Content │  │
│  │         │  │                                         │  │  Panel  │  │
│  │         │  │                                         │  │         │  │
│  │         │  │                                         │  │         │  │
│  └──────────┘  └──────────────────────────────────────────┘  └─────────┘  │
│  Fixed Left     Adjusts width based on sidebar states     Fixed Right   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            Component Hierarchy                           │
│                                                                          │
│         ┌──────────────────────┐                                        │
│         │   UIStateProvider     │                                        │
│         └────────────┬──────────┘                                        │
│                     │                                                    │
│         ┌────────────▼──────────┐                                        │
│         │   DashboardLayout     │                                        │
│         └────────────┬──────────┘                                        │
│          ┌───────────┼──────────┐                                         │
│ ┌─────────▼─────────┐ │ ┌─────────▼──────────┐                               │
│ │  LeftSidebar   │ │ │ MainContentArea  │                               │
│ └────────────────┘ │ └─────────┬─────────┘                               │
│                    │           │                                         │
│                    │ ┌─────────▼──────────┐                               │
│                    │ │  RightSidebar    │                               │
│                    │ └─────────┬─────────┘                               │
│                    │ ┌─────────┴─────────┐                               │
│                    │ │                  │                               │
│              ┌──────▼─▼───────┐    ┌──────▼─────────────┐                     │
│              │ TabNavigation│    │  ContentPanel  │                     │
│              └──────────────┘    └─────────────────┘                     │
│                                                                          │
└───────────────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### Right Sidebar Component

- [ ] The right sidebar is implemented using shadcn's Sidebar component
- [ ] The sidebar has both expanded and collapsed states
- [ ] The sidebar has a width of 320px (w-80) when expanded
- [ ] The sidebar has a minimal width showing only icons when collapsed
- [ ] The sidebar expands/collapses with a smooth animation
- [ ] The sidebar is positioned on the right side of the screen, opposite to the left sidebar

### Tab Navigation

- [ ] The sidebar contains two clearly labeled tabs: Chat and TODO
- [ ] Tabs are always visible even when the sidebar is collapsed (as icons)
- [ ] Clicking a tab makes it active and shows its corresponding content
- [ ] The active tab is visually distinguished from the inactive tab
- [ ] Only one tab can be active at a time

### Content Display

- [ ] When the Chat tab is active, a simple header displays "Chat"
- [ ] When the TODO tab is active, a simple header displays "TODO"
- [ ] Content area is hidden when the sidebar is collapsed
- [ ] Content area appears with a smooth transition when the sidebar expands

### Integration with Main Layout

- [ ] The right sidebar properly integrates with the existing dashboard layout
- [ ] The main content area adjusts its width when the right sidebar expands/collapses
- [ ] No overlap occurs between the right sidebar and main content

### Visual Design

- [ ] The right sidebar matches the application's dark theme (#0A0A0A background)
- [ ] The right sidebar has a subtle left border (border-l border-[#232326])
- [ ] Typography follows the application's existing text styles
- [ ] Button styling is consistent with other application controls

### Responsive Implementation

- [ ] Implement responsive behavior aligned with Speqq's existing breakpoint strategy:
  - **Desktop (≥ 1024px)**: Full sidebar with expand/collapse functionality
  - **Tablet (768px-1023px)**: Auto-collapsed sidebar showing only icons by default
  - **Mobile (< 768px)**: Icon-only toggleable sidebar using sheet/drawer pattern

- [ ] Apply Speqq's standard Tailwind breakpoint classes consistently:
  - **Desktop**: `lg:w-80 lg:translate-x-0` when expanded
  - **Tablet**: `md:w-12 md:translate-x-[calc(100%-48px)]` when collapsed
  - **Mobile**: `sm:fixed sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-xs sm:z-50`

- [ ] Maintain z-index coordination with existing components (dialogs, modals, notifications)

## UI Experience

### Expanded State

When the right sidebar is expanded:
- It occupies 320px of width on the right side of the screen
- The main content area is pushed to the left to accommodate the sidebar
- Both Chat and TODO tabs are fully visible with text labels
- The active tab's content is displayed in the content area
- A toggle button is available to collapse the sidebar

### Collapsed State

When the right sidebar is collapsed:
- It shows only icons for the Chat and TODO tabs
- The main content area expands to reclaim the space
- No content is visible, only the tab icons
- Hovering over the collapsed sidebar shows subtle tooltips for the tabs
- Clicking a tab icon expands the sidebar and activates that tab

### Interactions

- **Expanding/Collapsing:** Clicking the toggle button smoothly transitions between states
- **Tab Switching:** Clicking a tab activates it and shows its content
- **Responsive Adjustment:** The layout automatically adjusts based on screen size

## Implementation Steps

1. **Create UI State Provider (Day 1)**
   - Create `/src/providers/ui-state-provider.tsx` with proper TypeScript interfaces
   - Implement sidebar state management (open/closed, active tab)
   - Add custom hook for accessing UI state from components
   - Write unit tests for state provider functionality

2. **Implement Base Components (Day 1-2)**
   - Create directory structure for rightsidebar components
   - Implement `RightSidebar` component using shadcn UI patterns
   - Install required shadcn components (Sidebar, Tooltip) if not already present
   - Set up fixed positioning and z-index hierarchy

3. **Add Tab Navigation System (Day 2)**
   - Create `TabNavigation` component with Lucide React icons
   - Implement active/inactive states and responsive behavior
   - Add tooltip support for accessibility
   - Connect to UI state provider for state management

4. **Create Content Panels (Day 3)**
   - Implement `ContentPanel` component with conditional rendering
   - Create placeholder content for Chat and TODO views
   - Add smooth opacity transitions for panel switching
   - Implement scrolling behavior with custom scrollbar

5. **Integrate with Dashboard Layout (Day 3-4)**
   - Modify `/src/components/dashboard-layout-query.tsx` to include RightSidebar
   - Implement transform-based animations for main content area
   - Add responsive behavior across breakpoints
   - Ensure consistent styling with existing components

6. **Testing and Refinement (Day 4-5)**
   - Test across different viewport sizes (desktop, tablet, mobile)
   - Verify accessibility compliance (keyboard navigation, ARIA attributes)
   - Check for performance issues in animations
   - Validate against design requirements
   - Fix any edge cases or visual inconsistencies

## Lessons Learned

### State Management Separation

- **Problem**: Mixing UI state (like sidebar open/close) with data state can lead to unnecessary re-renders and harder-to-maintain code
- **Solution**: Create dedicated UI state providers that manage purely presentational concerns separate from data fetching

```typescript
// AVOID: Mixing UI and data state in a single provider
const AppContext = createContext<{  
  data: any[];  
  sidebarOpen: boolean;  
  toggleSidebar: () => void;
}>({});  

// PREFER: Separate concerns into multiple providers
const UIStateContext = createContext<{
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}>(null);

const DataContext = createContext<{
  data: any[];
}>(null);
```

### Transform-Based Animations

- **Problem**: Width/height animations often cause layout recalculations leading to poor performance
- **Solution**: Use transform-based animations which are GPU-accelerated and don't trigger layout recalculations

```css
/* AVOID: Layout-triggering animations */
.sidebar {
  width: 0;
  transition: width 300ms ease;
}
.sidebar.open {
  width: 320px;
}

/* PREFER: Transform-based animations */
.sidebar {
  width: 320px;
  transform: translateX(100%);
  transition: transform 300ms ease;
}
.sidebar.open {
  transform: translateX(0);
}
```

### Conditional Component Rendering

- **Problem**: Conditional mounting/unmounting of components can lead to layout shifts and lost state
- **Solution**: Use opacity and visibility for showing/hiding elements while keeping them in the DOM

```tsx
// AVOID: Complete unmounting on collapse
{isOpen && <SidebarContent />}

// PREFER: Keep in DOM but hide
<SidebarContent 
  className={`transition-opacity duration-200 ${
    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
  }`} 
/>
```

## Example Component Implementation

```tsx
// Example of a robust RightSidebar component with TypeScript types
import { FC } from 'react';
import { useUIState } from '@/providers/ui-state-provider';
import { Sidebar, SidebarContent, SidebarSection } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, CheckSquare, ChevronRight, ChevronLeft } from 'lucide-react';

export const RightSidebar: FC = () => {
  const { rightSidebarOpen, toggleRightSidebar, activeRightTab, setActiveRightTab } = useUIState();

  return (
    <Sidebar
      className={`h-screen fixed top-0 right-0 border-l border-[#232326] bg-[#0A0A0A] z-40
        will-change-transform overflow-hidden
        transition-transform duration-300 ease-out
        ${rightSidebarOpen ? 'w-80 translate-x-0' : 'w-12 translate-x-[calc(100%-48px)]'}
        lg:w-80 md:w-12 sm:w-full sm:inset-0 sm:z-50`}
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Tab Navigation Section */}
        <SidebarSection className="flex flex-row lg:flex-col justify-start items-center py-4 space-y-0 lg:space-y-4 space-x-4 lg:space-x-0 border-b border-[#232326] p-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`flex items-center justify-center p-2 rounded-md
                    ${activeRightTab === 'chat'
                      ? 'bg-[#121218] text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'}
                    transition-colors duration-200 min-w-10 h-10`}
                  onClick={() => setActiveRightTab('chat')}
                  aria-label="Chat"
                >
                  {rightSidebarOpen ? (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="font-medium">Chat</span>
                    </>
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-[#1A1A1A] text-white/80">
                <p>Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`flex items-center justify-center p-2 rounded-md
                    ${activeRightTab === 'todo'
                      ? 'bg-[#121218] text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'}
                    transition-colors duration-200 min-w-10 h-10`}
                  onClick={() => setActiveRightTab('todo')}
                  aria-label="TODO"
                >
                  {rightSidebarOpen ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <span className="font-medium">TODO</span>
                    </>
                  ) : (
                    <CheckSquare className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-[#1A1A1A] text-white/80">
                <p>TODO</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarSection>

        {/* Content Area - Conditionally rendered based on sidebar state */}
        <SidebarSection
          className={`p-4 flex-grow overflow-y-auto custom-scrollbar transition-opacity duration-200 ${
            rightSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeRightTab === 'chat' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/90">Chat</h2>
              <p className="text-white/70 text-sm">Chat functionality placeholder.</p>
            </div>
          )}

          {activeRightTab === 'todo' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/90">TODO</h2>
              <p className="text-white/70 text-sm">TODO list placeholder.</p>
            </div>
          )}
        </SidebarSection>
      </SidebarContent>

      {/* Toggle Button - Positioned for accessibility */}
      <button
        className="absolute top-4 left-3 z-50 p-1 rounded-md bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white/70 hover:text-white/90 transition-colors duration-200"
        onClick={toggleRightSidebar}
        aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </Sidebar>
  );
};
```

The access code is: "I read md.rightside, Justin"
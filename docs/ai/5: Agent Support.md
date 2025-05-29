# Objective
- Add agent support to the fully managed mode AI Chat. Agents represent systems that intelligently accomplish tasks, ranging from executing simple workflows to pursuing complex, open-ended objectives. We want to allow user to make changes to their underlying data from the chat
- Implementation should focus on base functionality rather than over engienerring and global scale. For exanple, testing for <500 users. However, there is no need for throw away work. We still want a good implementaition. 

# Requirements

## Functional Requirements

**Must**
- Allows a user to create entities:
    - Roadmaps
    - Products
    - Roadmaps
    - Requirements
    - Releases

- Allows a user to delete entities:
    - Roadmaps
    - Products
    - Roadmaps
    - Requirements
    - Releases

- Allows a update/modify entity data
    - Product: Name, Description,
    - Feature: Name, Priority, Description, Roadmap, OKR. If the field is based on existing data, for ex, Connecting to a roadmap, the agent should know what roadmaps exists and if they do not have a roadmap, say they do not have a roadmap and need to create one. Then ask if they want them to create one.
    - Requirements: Priotiy, Name, Description, Owner, 
    - Releases: name, description, release_date, priotiy, 


- Allows a user tp confirm or deny changes before they are made
- Allows a user to toggle between agent and Ask mode
    - Agent mode is take action
    - Query mode is ask a question about entities or general best practice product / software development.

- Error handling requirements:
    - Must gracefully handle and communicate database operation failures (create/update/delete) to the user with clear error messages
    - Must handle OpenAI API failures (rate limits, timeouts, authentication) and provide fallback responses or retry mechanisms
    - Must validate entity relationships and dependencies before operations (e.g., cannot delete a roadmap that has active features) and inform user of conflicts

**Should** 
- Allows a user to undo a change
- Allows a user to upload an image 
- Allows a user to see the model being used and toggle it


## UI Requirements
**Must**
- Toggle to switch between modes
- After message is sent, chat input returns back to defaul test: Ask, build, Plan
- Confirmation dialog that clearly shows what changes will be made before user approves/denies actions
- Visual indicators to distinguish between Agent mode (action-taking) and Ask mode (query-only) throughout the interface
- Loading states and progress indicators for long-running operations (entity creation, updates, deletions) with ability to cancel 

## System Requirements
**Must**
- Multi-tenant data isolation - all agent operations must respect tenant boundaries and cannot access or modify data from other tenants
- Authentication and authorization - verify user permissions before any create/update/delete operations on entities
- Database transaction support - all multi-step operations must be atomic (rollback on failure)
- Data validation - validate all entity data before database operations (required fields, data types, constraints)

**Should**
- Rate limiting for OpenAI API calls to prevent quota exhaustion and manage costs
- Audit logging - record all agent actions (what was changed, by whom, when) for compliance and debugging
- Backup and recovery - ensure agent operations can be reversed if needed, maintain data integrity
- Performance monitoring - track response times and success rates for agent operations
- Scalability for concurrent users - support multiple users performing agent operations simultaneously without conflicts
- Environment separation - agent operations must work correctly across development, staging, and production environments


# Solution 

## Constraints
- Must use openAI agent tools
- Must use existing patterns unless stricly necessary
- Use global resources and providers (eg useAuth())

## Overview
- Extend existing OpenAI Fully Managed mode to support function calling with CRUD operations
- Add Agent/Ask mode toggle to chat UI alongside existing RAG/OpenAI toggle
- Implement OpenAI function definitions for entity operations (create, update, delete for Products, Features, Requirements, Releases, Roadmaps)
- Create confirmation dialog component that shows proposed changes before execution
- Use existing service layer patterns (products-db.ts, features-db.ts, etc.) for database operations
- Leverage existing multi-tenant architecture and authentication via useAuth()
- Add visual indicators to distinguish between query mode and action mode
- Implement error handling for API failures and data validation
- Store agent actions in existing ai_messages table with action metadata
- Follow existing code patterns and use shadcn/ui components for new UI elements

## Engineering Design

**Architecture Components:**
- **OpenAI Assistants API** - Function calling for agent operations and conversation management
- **OpenAI Function Tools** - Define CRUD operations (createProduct, updateFeature, deleteRoadmap, etc.)
- **Supabase Database** - Store entity data with existing RLS policies for multi-tenant isolation
- **Next.js API Routes** - Handle agent requests and coordinate between OpenAI and database
- **React Components** - Agent/Ask mode toggle, confirmation dialogs, and visual indicators
- **Existing Service Layer** - Reuse products-db.ts, features-db.ts for database operations

**Data Flow:**
1. User sends message in Agent mode → OpenAI Assistant
2. OpenAI determines if action needed → Calls defined function tools
3. Function tool returns proposed changes → Show confirmation dialog to user
4. User approves → Execute via existing service layer → Update Supabase
5. Success/failure response → Store in ai_messages → Display to user

**Security & Validation:**
- **Next.js Middleware** - Authenticate requests using existing auth patterns
- **Service Layer** - Validate data and enforce business rules before database operations
- **Supabase RLS** - Enforce tenant isolation at database level
- **Input Validation** - Zod schemas for all agent operation parameters

**Auth & Context:**
- **useAuth() Provider** - Access current user and tenant ID for all agent operations
- **NextAuth.js** - Handle session management and user authentication
- **Auth Provider Context** - Provide user/tenant context to agent components and API routes
- **Tenant Resolution** - Extract tenant ID from auth context to ensure all operations are scoped correctly 

# Implementation 

## Testing 
[A test user id and tenent id can be found in env.local]:#


## Implementation Steps

### Phase 1: Foundation (No Dependencies)
**Goal**: Establish type safety and utility functions

1. **Models/Types** - Define TypeScript interfaces first
2. **Libs** - Create utility functions for OpenAI tools  
3. **Util** - Error handling and validation utilities

### Phase 2: Backend Core (Build from Data Up)
**Goal**: Implement data layer and security

4. **Dependencies** - Verify packages (no additional needed)
5. **DB** - Extend database schema for agent actions
6. **Services** - Add agent operations to existing service files
7. **Middleware** - Auth and security for agent operations  
8. **Providers** - Extend auth context for agent permissions

### Phase 3: API Integration (Connect to OpenAI)
**Goal**: Enable OpenAI function calling

9. **API** - Extend ai-chat-fully-managed with function calling

### Phase 4: Frontend (UI Depends on Backend)
**Goal**: Build user interface and interactions

10. **Hooks** - State management for agent operations
11. **Components** - UI components and dialogs

## Tasks

### Components
- Add Agent/Ask mode toggle component to chat interface
- Create confirmation dialog component for showing proposed changes
- Add visual mode indicators to distinguish Agent vs Ask modes
- Enhance loading states for agent operations with cancel capability
- Update chat input placeholder text based on current mode

**Tests**
- Test 25: Given user clicks Agent mode toggle, UI visually indicates action mode is active
- Test 26: Given user in Ask mode, agent operation buttons are disabled/hidden
- Test 27: Given mode switch during conversation, previous messages retain their mode context
- Test 28: Given agent proposes creating product, confirmation dialog shows preview of exact changes to be made
- Test 29: Given user clicks "Approve" in confirmation dialog, action executes and dialog closes with success message
- Test 30: Given user clicks "Deny" in confirmation dialog, action cancels and returns to chat without changes
- Test 31: Given agent operation in progress, loading indicator shows with ability to cancel
- Test 37: Given Agent mode active, chat input placeholder indicates action capabilities
- Test 38: Given Ask mode active, chat input placeholder indicates query-only mode

### Hooks
- Extend use-ai-chat-fully-managed hook to support function calling
- Add agent operations state management (pending confirmations, loading)
- Create hook for managing confirmation dialog state and responses
- Add error handling hooks for agent operation failures

**Tests**
- Test 10: Given agent action request, confirmation data structure contains all necessary change details
- Test 11: Given user denial, confirmation dialog returns rejection status
- Test 12: Given user approval, confirmation dialog returns approval with original parameters

### API
- Extend ai-chat-fully-managed route to handle OpenAI function calling
- Add function tool definitions for entity CRUD operations
- Implement confirmation flow in API route before executing actions
- Add error handling for database operation failures and OpenAI API issues

**Tests**
- Test 13: Given user message "Create a product called Login System", OpenAI calls createProduct function with correct parameters
- Test 14: Given function call execution, OpenAI receives properly formatted tool output response
- Test 15: Given OpenAI API failure during function calling, system handles gracefully with retry mechanism
- Test 22: Given OpenAI rate limit error, system implements exponential backoff and eventual success
- Test 23: Given database connection failure during agent operation, user receives clear error message
- Test 24: Given partial operation failure, system provides specific error details and recovery suggestions

### Services
- Add agent operation functions to existing service files (products-db, features-db, etc.)
- Implement data validation before database operations
- Add transaction support for multi-step operations
- Create service functions for entity relationship validation

**Tests**
- Test 4: Given function name "createProduct" with valid args, routes to products-db service
- Test 5: Given unknown function name, throws "Unknown function" error
- Test 7: Given product creation with missing required fields, validation fails with specific error
- Test 8: Given feature update with invalid roadmap ID, relationship validation fails
- Test 9: Given entity deletion with active dependencies, dependency check prevents deletion
- Test 16: Given agent creates product with features, both entities created in single transaction or both fail
- Test 17: Given database constraint violation during agent operation, transaction rolls back completely

### DB
- Extend ai_messages table to store agent action metadata
- Add indexes for agent operation queries if needed
- Ensure existing RLS policies cover agent operations
- Add any new columns needed for tracking agent actions

**Tests**
- Test 18: Given successful agent operation, audit log entry created with user/tenant/action details
- Test 19: Given user from tenant A attempts to modify tenant B data via agent, operation is blocked
- Test 20: Given agent operation, only current tenant's data is accessible for context and modification
- Test 21: Given cross-tenant entity reference in agent request, validation prevents unauthorized access

### Providers
- Update auth provider context to support agent operation permissions
- Ensure tenant context is properly passed to agent operations
- Add agent mode state to relevant providers

**Tests**
- Test 6: Given function call without tenant context, throws authentication error

### Middleware
- Extend existing auth middleware to handle agent operation requests
- Add validation for agent mode vs ask mode permissions
- Ensure tenant isolation for all agent operations

**Tests**
- Test 19: Given user from tenant A attempts to modify tenant B data via agent, operation is blocked
- Test 20: Given agent operation, only current tenant's data is accessible for context and modification

### Models / Types
- Add TypeScript types for agent operation parameters
- Define types for confirmation dialog data structures
- Add agent action metadata types for message storage
- Create types for OpenAI function tool definitions

**Tests**
- Test 1: Given valid function parameters, function definitions match OpenAI schema requirements
- Test 2: Given invalid parameters, function validation throws appropriate errors
- Test 3: Given entity type (product, feature, etc.), correct CRUD functions are available

### Libs
- Add utility functions for OpenAI function tool creation
- Create helpers for agent operation validation
- Add confirmation dialog utility functions

**Tests**
- Test 1: Given valid function parameters, function definitions match OpenAI schema requirements
- Test 2: Given invalid parameters, function validation throws appropriate errors

### Util
- Add entity relationship validation utilities
- Create error message formatting for agent operations
- Add data transformation utilities for OpenAI function responses
- Create utilities for agent operation logging and tracking

**Tests**
- Test 32: Given long-running operation, progress updates appear with current status
- Test 33: Given operation completion, success/failure state shows with appropriate messaging
- Test 34: Given agent operation fails, error message appears in chat with retry option
- Test 35: Given validation error, specific field requirements shown to user for correction
- Test 36: Given network error, user receives actionable error message with manual retry option
- Test 39: Given agent operation successful, chat history shows clear record of action taken with timestamp 


# Resources
- NextJS: https://nextjs.org/docs
- React: https://react.dev/
- Open AI Agents: https://platform.openai.com/docs/guides/agents
- Open AI Realtime: https://platform.openai.com/docs/guides/realtime
- Supbase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
# Speqq Roadmapping Feature: Product Manager Needs & Implementation Plan

Overview
- The Roadmap features purpose is to give users a view of their features/releases in a viewable and editable snapshot.

What is a roadmap?
- Roadmap: a group of Features and their associated Releases

## Release 1

Access points 
- Roadmap button in the side nav

Requirements 
- CRUD a roadmap
- CRUD features to a roadmap 
- Assign an owner(s) (user(s)) to the roadmap...they must be in the same tenant
- **Filters:** By owner, priority, status, release, or custom tags.
- **Custom Columns:** Allow PMs to define their own visible columns.
- **Saved Views:** Save and share custom table configurations.
- **Quick Edit:** Inline editing of Features and Releases from the table.
- Roadmap tenancy: as of now a roadmap is for a tenant only. A roadmap is assocaited with a tenant

UI Components
- **Structured Table View:** Rich table interface for Features and Releases with customizable columns.
- **Grouping Options:** Group by Release, Feature Type, or Priority.
- **Feature-Release Rows:** Show key info (name, owner, status, priority, linked requirements, etc.).
- **Filters:** By owner, priority, status, release, or custom tags.
- **Custom Columns:** Allow PMs to define their own visible columns.
- **Saved Views:** Save and share custom table configurations.

## Eng Design

### DB Changes
1. **Tables Updates**
   - Add to `features` table:
     - `roadmapId` TEXT column (NULL if not on roadmap)
     - `display_order` INTEGER DEFAULT 0 column
     - `color` TEXT column
   
   - Add to `releases` table:
     - `roadmapId` TEXT column (NULL if not on roadmap)
     - `display_order` INTEGER DEFAULT 0 column
     - `color` TEXT column

2. **Migration Script**
   ```sql
   -- Add columns to features table with tenantId support
   ALTER TABLE features ADD COLUMN "roadmapId" TEXT;
   ALTER TABLE features ADD COLUMN "display_order" INTEGER DEFAULT 0;
   ALTER TABLE features ADD COLUMN "color" TEXT;
   
   -- Add columns to releases table with tenantId support
   ALTER TABLE releases ADD COLUMN "roadmapId" TEXT;
   ALTER TABLE releases ADD COLUMN "display_order" INTEGER DEFAULT 0;
   ALTER TABLE releases ADD COLUMN "color" TEXT;
   
   -- Create necessary indexes
   CREATE INDEX IF NOT EXISTS "idx_features_roadmapId" ON features("roadmapId");
   CREATE INDEX IF NOT EXISTS "idx_features_display_order" ON features("display_order");
   CREATE INDEX IF NOT EXISTS "idx_releases_roadmapId" ON releases("roadmapId");
   CREATE INDEX IF NOT EXISTS "idx_releases_display_order" ON releases("display_order");
   ```

3. **Best Practice Patterns**
   - Maintain existing 1:N relationship between features and releases
   - Follow established SQLite schema conventions
   - Ensure tenantId filtering is applied to all roadmap queries
   - Never return data from different tenants in the same query

### Server Layer Changes
1. **API Routes**
   - Create roadmap data route (`/api/roadmap`):
     ```typescript
     // GET /api/roadmap
     export async function GET(request: NextRequest) {
       // Extract tenantId from session or params
       const session = await getServerSession();
       const tenantId = session?.user?.currentTenant || 
                         request.nextUrl.searchParams.get('tenantId') || 
                         'org1';
       
       // Return roadmap data with proper tenancy isolation
       const roadmapData = await getRoadmapData(tenantId);
       return NextResponse.json(roadmapData);
     }
     ```

2. **Database Service Methods**
   - Add to `features-db.ts`:
     ```typescript
     // Get features for roadmap
     export async function getFeaturesForRoadmap(tenantId: string = 'org1') {
       const db = getDb();
       try {
         // Get features directly on roadmap
         const features = db.prepare(`
           SELECT * FROM features 
           WHERE "roadmapId" IS NOT NULL 
           AND "tenantId" = ?
           ORDER BY "display_order"
         `).all(tenantId);
         
         return { success: true, data: features };
       } catch (error) {
         console.error('Error fetching roadmap features:', error);
         return { success: false, error: error.message };
       }
     }
     
     // Update feature roadmap fields
     export async function updateFeatureRoadmapFields(
       id: string, 
       roadmapId: string | null,
       display_order: number | null,
       color: string | null,
       tenantId: string = 'org1'
     ) {
       const db = getDb();
       
       // Build update query based on provided fields
       let updates = [];
       let params = [];
       
       if (roadmapId !== undefined) {
         updates.push('"roadmapId" = ?');
         params.push(roadmapId);
       }
       
       if (display_order !== undefined) {
         updates.push('"display_order" = ?');
         params.push(display_order);
       }
       
       if (color !== undefined) {
         updates.push('"color" = ?');
         params.push(color);
       }
       
       if (updates.length === 0) return { success: false, error: 'No updates provided' };
       
       try {
         // Add required params for WHERE clause
         params.push(id, tenantId);
         
         const result = db.prepare(`
           UPDATE features 
           SET ${updates.join(', ')} 
           WHERE "id" = ? AND "tenantId" = ?
         `).run(...params);
         
         return { success: result.changes > 0 };
       } catch (error) {
         console.error(`Error updating feature roadmap fields:`, error);
         return { success: false, error: error.message };
       }
     }
     ```
   
   - Similar methods for `releases-db.ts`
   
   - Add to `db.server.ts`:
     ```typescript
     // Combined roadmap data service
     export async function getRoadmapData(roadmapId: string, tenantId: string = 'org1') {
       const db = getDb();
       try {
         // Get features on the roadmap
         const features = db.prepare(`
           SELECT * FROM features 
           WHERE "roadmapId" = ? 
           AND "tenantId" = ?
           ORDER BY "display_order"
         `).all(roadmapId, tenantId);
         
         // Get releases that belong to features on the roadmap
         const releases = db.prepare(`
           SELECT r.*
           FROM releases r
           JOIN features f ON r.featureId = f.id
           WHERE f.roadmapId = ?
           AND r.tenantId = ? AND f.tenantId = ?
           ORDER BY r.releaseDate, r.name
         `).all(roadmapId, tenantId, tenantId);
         
         return { 
           success: true, 
           data: {
             features,
             releases
           }
         };
       } catch (error) {
         console.error('Error fetching roadmap data:', error);
         return { success: false, error: error.message };
       }
     }
     ```

3. **Best Practice Patterns**
   - Always filter by tenantId in every database query
   - Validate tenantId matches current user's tenant before operations
   - Use consistent error handling for all database operations
   - Follow existing patterns for API responses

### Client Layer Changes
1. **Components**
   - Add Roadmap tab component
   - Create RoadmapTable component based on existing table patterns
   - Create RoadmapHeader and filtering components
   - Add linking functionality to Feature and Release cells

2. **Data Management**
   - Extend existing React Query hooks for release data
   - Example: 
     ```typescript
     export function useReleasesForRoadmap(filters) {
       return useQuery(['releases', 'roadmap', filters], () => fetchReleasesForRoadmap(filters));
     }
     ```
   - Update existing release mutation hooks to handle new fields
   - Create new hooks for roadmap views if needed

3. **Best Practice Patterns**
   - Reuse existing UI components (tables, filters, tabs)
   - Follow established component hierarchy
   - Maintain separation of concerns (data fetching, rendering, state)
   - Extend existing hooks rather than creating new ones when possible
   - Use consistent state management approach

### Implementation Approach
1. **Phase 1: Schema Updates**
   - Add new columns to releases table
   - Add necessary indexes

2. **Phase 2: Backend Extensions**
   - Extend existing services with roadmap functionality
   - Create basic roadmap API endpoint

3. **Phase 3: UI Implementation**
   - Build roadmap tab and table components
   - Implement basic filtering functionality

4. **Future Enhancements** (deferred to later releases)
   - Saved views functionality
   - Advanced filtering and customization
   - Design components to be flexible if N:N relationship is needed later

### Migration Note
- This implementation preserves the current 1:N relationship model where:
  - A Feature can have multiple Releases
  - A Release belongs to exactly one Feature
- If a many-to-many model is needed in the future, we can implement it as a separate enhancement

## 3. Workflow Stages Implementation

### Feature-Release Relationship Model
To accommodate features that span multiple releases with different statuses per release, we need a many-to-many relationship model:

#### Database Schema
- **features** table: Contains core feature information
- **releases** table: Contains release information
- **feature_releases** table: Junction table that tracks the relationship between features and releases with per-release status:
  - feature_id (FK)
  - release_id (FK)
  - workflow_stage_id (FK)
  - status_notes
  - percent_complete
  - is_visible_on_roadmap

#### Workflow Stages
Standard workflow stages across all releases:
- **Backlog**: Feature is planned but not yet scheduled
- **Not Started**: Feature is scheduled for the release but work hasn't begun
- **In Progress**: Feature is actively being worked on (maps to any active Main Stage)
- **Launched**: Feature has completed all required Main Stages for this release

#### Implementation Details
1. **Main Stages Integration**:
   - When a feature's Main Stage changes, the system will determine if this should update the workflow_stage
   - Map various Main Stages to the "In Progress" workflow stage with additional metadata

2. **Launch Phases Integration**:
   - Track launch phase progress per release
   - When all required launch phases are complete, automatically update to "Launched" status

3. **Multiple Release Support**:
   - A feature can appear multiple times on the roadmap, once per associated release
   - Each appearance can have a different workflow stage (e.g., "Launched" for Release 1, "In Progress" for Release 2)
   - The UI will visually indicate these relationships

4. **Versioning Strategy**:
   - Features can have incremental versions across releases
   - Track which requirements are targeted for which release version

5. **Feature-Release as Launchable Unit**:
   - The combination of Feature+Release is the fundamental launchable unit
   - Each Feature/Release pair appears as a unique entry on the roadmap (e.g., "Feature A (Release 1)", "Feature A (Release 2)")
   - Upon feature creation, an initial "Release 1" is automatically created and associated with it
   - Users can add additional releases to an existing feature as needed

### Visual Representation
- Each feature-release combination appears as a row in the roadmap table
- Color indicators can show status and highlight when a feature spans multiple releases
- Filter controls allow for showing/hiding different release versions of features
- Grouping options include by Feature (showing all releases) or by Release (showing all features)

## 4. Database Implementation: Current State vs. Required Changes

### Current Database Schema

The Speqq application currently uses SQLite with the following key tables:

1. **features**
   ```sql
   CREATE TABLE features (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     priority TEXT NOT NULL,
     description TEXT,
     interfaceId TEXT,
     tenantId TEXT NOT NULL,
     FOREIGN KEY (interfaceId) REFERENCES interfaces(id),
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   )
   ```

2. **releases**
   ```sql
   CREATE TABLE releases (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     releaseDate TEXT NOT NULL,
     priority TEXT NOT NULL,
     featureId TEXT,
     tenantId TEXT NOT NULL,
     FOREIGN KEY (featureId) REFERENCES features(id),
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   )
   ```

3. **approval_stages**
   ```sql
   CREATE TABLE approval_stages (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     order_num INTEGER NOT NULL,
     type TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )
   ```

4. **entity_approvals**
   ```sql
   CREATE TABLE entity_approvals (
     id TEXT PRIMARY KEY,
     entity_id TEXT NOT NULL,
     entity_type TEXT NOT NULL,
     stage_id TEXT NOT NULL,
     status_id TEXT NOT NULL,
     approver TEXT,
     comments TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )
   ```

### Required Schema Changes

To implement the roadmap functionality while leveraging existing tables:

1. **Extend Release Table**
   ```sql
   ALTER TABLE releases ADD COLUMN "display_order" INTEGER DEFAULT 0;
   ALTER TABLE releases ADD COLUMN "color" TEXT;
   ```

2. **Create Feature-Release Junction Table**
   ```sql
   CREATE TABLE feature_release_mapping (
     feature_id TEXT NOT NULL,
     release_id TEXT NOT NULL,
     workflow_stage TEXT NOT NULL,
     percent_complete REAL DEFAULT 0,
     is_visible_on_roadmap INTEGER DEFAULT 1,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     tenantId TEXT NOT NULL,
     PRIMARY KEY (feature_id, release_id),
     FOREIGN KEY (feature_id) REFERENCES features(id),
     FOREIGN KEY (release_id) REFERENCES releases(id),
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   )
   ```

3. **Create Roadmap View Settings Table**
   ```sql
   CREATE TABLE roadmap_views (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     user_id TEXT NOT NULL,
     view_type TEXT NOT NULL,
     column_config TEXT,
     filter_config TEXT,
     is_default INTEGER DEFAULT 0,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     tenantId TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   )
   ```

### Integration with Existing Approval System

The existing approval system can be utilized for the roadmap workflow stages:

1. **Workflow Stage Mapping**
   - Map the roadmap workflow stages (Backlog, Not Started, In Progress, Launched) to the approval_stages and entity_approvals tables
   - Create a view or function that determines a feature-release's workflow stage based on its approval status

```sql
-- Example view to map approval statuses to workflow stages
CREATE VIEW feature_release_workflow AS
SELECT 
  ea.entity_id AS feature_id,
  r.id AS release_id,
  CASE
    WHEN COUNT(DISTINCT eas.stage_id) = 0 THEN 'Backlog'
    WHEN MIN(eas.status_id) = 'not_started' THEN 'Not Started'
    WHEN MIN(eas.status_id) = 'completed' AND COUNT(DISTINCT eas.stage_id) = (SELECT COUNT(*) FROM approval_stages WHERE type = 'main') THEN 'Launched'
    ELSE 'In Progress'
  END AS workflow_stage
FROM 
  entity_approvals ea
JOIN 
  releases r ON ea.entity_id = r.featureId
GROUP BY 
  ea.entity_id, r.id;
```

### Data Migration Strategy

1. **Initialize Feature-Release Mappings**
   - For each release in the database, create a corresponding feature_release_mapping entry
   - Default the workflow_stage based on current approval status

2. **Create Default Roadmap View**
   - Create a default roadmap view for each user with standard column configuration

## 5. Table-Based Implementation

Leveraging the existing table patterns in Speqq, the roadmap can be implemented as an enhanced table view instead of a Kanban board. This approach would:

### a. Table Structure & Features

1. **Rich Interactive Table**
   - Similar to existing tables for features, releases, and approvals
   - Multi-level grouping capabilities (by Feature, by Release, by Stage)
   - Color-coded status indicators
   - Progress bars for completion percentage
   - Timeline indicators for release dates

2. **Column Configuration**
   - **Feature**: Name of the feature (links to Feature tab)
   - **Release**: Associated release name (links to Release tab)
   - **Release Date**: Timeline indicator
   - **Last Updated**: When the item was last modified

3. **Multiple Views with Tabs**
   - **All**: Complete list of all feature-release combinations
   - **Backlog**: Only items in Backlog stage
   - **Not Started**: Only items in Not Started stage
   - **In Progress**: Only items in In Progress stage
   - **Launched**: Only items that have been launched

### b. Technical Advantages

1. **Code Reuse**
   - Leverages the existing table components, reducers, and query patterns
   - Follows established UI patterns familiar to users
   - Minimal new UI components needed

2. **Database Compatibility**
   - Works with the same database schema proposed earlier
   - Leverages existing SQL queries and database access patterns

3. **Faster Implementation**
   - Reduced development time by building on proven patterns
   - Easier testing and quality assurance

### c. User Experience

```
[Tabs: All | Backlog | Not Started | In Progress | Launched]

┌─────────────────┬────────────────┬─────────────┬────────────────┐
│ Feature         │ Release        │ Release Date│ Last Updated   │
├─────────────────┼────────────────┼─────────────┼────────────────┤
│ Feature A       │ R1.0           │ 2023-10-15  │ 2023-09-30     │
│ Feature A       │ R2.0           │ 2023-12-01  │ 2023-11-15     │
│ Feature B       │ R1.0           │ 2023-10-15  │ 2023-09-25     │
│ Feature C       │ R1.5           │ 2023-11-10  │ 2023-10-20     │
└─────────────────┴────────────────┴─────────────┴────────────────┘
```

### d. Future Enhancement Path

1. **Phase 1**: Implement table-based roadmap with basic functionality
2. **Phase 2**: Add advanced filtering, grouping, and visualization features
3. **Phase 3**: Consider adding Kanban view as an alternative visualization (if still desired)

## 6. Implementation Plan

### Phase 1: Foundation

#### Database (Storage)
- [ ] Add display_order and color fields to releases table
- [ ] Create feature_release_mapping table
- [ ] Create roadmap_views table for storing custom view configurations

#### Backend (Server)
- [ ] Create API endpoints for feature-release combinations
- [ ] Implement endpoints for updating workflow stages
- [ ] Add sorting and grouping functionality to API responses

#### Frontend (Client)
- [ ] Add "Roadmap" tab to the dashboard navigation
- [ ] Create roadmap table component based on existing table patterns
- [ ] Implement Feature and Release row/cell components
- [ ] Build basic filtering controls
- [ ] Add tab navigation for different grouping views

### Phase 2: Advanced Features

#### Database (Storage)
- [ ] Create roadmap_milestones table for timeline events
- [ ] Add dependency relationships between features

#### Backend (Server)
- [ ] Create endpoints for milestone management
- [ ] Implement feature dependency logic
- [ ] Add advanced aggregation and filtering endpoints

#### Frontend (Client)
- [ ] Build advanced filtering UI
- [ ] Implement excel-like aggregation features
- [ ] Add timeline visualization overlay option
- [ ] Implement status indicators and milestone markers

### Phase 3: Collaboration Features

#### Database (Storage)
- [ ] Create feature_comments and release_comments tables
- [ ] Add notification_preferences table for user settings

#### Backend (Server)
- [ ] Implement comment and note management endpoints
- [ ] Create notification generation and delivery system

#### Frontend (Client)
- [ ] Add comment and discussion UI to feature/release rows
- [ ] Implement assignment and notification components
- [ ] Add inline editing capabilities

### Phase 4: Integration & Bulk Actions

#### Database (Storage)
- [ ] Add batch_operation_logs table to track bulk changes

#### Backend (Server)
- [ ] Implement bulk update endpoints for features and releases
- [ ] Create advanced filtering API with multiple parameters

#### Frontend (Client)
- [ ] Build multi-select and bulk action UI components
- [ ] Implement advanced filtering interface
- [ ] Add data validation and conflict resolution for sync operations

### Phase 5: Polish & Performance

#### Database (Storage)
- [ ] Add usage_analytics tables to track roadmap feature usage
- [ ] Create performance optimization indexes

#### Backend (Server)
- [ ] Implement analytics collection endpoints
- [ ] Performance optimization for large roadmaps

#### Frontend (Client)
- [ ] Add onboarding tooltips and guided tour
- [ ] Implement performance optimizations for large datasets
- [ ] Create documentation and help components

---

**Next Steps:**
- Review and prioritize the above needs and phases.
- Begin with Phase 1 implementation, focusing on the Database schema changes and adapting existing table components. 


# Future Planning
### b. Feature & Release Management

- **Release Data:** Show release name, date, status, and associated features.


### c. Progress & Status Visibility
- **Status Indicators:** Visual cues for progress, blockers, and completion.
- **Dependencies:** Indicate and manage dependencies between features/releases.
- **Milestones:** Highlight key dates or deliverables.

### d. Collaboration & Communication
- **Comments/Notes:** Allow team members to discuss items directly in the table.
- **Assignment:** Assign owners or teams to Features and Releases.
- **Notifications:** Alert users to changes, blockers, or upcoming deadlines.


### f. Integration with Existing Data
- **Sync:** Features and Releases on the roadmap are linked to the existing Speqq data model.
- **Bulk Actions:** Move, assign, or update multiple items at once.

4. **Implementation Best Practices**
   
   a. **Input Validation**
   - Implement Zod schemas for all API input validation:
     ```typescript
     // Define Zod schema for roadmap parameters
     import { z } from 'zod';
     
     export const RoadmapFeatureSchema = z.object({
       featureId: z.string().min(1, "Feature ID is required"),
       roadmapId: z.string().min(1, "Roadmap ID is required"),
       display_order: z.number().optional(),
       color: z.string().optional(),
     });
     
     // Use in API routes
     export async function POST(request: NextRequest) {
       try {
         const body = await request.json();
         
         // Validate input with Zod
         const result = RoadmapFeatureSchema.safeParse(body);
         
         if (!result.success) {
           return NextResponse.json(
             { error: result.error.format() },
             { status: 400 }
           );
         }
         
         const { featureId, roadmapId, display_order, color } = result.data;
         
         // Proceed with validated data
         // ...
       } catch (error) {
         // ...
       }
     }
     ```
   - Validate all query parameters and body content
   - Return standardized error responses for validation failures
   - Add validation at both API and service layers

   b. **Database Operations**
   - Use transactions for multi-step operations:
     ```typescript
     // Example: Adding multiple features to a roadmap
     export async function addFeaturesToRoadmap(
       featureIds: string[], 
       roadmapId: string,
       tenantId: string = 'org1'
     ) {
       const db = getDb();
       
       try {
         // Begin transaction
         db.prepare('BEGIN TRANSACTION').run();
         
         const stmt = db.prepare(`
           UPDATE features 
           SET "roadmapId" = ? 
           WHERE "id" = ? AND "tenantId" = ?
         `);
         
         // Execute for each feature
         for (const featureId of featureIds) {
           stmt.run(roadmapId, featureId, tenantId);
         }
         
         // Commit transaction
         db.prepare('COMMIT').run();
         
         return { success: true };
       } catch (error) {
         // Rollback on error
         db.prepare('ROLLBACK').run();
         console.error('Error adding features to roadmap:', error);
         return { success: false, error: error.message };
       }
     }
     ```
   - Standardize SQL patterns across services:
     - Consistent column naming and quoting
     - Standard parameter handling
     - Unified error handling and logging
   - Add retry logic for transient database errors
   - Implement connection pooling for production environments

   c. **TypeScript Improvements**
   - Create comprehensive model types:
     ```typescript
     // Enhanced feature model with roadmap fields
     export interface Feature {
       id: string;
       name: string;
       description: string;
       priority: 'High' | 'Med' | 'Low';
       interfaceId: string;
       tenantId: string;
       // Roadmap fields
       roadmapId: string | null;
       display_order: number;
       color: string | null;
     }
     
     // Type for roadmap data
     export interface RoadmapData {
       features: Feature[];
       releases: Release[];
     }
     
     // Service result types
     export type ServiceResult<T> = 
       | { success: true; data: T }
       | { success: false; error: string };
     ```
   - Use discriminated unions for error handling:
     ```typescript
     // Usage
     const result = await getRoadmapData(roadmapId, tenantId);
     
     if (!result.success) {
       return handleError(result.error);
     }
     
     // TypeScript knows result.data exists here
     const { features, releases } = result.data;
     ```
   - Enforce strict typing for API responses
   - Create dedicated DTOs (Data Transfer Objects) for API inputs/outputs

5. **Client Layer Changes**
   - Add Roadmap tab component
   - Create roadmap table component based on existing table patterns
   - Create RoadmapHeader and filtering components
   - Add linking functionality to Feature and Release cells

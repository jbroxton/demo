# Speqq Roadmapping Feature

## V1 Overview
The Roadmap feature provides users with a unified view of features and their associated releases in a table-based interface. Features are included in the roadmap by setting a roadmapId value, and can be added or removed directly.

## V1 Requirements
- User can CRUD a roadmap
- User can add a feaure (and by associations the releases) to a roadmap
- Simple add/remove mechanism for roadmap features. Features are not added to the roadmap by default
- Filtering by workflow stage (All, Backlog, Not Started, In Progress, Launched, Blocked)
- Persistent roadmap_status stored in the entity_approvals table for optimal performance
- Status automatically updated whenever approval stages change
- Status determination based on a priority-based algorithm
- Tenancy isolation (roadmap data limited to tenant scope)

## V1 Acceptance Criteria
- Users can view all features and associated releases in a table view
- Features can be toggled on/off the roadmap via UI controls
- Roadmap shows key information including feature name, release, release date, and last update
- Users can filter the roadmap by workflow stage
- New features are automatically added to the roadmap
- Table supports sorting and basic filtering
- All data operations maintain proper tenant isolation
- UI is consistent with existing application patterns
- Workflow status correctly reflects feature's current progress

## V1 Implementation Plan

### Database
1. Schema Changes:
   - Add to `features` table:
     - `roadmapId` TEXT column (NULL if not on roadmap)
   - Add to `entity_approvals` table:
     - `roadmap_status` TEXT column DEFAULT 'Not Started' to store the calculated status
   - Create appropriate indexes for performance
     - Index on features.roadmapId
     - Index on entity_approvals.roadmap_status
   - Create `roadmaps` table:
   
   ```sql
   CREATE TABLE IF NOT EXISTS roadmaps (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     is_default INTEGER DEFAULT 0,
     tenantId TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   )
   ```

2. Migration Script:
   ```sql
   -- Add columns to features table
   ALTER TABLE features ADD COLUMN "roadmapId" TEXT;

   -- Add roadmap_status column to entity_approvals table
   ALTER TABLE entity_approvals ADD COLUMN "roadmap_status" TEXT DEFAULT 'Not Started';

   -- Create necessary indexes
   CREATE INDEX IF NOT EXISTS "idx_features_roadmapId" ON features("roadmapId");
   CREATE INDEX IF NOT EXISTS "idx_entity_approvals_roadmap_status" ON entity_approvals("roadmap_status");
   
   -- Create roadmaps table
   CREATE TABLE IF NOT EXISTS roadmaps (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     is_default INTEGER DEFAULT 0,
     tenantId TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     FOREIGN KEY (tenantId) REFERENCES tenants(id)
   );
   
   -- Create index for roadmaps
   CREATE INDEX IF NOT EXISTS "idx_roadmaps_tenantId" ON roadmaps("tenantId");
   ```

3. Migration Process:
   ```typescript
   // In migration.ts or similar
   
   import { initializeAllFeatureRoadmapStatuses } from '@/services/entity-approvals-db';
   
   export async function migrateRoadmapFeature() {
     const db = getDb();
     
     try {
       // Execute SQL migration script for schema changes
       const migrationSQL = fs.readFileSync('./migrations/roadmap-feature.sql', 'utf8');
       db.exec(migrationSQL);
       
       // Initialize roadmap status values for all existing features
       await initializeAllFeatureRoadmapStatuses();
       
       console.log('Roadmap feature migration completed successfully');
       return { success: true };
     } catch (error) {
       console.error('Error during roadmap feature migration:', error);
       return { success: false, error: error.message };
     }
   }
   ```

### Server
1. API Endpoints:
   - **Resource**: `/api/roadmaps-db` - Single consolidated API route for roadmap operations
   - **Operations**:
     - `GET` - Retrieve roadmaps or roadmap features
       - List all roadmaps: `GET /api/roadmaps-db`
       - Get by ID: `GET /api/roadmaps-db?id=xxx`
       - Get features: `GET /api/roadmaps-db?roadmapId=xxx&includeFeatures=true`
       - Filter by status: `GET /api/roadmaps-db?roadmapId=xxx&includeFeatures=true&status=xxx`
     - `POST` - Create a new roadmap
       - Request body: `{ "name": "string", "description": "string", "is_default": boolean }`
     - `PATCH` - Update roadmap or feature-roadmap relationship
       - Update roadmap: `{ "id": "roadmap-id", "name": "string", "description": "string" }`
       - Add feature: `{ "id": "feature-id", "action": "add", "roadmapId": "roadmap-id" }`
       - Remove feature: `{ "id": "feature-id", "action": "remove" }`
     - `DELETE` - Remove a roadmap
       - Query param: `?id=xxx`

   This design follows the application's established pattern of one consolidated API route per entity type, ensuring consistent API structure.

   **Data Flow Architecture**:
   ```
   UI Component → React Query Hook → API Route → Service Layer → Database
   ```

   The implementation uses React Query for data fetching, caching, and mutations, matching the pattern used by other entities in the application.

2. Roadmap Service Methods:
   ```typescript
   /**
    * @file src/services/roadmaps-db.ts
    * Service methods for interacting with roadmaps data
    */

   import { getDb } from './db.server';
   import { nanoid } from 'nanoid';
   import { Feature } from '@/types/models';
import { Roadmap } from '@/types/models/Roadmap';

   /**
    * Roadmap Management Methods
    */

   /**
    * Get all roadmaps for a tenant
    */
   export async function getRoadmaps(tenantId: string = 'org1') {
     const db = getDb();
     try {
       const roadmaps = db.prepare(`
         SELECT * FROM roadmaps
         WHERE "tenantId" = ?
         ORDER BY "created_at" DESC
       `).all(tenantId);

       return { success: true, data: roadmaps };
     } catch (error) {
       console.error('Error fetching roadmaps:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Get roadmap by ID
    */
   export async function getRoadmapById(id: string, tenantId: string = 'org1') {
     const db = getDb();
     try {
       const roadmap = db.prepare(`
         SELECT * FROM roadmaps
         WHERE "id" = ? AND "tenantId" = ?
       `).get(id, tenantId);

       if (!roadmap) {
         return { success: false, error: 'Roadmap not found' };
       }

       return { success: true, data: roadmap };
     } catch (error) {
       console.error('Error fetching roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Get or create default roadmap for tenant
    */
   export async function getOrCreateDefaultRoadmap(tenantId: string = 'org1') {
     const db = getDb();
     const now = new Date().toISOString();

     try {
       // Begin transaction
       db.prepare('BEGIN TRANSACTION').run();

       // Check for existing default roadmap
       const existing = db.prepare(`
         SELECT * FROM roadmaps
         WHERE "tenantId" = ? AND "is_default" = 1
         LIMIT 1
       `).get(tenantId);

       if (existing) {
         db.prepare('COMMIT').run();
         return { success: true, data: existing };
       }

       // Create default roadmap if none exists
       const id = nanoid();
       db.prepare(`
         INSERT INTO roadmaps (
           id, name, description, is_default, tenantId, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)
       `).run(
         id,
         'Default Roadmap',
         'Default roadmap for tenant',
         1,
         tenantId,
         now,
         now
       );

       const newRoadmap = {
         id,
         name: 'Default Roadmap',
         description: 'Default roadmap for tenant',
         is_default: 1,
         tenantId,
         created_at: now,
         updated_at: now
       };

       // Commit transaction
       db.prepare('COMMIT').run();

       return { success: true, data: newRoadmap };
     } catch (error) {
       // Rollback on error
       db.prepare('ROLLBACK').run();
       console.error('Error getting/creating default roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Create a new roadmap
    */
   export async function createRoadmap(
     data: { name: string; description?: string; is_default?: boolean },
     tenantId: string = 'org1'
   ) {
     const db = getDb();
     const id = nanoid();
     const now = new Date().toISOString();

     try {
       const is_default = data.is_default ? 1 : 0;

       // If this is being set as default, clear any existing defaults
       if (is_default) {
         db.prepare(`
           UPDATE roadmaps SET "is_default" = 0
           WHERE "tenantId" = ?
         `).run(tenantId);
       }

       // Insert new roadmap
       db.prepare(`
         INSERT INTO roadmaps (
           id, name, description, is_default, tenantId, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)
       `).run(
         id,
         data.name,
         data.description || '',
         is_default,
         tenantId,
         now,
         now
       );

       return { success: true, id, data: { id, ...data, tenantId, created_at: now, updated_at: now } };
     } catch (error) {
       console.error('Error creating roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Update an existing roadmap
    */
   export async function updateRoadmap(
     id: string,
     data: { name?: string; description?: string; is_default?: boolean },
     tenantId: string = 'org1'
   ) {
     const db = getDb();
     const now = new Date().toISOString();

     try {
       // Check if roadmap exists and belongs to tenant
       const existing = db.prepare(`
         SELECT id FROM roadmaps
         WHERE "id" = ? AND "tenantId" = ?
       `).get(id, tenantId);

       if (!existing) {
         return { success: false, error: 'Roadmap not found' };
       }

       // Handle default status if updating it
       if (data.is_default) {
         db.prepare(`
           UPDATE roadmaps SET "is_default" = 0
           WHERE "tenantId" = ?
         `).run(tenantId);
       }

       // Build update query
       const updates = [];
       const params = [];

       if (data.name !== undefined) {
         updates.push('"name" = ?');
         params.push(data.name);
       }

       if (data.description !== undefined) {
         updates.push('"description" = ?');
         params.push(data.description);
       }

       if (data.is_default !== undefined) {
         updates.push('"is_default" = ?');
         params.push(data.is_default ? 1 : 0);
       }

       updates.push('"updated_at" = ?');
       params.push(now);

       // Add required params for WHERE clause
       params.push(id, tenantId);

       // Execute update
       const result = db.prepare(`
         UPDATE roadmaps
         SET ${updates.join(', ')}
         WHERE "id" = ? AND "tenantId" = ?
       `).run(...params);

       return { success: result.changes > 0 };
     } catch (error) {
       console.error('Error updating roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Delete a roadmap
    */
   export async function deleteRoadmap(id: string, tenantId: string = 'org1') {
     const db = getDb();

     try {
       // Begin transaction
       db.prepare('BEGIN TRANSACTION').run();

       // Check if roadmap exists and belongs to tenant
       const existing = db.prepare(`
         SELECT is_default FROM roadmaps
         WHERE "id" = ? AND "tenantId" = ?
       `).get(id, tenantId);

       if (!existing) {
         db.prepare('ROLLBACK').run();
         return { success: false, error: 'Roadmap not found' };
       }

       // Don't allow deleting the default roadmap
       if (existing.is_default) {
         db.prepare('ROLLBACK').run();
         return { success: false, error: 'Cannot delete default roadmap' };
       }

       // Update any features using this roadmap to not be on any roadmap
       db.prepare(`
         UPDATE features
         SET "roadmapId" = NULL
         WHERE "roadmapId" = ? AND "tenantId" = ?
       `).run(id, tenantId);

       // Delete the roadmap
       const result = db.prepare(`
         DELETE FROM roadmaps
         WHERE "id" = ? AND "tenantId" = ?
       `).run(id, tenantId);

       // Commit transaction
       db.prepare('COMMIT').run();

       return { success: result.changes > 0 };
     } catch (error) {
       // Rollback on error
       db.prepare('ROLLBACK').run();
       console.error('Error deleting roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Feature-Roadmap Relationship Methods
    */

   /**
    * Get features for a specific roadmap
    */
   export async function getFeaturesForRoadmap(roadmapId: string, tenantId: string = 'org1') {
     const db = getDb();
     try {
       const features = db.prepare(`
         SELECT * FROM features
         WHERE "roadmapId" = ?
         AND "tenantId" = ?
       `).all(roadmapId, tenantId);

       return { success: true, data: features };
     } catch (error) {
       console.error('Error fetching roadmap features:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Get features for a specific roadmap with calculated workflow statuses
    */
   export async function getFeaturesForRoadmapWithStatus(
     roadmapId: string,
     tenantId: string = 'org1',
     status?: string
   ) {
     const db = getDb();
     try {
       // Prepare base query with workflow status
       let query = `
         SELECT f.*,
                (SELECT roadmap_status FROM entity_approvals
                 WHERE entity_id = f.id AND entity_type = 'feature'
                 LIMIT 1) as workflowStatus
         FROM features f
         WHERE f."roadmapId" = ?
         AND f."tenantId" = ?
       `;

       const params = [roadmapId, tenantId];

       // Add status filter if provided
       if (status) {
         query += ` AND (SELECT roadmap_status FROM entity_approvals
                         WHERE entity_id = f.id AND entity_type = 'feature'
                         LIMIT 1) = ?`;
         params.push(status);
       }

       const features = db.prepare(query).all(...params);

       return { success: true, data: features };
     } catch (error) {
       console.error('Error fetching roadmap features with status:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Add a feature to a roadmap
    */
   export async function addFeatureToRoadmap(
     featureId: string,
     roadmapId: string,
     tenantId: string = 'org1'
   ) {
     const db = getDb();

     try {
       // Begin transaction
       db.prepare('BEGIN TRANSACTION').run();

       // Verify feature exists and belongs to tenant
       const feature = db.prepare(`
         SELECT id FROM features
         WHERE id = ? AND tenantId = ?
       `).get(featureId, tenantId);

       if (!feature) {
         db.prepare('ROLLBACK').run();
         return { success: false, error: 'Feature not found' };
       }

       // Verify roadmap exists and belongs to tenant
       const roadmap = db.prepare(`
         SELECT id FROM roadmaps
         WHERE id = ? AND tenantId = ?
       `).get(roadmapId, tenantId);

       if (!roadmap) {
         db.prepare('ROLLBACK').run();
         return { success: false, error: 'Roadmap not found' };
       }

       // Update feature to be part of roadmap
       const result = db.prepare(`
         UPDATE features
         SET roadmapId = ?
         WHERE id = ? AND tenantId = ?
       `).run(roadmapId, featureId, tenantId);

       // Commit transaction
       db.prepare('COMMIT').run();

       return { success: result.changes > 0 };
     } catch (error) {
       // Rollback on error
       db.prepare('ROLLBACK').run();
       console.error('Error adding feature to roadmap:', error);
       return { success: false, error: error.message };
     }
   }

   /**
    * Remove a feature from any roadmap
    */
   export async function removeFeatureFromRoadmap(
     featureId: string,
     tenantId: string = 'org1'
   ) {
     const db = getDb();

     try {
       // Verify feature exists and belongs to tenant
       const feature = db.prepare(`
         SELECT id FROM features
         WHERE id = ? AND tenantId = ?
       `).get(featureId, tenantId);

       if (!feature) {
         return { success: false, error: 'Feature not found' };
       }

       // Remove feature from roadmap by setting roadmapId to NULL
       const result = db.prepare(`
         UPDATE features
         SET roadmapId = NULL
         WHERE id = ? AND tenantId = ?
       `).run(featureId, tenantId);

       return { success: result.changes > 0 };
     } catch (error) {
       console.error('Error removing feature from roadmap:', error);
       return { success: false, error: error.message };
     }
   }
   ```

3. API Routes Implementation:
   ```typescript
   // In src/app/api/roadmaps-db/route.ts

   import { NextRequest, NextResponse } from 'next/server';
   import { getServerSession } from 'next-auth';
   import {
     getRoadmaps,
     getRoadmapById,
     createRoadmap,
     updateRoadmap,
     deleteRoadmap,
     getFeaturesForRoadmap,
     getFeaturesForRoadmapWithStatus,
     addFeatureToRoadmap,
     removeFeatureFromRoadmap
   } from '@/services/roadmaps-db';
   import { z } from 'zod';

   // GET handler for roadmaps
   export async function GET(request: NextRequest) {
     try {
       const session = await getServerSession();
       const tenantId = session?.user?.currentTenant || 'org1';
       const searchParams = request.nextUrl.searchParams;

       // Handle different GET operations based on query params
       const id = searchParams.get('id');
       const roadmapId = searchParams.get('roadmapId');
       const includeFeatures = searchParams.get('includeFeatures') === 'true';
       const status = searchParams.get('status');

       // Get specific roadmap by ID
       if (id) {
         const result = await getRoadmapById(id, tenantId);

         if (!result.success) {
           return NextResponse.json(
             { error: result.error },
             { status: 404 }
           );
         }

         return NextResponse.json(result.data);
       }

       // Get features for a specific roadmap
       if (roadmapId && includeFeatures) {
         // Get features with optional status filtering
         const featuresResult = status
           ? await getFeaturesForRoadmapWithStatus(roadmapId, tenantId, status)
           : await getFeaturesForRoadmapWithStatus(roadmapId, tenantId);

         if (!featuresResult.success) {
           return NextResponse.json(
             { error: featuresResult.error },
             { status: 500 }
           );
         }

         return NextResponse.json(featuresResult.data);
       }

       // Default: get all roadmaps
       const result = await getRoadmaps(tenantId);

       if (!result.success) {
         return NextResponse.json(
           { error: result.error },
           { status: 500 }
         );
       }

       return NextResponse.json(result.data);
     } catch (error) {
       console.error('Error handling GET request:', error);
       return NextResponse.json(
         { error: error instanceof Error ? error.message : 'Unknown error' },
         { status: 500 }
       );
     }
   }

   // POST handler for creating roadmaps
   export async function POST(request: NextRequest) {
     try {
       const session = await getServerSession();
       const tenantId = session?.user?.currentTenant || 'org1';

       const body = await request.json();

       // Validate input
       const schema = z.object({
         name: z.string().min(1, "Name is required"),
         description: z.string().optional(),
         is_default: z.boolean().optional()
       });

       const result = schema.safeParse(body);

       if (!result.success) {
         return NextResponse.json(
           { error: result.error.format() },
           { status: 400 }
         );
       }

       const createResult = await createRoadmap(result.data, tenantId);

       if (!createResult.success) {
         return NextResponse.json(
           { error: createResult.error },
           { status: 500 }
         );
       }

       return NextResponse.json(createResult.data, { status: 201 });
     } catch (error) {
       console.error('Error handling POST request:', error);
       return NextResponse.json(
         { error: error instanceof Error ? error.message : 'Unknown error' },
         { status: 500 }
       );
     }
   }

   // PATCH handler for updating roadmaps or roadmap features
   export async function PATCH(request: NextRequest) {
     try {
       const session = await getServerSession();
       const tenantId = session?.user?.currentTenant || 'org1';

       const body = await request.json();

       if (!body.id) {
         return NextResponse.json(
           { error: 'ID is required' },
           { status: 400 }
         );
       }

       // Handle feature-roadmap relationship actions
       if (body.action) {
         // Add feature to roadmap
         if (body.action === 'add' && body.roadmapId) {
           const result = await addFeatureToRoadmap(body.id, body.roadmapId, tenantId);

           if (!result.success) {
             return NextResponse.json(
               { error: result.error },
               { status: 500 }
             );
           }

           return NextResponse.json({ success: true });
         }

         // Remove feature from roadmap
         if (body.action === 'remove') {
           const result = await removeFeatureFromRoadmap(body.id, tenantId);

           if (!result.success) {
             return NextResponse.json(
               { error: result.error },
               { status: 500 }
             );
           }

           return NextResponse.json({ success: true });
         }

         return NextResponse.json(
           { error: 'Invalid action' },
           { status: 400 }
         );
       }

       // Handle roadmap updates
       const updateData: Record<string, any> = {};

       if (body.name !== undefined) updateData.name = body.name;
       if (body.description !== undefined) updateData.description = body.description;
       if (body.is_default !== undefined) updateData.is_default = body.is_default;

       if (Object.keys(updateData).length === 0) {
         return NextResponse.json(
           { error: 'No update data provided' },
           { status: 400 }
         );
       }

       const updateResult = await updateRoadmap(body.id, updateData, tenantId);

       if (!updateResult.success) {
         return NextResponse.json(
           { error: updateResult.error },
           { status: updateResult.error === 'Roadmap not found' ? 404 : 500 }
         );
       }

       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Error handling PATCH request:', error);
       return NextResponse.json(
         { error: error instanceof Error ? error.message : 'Unknown error' },
         { status: 500 }
       );
     }
   }

   // DELETE handler for removing roadmaps
   export async function DELETE(request: NextRequest) {
     try {
       const session = await getServerSession();
       const tenantId = session?.user?.currentTenant || 'org1';

       const id = request.nextUrl.searchParams.get('id');

       if (!id) {
         return NextResponse.json(
           { error: 'Roadmap ID is required' },
           { status: 400 }
         );
       }

       const deleteResult = await deleteRoadmap(id, tenantId);

       if (!deleteResult.success) {
         return NextResponse.json(
           { error: deleteResult.error },
           { status: deleteResult.error === 'Roadmap not found' ? 404 : 400 }
         );
       }

       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Error handling DELETE request:', error);
       return NextResponse.json(
         { error: error instanceof Error ? error.message : 'Unknown error' },
         { status: 500 }
       );
     }
   }
   ```

4. Approval Status API Routes:
   ```typescript
   // In src/app/api/approval-statuses-db/route.ts
   
   import { NextRequest, NextResponse } from 'next/server';
   import { getServerSession } from 'next-auth';
   import { 
     updateApprovalWithRoadmapStatus, 
     createApprovalWithRoadmapStatus,
     bulkUpdateApprovalsWithRoadmapStatus,
     deleteApprovalWithRoadmapStatus
   } from '@/services/entity-approvals-db';
   import { z } from 'zod';
   
   // POST: Create new approval with roadmap status update
   export async function POST(request: NextRequest) {
     try {
       const session = await getServerSession();
       const userId = session?.user?.id || 'anonymous';
       
       const body = await request.json();
       
       // Validate input
       const schema = z.object({
         entity_id: z.string().min(1, "Entity ID is required"),
         entity_type: z.string().min(1, "Entity type is required"),
         stage_id: z.string().min(1, "Stage ID is required"),
         status_id: z.string().min(1, "Status ID is required")
       });
       
       const result = schema.safeParse(body);
       
       if (!result.success) {
         return NextResponse.json(
           { error: result.error.format() },
           { status: 400 }
         );
       }
       
       // Create approval with roadmap status update
       const createResult = await createApprovalWithRoadmapStatus({
         ...result.data,
         created_by: userId
       });
       
       if (!createResult.success) {
         return NextResponse.json(
           { error: createResult.error },
           { status: 500 }
         );
       }
       
       return NextResponse.json({ id: createResult.id }, { status: 201 });
     } catch (error) {
       console.error('Error in POST /api/approval-statuses-db:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   
   // PUT: Update approval status with automatic roadmap status update
   // Supports both single updates and bulk updates
   export async function PUT(request: NextRequest) {
     try {
       const session = await getServerSession();
       const userId = session?.user?.id || 'anonymous';
       
       const body = await request.json();
       
       // Check if this is a bulk update operation
       if (body.bulk === true && Array.isArray(body.updates)) {
         // Validate bulk parameter and updates array
         const bulkSchema = z.object({
           bulk: z.literal(true),
           updates: z.array(
             z.object({
               approvalId: z.string().min(1, "Approval ID is required"),
               statusId: z.string().min(1, "Status ID is required")
             })
           ).min(1, "At least one update is required")
         });
         
         const result = bulkSchema.safeParse(body);
         
         if (!result.success) {
           return NextResponse.json(
             { error: result.error.format() },
             { status: 400 }
           );
         }
         
         // Perform bulk update with roadmap status updates
         const updateResult = await bulkUpdateApprovalsWithRoadmapStatus(
           result.data.updates,
           userId
         );
         
         if (!updateResult.success) {
           return NextResponse.json(
             { error: updateResult.error },
             { status: 500 }
           );
         }
         
         return NextResponse.json({ 
           success: true,
           updatedCount: updateResult.updatedCount
         });
       }
       
       // Handle single status update
       const schema = z.object({
         approvalId: z.string().min(1, "Approval ID is required"),
         statusId: z.string().min(1, "Status ID is required")
       });
       
       const result = schema.safeParse(body);
       
       if (!result.success) {
         return NextResponse.json(
           { error: result.error.format() },
           { status: 400 }
         );
       }
       
       // Update with roadmap status
       const updateResult = await updateApprovalWithRoadmapStatus(
         result.data.approvalId,
         result.data.statusId,
         userId
       );
       
       if (!updateResult.success) {
         return NextResponse.json(
           { error: updateResult.error },
           { status: 500 }
         );
       }
       
       return NextResponse.json({ success: true });
       
     } catch (error) {
       console.error('Error in PUT /api/approval-statuses-db:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   
   // DELETE: Delete approval with roadmap status update
   export async function DELETE(request: NextRequest) {
     try {
       const approvalId = request.nextUrl.searchParams.get('id');
       
       if (!approvalId) {
         return NextResponse.json(
           { error: "Approval ID is required" },
           { status: 400 }
         );
       }
       
       // Delete with roadmap status update
       const deleteResult = await deleteApprovalWithRoadmapStatus(approvalId);
       
       if (!deleteResult.success) {
         return NextResponse.json(
           { error: deleteResult.error },
           { status: deleteResult.error === 'Approval not found' ? 404 : 500 }
         );
       }
       
       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Error in DELETE /api/approval-statuses-db:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

   // Note: The separate /api/approvals routes should be removed in favor of using 
   // the consolidated /api/approval-statuses-db endpoint for all approval status operations
### Type Definitions
   ```typescript
   /**
    * @file src/types/models/Roadmap.ts
    * Type definition for Roadmap model
    */

   export interface Roadmap {
     id: string;
     name: string;
     description: string;
     is_default: number;
     tenantId: string;
     created_at: string;
     updated_at: string;
   }
   ```

### Front End
1. Custom React Query Hook for Roadmap Features
   ```typescript
   // src/hooks/use-roadmaps-query.ts

   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { Roadmap } from '@/types/models/Roadmap';

   // Query key for roadmaps
   const ROADMAPS_QUERY_KEY = 'roadmaps';

   /**
    * Hook for working with roadmaps and roadmap features using React Query
    */
   export function useRoadmapsQuery() {
     const queryClient = useQueryClient();

     // Get all roadmaps
     const { data: roadmaps = [], isLoading, error } = useQuery<Roadmap[]>({
       queryKey: [ROADMAPS_QUERY_KEY],
       queryFn: async () => {
         const response = await fetch('/api/roadmaps-db');
         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }
         return response.json();
       },
     });

     // Get roadmap by ID
     const getRoadmapById = (roadmapId: string) => {
       return roadmaps.find(roadmap => roadmap.id === roadmapId);
     };

     // Get features for a specific roadmap
     const getRoadmapFeatures = async (roadmapId: string, status?: string) => {
       try {
         let url = `/api/roadmaps-db?roadmapId=${roadmapId}&includeFeatures=true`;
         if (status) {
           url += `&status=${status}`;
         }

         const response = await fetch(url);
         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return response.json();
       } catch (error) {
         console.error('Error fetching roadmap features:', error);
         throw error;
       }
     };

     // Create roadmap mutation
     const addRoadmapMutation = useMutation({
       mutationFn: async (roadmap: { name: string; description?: string; is_default?: boolean }): Promise<Roadmap> => {
         const response = await fetch('/api/roadmaps-db', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify(roadmap),
         });

         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return response.json();
       },
       onSuccess: (newRoadmap) => {
         // Update cache with the new roadmap
         queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
           return [...oldData, newRoadmap];
         });
       },
     });

     // Update roadmap mutation
     const updateRoadmapMutation = useMutation({
       mutationFn: async ({ id, ...updateData }: { id: string; name?: string; description?: string; is_default?: boolean }) => {
         const response = await fetch('/api/roadmaps-db', {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ id, ...updateData }),
         });

         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return { id, ...updateData };
       },
       onSuccess: (data) => {
         // Update cache with the updated roadmap
         queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
           return oldData.map(roadmap =>
             roadmap.id === data.id
               ? { ...roadmap, ...data }
               : roadmap
           );
         });
       },
     });

     // Delete roadmap mutation
     const deleteRoadmapMutation = useMutation({
       mutationFn: async (roadmapId: string) => {
         const response = await fetch(`/api/roadmaps-db?id=${roadmapId}`, {
           method: 'DELETE',
         });

         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return roadmapId;
       },
       onSuccess: (roadmapId) => {
         // Remove the deleted roadmap from cache
         queryClient.setQueryData<Roadmap[]>([ROADMAPS_QUERY_KEY], (oldData = []) => {
           return oldData.filter(roadmap => roadmap.id !== roadmapId);
         });
       },
     });

     // Add feature to roadmap mutation
     const addFeatureToRoadmapMutation = useMutation({
       mutationFn: async ({ featureId, roadmapId }: { featureId: string; roadmapId: string }) => {
         const response = await fetch('/api/roadmaps-db', {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             id: featureId,
             action: 'add',
             roadmapId
           }),
         });

         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return { featureId, roadmapId };
       },
       onSuccess: () => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] });
         queryClient.invalidateQueries({ queryKey: ['features'] });
       },
     });

     // Remove feature from roadmap mutation
     const removeFeatureFromRoadmapMutation = useMutation({
       mutationFn: async (featureId: string) => {
         const response = await fetch('/api/roadmaps-db', {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             id: featureId,
             action: 'remove'
           }),
         });

         if (!response.ok) {
           throw new Error(`API responded with status: ${response.status}`);
         }

         return featureId;
       },
       onSuccess: () => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] });
         queryClient.invalidateQueries({ queryKey: ['features'] });
       },
     });

     return {
       // State
       roadmaps,
       isLoading,
       error,

       // Roadmap retrieval methods
       getRoadmapById,
       getRoadmapFeatures,

       // Mutations
       addRoadmapMutation,
       updateRoadmapMutation,
       deleteRoadmapMutation,
       addFeatureToRoadmapMutation,
       removeFeatureFromRoadmapMutation,

       // Convenient mutation methods
       addRoadmap: (data: { name: string; description?: string; is_default?: boolean }) =>
         addRoadmapMutation.mutateAsync(data),
       updateRoadmap: (id: string, data: { name?: string; description?: string; is_default?: boolean }) =>
         updateRoadmapMutation.mutateAsync({ id, ...data }),
       deleteRoadmap: (id: string) =>
         deleteRoadmapMutation.mutateAsync(id),
       addFeatureToRoadmap: (featureId: string, roadmapId: string) =>
         addFeatureToRoadmapMutation.mutateAsync({ featureId, roadmapId }),
       removeFeatureFromRoadmap: (featureId: string) =>
         removeFeatureFromRoadmapMutation.mutateAsync(featureId),

       // Operation states
       isAdding: addFeatureToRoadmapMutation.isPending,
       isRemoving: removeFeatureFromRoadmapMutation.isPending,

       // Refetch helper
       refetch: () => queryClient.invalidateQueries({ queryKey: [ROADMAPS_QUERY_KEY] })
     };
   }
   ```

2. Leverage Existing UI Components:
   - **Table Implementation**: Extend the existing DataTable component instead of creating a new one:
   ```typescript
   // src/components/roadmap/roadmap-features-table.tsx

   import { useState, useEffect } from 'react';
   import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
   import { DataTable } from '@/components/ui/data-table';
   import { Button } from '@/components/ui/button';
   import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import { ApprovalStatusBadge } from '@/components/approval-status-badge';
   import { MinusCircle, Calendar } from 'lucide-react';
   import { Feature } from '@/types/models';

   // Define column configuration that leverages existing DataTable capabilities
   const getColumns = (removeFeatureFromRoadmap, isRemoving) => [
     {
       accessorKey: 'name',
       header: 'Feature',
       cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>
     },
     {
       accessorKey: 'releaseId',
       header: 'Release',
       cell: ({ row }) => {
         const releaseName = row.original.releaseName || '-';
         return (
           <div className="flex items-center">
             {row.original.releaseId && <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />}
             <span>{releaseName}</span>
           </div>
         );
       }
     },
     {
       accessorKey: 'workflowStatus',
       header: 'Status',
       cell: ({ row }) => (
         <ApprovalStatusBadge status={row.getValue('workflowStatus')} />
       )
     },
     {
       id: 'actions',
       cell: ({ row }) => (
         <Button
           variant="outline"
           size="sm"
           onClick={() => removeFeatureFromRoadmap(row.original.id)}
           disabled={isRemoving}
         >
           <MinusCircle className="h-4 w-4 mr-2" /> Remove
         </Button>
       )
     }
   ];

   interface RoadmapFeaturesTableProps {
     roadmapId: string;
   }

   export function RoadmapFeaturesTable({ roadmapId }: RoadmapFeaturesTableProps) {
     const [statusFilter, setStatusFilter] = useState('All');
     const [features, setFeatures] = useState<Feature[]>([]);
     const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

     const {
       getRoadmapFeatures,
       removeFeatureFromRoadmap,
       isRemoving
     } = useRoadmapsQuery();

     // Load roadmap features
     useEffect(() => {
       const loadFeatures = async () => {
         try {
           setIsLoadingFeatures(true);
           const data = await getRoadmapFeatures(roadmapId, statusFilter !== 'All' ? statusFilter : undefined);
           setFeatures(data || []);
         } catch (error) {
           console.error('Error loading roadmap features:', error);
         } finally {
           setIsLoadingFeatures(false);
         }
       };

       loadFeatures();
     }, [roadmapId, statusFilter, getRoadmapFeatures]);

     // Handle status filter change
     const handleStatusChange = (value: string) => {
       setStatusFilter(value);
     };

     const columns = getColumns(removeFeatureFromRoadmap, isRemoving);

     return (
       <div className="space-y-4">
         <Tabs defaultValue="All" onValueChange={handleStatusChange}>
           <TabsList>
             <TabsTrigger value="All">All</TabsTrigger>
             <TabsTrigger value="Backlog">Backlog</TabsTrigger>
             <TabsTrigger value="Not Started">Not Started</TabsTrigger>
             <TabsTrigger value="In Progress">In Progress</TabsTrigger>
             <TabsTrigger value="Launched">Launched</TabsTrigger>
             <TabsTrigger value="Blocked">Blocked</TabsTrigger>
           </TabsList>
         </Tabs>

         <DataTable
           columns={columns}
           data={features}
           isLoading={isLoadingFeatures}
           pagination
           searchable
           searchColumn="name"
         />
       </div>
     );
   }
   ```

3. **Status Indicators**: Reuse ApprovalStatusBadge component rather than creating new badges:
   ```typescript
   // Update approval-status-badge.tsx to support roadmap statuses
   
   const statusStyles = {
     // Existing approval statuses
     'Not Started': { color: 'text-gray-500', bg: 'bg-gray-100' },
     'In Progress': { color: 'text-blue-500', bg: 'bg-blue-100' },
     'Completed': { color: 'text-green-500', bg: 'bg-green-100' },
     'Blocked': { color: 'text-orange-500', bg: 'bg-orange-100' },
     'Not Needed': { color: 'text-gray-500', bg: 'bg-gray-100' },
     
     // Add roadmap statuses (matching existing ones where appropriate)
     'Backlog': { color: 'text-purple-500', bg: 'bg-purple-100' },
     'Launched': { color: 'text-green-500', bg: 'bg-green-100' }
   };
   ```

4. **Entity Creation**: Extend the EntityCreator for roadmaps:
   ```typescript
   // src/components/entity-creator.tsx
   
   // Add roadmap entity type
   type EntityType = 'feature' | 'release' | 'product' | 'roadmap';
   
   // Add roadmap configuration to existing entity creator
   const entityConfig = {
     // Existing configurations...
     
     roadmap: {
       title: 'Create Roadmap',
       fields: [
         { name: 'name', label: 'Name', type: 'text', required: true },
         { name: 'description', label: 'Description', type: 'textarea' }
       ],
       createFn: async (data) => {
         const response = await fetch('/api/roadmaps-db', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data)
         });

         if (!response.ok) throw new Error('Failed to create roadmap');
         return response.json();
       }
     }
   };
   
   // Usage in the roadmap page:
   // <EntityCreator type="roadmap" onSuccess={handleCreated} />
   ```

5. **Schema Updates**: Leverage existing migration framework:
   ```typescript
   // src/services/migrations/roadmap-feature-migration.ts
   
   import { executeMigration } from '@/services/migration-framework';
   import { initializeAllFeatureRoadmapStatuses } from '@/services/entity-approvals-db';
   
   export async function migrateRoadmapFeature() {
     const migrationSteps = [
       // Add columns to features table
       `ALTER TABLE features ADD COLUMN IF NOT EXISTS "roadmapId" TEXT;`,
       
       // Add roadmap_status column to entity_approvals
       `ALTER TABLE entity_approvals ADD COLUMN IF NOT EXISTS "roadmap_status" TEXT DEFAULT 'Not Started';`,
       
       // Create necessary indexes
       `CREATE INDEX IF NOT EXISTS "idx_features_roadmapId" ON features("roadmapId");`,
       `CREATE INDEX IF NOT EXISTS "idx_entity_approvals_roadmap_status" ON entity_approvals("roadmap_status");`,
       
       // Create roadmaps table
       `CREATE TABLE IF NOT EXISTS roadmaps (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         description TEXT,
         is_default INTEGER DEFAULT 0,
         tenantId TEXT NOT NULL,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL,
         FOREIGN KEY (tenantId) REFERENCES tenants(id)
       );`,
       
       `CREATE INDEX IF NOT EXISTS "idx_roadmaps_tenantId" ON roadmaps("tenantId");`
     ];
     
     const result = await executeMigration('roadmap-feature', migrationSteps);
     
     if (result.success) {
       // Initialize roadmap statuses for existing features
       await initializeAllFeatureRoadmapStatuses();
     }
     
     return result;
   }
   ```

This implementation leverages your existing components and frameworks instead of creating new ones from scratch:

1. **DataTable Component**: Reusing your robust DataTable with built-in pagination, filtering, and sorting
2. **ApprovalStatusBadge**: Extending it to support roadmap workflow statuses
3. **EntityCreator**: Adding roadmap configuration to your existing creator component
4. **Migration Framework**: Leveraging your existing migration system for schema updates

The approach minimizes redundancy, maintains UI consistency, and follows the DRY (Don't Repeat Yourself) principle throughout the implementation.
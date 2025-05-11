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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    console.log('[createRoadmap] Received data:', JSON.stringify(data));

    // Sanitize input data
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name) {
      return { success: false, error: 'Name is required' };
    }

    const description = data.description != null ? String(data.description) : '';
    const is_default = data.is_default === true ? 1 : 0;

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
      name,
      description,
      is_default,
      tenantId,
      now,
      now
    );

    // Format the response data to match the Roadmap type
    const responseData = {
      id,
      name: data.name,
      description,
      is_default: is_default,
      tenantId,
      created_at: now,
      updated_at: now
    };

    return {
      success: true,
      id,
      data: responseData
    };
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    const queryResult = db.prepare(`
      SELECT is_default FROM roadmaps
      WHERE "id" = ? AND "tenantId" = ?
    `).get(id, tenantId);

    // Properly type the query result
    const existing: { is_default: number } | undefined = queryResult as { is_default: number } | undefined;

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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    // First check if tables exist before running the query
    const checkFeatureTable = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='features'
    `).get();

    const checkReleaseTable = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='releases'
    `).get();

    const checkEntityApprovalTable = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entity_approvals'
    `).get();

    // If any required table doesn't exist, return an error
    if (!checkFeatureTable || !checkReleaseTable || !checkEntityApprovalTable) {
      return {
        success: false,
        error: `Required tables don't exist: ${!checkFeatureTable ? 'features ' : ''}${!checkReleaseTable ? 'releases ' : ''}${!checkEntityApprovalTable ? 'entity_approvals' : ''}`
      };
    }

    // Query that shows all combinations of features and their associated releases
    let query = `
      SELECT
        f.*,
        COALESCE(
          (SELECT roadmap_status FROM entity_approvals
           WHERE entity_id = f.id AND entity_type = 'feature'
           LIMIT 1), 'Not Started'
        ) as workflowStatus,
        r.id as releaseId,
        r.name as releaseName,
        r.releaseDate as releaseDate
      FROM features f
      LEFT JOIN releases r ON r.featureId = f.id
      WHERE f."roadmapId" = ?
      AND f."tenantId" = ?
    `;

    const params = [roadmapId, tenantId];

    // Add status filter if provided - consistent with the workflowStatus calculation
    if (status) {
      query += ` AND COALESCE(
                  (SELECT roadmap_status FROM entity_approvals
                   WHERE entity_id = f.id AND entity_type = 'feature'
                   LIMIT 1), 'Not Started'
                ) = ?`;
      params.push(status);
    }

    console.log('Executing query with params:', JSON.stringify(params));

    try {
      console.log('Executing SQL query:', query.trim().replace(/\s+/g, ' '));
      const features = db.prepare(query).all(...params);
      console.log(`Found ${features.length} features for roadmap ${roadmapId}`);

      // Log the full structure of the first result for debugging
      if (features.length > 0) {
        console.log('First feature structure:', JSON.stringify(features[0], null, 2));
      }

      return { success: true, data: features };
    } catch (queryError) {
      console.error('SQL error in getFeaturesForRoadmapWithStatus:', queryError);
      console.error('Failed query:', query.trim().replace(/\s+/g, ' '));
      // Try a simpler query without the JOIN if the complex one fails
      const simpleQuery = `
        SELECT f.*,
               'Not Started' as workflowStatus,
               NULL as releaseId,
               NULL as releaseName,
               NULL as releaseDate
        FROM features f
        WHERE f."roadmapId" = ? AND f."tenantId" = ?
      `;
      const simpleFeatures = db.prepare(simpleQuery).all(roadmapId, tenantId);
      console.log(`Fallback query found ${simpleFeatures.length} features`);
      return { success: true, data: simpleFeatures };
    }
  } catch (error) {
    console.error('Error fetching roadmap features with status:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
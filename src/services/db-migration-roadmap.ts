/**
 * @file db-migration-roadmap.ts
 * Migration script for roadmap feature
 */

import { getDb } from './db.server';
import fs from 'fs';
import path from 'path';

/**
 * Migration function to add roadmap feature
 */
export async function migrateRoadmapFeature() {
  const db = getDb();

  try {
    // Check if migration is needed
    const roadmapsTableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='roadmaps'
    `).get();

    if (roadmapsTableExists) {
      console.log('Roadmap feature already migrated');

      // Even if already migrated, check if we need to create any indexes or fix roadmap_status column
      // This ensures robustness even if a previous migration failed partially

      // Check if roadmap_status column exists in entity_approvals
      let needsRoadmapStatus = false;
      try {
        // This will throw if the column doesn't exist
        db.prepare(`SELECT roadmap_status FROM entity_approvals LIMIT 1`).get();
      } catch (e) {
        needsRoadmapStatus = true;
      }

      if (needsRoadmapStatus) {
        console.log('Adding roadmap_status column to entity_approvals table');
        try {
          db.prepare(`ALTER TABLE entity_approvals ADD COLUMN roadmap_status TEXT DEFAULT 'Not Started'`).run();
        } catch (e) {
          console.log('Error adding column, may already exist:', e);
        }
      }

      // Ensure features have roadmap_status values
      const result = db.prepare(`
        UPDATE entity_approvals
        SET roadmap_status = 'Not Started'
        WHERE entity_type = 'feature' AND (roadmap_status IS NULL OR roadmap_status = '')
      `).run();

      console.log(`Updated ${result.changes} features with default roadmap status`);

      return { success: true };
    }

    console.log('Starting roadmap feature migration');

    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // First check if migrations folder exists
      const migrationsPath = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsPath)) {
        throw new Error(`Migrations folder not found at ${migrationsPath}`);
      }

      // Check if migration SQL file exists
      const sqlFilePath = path.join(migrationsPath, 'roadmap-feature.sql');
      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`Migration SQL file not found at ${sqlFilePath}`);
      }

      // Execute SQL migration script for schema changes
      const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');

      // Split SQL into statements and execute them separately for better error handling
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            db.exec(statement);
          } catch (stmtError) {
            // Handle the error properly by checking its type
            const errorMessage = stmtError instanceof Error ? stmtError.message : String(stmtError);
            console.warn(`Non-fatal error in SQL statement: ${errorMessage}`);
            // Continue with other statements, some might be ALTER TABLE statements that fail if column already exists
          }
        }
      }

      // Initialize roadmap status values for all existing features
      // Use the direct SQL approach instead of the function to avoid circular dependency
      const result = db.prepare(`
        UPDATE entity_approvals
        SET roadmap_status = 'Not Started'
        WHERE entity_type = 'feature' AND (roadmap_status IS NULL OR roadmap_status = '')
      `).run();

      console.log(`Initialized ${result.changes} features with default roadmap status`);

      // Commit transaction
      db.prepare('COMMIT').run();

      console.log('Roadmap feature migration completed successfully');
      return { success: true };
    } catch (error) {
      // Rollback on error
      try {
        db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      console.error('Error during roadmap feature migration:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  } catch (error) {
    console.error('Error checking roadmap migration status:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
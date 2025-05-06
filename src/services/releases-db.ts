// Service for managing releases in the database
import { getDb } from './db.server';
import { Release } from '@/types/models';

// Generate a simple ID - matching the same method used in the Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all releases from the database
 */
export async function getReleasesFromDb(tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    // Fetch all releases for the specified tenant
    const releases = db.prepare('SELECT * FROM releases WHERE tenantId = ?')
      .all(tenantId) as Release[];
    
    return { success: true, data: releases };
  } catch (error) {
    console.error('Error fetching releases:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get releases by feature ID
 */
export async function getReleasesByFeatureId(featureId: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const releases = db.prepare('SELECT * FROM releases WHERE featureId = ? AND tenantId = ?')
      .all(featureId, tenantId) as Release[];
    
    return { success: true, data: releases };
  } catch (error) {
    console.error(`Error fetching releases for feature ${featureId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a release by ID
 */
export async function getReleaseByIdFromDb(id: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const release = db.prepare('SELECT * FROM releases WHERE id = ? AND tenantId = ?')
      .get(id, tenantId) as Release | undefined;
    
    if (!release) {
      return { success: false, error: 'Release not found' };
    }
    
    return { success: true, data: release };
  } catch (error) {
    console.error(`Error fetching release ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new release in the database
 */
export async function createReleaseInDb(release: Omit<Release, 'id'> & { tenantId?: string }) {
  const db = getDb();
  const id = generateId();
  const tenantId = release.tenantId || 'org1'; // Default to org1 if not provided
  
  try {
    db.prepare('INSERT INTO releases (id, name, description, releaseDate, priority, featureId, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        id, 
        release.name, 
        release.description || '', 
        release.releaseDate,
        release.priority || 'Med', 
        release.featureId,
        tenantId
      );
    
    return { 
      success: true, 
      data: {
        ...release,
        id,
        tenantId
      }
    };
  } catch (error) {
    console.error('Error creating release:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update release name
 */
export async function updateReleaseNameInDb(id: string, name: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE releases SET name = ? WHERE id = ? AND tenantId = ?')
      .run(name, id, tenantId);
    
    if (result.changes === 0) {
      return { success: false, error: 'Release not found or name unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating release ${id} name:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update release description
 */
export async function updateReleaseDescriptionInDb(id: string, description: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE releases SET description = ? WHERE id = ? AND tenantId = ?')
      .run(description, id, tenantId);
    
    if (result.changes === 0) {
      return { success: false, error: 'Release not found or description unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating release ${id} description:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update release date
 */
export async function updateReleaseDateInDb(id: string, releaseDate: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE releases SET releaseDate = ? WHERE id = ? AND tenantId = ?')
      .run(releaseDate, id, tenantId);
    
    if (result.changes === 0) {
      return { success: false, error: 'Release not found or date unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating release ${id} date:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update release priority
 */
export async function updateReleasePriorityInDb(id: string, priority: 'High' | 'Med' | 'Low', tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE releases SET priority = ? WHERE id = ? AND tenantId = ?')
      .run(priority, id, tenantId);
    
    if (result.changes === 0) {
      return { success: false, error: 'Release not found or priority unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating release ${id} priority:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a release
 */
export async function deleteReleaseFromDb(id: string, tenantId: string = 'org1') {
  const db = getDb();
  
  try {
    // First check if release exists in the specified tenant
    const release = db.prepare('SELECT id FROM releases WHERE id = ? AND tenantId = ?')
      .get(id, tenantId);
    
    if (!release) {
      return { success: false, error: 'Release not found' };
    }
    
    // Delete the release
    db.prepare('DELETE FROM releases WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting release ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
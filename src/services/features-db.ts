// Service for managing features in the database
import { getDb } from './db.server';
import { Feature } from '@/types/models';

// Generate a simple ID - matching the same method used in the Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all features from the database
 */
export async function getFeaturesFromDb() {
  const db = getDb();
  
  try {
    // Fetch all features
    const features = db.prepare('SELECT * FROM features').all() as Feature[];
    
    return { success: true, data: features };
  } catch (error) {
    console.error('Error fetching features:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get features by interface ID
 */
export async function getFeaturesByInterfaceId(interfaceId: string) {
  const db = getDb();
  
  try {
    const features = db.prepare('SELECT * FROM features WHERE interfaceId = ?')
      .all(interfaceId) as Feature[];
    
    return { success: true, data: features };
  } catch (error) {
    console.error(`Error fetching features for interface ${interfaceId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a feature by ID
 */
export async function getFeatureByIdFromDb(id: string) {
  const db = getDb();
  
  try {
    const feature = db.prepare('SELECT * FROM features WHERE id = ?').get(id) as Feature | undefined;
    
    if (!feature) {
      return { success: false, error: 'Feature not found' };
    }
    
    return { success: true, data: feature };
  } catch (error) {
    console.error(`Error fetching feature ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new feature in the database
 */
export async function createFeatureInDb(feature: Omit<Feature, 'id' | 'releases'>) {
  const db = getDb();
  const id = generateId();
  const tenantId = 'org1'; // Default to the first organization
  
  try {
    db.prepare('INSERT INTO features (id, name, description, priority, interfaceId, tenantId) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        id, 
        feature.name, 
        feature.description || '', 
        feature.priority || 'Med', 
        feature.interfaceId,
        tenantId
      );
    
    return { 
      success: true, 
      data: {
        ...feature,
        id,
        tenantId,
        releases: [] as string[]
      }
    };
  } catch (error) {
    console.error('Error creating feature:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update feature name
 */
export async function updateFeatureNameInDb(id: string, name: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE features SET name = ? WHERE id = ?').run(name, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Feature not found or name unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating feature ${id} name:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update feature description
 */
export async function updateFeatureDescriptionInDb(id: string, description: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE features SET description = ? WHERE id = ?')
      .run(description, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Feature not found or description unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating feature ${id} description:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update feature priority
 */
export async function updateFeaturePriorityInDb(id: string, priority: 'High' | 'Med' | 'Low') {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE features SET priority = ? WHERE id = ?')
      .run(priority, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Feature not found or priority unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating feature ${id} priority:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a feature
 */
export async function deleteFeatureFromDb(id: string) {
  const db = getDb();
  
  try {
    // First check if feature exists
    const feature = db.prepare('SELECT id FROM features WHERE id = ?').get(id);
    
    if (!feature) {
      return { success: false, error: 'Feature not found' };
    }
    
    // Delete the feature
    db.prepare('DELETE FROM features WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting feature ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update feature with release
 */
export async function updateFeatureWithReleaseInDb(featureId: string, releaseId: string) {
  // This is a virtual relationship maintained in memory for React Query
  // We don't need to store it explicitly in the database since releases have a featureId foreign key
  return { success: true };
}
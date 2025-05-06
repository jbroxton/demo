// Database service for requirements
import { getDb } from './db.server';
import { Requirement } from '@/types/models';

// Generate a simple ID - matching the same method used in Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all requirements from the database
 */
export async function getRequirementsFromDb() {
  const db = getDb();
  
  try {
    // Fetch all requirements
    const requirements = db.prepare('SELECT * FROM requirements').all() as Requirement[];
    
    return { success: true, data: requirements };
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a requirement by ID
 */
export async function getRequirementByIdFromDb(id: string) {
  const db = getDb();
  
  try {
    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id) as Requirement | undefined;
    
    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }
    
    return { success: true, data: requirement };
  } catch (error) {
    console.error(`Error fetching requirement ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get requirements by feature ID
 */
export async function getRequirementsByFeatureId(featureId: string) {
  const db = getDb();
  
  try {
    const requirements = db.prepare('SELECT * FROM requirements WHERE featureId = ?').all(featureId) as Requirement[];
    
    return { success: true, data: requirements };
  } catch (error) {
    console.error(`Error fetching requirements for feature ${featureId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get requirements by release ID
 */
export async function getRequirementsByReleaseId(releaseId: string) {
  const db = getDb();
  
  try {
    const requirements = db.prepare('SELECT * FROM requirements WHERE releaseId = ?').all(releaseId) as Requirement[];
    
    return { success: true, data: requirements };
  } catch (error) {
    console.error(`Error fetching requirements for release ${releaseId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new requirement
 */
export async function createRequirementInDb(requirement: Omit<Requirement, 'id'>) {
  const db = getDb();
  const id = generateId();
  const tenantId = 'org1'; // Default to the first organization
  
  try {
    // Validate feature exists
    const feature = db.prepare('SELECT id FROM features WHERE id = ?').get(requirement.featureId);
    if (!feature) {
      return { success: false, error: 'Feature not found' };
    }
    
    // Validate release exists if provided
    if (requirement.releaseId) {
      const release = db.prepare('SELECT id FROM releases WHERE id = ?').get(requirement.releaseId);
      if (!release) {
        return { success: false, error: 'Release not found' };
      }
    }
    
    // Insert the requirement
    db.prepare(`
      INSERT INTO requirements (
        id, name, featureId, releaseId, owner, description, 
        priority, cuj, acceptanceCriteria, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      requirement.name,
      requirement.featureId,
      requirement.releaseId || null,
      requirement.owner || null,
      requirement.description || null,
      requirement.priority || null,
      requirement.cuj || null,
      requirement.acceptanceCriteria || null,
      tenantId
    );
    
    // Return the created requirement
    return { 
      success: true, 
      data: {
        ...requirement,
        id,
        tenantId
      }
    };
  } catch (error) {
    console.error('Error creating requirement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement name
 */
export async function updateRequirementNameInDb(id: string, name: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET name = ? WHERE id = ?').run(name, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or name unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} name:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement description
 */
export async function updateRequirementDescriptionInDb(id: string, description: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET description = ? WHERE id = ?')
      .run(description, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or description unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} description:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement owner
 */
export async function updateRequirementOwnerInDb(id: string, owner: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET owner = ? WHERE id = ?')
      .run(owner, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or owner unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} owner:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement priority
 */
export async function updateRequirementPriorityInDb(id: string, priority: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET priority = ? WHERE id = ?')
      .run(priority, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or priority unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} priority:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement release
 */
export async function updateRequirementReleaseInDb(id: string, releaseId: string | null) {
  const db = getDb();
  
  try {
    // Validate release exists if provided
    if (releaseId) {
      const release = db.prepare('SELECT id FROM releases WHERE id = ?').get(releaseId);
      if (!release) {
        return { success: false, error: 'Release not found' };
      }
    }
    
    const result = db.prepare('UPDATE requirements SET releaseId = ? WHERE id = ?')
      .run(releaseId, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or release unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} release:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement CUJ (Critical User Journey)
 */
export async function updateRequirementCujInDb(id: string, cuj: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET cuj = ? WHERE id = ?')
      .run(cuj, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or CUJ unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} CUJ:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update requirement acceptance criteria
 */
export async function updateRequirementAcceptanceCriteriaInDb(id: string, acceptanceCriteria: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE requirements SET acceptanceCriteria = ? WHERE id = ?')
      .run(acceptanceCriteria, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Requirement not found or acceptance criteria unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating requirement ${id} acceptance criteria:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a requirement
 */
export async function deleteRequirementFromDb(id: string) {
  const db = getDb();
  
  try {
    // First check if requirement exists
    const requirement = db.prepare('SELECT id FROM requirements WHERE id = ?').get(id);
    
    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }
    
    // Delete the requirement
    db.prepare('DELETE FROM requirements WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting requirement ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
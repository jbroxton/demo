// Service for interfaces that will work alongside existing state
import { getDb } from './db.server';
import { Interface } from '@/types/models';

// Generate a simple ID - matching the same method used in the Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all interfaces from the database
 */
export async function getInterfacesFromDb() {
  const db = getDb();
  
  try {
    // Fetch all interfaces
    const interfaces = db.prepare('SELECT * FROM interfaces').all() as Interface[];
    
    return { success: true, data: interfaces };
  } catch (error) {
    console.error('Error fetching interfaces:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get interfaces by product ID
 */
export async function getInterfacesByProductIdFromDb(productId: string) {
  const db = getDb();
  
  try {
    const interfaces = db.prepare('SELECT * FROM interfaces WHERE productId = ?').all(productId) as Interface[];
    
    return { success: true, data: interfaces };
  } catch (error) {
    console.error(`Error fetching interfaces for product ${productId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a interface by ID
 */
export async function getInterfaceByIdFromDb(id: string) {
  const db = getDb();
  
  try {
    const interface_ = db.prepare('SELECT * FROM interfaces WHERE id = ?').get(id) as Interface | undefined;
    
    if (!interface_) {
      return { success: false, error: 'Interface not found' };
    }
    
    return { success: true, data: interface_ };
  } catch (error) {
    console.error(`Error fetching interface ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new interface in the database
 */
export async function createInterfaceInDb(interface_: Omit<Interface, 'id' | 'features'>) {
  const db = getDb();
  const id = generateId();
  const tenantId = 'org1'; // Default to the first organization
  
  try {
    db.prepare('INSERT INTO interfaces (id, name, description, productId, tenantId) VALUES (?, ?, ?, ?, ?)')
      .run(id, interface_.name, interface_.description || '', interface_.productId, tenantId);
    
    return { 
      success: true, 
      data: {
        ...interface_,
        id,
        tenantId,
        features: [] as string[]
      }
    };
  } catch (error) {
    console.error('Error creating interface:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update interface name
 */
export async function updateInterfaceNameInDb(id: string, name: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE interfaces SET name = ? WHERE id = ?').run(name, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Interface not found or name unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating interface ${id} name:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update interface description
 */
export async function updateInterfaceDescriptionInDb(id: string, description: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE interfaces SET description = ? WHERE id = ?')
      .run(description, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Interface not found or description unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating interface ${id} description:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete an interface
 */
export async function deleteInterfaceFromDb(id: string) {
  const db = getDb();
  
  try {
    // First check if interface exists
    const interface_ = db.prepare('SELECT id FROM interfaces WHERE id = ?').get(id);
    
    if (!interface_) {
      return { success: false, error: 'Interface not found' };
    }
    
    // Delete the interface
    db.prepare('DELETE FROM interfaces WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting interface ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


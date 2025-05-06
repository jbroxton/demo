// This is a minimal service for products that will work alongside existing state
import { getDb } from './db.server';
import { Product } from '@/types/models';

// Generate a simple ID - matching the same method used in the Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all products from the database
 */
export async function getProductsFromDb() {
  const db = getDb();
  
  try {
    // Fetch all products
    const products = db.prepare('SELECT * FROM products').all() as Product[];
    
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a product by ID
 */
export async function getProductByIdFromDb(id: string) {
  const db = getDb();
  
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    return { success: true, data: product };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new product in the database
 */
export async function createProductInDb(product: Omit<Product, 'id'>) {
  const db = getDb();
  const id = generateId();
  const tenantId = 'org1'; // Default to the first organization
  
  try {
    db.prepare('INSERT INTO products (id, name, description, tenantId) VALUES (?, ?, ?, ?)')
      .run(id, product.name, product.description || '', tenantId);
    
    return { 
      success: true, 
      data: {
        ...product,
        id,
        tenantId,
        interfaces: [] as string[]
      }
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update product name
 */
export async function updateProductNameInDb(id: string, name: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE products SET name = ? WHERE id = ?').run(name, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Product not found or name unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating product ${id} name:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update product description
 */
export async function updateProductDescriptionInDb(id: string, description: string) {
  const db = getDb();
  
  try {
    const result = db.prepare('UPDATE products SET description = ? WHERE id = ?')
      .run(description, id);
    
    if (result.changes === 0) {
      return { success: false, error: 'Product not found or description unchanged' };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating product ${id} description:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProductFromDb(id: string) {
  const db = getDb();
  
  try {
    // First check if product exists
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    // Delete the product
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


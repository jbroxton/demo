/**
 * @file products-db.ts
 * @description Database service for product operations using Supabase
 */

import { supabase } from './supabase';
import { Product } from '@/types/models/Product';

/**
 * Maps a database row to a TypeScript Product object with camelCase fields
 * @param row - Database row with snake_case fields
 * @returns Product object with camelCase fields
 */
function mapProductFromDb(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    tenantId: row.tenant_id,
    isSaved: row.is_saved ?? false,
    savedAt: row.saved_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    interfaces: [] // Initialize empty array for interfaces
  };
}

/**
 * Maps a TypeScript Product object to database format with snake_case fields
 * @param product - Partial Product object with camelCase fields
 * @returns Database-formatted object with snake_case fields
 */
function mapProductToDb(product: Partial<Product>): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  // Map each field explicitly to maintain type safety
  if (product.id !== undefined) {
    mapped.id = product.id;
  }
  if (product.name !== undefined) {
    mapped.name = product.name;
  }
  if (product.description !== undefined) {
    mapped.description = product.description;
  }
  if (product.tenantId !== undefined) {
    mapped.tenant_id = product.tenantId;
  }
  if (product.isSaved !== undefined) {
    mapped.is_saved = product.isSaved;
  }
  if (product.savedAt !== undefined) {
    mapped.saved_at = product.savedAt;
  }
  if (product.createdAt !== undefined) {
    mapped.created_at = product.createdAt;
  }
  if (product.updatedAt !== undefined) {
    mapped.updated_at = product.updatedAt;
  }
  // Note: interfaces field is handled separately as it has a different table relationship
  
  return mapped;
}

/**
 * Get all products from the database
 */
export async function getProductsFromDb(tenantId: string) {
  console.log('=== getProductsFromDb CALLED ===');
  console.log('getProductsFromDb - tenantId:', tenantId);
  
  try {
    console.log('getProductsFromDb - executing Supabase query...');
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    console.log('getProductsFromDb - raw DB results:', dbProducts);
    
    // Map database fields to frontend format using the mapping function
    const mappedProducts = (dbProducts || []).map(mapProductFromDb);
    
    console.log('getProductsFromDb - mapped results:', mappedProducts);
    
    return { success: true, data: mappedProducts };
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
export async function getProductByIdFromDb(id: string, tenantId: string) {
  console.log('getProductByIdFromDb - id:', id, 'tenantId:', tenantId);
  
  try {
    const { data: dbProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('getProductByIdFromDb - product not found');
        return { success: false, error: 'Product not found' };
      }
      throw error;
    }
    
    console.log('getProductByIdFromDb - raw DB result:', dbProduct);
    
    // Map database fields to frontend format using the mapping function
    const mappedProduct = mapProductFromDb(dbProduct);
    
    console.log('getProductByIdFromDb - mapped result:', mappedProduct);
    
    return { success: true, data: mappedProduct };
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
 * @param product Product data without id (id is auto-generated)
 * @param tenantId The tenant ID for multi-tenancy
 */
export async function createProductInDb(
  product: { name: string; description?: string; isSaved?: boolean; savedAt?: string | null }, 
  tenantId: string
) {
  console.log('createProductInDb - input:', product, 'tenantId:', tenantId);
  
  if (!tenantId) {
    console.error('createProductInDb - no tenantId provided');
    return { 
      success: false, 
      error: 'Tenant ID is required'
    };
  }
  
  try {
    // Map input to database format
    const dbInput = {
      ...mapProductToDb(product),
      tenant_id: tenantId
    };
    
    console.log('createProductInDb - mapped DB input:', dbInput);
    
    const { data: dbProduct, error } = await supabase
      .from('products')
      .insert(dbInput)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('createProductInDb - raw DB result:', dbProduct);
    
    // Map database fields to frontend format using the mapping function
    const mappedProduct = mapProductFromDb(dbProduct);
    
    console.log('createProductInDb - mapped result:', mappedProduct);
    
    return { success: true, data: mappedProduct };
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
export async function updateProductNameInDb(id: string, name: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
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
export async function updateProductDescriptionInDb(id: string, description: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ description })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
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
export async function deleteProductFromDb(id: string, tenantId: string) {
  try {
    // First check if the product exists and belongs to the tenant
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { success: false, error: 'Product not found' };
      }
      throw checkError;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) {
      if (error.code === '23503') {
        return { success: false, error: 'Cannot delete product with existing references' };
      }
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a product as saved with timestamp
 */
export async function markProductAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ 
        is_saved: true,
        saved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error(`Error marking product ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
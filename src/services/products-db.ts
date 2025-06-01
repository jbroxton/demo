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
   // tenantId: row.tenant_id,
    isSaved: row.is_saved ?? false,
    savedAt: row.saved_at || null,
    // createdAt: row.created_at,
    // updatedAt: row.updated_at,
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
  if (product.isSaved !== undefined) {
    mapped.is_saved = product.isSaved;
  }
  if (product.savedAt !== undefined) {
    mapped.saved_at = product.savedAt;
  }
  // if (product.createdAt !== undefined) {
  //   mapped.created_at = product.createdAt;
  // }
  // if (product.updatedAt !== undefined) {
  //   mapped.updated_at = product.updatedAt;
  // }
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
    // Use direct object literal like interfaces and features
    const dbInput = {
      name: product.name,
      description: product.description || '',
      tenant_id: tenantId,
      is_saved: product.isSaved ?? false,
      saved_at: product.savedAt || null
    };
    
    console.log('createProductInDb - DB input:', JSON.stringify(dbInput, null, 2));
    console.log('createProductInDb - Field types:', {
      name: typeof dbInput.name,
      description: typeof dbInput.description,
      tenant_id: typeof dbInput.tenant_id,
      is_saved: typeof dbInput.is_saved,
      saved_at: typeof dbInput.saved_at,
    });
    
    console.log('createProductInDb - About to insert into Supabase...');
    const { data: dbProduct, error } = await supabase
      .from('products')
      .insert(dbInput)
      .select()
      .single();
    
    console.log('createProductInDb - Supabase response:', { 
      hasData: !!dbProduct, 
      hasError: !!error,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null
    });
    
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
    
    if (!dbProduct) {
      console.error('No product returned from insert');
      throw new Error('Failed to create product - no data returned');
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
 * Update product with multiple fields
 */
export async function updateProductInDb(updateData: any, tenantId: string) {
  try {
    console.log('updateProductInDb - input:', updateData, 'tenantId:', tenantId);
    
    if (!updateData.id) {
      return { 
        success: false, 
        error: 'Product ID is required for update'
      };
    }

    if (!tenantId) {
      return { 
        success: false, 
        error: 'Tenant ID is required'
      };
    }

    // Prepare update object (exclude id from update data)
    const { id, ...fieldsToUpdate } = updateData;
    
    console.log('updateProductInDb - updating product', id, 'with fields:', fieldsToUpdate);

    const { data, error } = await supabase
      .from('products')
      .update(fieldsToUpdate)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    
    if (error) {
      console.error('updateProductInDb - Supabase error:', error);
      throw error;
    }

    if (!data) {
      return { 
        success: false, 
        error: 'Product not found or not updated'
      };
    }

    console.log('updateProductInDb - success, raw data:', data);

    // Map the result back to Product format
    const mappedResult = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      isSaved: data.is_saved ?? true,
      savedAt: data.saved_at,
      interfaces: [] // Virtual relationship
    };

    console.log('updateProductInDb - mapped result:', mappedResult);

    return { 
      success: true, 
      data: mappedResult 
    };
  } catch (error) {
    console.error(`Error updating product ${updateData.id}:`, error);
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
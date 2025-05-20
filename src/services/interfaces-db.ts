// Service for interfaces that will work alongside existing state
import { supabase } from './supabase';
import { Interface } from '@/types/models';

// Map database rows to Interface type
const mapInterface = (row: any): Interface => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  productId: row.product_id,
  features: [], // Virtual relationship
  isSaved: row.is_saved ?? true,
  savedAt: row.saved_at
});

/**
 * Get all interfaces from the database
 */
export async function getInterfacesFromDb(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('interfaces')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapInterface) 
    };
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
export async function getInterfacesByProductIdFromDb(productId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('interfaces')
      .select('*')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapInterface) 
    };
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
export async function getInterfaceByIdFromDb(id: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('interfaces')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Interface not found' };
      }
      throw error;
    }

    return { 
      success: true, 
      data: mapInterface(data) 
    };
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
export async function createInterfaceInDb(interface_: Omit<Interface, 'id' | 'features' | 'tenantId'>, tenantId: string) {
  try {
    // Validate product exists and belongs to the same tenant
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', interface_.productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !productData) {
      return { success: false, error: 'Product not found or access denied' };
    }

    const { data, error } = await supabase
      .from('interfaces')
      .insert({
        name: interface_.name,
        description: interface_.description || '',
        product_id: interface_.productId,
        tenant_id: tenantId,
        is_saved: false,  // New entities start as unsaved
        saved_at: null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: mapInterface(data)
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
export async function updateInterfaceNameInDb(id: string, name: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('interfaces')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateInterfaceDescriptionInDb(id: string, description: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('interfaces')
      .update({ description })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function deleteInterfaceFromDb(id: string, tenantId: string) {
  try {
    // First check if interface exists
    const { data: existingInterface, error: checkError } = await supabase
      .from('interfaces')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { success: false, error: 'Interface not found' };
      }
      throw checkError;
    }

    // Delete the interface
    const { error } = await supabase
      .from('interfaces')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting interface ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark an interface as saved with timestamp
 */
export async function markInterfaceAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('interfaces')
      .update({ 
        is_saved: true,
        saved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error(`Error marking interface ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
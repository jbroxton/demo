// Service for managing features in the database
import { supabase } from './supabase';
import { Feature } from '@/types/models';

// Map database rows to Feature type
const mapFeature = (row: any): Feature => {
  // Map database priority values to frontend values
  const priorityMap: Record<string, 'High' | 'Med' | 'Low'> = {
    'high': 'High',
    'medium': 'Med',
    'low': 'Low'
  };
  
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    priority: priorityMap[row.priority] || 'Med',
    interfaceId: row.interface_id,
    tenantId: row.tenant_id,
    releases: [], // Virtual relationship
    isSaved: row.is_saved ?? true,
    savedAt: row.saved_at
  };
};

/**
 * Get all features from the database
 */
export async function getFeaturesFromDb(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapFeature) 
    };
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
export async function getFeaturesByInterfaceId(interfaceId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('interface_id', interfaceId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapFeature) 
    };
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
export async function getFeatureByIdFromDb(id: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Feature not found' };
      }
      throw error;
    }

    return { 
      success: true, 
      data: mapFeature(data) 
    };
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
export async function createFeatureInDb(feature: Omit<Feature, 'id' | 'releases' | 'tenantId'>, tenantId: string) {
  try {
    // Validate interface exists and belongs to the same tenant
    const { data: interfaceData, error: interfaceError } = await supabase
      .from('interfaces')
      .select('id')
      .eq('id', feature.interfaceId)
      .eq('tenant_id', tenantId)
      .single();

    if (interfaceError || !interfaceData) {
      return { success: false, error: 'Interface not found or access denied' };
    }

    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const { data, error } = await supabase
      .from('features')
      .insert({
        name: feature.name,
        description: feature.description || '',
        priority: priorityMap[feature.priority] || 'medium',
        interface_id: feature.interfaceId,
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
      data: mapFeature(data)
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
export async function updateFeatureNameInDb(id: string, name: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('features')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateFeatureDescriptionInDb(id: string, description: string, tenantId: string) {
  try {
    // Ensure description is a string - handle potential JSON objects that were stringified
    let descriptionToStore = description;

    // Safety check - if it's already a valid JSON string, don't double stringify it
    try {
      // Try to parse it - if it succeeds, it's already a JSON string
      JSON.parse(description);
      // It's already a valid JSON string, use as is
    } catch (e) {
      // If it's not valid JSON but an object somehow made it here
      if (typeof description === 'object') {
        descriptionToStore = JSON.stringify(description);
      }
      // Otherwise keep as is - it's a regular string
    }

    console.log(`Updating feature ${id} with description length: ${descriptionToStore.length}`);

    const { error } = await supabase
      .from('features')
      .update({ description: descriptionToStore })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateFeaturePriorityInDb(id: string, priority: 'High' | 'Med' | 'Low', tenantId: string) {
  try {
    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const { error } = await supabase
      .from('features')
      .update({ priority: priorityMap[priority] || 'medium' })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function deleteFeatureFromDb(id: string, tenantId: string) {
  try {
    // First check if feature exists
    const { data: existingFeature, error: checkError } = await supabase
      .from('features')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { success: false, error: 'Feature not found' };
      }
      throw checkError;
    }

    // Delete the feature
    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

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

/**
 * Mark a feature as saved with timestamp
 */
export async function markFeatureAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('features')
      .update({ 
        is_saved: true,
        saved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error(`Error marking feature ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
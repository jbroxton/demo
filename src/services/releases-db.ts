/**
 * @file src/services/releases-db.ts
 * @description Database service for managing releases in Supabase
 * @see {@link Release} for type definition
 */

import { supabase } from './supabase';
import { Release } from '@/types/models';

// Map database rows to Release type
const mapRelease = (row: any): Release => {
  // Map database priority values back to frontend values
  const priorityMap: Record<string, 'High' | 'Med' | 'Low'> = {
    'high': 'High',
    'medium': 'Med',
    'low': 'Low'
  };
  
  const frontendPriority = priorityMap[row.priority?.toLowerCase()] || 'Med';
  
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    releaseDate: row.release_date,
    priority: frontendPriority,
    featureId: row.feature_id,
    tenantId: row.tenant_id,
    isSaved: row.is_saved ?? true,
    savedAt: row.saved_at
  };
};

/**
 * Get all releases from the database
 */
export async function getReleasesFromDb(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRelease) 
    };
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
export async function getReleasesByFeatureId(featureId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('feature_id', featureId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRelease) 
    };
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
export async function getReleaseByIdFromDb(id: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Release not found' };
      }
      throw error;
    }

    return { 
      success: true, 
      data: mapRelease(data) 
    };
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
export async function createReleaseInDb(release: Omit<Release, 'id' | 'tenantId'>, tenantId: string) {
  try {
    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const { data, error } = await supabase
      .from('releases')
      .insert({
        name: release.name,
        description: release.description || '',
        release_date: release.releaseDate,
        priority: priorityMap[release.priority] || 'medium',
        feature_id: release.featureId,
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
      data: mapRelease(data)
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
export async function updateReleaseNameInDb(id: string, name: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('releases')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateReleaseDescriptionInDb(id: string, description: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('releases')
      .update({ description })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateReleaseDateInDb(id: string, releaseDate: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('releases')
      .update({ release_date: releaseDate })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateReleasePriorityInDb(id: string, priority: 'High' | 'Med' | 'Low', tenantId: string) {
  try {
    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const dbPriority = priorityMap[priority] || 'medium';
    
    const { error } = await supabase
      .from('releases')
      .update({ priority: dbPriority })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
 * Update a release with multiple fields
 */
export async function updateReleaseInDb(updateData: any, tenantId: string) {
  try {
    console.log('updateReleaseInDb - input:', updateData, 'tenantId:', tenantId);
    
    if (!updateData.id) {
      return { success: false, error: 'Release ID is required for update' };
    }

    const { id, ...fieldsToUpdate } = updateData;
    
    // Map frontend fields to database fields
    if (fieldsToUpdate.targetDate !== undefined) {
      fieldsToUpdate.release_date = fieldsToUpdate.targetDate;
      delete fieldsToUpdate.targetDate;
    }
    
    // Map priority values
    if (fieldsToUpdate.priority !== undefined) {
      const priorityMap: Record<string, string> = {
        'High': 'high',
        'Med': 'medium', 
        'Low': 'low'
      };
      fieldsToUpdate.priority = priorityMap[fieldsToUpdate.priority] || 'medium';
    }

    const { data, error } = await supabase
      .from('releases')
      .update(fieldsToUpdate)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating release:', error);
      throw error;
    }

    return { 
      success: true, 
      data: mapRelease(data)
    };
  } catch (error) {
    console.error(`Error updating release ${updateData.id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a release as saved
 */
export async function markReleaseAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('releases')
      .update({ 
        is_saved: true,
        saved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error marking release ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a release
 */
export async function deleteReleaseFromDb(id: string, tenantId: string) {
  try {
    // First check if release exists in the specified tenant
    const { data: existing, error: checkError } = await supabase
      .from('releases')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { success: false, error: 'Release not found' };
      }
      throw checkError;
    }

    // Delete the release
    const { error } = await supabase
      .from('releases')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting release ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
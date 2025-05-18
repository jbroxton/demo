/**
 * @file src/services/roadmaps-db.ts
 * Service methods for interacting with roadmaps data
 */

import { supabase } from './supabase';
import { Feature } from '@/types/models';
import { Roadmap } from '@/types/models/Roadmap';

// Map database rows to Roadmap type
const mapRoadmap = (row: any): Roadmap => ({
  id: row.id,
  name: row.name,
  description: row.description,
  is_default: row.is_default,
  tenantId: row.tenant_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  isSaved: row.is_saved ?? true,
  savedAt: row.saved_at
});

/**
 * Roadmap Management Methods
 */

/**
 * Get all roadmaps for a tenant
 */
export async function getRoadmaps(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRoadmap) 
    };
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get roadmap by ID
 */
export async function getRoadmapById(id: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Roadmap not found' };
      }
      throw error;
    }

    return { 
      success: true, 
      data: mapRoadmap(data) 
    };
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get or create default roadmap for tenant
 */
export async function getOrCreateDefaultRoadmap(tenantId: string) {
  try {
    // Check for existing default roadmap
    const { data: existing, error: checkError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .single();

    if (existing && !checkError) {
      return { success: true, data: mapRoadmap(existing) };
    }

    // Create default roadmap if none exists
    const { data: newRoadmap, error: createError } = await supabase
      .from('roadmaps')
      .insert({
        name: 'Default Roadmap',
        description: 'Default roadmap for tenant',
        is_default: true,
        tenant_id: tenantId,
        is_saved: false,  // New entities start as unsaved
        saved_at: null
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return { 
      success: true, 
      data: mapRoadmap(newRoadmap) 
    };
  } catch (error) {
    console.error('Error getting/creating default roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Create a new roadmap
 */
export async function createRoadmap(
  data: { name: string; description?: string; is_default?: boolean },
  tenantId: string
) {
  try {
    console.log('[createRoadmap] Received data:', JSON.stringify(data));

    // Sanitize input data
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name) {
      return { success: false, error: 'Name is required' };
    }

    const description = data.description != null ? String(data.description) : '';

    // If this is being set as default, clear any existing defaults
    if (data.is_default) {
      await supabase
        .from('roadmaps')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    // Insert new roadmap
    const { data: newRoadmap, error } = await supabase
      .from('roadmaps')
      .insert({
        name,
        description,
        is_default: data.is_default || false,
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
      id: newRoadmap.id,
      data: mapRoadmap(newRoadmap)
    };
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Mark a roadmap as saved
 */
export async function markRoadmapAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('roadmaps')
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
    console.error(`Error marking roadmap ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update an existing roadmap
 */
export async function updateRoadmap(
  id: string,
  data: { name?: string; description?: string; is_default?: boolean },
  tenantId: string
) {
  try {
    // Check if roadmap exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existing) {
      return { success: false, error: 'Roadmap not found' };
    }

    // Handle default status if updating it
    if (data.is_default) {
      await supabase
        .from('roadmaps')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.is_default !== undefined) {
      updateData.is_default = data.is_default;
    }

    // Execute update
    const { error } = await supabase
      .from('roadmaps')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Delete a roadmap
 */
export async function deleteRoadmap(id: string, tenantId: string) {
  try {
    // Check if roadmap exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('roadmaps')
      .select('is_default')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existing) {
      return { success: false, error: 'Roadmap not found' };
    }

    // Don't allow deleting the default roadmap
    if (existing.is_default) {
      return { success: false, error: 'Cannot delete default roadmap' };
    }

    // Update any features using this roadmap to not be on any roadmap
    await supabase
      .from('features')
      .update({ roadmap_id: null })
      .eq('roadmap_id', id)
      .eq('tenant_id', tenantId);

    // Delete the roadmap
    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Feature-Roadmap Relationship Methods
 */

/**
 * Get features for a specific roadmap
 */
export async function getFeaturesForRoadmap(roadmapId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: data || [] 
    };
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get features for a specific roadmap with calculated workflow statuses
 */
export async function getFeaturesForRoadmapWithStatus(
  roadmapId: string,
  tenantId: string,
  status?: string
) {
  try {
    // Build the query
    let query = supabase
      .from('features')
      .select(`
        *,
        entity_approvals!entity_approvals_entity_id_fkey (
          roadmap_status
        ),
        releases (
          id,
          name,
          release_date
        )
      `)
      .eq('roadmap_id', roadmapId)
      .eq('tenant_id', tenantId);

    const { data: features, error } = await query;

    if (error) {
      throw error;
    }

    // Process the data to calculate workflowStatus
    const processedFeatures = (features || []).map((feature: any) => {
      const workflowStatus = feature.entity_approvals?.[0]?.roadmap_status || 'Not Started';
      const release = feature.releases?.[0];
      
      return {
        ...feature,
        workflowStatus,
        releaseId: release?.id || null,
        releaseName: release?.name || null,
        releaseDate: release?.release_date || null,
        // Remove the nested data
        entity_approvals: undefined,
        releases: undefined
      };
    });

    // Filter by status if provided
    const filteredFeatures = status 
      ? processedFeatures.filter(f => f.workflowStatus === status)
      : processedFeatures;

    console.log(`Found ${filteredFeatures.length} features for roadmap ${roadmapId}`);
    
    return { success: true, data: filteredFeatures };
  } catch (error) {
    console.error('Error fetching roadmap features with status:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Add a feature to a roadmap
 */
export async function addFeatureToRoadmap(
  featureId: string,
  roadmapId: string,
  tenantId: string
) {
  try {
    // Verify feature exists and belongs to tenant
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id')
      .eq('id', featureId)
      .eq('tenant_id', tenantId)
      .single();

    if (featureError || !feature) {
      return { success: false, error: 'Feature not found' };
    }

    // Verify roadmap exists and belongs to tenant
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('id', roadmapId)
      .eq('tenant_id', tenantId)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: 'Roadmap not found' };
    }

    // Update feature to be part of roadmap
    const { error } = await supabase
      .from('features')
      .update({ roadmap_id: roadmapId })
      .eq('id', featureId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding feature to roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Remove a feature from any roadmap
 */
export async function removeFeatureFromRoadmap(
  featureId: string,
  tenantId: string
) {
  try {
    // Verify feature exists and belongs to tenant
    const { data: feature, error: checkError } = await supabase
      .from('features')
      .select('id')
      .eq('id', featureId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !feature) {
      return { success: false, error: 'Feature not found' };
    }

    // Remove feature from roadmap by setting roadmap_id to NULL
    const { error } = await supabase
      .from('features')
      .update({ roadmap_id: null })
      .eq('id', featureId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing feature from roadmap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
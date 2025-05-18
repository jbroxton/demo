// Database service for requirements
import { supabase } from './supabase';
import { Requirement } from '@/types/models';

// Map database rows to Requirement type
const mapRequirement = (row: any): Requirement => {
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
    featureId: row.feature_id,
    releaseId: row.release_id,
    owner: row.owner,
    description: row.description,
    priority: frontendPriority,
    cuj: row.cuj,
    acceptanceCriteria: row.acceptance_criteria,
    tenantId: row.tenant_id,
    isSaved: row.is_saved ?? true,
    savedAt: row.saved_at
  };
};

/**
 * Get all requirements from the database
 */
export async function getRequirementsFromDb(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRequirement) 
    };
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
export async function getRequirementByIdFromDb(id: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Requirement not found' };
      }
      throw error;
    }

    return { 
      success: true, 
      data: mapRequirement(data) 
    };
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
export async function getRequirementsByFeatureId(featureId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('feature_id', featureId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRequirement) 
    };
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
export async function getRequirementsByReleaseId(releaseId: string, tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('release_id', releaseId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      data: (data || []).map(mapRequirement) 
    };
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
export async function createRequirementInDb(requirement: Omit<Requirement, 'id' | 'tenantId'>, tenantId: string) {
  try {
    // Validate feature exists
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id')
      .eq('id', requirement.featureId)
      .eq('tenant_id', tenantId)
      .single();

    if (featureError || !feature) {
      return { success: false, error: 'Feature not found' };
    }
    
    // Validate release exists if provided
    if (requirement.releaseId) {
      const { data: release, error: releaseError } = await supabase
        .from('releases')
        .select('id')
        .eq('id', requirement.releaseId)
        .eq('tenant_id', tenantId)
        .single();

      if (releaseError || !release) {
        return { success: false, error: 'Release not found' };
      }
    }
    
    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const dbPriority = requirement.priority ? (priorityMap[requirement.priority] || requirement.priority.toLowerCase()) : null;
    
    // Insert the requirement
    const { data, error } = await supabase
      .from('requirements')
      .insert({
        name: requirement.name,
        feature_id: requirement.featureId,
        release_id: requirement.releaseId || null,
        owner: requirement.owner || null,
        description: requirement.description || null,
        priority: dbPriority,
        cuj: requirement.cuj || null,
        acceptance_criteria: requirement.acceptanceCriteria || null,
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
      data: mapRequirement(data)
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
export async function updateRequirementNameInDb(id: string, name: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementDescriptionInDb(id: string, description: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
      .update({ description })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementOwnerInDb(id: string, owner: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
      .update({ owner })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementPriorityInDb(id: string, priority: string, tenantId: string) {
  try {
    // Map frontend priority values to database values
    const priorityMap: Record<string, string> = {
      'High': 'high',
      'Med': 'medium',
      'Low': 'low'
    };
    
    const dbPriority = priorityMap[priority] || priority.toLowerCase();
    
    const { error } = await supabase
      .from('requirements')
      .update({ priority: dbPriority })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementReleaseInDb(id: string, releaseId: string | null, tenantId: string) {
  try {
    // Validate release exists if provided
    if (releaseId) {
      const { data: release, error: releaseError } = await supabase
        .from('releases')
        .select('id')
        .eq('id', releaseId)
        .eq('tenant_id', tenantId)
        .single();

      if (releaseError || !release) {
        return { success: false, error: 'Release not found' };
      }
    }
    
    const { error } = await supabase
      .from('requirements')
      .update({ release_id: releaseId })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementCujInDb(id: string, cuj: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
      .update({ cuj })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
export async function updateRequirementAcceptanceCriteriaInDb(id: string, acceptanceCriteria: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
      .update({ acceptance_criteria: acceptanceCriteria })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
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
 * Mark a requirement as saved
 */
export async function markRequirementAsSavedInDb(id: string, tenantId: string) {
  try {
    const { error } = await supabase
      .from('requirements')
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
    console.error(`Error marking requirement ${id} as saved:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a requirement
 */
export async function deleteRequirementFromDb(id: string, tenantId: string) {
  try {
    // First check if requirement exists
    const { data: existingRequirement, error: checkError } = await supabase
      .from('requirements')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { success: false, error: 'Requirement not found' };
      }
      throw checkError;
    }

    // Delete the requirement
    const { error } = await supabase
      .from('requirements')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting requirement ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
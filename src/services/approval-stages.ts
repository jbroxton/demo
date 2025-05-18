import { supabase } from './supabase';
import { ApprovalStage } from '@/types/models';

/**
 * Get all approval stages
 */
export async function getApprovalStages(tenantId: string = 'org1'): Promise<ApprovalStage[]> {
  try {
    console.log(`Fetching approval stages from database for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_stages')
      .select('*')
      .order('type')
      .order('order_num');
    
    if (error) {
      console.error('Error retrieving approval stages:', error);
      return [];
    }
    
    // Map database fields to TypeScript model
    const stages = (data || []).map((stage: any) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      order: stage.order_num, // Map order_num to order
      type: stage.type,
      created_at: stage.created_at,
      updated_at: stage.updated_at
    })) as ApprovalStage[];
    
    console.log(`Retrieved ${stages.length} stages from database`);
    
    return stages;
  } catch (error) {
    console.error('Error retrieving approval stages:', error);
    return [];
  }
}

/**
 * Get approval stage by ID
 */
export async function getApprovalStageById(id: string, tenantId: string = 'org1'): Promise<ApprovalStage | null> {
  try {
    console.log(`Fetching approval stage with ID: ${id} for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_stages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error retrieving approval stage with ID: ${id}`, error);
      return null;
    }
    
    if (!data) {
      console.log(`No stage found with ID: ${id}`);
      return null;
    }
    
    // Map database fields to TypeScript model
    const stage: ApprovalStage = {
      id: data.id,
      name: data.name,
      description: data.description,
      order: data.order_num, // Map order_num to order
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return stage;
  } catch (error) {
    console.error(`Error retrieving approval stage with ID: ${id}`, error);
    return null;
  }
}

/**
 * Create a new approval stage
 */
export async function createApprovalStage(stageData: Partial<ApprovalStage>, tenantId: string = 'org1'): Promise<ApprovalStage | null> {
  try {
    console.log(`Creating new approval stage with data for tenant ${tenantId}:`, stageData);
    
    const { data, error } = await supabase
      .from('approval_stages')
      .insert({
        name: stageData.name || '',
        description: stageData.description || '',
        order_num: stageData.order || 0,
        type: stageData.type || 'main'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating approval stage:', error);
      return null;
    }
    
    // Map database fields to TypeScript model
    const newStage: ApprovalStage = {
      id: data.id,
      name: data.name,
      description: data.description,
      order: data.order_num,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    console.log('Created new approval stage:', newStage);
    return newStage;
  } catch (error) {
    console.error('Error creating approval stage:', error);
    return null;
  }
}

/**
 * Update approval stage
 */
export async function updateApprovalStage(id: string, stageData: Partial<ApprovalStage>, tenantId: string = 'org1'): Promise<ApprovalStage | null> {
  try {
    console.log(`Updating approval stage with ID: ${id} for tenant ${tenantId} with data:`, stageData);
    
    const { data, error } = await supabase
      .from('approval_stages')
      .update({
        name: stageData.name,
        description: stageData.description,
        order_num: stageData.order,
        type: stageData.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating approval stage:', error);
      return null;
    }
    
    // Map database fields to TypeScript model
    const updatedStage: ApprovalStage = {
      id: data.id,
      name: data.name,
      description: data.description,
      order: data.order_num,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    console.log('Updated approval stage:', updatedStage);
    return updatedStage;
  } catch (error) {
    console.error('Error updating approval stage:', error);
    return null;
  }
}

/**
 * Delete approval stage
 */
export async function deleteApprovalStage(id: string, tenantId: string = 'org1'): Promise<boolean> {
  try {
    console.log(`Deleting approval stage with ID: ${id} for tenant ${tenantId}`);
    
    const { error } = await supabase
      .from('approval_stages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting approval stage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting approval stage:', error);
    return false;
  }
}
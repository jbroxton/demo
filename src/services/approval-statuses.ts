import { supabase } from './supabase';
import { ApprovalStatus } from '@/types/models';

/**
 * Get all approval statuses
 */
export async function getApprovalStatuses(tenantId: string): Promise<ApprovalStatus[]> {
  try {
    console.log(`Fetching approval statuses from database for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_statuses')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error retrieving approval statuses:', error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} statuses from database`);
    
    return data || [];
  } catch (error) {
    console.error('Error retrieving approval statuses:', error);
    return [];
  }
}

/**
 * Get approval status by ID
 */
export async function getApprovalStatusById(id: string, tenantId: string): Promise<ApprovalStatus | null> {
  try {
    console.log(`Fetching approval status with ID: ${id} for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_statuses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error retrieving approval status with ID: ${id}`, error);
      return null;
    }
    
    if (!data) {
      console.log(`No status found with ID: ${id}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error retrieving approval status with ID: ${id}`, error);
    return null;
  }
}

/**
 * Create a new approval status
 */
export async function createApprovalStatus(statusData: Partial<ApprovalStatus>, tenantId: string): Promise<ApprovalStatus | null> {
  try {
    console.log(`Creating approval status for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_statuses')
      .insert({
        name: statusData.name || '',
        color: statusData.color || '#cccccc',
        description: statusData.description || ''
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating approval status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating approval status:', error);
    return null;
  }
}

/**
 * Update approval status
 */
export async function updateApprovalStatus(id: string, statusData: Partial<ApprovalStatus>, tenantId: string): Promise<ApprovalStatus | null> {
  try {
    console.log(`Updating approval status with ID: ${id} for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('approval_statuses')
      .update({
        name: statusData.name,
        color: statusData.color,
        description: statusData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating approval status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating approval status:', error);
    return null;
  }
}

/**
 * Delete approval status
 */
export async function deleteApprovalStatus(id: string, tenantId: string): Promise<boolean> {
  try {
    console.log(`Deleting approval status with ID: ${id} for tenant: ${tenantId}`);
    
    const { error } = await supabase
      .from('approval_statuses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting approval status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting approval status:', error);
    return false;
  }
}
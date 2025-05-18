// IMPORTANT: This file should only be imported from server components or API routes
import { supabase } from './supabase';

// Define tenant interface
export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// Define user interface
export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  allowedTenants: Tenant[];
}

// Define the shape of the Supabase join response  
// When using !inner join, Supabase returns an array but TypeScript types it differently
interface UserTenantJoin {
  tenant_id: string;
  tenants: any; // Due to TypeScript limitations with Supabase typing
}

/**
 * Get user by email
 * @param email The user's email
 * @returns The user object or null if not found
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  try {
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return null;
    }
    
    // Get user's allowed tenants using a joined query
    const { data: userTenants, error: tenantsError } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        tenants!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id);
    
    if (tenantsError) {
      console.error('Error fetching user tenants:', tenantsError);
      return null;
    }
    
    // Map the nested data structure to our Tenant interface
    const tenants: Tenant[] = (userTenants || []).map((ut: UserTenantJoin) => ({
      id: ut.tenants.id,
      name: ut.tenants.name,
      slug: ut.tenants.slug
    }));
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      allowedTenants: tenants || []
    };
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
}

/**
 * Validate user credentials
 * @param email The user's email
 * @param password The user's password
 * @returns The user object if credentials are valid, null otherwise
 */
export async function validateCredentials(email: string, password: string): Promise<DbUser | null> {
  console.log(`validateCredentials called with email: ${email}`);
  
  try {
    // In a real app, you would use proper password hashing
    // For now, matching the current implementation with plain text password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .eq('password_hash', password)
      .single();
    
    console.log(`DB query result for ${email}:`, user ? "User found" : "No user found");
    
    if (userError || !user) {
      return null;
    }
    
    // Get user's allowed tenants using a joined query
    const { data: userTenants, error: tenantsError } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        tenants!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id);
    
    if (tenantsError) {
      console.error(`Error fetching tenants for user ${user.id}:`, tenantsError);
      return null;
    }
    
    // Map the nested data structure to our Tenant interface
    const allowedTenants: Tenant[] = (userTenants || []).map((ut: UserTenantJoin) => ({
      id: ut.tenants.id,
      name: ut.tenants.name,
      slug: ut.tenants.slug
    }));
    
    console.log(`Found ${allowedTenants.length} tenants for user ${user.id}`);
    
    const result: DbUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      allowedTenants
    };
    
    console.log(`Validation successful for ${email}, returning user with data:`, { 
      id: result.id, 
      name: result.name, 
      tenantsCount: result.allowedTenants.length 
    });
    
    return result;
  } catch (error) {
    console.error(`Error in validateCredentials for ${email}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Get user's tenants
 * @param userId The user's ID
 * @returns Array of tenant objects the user has access to
 */
export async function getUserTenants(userId: string): Promise<Tenant[]> {
  console.log(`getUserTenants called with userId: ${userId}`);
  
  if (!userId) {
    console.error("getUserTenants called with invalid userId:", userId);
    return [];
  }
  
  try {
    // Get user's tenants using a joined query
    const { data: userTenants, error } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        tenants!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching user tenants for ${userId}:`, error);
      return [];
    }
    
    // Map the nested data structure to our Tenant interface
    const tenants: Tenant[] = (userTenants || []).map((ut: UserTenantJoin) => ({
      id: ut.tenants.id,
      name: ut.tenants.name,
      slug: ut.tenants.slug
    }));
    
    console.log(`Found ${tenants.length} tenants for user ${userId}:`, 
      tenants.map((t: Tenant) => ({ id: t.id, name: t.name })));
    
    return tenants;
  } catch (error) {
    console.error(`Error fetching user tenants for ${userId}:`, error);
    return [];
  }
}

/**
 * Check if user has access to tenant
 * @param userId The user's ID
 * @param tenantId The tenant ID
 * @returns True if user has access, false otherwise
 */
export async function userHasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_tenants')
      .select('user_id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking tenant access:', error);
    return false;
  }
}

/**
 * Set user's current tenant
 * @param userId The user's ID
 * @param tenantId The tenant ID
 * @returns True if successful, false otherwise
 */
export async function setUserCurrentTenant(userId: string, tenantId: string): Promise<boolean> {
  // Check if user has access to this tenant
  const hasAccess = await userHasTenantAccess(userId, tenantId);
  if (!hasAccess) {
    return false;
  }
  
  // Update user's current tenant in session
  return true;
}
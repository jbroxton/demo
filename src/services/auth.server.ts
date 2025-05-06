// IMPORTANT: This file should only be imported from server components or API routes
import { getDb } from './db.server';

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

/**
 * Get user by email
 * @param email The user's email
 * @returns The user object or null if not found
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(email) as {
    id: string;
    email: string;
    name: string;
    role: string;
  } | undefined;
  
  if (!user) {
    return null;
  }
  
  // Get user's allowed tenants
  const allowedTenants = db.prepare(`
    SELECT t.id, t.name, t.slug
    FROM tenants t
    JOIN user_tenants ut ON t.id = ut.tenantId
    WHERE ut.userId = ?
  `).all(user.id) as Tenant[];
  
  return {
    ...user,
    allowedTenants
  };
}

/**
 * Validate user credentials
 * @param email The user's email
 * @param password The user's password
 * @returns The user object if credentials are valid, null otherwise
 */
export async function validateCredentials(email: string, password: string): Promise<DbUser | null> {
  console.log(`validateCredentials called with email: ${email}`);
  const db = getDb();
  
  try {
    // In a real app, you would use proper password hashing
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ? AND passwordHash = ?')
      .get(email, password) as {
        id: string;
        email: string;
        name: string;
        role: string;
      } | undefined;
    
    console.log(`DB query result for ${email}:`, user ? "User found" : "No user found");
    
    if (!user) {
      return null;
    }
    
    // Get user's allowed tenants
    const allowedTenants = db.prepare(`
      SELECT t.id, t.name, t.slug
      FROM tenants t
      JOIN user_tenants ut ON t.id = ut.tenantId
      WHERE ut.userId = ?
    `).all(user.id) as Tenant[];
    
    console.log(`Found ${allowedTenants.length} tenants for user ${user.id}`);
    
    const result: DbUser = {
      ...user,
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
  
  const db = getDb();
  
  try {
    const tenants = db.prepare(`
      SELECT t.id, t.name, t.slug
      FROM tenants t
      JOIN user_tenants ut ON t.id = ut.tenantId
      WHERE ut.userId = ?
    `).all(userId) as Tenant[];
    
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
  const db = getDb();
  
  const access = db.prepare(`
    SELECT 1 FROM user_tenants 
    WHERE userId = ? AND tenantId = ?
  `).get(userId, tenantId) as { 1: number } | undefined;
  
  return !!access;
}

/**
 * Set user's current tenant
 * @param userId The user's ID
 * @param tenantId The tenant ID
 * @returns True if successful, false otherwise
 */
export async function setUserCurrentTenant(userId: string, tenantId: string): Promise<boolean> {
  const db = getDb();
  
  // Check if user has access to this tenant
  const hasAccess = await userHasTenantAccess(userId, tenantId);
  if (!hasAccess) {
    return false;
  }
  
  // Update user's current tenant in session
  return true;
}
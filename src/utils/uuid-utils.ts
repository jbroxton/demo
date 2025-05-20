/**
 * UUID utility functions
 * 
 * This module provides helper functions for working with UUIDs
 * to ensure consistent formatting and validation.
 */

/**
 * Generates a random UUID in v4 format
 * 
 * @returns A new UUID string
 */
export function generateUuid(): string {
  // Implementation from RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID
 * 
 * @param id - The string to check
 * @returns True if the string is a valid UUID
 */
export function isValidUuid(id: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
}

/**
 * Ensures a tenant ID is a valid UUID
 * If not, it will return a replacement UUID instead
 * 
 * @param tenantId - The tenant ID to validate
 * @returns A valid UUID (either the input if valid, or a replacement)
 */
export function ensureValidTenantId(tenantId: string | null | undefined): string {
  // If no tenant ID was provided
  if (!tenantId) {
    console.warn('No tenant ID provided, generating a new UUID');
    return generateUuid();
  }
  
  // If the tenant ID is valid, return it
  if (isValidUuid(tenantId)) {
    return tenantId;
  }
  
  // If we have a non-UUID tenant ID like 'org1', generate a deterministic UUID from it
  // This ensures the same string always maps to the same UUID
  console.warn(`Invalid UUID format for tenant ID: "${tenantId}", converting to valid UUID`);
  
  // Simple hash function to get deterministic digits from a string
  let hash = 0;
  for (let i = 0; i < tenantId.length; i++) {
    hash = ((hash << 5) - hash) + tenantId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to modify a v4 UUID template
  // This keeps the version and variant bits intact per RFC4122
  let template = '10000000-1000-4000-8000-100000000000';
  let uuid = '';
  let hashStr = Math.abs(hash).toString();
  let index = 0;
  
  for (let i = 0; i < template.length; i++) {
    if (template[i] === '-') {
      uuid += '-';
    } else if (template[i] === '1') {
      // Use the hash value modulo 16 to get a hex digit
      const digit = parseInt(hashStr[index % hashStr.length]) % 16;
      uuid += digit.toString(16);
      index++;
    } else {
      // Keep version (4) and variant (8, 9, a, or b) bits
      uuid += template[i];
    }
  }
  
  return uuid;
}
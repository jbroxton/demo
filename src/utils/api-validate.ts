/**
 * Validation Helper Utilities
 * 
 * Provides standardized validation for API routes.
 * Helps ensure required fields are present and properly formatted.
 * 
 * Usage:
 * ```typescript
 * import { validateRequired } from '@/utils/validate';
 * 
 * const error = validateRequired(body, ['name', 'email']);
 * if (error) {
 *   return apiResponse.error(error, 400);
 * }
 * ```
 */

/**
 * Validates that required fields are present in the request body
 * 
 * @param body - The request body object to validate
 * @param fields - Array of required field names
 * @returns Error message if validation fails, null if all fields are present
 * 
 * @example
 * ```typescript
 * // Check for required fields
 * const body = { name: 'John' };
 * const error = validateRequired(body, ['name', 'email']);
 * // Returns: "Email is required"
 * 
 * // All fields present
 * const body = { name: 'John', email: 'john@example.com' };
 * const error = validateRequired(body, ['name', 'email']);
 * // Returns: null
 * ```
 */
export function validateRequired(
  body: Record<string, any>,
  fields: string[]
): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body is required';
  }

  for (const field of fields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      // Capitalize the first letter of the field name for the error message
      const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
      return `${capitalizedField} is required`;
    }
  }

  return null;
}
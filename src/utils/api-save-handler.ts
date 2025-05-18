/**
 * @file src/utils/api-save-handler.ts
 * @description Generic API handler for marking entities as saved
 */

import { NextRequest } from 'next/server';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

type SaveFunction = (id: string, tenantId: string) => Promise<{ success: boolean; error?: string }>;

/**
 * Creates a PATCH handler for marking an entity as saved
 * @param saveFunction - The service function that marks the entity as saved
 * @param entityName - The name of the entity type for error messages
 * @returns An authenticated Next.js API route handler
 */
export function createSaveHandler(saveFunction: SaveFunction, entityName: string) {
  return authenticatedHandler(async (request, { tenantId, body }) => {
    // Validate that we have an ID
    const validationError = validateRequired(body, ['id']);
    if (validationError) {
      return apiResponse.error(validationError, 400);
    }

    // Call the save function
    const result = await saveFunction(body.id, tenantId);

    if (!result.success) {
      return apiResponse.error(
        result.error || `Failed to mark ${entityName} as saved`,
        500
      );
    }

    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  });
}
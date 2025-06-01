import { getParentEntityAttachmentsFromDb } from '@/services/attachments-db';
import { apiResponse } from '@/utils/api-response';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';
import { EntityType } from '@/types/models';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');

  if (!entityId || !entityType) {
    return apiResponse.error('Entity ID and type are required', 400);
  }

  const result = await getParentEntityAttachmentsFromDb(entityId, entityType as EntityType, tenantId);
  
  if (!result.success) {
    return apiResponse.error(result.error || 'Failed to fetch inherited attachments', 500);
  }
  
  return apiResponse.success(result.data);
});
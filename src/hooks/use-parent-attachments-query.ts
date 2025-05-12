import { useQuery } from '@tanstack/react-query';
import { Attachment, EntityType } from '@/types/models';
import { useAuth } from './use-auth';

/**
 * Response format for parent attachments
 */
interface ParentAttachmentsResponse {
  parentType: EntityType | null;
  parentId: string | null;
  attachments: Attachment[];
}

/**
 * Hook for retrieving parent entity attachments
 * Currently only supports requirements having feature attachments
 */
export function useParentAttachmentsQuery(entityId?: string, entityType?: EntityType) {
  const { currentTenant } = useAuth();
  
  // Construct query key including tenant for proper cache isolation
  const queryKey = ['parent-attachments', entityId, entityType, currentTenant];

  // Query to fetch parent attachments
  const parentAttachmentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId || !entityType) {
        return { parentType: null, parentId: null, attachments: [] };
      }
      
      const response = await fetch(
        `/api/attachments-inherited-db?entityId=${entityId}&entityType=${entityType}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch parent attachments');
      }

      return await response.json() as ParentAttachmentsResponse;
    },
    // Only enable query if we have an entity and type (currently only requirements)
    enabled: !!entityId && entityType === 'requirement' && !!currentTenant,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    parentType: parentAttachmentsQuery.data?.parentType || null,
    parentId: parentAttachmentsQuery.data?.parentId || null,
    parentAttachments: parentAttachmentsQuery.data?.attachments || [],
    isLoading: parentAttachmentsQuery.isLoading,
    isError: parentAttachmentsQuery.isError,
    error: parentAttachmentsQuery.error,
  };
}
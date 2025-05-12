import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Attachment, EntityType } from '@/types/models';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

/**
 * Hook for managing attachments for a specific entity
 */
export function useAttachmentsQuery(entityId?: string, entityType?: EntityType) {
  const queryClient = useQueryClient();
  const { currentTenant } = useAuth();
  
  // Construct query key including tenant for proper cache isolation
  const queryKey = ['attachments', entityId, entityType, currentTenant];

  // Main query to fetch attachments
  const attachmentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId || !entityType) {
        return [];
      }
      
      const response = await fetch(
        `/api/attachments-db?entityId=${entityId}&entityType=${entityType}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attachments');
      }

      return await response.json() as Attachment[];
    },
    // Only enable query if we have an entity and type
    enabled: !!entityId && !!entityType && !!currentTenant,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for adding an attachment
  const addAttachmentMutation = useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const response = await fetch('/api/attachments-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title,
          entityId,
          entityType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add attachment');
      }

      return await response.json() as Attachment;
    },
    onSuccess: () => {
      // Invalidate the query to refetch attachments
      queryClient.invalidateQueries({ queryKey });
      toast.success('Attachment added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add attachment: ${error.message}`);
    },
  });

  // Mutation for removing an attachment
  const removeAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await fetch(
        `/api/attachments-db?id=${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove attachment');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refetch attachments
      queryClient.invalidateQueries({ queryKey });
      toast.success('Attachment removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove attachment: ${error.message}`);
    },
  });

  // Mutation for updating an attachment
  const updateAttachmentMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<Attachment>) => {
      const response = await fetch('/api/attachments-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attachment');
      }

      return await response.json() as Attachment;
    },
    onSuccess: () => {
      // Invalidate the query to refetch attachments
      queryClient.invalidateQueries({ queryKey });
      toast.success('Attachment updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update attachment: ${error.message}`);
    },
  });

  return {
    attachments: attachmentsQuery.data || [],
    isLoading: attachmentsQuery.isLoading,
    isError: attachmentsQuery.isError,
    error: attachmentsQuery.error,
    addAttachment: addAttachmentMutation.mutateAsync,
    removeAttachment: removeAttachmentMutation.mutateAsync,
    updateAttachment: updateAttachmentMutation.mutateAsync,
    isAddingAttachment: addAttachmentMutation.isPending,
    isRemovingAttachment: removeAttachmentMutation.isPending,
    isUpdatingAttachment: updateAttachmentMutation.isPending,
  };
}
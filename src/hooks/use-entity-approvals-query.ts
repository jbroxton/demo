import { EntityApproval } from '@/types/models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for interacting with entity approvals data
 */
export function useEntityApprovalsQuery(
  entityId?: string,
  entityType?: 'feature' | 'release'
) {
  const queryClient = useQueryClient();
  
  // We only enable the query if we have both entityId and entityType
  const enabled = !!entityId && !!entityType;
  
  // Use a specific query key for this entity
  const approvalsQueryKey = ['entity-approvals', entityType, entityId];

  // Get approvals for this entity
  const {
    data: approvals = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<EntityApproval[]>({
    queryKey: approvalsQueryKey,
    queryFn: async () => {
      if (!entityId || !entityType) {
        return [];
      }
      
      const response = await fetch(
        `/api/entity-approvals-db?entityId=${entityId}&entityType=${entityType}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch approvals for ${entityType} ${entityId}`);
      }
      
      return response.json();
    },
    enabled: enabled
  });

  // Initialize approvals for this entity
  const initializeApprovalsMutation = useMutation({
    mutationFn: async (params?: { customEntityId?: string; customEntityType?: 'feature' | 'release' }) => {
      const effectiveEntityId = params?.customEntityId || entityId;
      const effectiveEntityType = params?.customEntityType || entityType;
      
      if (!effectiveEntityId || !effectiveEntityType) {
        throw new Error('Entity ID and type are required');
      }
      
      console.log('Initializing approvals with:', effectiveEntityId, effectiveEntityType);
      
      const response = await fetch('/api/entity-approvals-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'initialize',
          entityId: effectiveEntityId,
          entityType: effectiveEntityType
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize approvals for ${effectiveEntityType} ${effectiveEntityId}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(approvalsQueryKey, data);
      // Dismiss any loading toasts first
      toast.dismiss();
      toast.success('Approvals initialized', { duration: 2000 });
    },
    onError: (error) => {
      console.error('Error initializing approvals:', error);
      toast.error('Failed to initialize approvals');
    }
  });

  // Update or create an approval
  const updateApprovalMutation = useMutation({
    mutationFn: async (approvalData: Partial<EntityApproval>) => {
      if (!entityId || !entityType) {
        throw new Error('Entity ID and type are required');
      }
      
      // Ensure entity info is included
      const data = {
        ...approvalData,
        entity_id: entityId,
        entity_type: entityType
      };
      
      const response = await fetch('/api/entity-approvals-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approval');
      }
      
      return response.json();
    },
    onSuccess: (updatedApproval) => {
      queryClient.setQueryData(approvalsQueryKey, (oldApprovals: EntityApproval[] = []) => {
        const index = oldApprovals.findIndex(a => a.stage_id === updatedApproval.stage_id);
        
        if (index >= 0) {
          // Replace existing approval
          return [
            ...oldApprovals.slice(0, index),
            updatedApproval,
            ...oldApprovals.slice(index + 1)
          ];
        } else {
          // Add new approval
          return [...oldApprovals, updatedApproval];
        }
      });
    },
    onError: (error) => {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval');
    }
  });

  // Delete an approval
  const deleteApprovalMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      const response = await fetch(`/api/entity-approvals-db?id=${approvalId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete approval');
      }
      
      return { success: true, id: approvalId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(approvalsQueryKey, (oldApprovals: EntityApproval[] = []) => {
        return oldApprovals.filter(approval => approval.id !== data.id);
      });
    },
    onError: (error) => {
      console.error('Error deleting approval:', error);
      toast.error('Failed to delete approval');
    }
  });

  // Delete all approvals for this entity
  const deleteAllApprovalsMutation = useMutation({
    mutationFn: async () => {
      if (!entityId || !entityType) {
        throw new Error('Entity ID and type are required');
      }
      
      const response = await fetch(
        `/api/entity-approvals-db?entityId=${entityId}&entityType=${entityType}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete approvals for ${entityType} ${entityId}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(approvalsQueryKey, []);
      toast.success('All approvals removed');
    },
    onError: (error) => {
      console.error('Error deleting all approvals:', error);
      toast.error('Failed to delete approvals');
    }
  });

  // Helper to get approval for a specific stage
  const getApprovalForStage = (stageId: string) => {
    return approvals.find(approval => approval.stage_id === stageId) || null;
  };

  // Check if this entity has any approvals
  const hasApprovals = approvals.length > 0;

  return {
    approvals,
    getApprovalForStage,
    hasApprovals,
    isLoading,
    isError,
    error,
    refetch,
    initializeApprovalsMutation,
    updateApprovalMutation,
    deleteApprovalMutation,
    deleteAllApprovalsMutation
  };
}
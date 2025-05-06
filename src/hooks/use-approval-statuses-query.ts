import { ApprovalStatus } from '@/types/models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for interacting with approval statuses data
 */
export function useApprovalStatusesQuery() {
  const queryClient = useQueryClient();
  const statusesQueryKey = ['approval-statuses'];

  // Get all statuses
  const {
    data: statuses = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ApprovalStatus[]>({
    queryKey: statusesQueryKey,
    queryFn: async () => {
      const response = await fetch('/api/approval-statuses-db');
      if (!response.ok) {
        throw new Error('Failed to fetch approval statuses');
      }
      return response.json();
    }
  });

  // Initialize default statuses
  const initializeStatusesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/approval-statuses-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize approval statuses');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(statusesQueryKey, data);
      toast.success('Approval statuses initialized');
    },
    onError: (error) => {
      console.error('Error initializing approval statuses:', error);
      toast.error('Failed to initialize approval statuses');
    }
  });

  // Create a new status
  const createStatusMutation = useMutation({
    mutationFn: async (statusData: Partial<ApprovalStatus>) => {
      const response = await fetch('/api/approval-statuses-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create approval status');
      }
      
      return response.json();
    },
    onSuccess: (newStatus) => {
      queryClient.setQueryData(statusesQueryKey, (oldStatuses: ApprovalStatus[] = []) => {
        return [...oldStatuses, newStatus];
      });
      toast.success('Approval status created');
    },
    onError: (error) => {
      console.error('Error creating approval status:', error);
      toast.error('Failed to create approval status');
    }
  });

  // Update a status
  const updateStatusMutation = useMutation({
    mutationFn: async (statusData: Partial<ApprovalStatus>) => {
      const response = await fetch('/api/approval-statuses-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }
      
      return response.json();
    },
    onSuccess: (updatedStatus) => {
      queryClient.setQueryData(statusesQueryKey, (oldStatuses: ApprovalStatus[] = []) => {
        return oldStatuses.map(status => 
          status.id === updatedStatus.id ? updatedStatus : status
        );
      });
      toast.success('Approval status updated');
    },
    onError: (error) => {
      console.error('Error updating approval status:', error);
      toast.error('Failed to update approval status');
    }
  });

  // Delete a status
  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const response = await fetch(`/api/approval-statuses-db?id=${statusId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete approval status');
      }
      
      return { success: true, id: statusId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(statusesQueryKey, (oldStatuses: ApprovalStatus[] = []) => {
        return oldStatuses.filter(status => status.id !== data.id);
      });
      toast.success('Approval status deleted');
    },
    onError: (error) => {
      console.error('Error deleting approval status:', error);
      toast.error('Failed to delete approval status');
    }
  });

  // Get a status by ID
  const getStatusById = (statusId: string) => {
    return statuses.find(status => status.id === statusId) || null;
  };

  // Get a status by name
  const getStatusByName = (statusName: string) => {
    return statuses.find(status => 
      status.name.toLowerCase() === statusName.toLowerCase()
    ) || null;
  };

  return {
    statuses,
    getStatusById,
    getStatusByName,
    isLoading,
    isError,
    error,
    refetch,
    initializeStatusesMutation,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation
  };
}
import { ApprovalStage } from '@/types/models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for interacting with approval stages data
 */
export function useApprovalStagesQuery() {
  const queryClient = useQueryClient();
  const stagesQueryKey = ['approval-stages'];

  // Get all stages
  const {
    data: stages = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ApprovalStage[]>({
    queryKey: stagesQueryKey,
    queryFn: async () => {
      const response = await fetch('/api/approval-stages-db');
      if (!response.ok) {
        throw new Error('Failed to fetch approval stages');
      }
      return response.json();
    }
  });

  // Initialize default stages
  const initializeStagesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/approval-stages-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize approval stages');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(stagesQueryKey, data);
      toast.success('Approval stages initialized');
    },
    onError: (error) => {
      console.error('Error initializing approval stages:', error);
      toast.error('Failed to initialize approval stages');
    }
  });

  // Create a new stage
  const createStageMutation = useMutation({
    mutationFn: async (stageData: Partial<ApprovalStage>) => {
      const response = await fetch('/api/approval-stages-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create approval stage');
      }
      
      return response.json();
    },
    onSuccess: (newStage) => {
      queryClient.setQueryData(stagesQueryKey, (oldStages: ApprovalStage[] = []) => {
        return [...oldStages, newStage];
      });
      toast.success('Approval stage created');
    },
    onError: (error) => {
      console.error('Error creating approval stage:', error);
      toast.error('Failed to create approval stage');
    }
  });

  // Update a stage
  const updateStageMutation = useMutation({
    mutationFn: async (stageData: Partial<ApprovalStage>) => {
      const response = await fetch('/api/approval-stages-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approval stage');
      }
      
      return response.json();
    },
    onSuccess: (updatedStage) => {
      queryClient.setQueryData(stagesQueryKey, (oldStages: ApprovalStage[] = []) => {
        return oldStages.map(stage => 
          stage.id === updatedStage.id ? updatedStage : stage
        );
      });
      toast.success('Approval stage updated');
    },
    onError: (error) => {
      console.error('Error updating approval stage:', error);
      toast.error('Failed to update approval stage');
    }
  });

  // Delete a stage
  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const response = await fetch(`/api/approval-stages-db?id=${stageId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete approval stage');
      }
      
      return { success: true, id: stageId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(stagesQueryKey, (oldStages: ApprovalStage[] = []) => {
        return oldStages.filter(stage => stage.id !== data.id);
      });
      toast.success('Approval stage deleted');
    },
    onError: (error) => {
      console.error('Error deleting approval stage:', error);
      toast.error('Failed to delete approval stage');
    }
  });

  // Helper function to get main stages (non-launch stages)
  const getMainStages = () => {
    return stages.filter(stage => stage.type === 'main')
      .sort((a, b) => a.order - b.order);
  };

  // Helper function to get launch phases
  const getLaunchStages = () => {
    return stages.filter(stage => stage.type === 'launch')
      .sort((a, b) => a.order - b.order);
  };

  // Get a stage by ID
  const getStageById = (stageId: string) => {
    return stages.find(stage => stage.id === stageId) || null;
  };

  return {
    stages,
    mainStages: getMainStages(),
    launchStages: getLaunchStages(),
    getStageById,
    isLoading,
    isError,
    error,
    refetch,
    initializeStagesMutation,
    createStageMutation,
    updateStageMutation,
    deleteStageMutation
  };
}
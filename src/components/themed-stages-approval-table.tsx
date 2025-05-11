import React, { useState, useEffect } from 'react';
import { ThemedTable, ThemedTableBody, ThemedTableCell, ThemedTableHead, ThemedTableHeader, ThemedTableRow } from '@/components/ui/themed-table';
import { ApprovalStage, ApprovalStatus, EntityApproval } from '@/types/models';
import { useApprovalStagesQuery } from '@/hooks/use-approval-stages-query';
import { useApprovalStatusesQuery } from '@/hooks/use-approval-statuses-query';
import { useEntityApprovalsQuery } from '@/hooks/use-entity-approvals-query';
import { ApprovalStatusBadge } from './approval-status-badge';
import { ApprovalEditDialog } from './approval-edit-dialog';
import { AddStageDialog } from './add-stage-dialog';
import { toast } from 'sonner';
import { Clock, Eye, Plus, FileEdit, X } from 'lucide-react';
import { useTableTheme } from '@/providers/table-theme-provider';
import { useAppTheme } from '@/providers/sidenav-theme-provider';
import { ThemedButton } from '@/components/ui/themed-button';

interface ThemedStagesApprovalTableProps {
  entityId: string;
  entityType: 'feature' | 'release';
  onToggle?: (isVisible: boolean) => void;
  shouldInitialize?: boolean;
}

export function ThemedStagesApprovalTable({
  entityId,
  entityType,
  onToggle,
  shouldInitialize = false
}: ThemedStagesApprovalTableProps) {
  // Theme hooks
  const theme = useTableTheme();
  const appTheme = useAppTheme();
  
  // State
  const [initialized, setInitialized] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ApprovalStage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddStageDialogOpen, setIsAddStageDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'launch'>('main');
  
  // Queries
  const { 
    mainStages, 
    launchStages, 
    isLoading: isLoadingStages, 
    getStageById,
    createStageMutation,
    refetch: refetchStages
  } = useApprovalStagesQuery();
  
  const { 
    statuses, 
    isLoading: isLoadingStatuses,
    getStatusById,
    refetch: refetchStatuses
  } = useApprovalStatusesQuery();
  
  const {
    approvals,
    hasApprovals,
    isLoading: isLoadingApprovals,
    initializeApprovalsMutation,
    updateApprovalMutation,
    deleteAllApprovalsMutation
  } = useEntityApprovalsQuery(entityId, entityType);
  
  // Initialize approvals if they don't exist yet - with fix for infinite update loop
  useEffect(() => {
    // Skip if already initialized or if we're still loading data
    if (initialized || isLoadingApprovals || isLoadingStages || isLoadingStatuses) {
      return;
    }
    
    // Skip if we already have approvals - no need to initialize
    if (hasApprovals) {
      setInitialized(true); // Mark as initialized since we already have approvals
      return;
    }
    
    // Only initialize if we have the necessary data
    if (mainStages.length === 0 || statuses.length === 0) {
      return; // Not ready to initialize yet
    }
    
    // Now we can safely initialize
    if (entityId && entityType) {
      console.log(`Initializing stages for ${entityType} ${entityId}`);
      setInitialized(true); // Mark as initialized BEFORE calling the mutation to prevent loops

      // Dismiss any existing loading toasts to prevent stuck UI
      toast.dismiss();

      // Use setTimeout to avoid any potential state update race conditions
      setTimeout(() => {
        initializeApprovalsMutation.mutate({});
      }, 0);
    }
  // Deliberately omit initializeApprovalsMutation from dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasApprovals,
    isLoadingApprovals,
    isLoadingStages,
    isLoadingStatuses,
    initialized,
    shouldInitialize,
    entityId,
    entityType,
    mainStages.length,
    statuses.length
  ]);
  
  // Handler to open the edit dialog for a stage
  const handleEditStage = (stage: ApprovalStage) => {
    setSelectedStage(stage);
    setIsDialogOpen(true);
  };
  
  // Handler to save approval change
  const handleSaveApproval = (approvalData: Partial<EntityApproval>) => {
    updateApprovalMutation.mutate(approvalData);
  };
  
  // Handler to remove stages tracking
  const handleRemoveApprovals = () => {
    if (confirm('Are you sure you want to remove all stages for this item?')) {
      deleteAllApprovalsMutation.mutate();
      if (onToggle) {
        onToggle(false);
      }
    }
  };
  
  // Handler to add a new custom stage
  const handleAddStage = (stageData: { name: string; description: string; type: 'main' | 'launch'; order: number }) => {
    createStageMutation.mutate({
      name: stageData.name,
      description: stageData.description,
      type: stageData.type,
      order: stageData.order
    }, {
      onSuccess: () => {
        toast.success(`New ${stageData.type} stage added successfully`);
      }
    });
  };
  
  // Helper to get current approval for a stage
  const getCurrentApproval = (stageId: string): EntityApproval | null => {
    return approvals.find(approval => approval.stage_id === stageId) || null;
  };
  
  // Helper to get status object for an approval
  const getApprovalStatus = (approval: EntityApproval | null): ApprovalStatus | null => {
    if (!approval) return null;
    return getStatusById(approval.status_id);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Loading state
  const isLoading = isLoadingStages || isLoadingStatuses || isLoadingApprovals;
  
  // Get the stages for the active tab
  const activeStages = activeTab === 'main' ? mainStages : launchStages;
  
  return (
    <div className="w-full space-y-2">
      {/* Tab and Action Buttons - Using ThemedButton */}
      <div className={theme.components.tableActionBar}>
        <div className={theme.components.tableActionBarLeft}>
          <ThemedButton
            variant={activeTab === 'main' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('main')}
          >
            Work Stages
          </ThemedButton>
          <ThemedButton
            variant={activeTab === 'launch' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('launch')}
          >
            Launch Stages
          </ThemedButton>
        </div>
        
        <div className={theme.components.tableActionBarRight}>
          <ThemedButton
            variant="secondary"
            onClick={() => {
              toast.loading('Refreshing data...');
              Promise.all([
                mainStages.length === 0 ? refetchStages() : Promise.resolve({ data: [] } as any),
                statuses.length === 0 ? refetchStatuses() : Promise.resolve({ data: [] } as any)
              ]).then(() => {
                toast.success('Data refreshed');
              }).catch(err => {
                console.error('Error refreshing data:', err);
                toast.error('Failed to refresh data');
              });
            }}
          >
            Refresh
          </ThemedButton>
          
          <ThemedButton
            variant="secondary"
            onClick={() => setIsAddStageDialogOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Custom Stage
          </ThemedButton>
          
          <ThemedButton
            variant="secondary"
            onClick={handleRemoveApprovals}
            icon={<X className="h-4 w-4" />}
          >
            Remove Stages
          </ThemedButton>
        </div>
      </div>
      
      {/* Table container with themed styling */}
      <div className={appTheme.card}>
        <div className={appTheme.cardContent}>
          <ThemedTable>
            <ThemedTableHeader>
              <ThemedTableRow isHeader>
                <ThemedTableHead className="w-1/4">Stage</ThemedTableHead>
                <ThemedTableHead className="w-1/5">Status</ThemedTableHead>
                <ThemedTableHead className="w-1/6">Approver</ThemedTableHead>
                <ThemedTableHead className="w-1/6">Updated</ThemedTableHead>
                <ThemedTableHead className="w-1/6 text-right">Actions</ThemedTableHead>
              </ThemedTableRow>
            </ThemedTableHeader>
            <ThemedTableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <ThemedTableRow key={index} alternate={index % 2 === 1}>
                    <ThemedTableCell>
                      <div className="h-4 w-3/4 bg-[#121218] rounded animate-pulse"></div>
                    </ThemedTableCell>
                    <ThemedTableCell>
                      <div className="h-4 w-1/2 bg-[#121218] rounded animate-pulse"></div>
                    </ThemedTableCell>
                    <ThemedTableCell>
                      <div className="h-4 w-1/2 bg-[#121218] rounded animate-pulse"></div>
                    </ThemedTableCell>
                    <ThemedTableCell>
                      <div className="h-4 w-1/2 bg-[#121218] rounded animate-pulse"></div>
                    </ThemedTableCell>
                    <ThemedTableCell className="text-right">
                      <div className="h-6 w-8 bg-[#121218] rounded animate-pulse ml-auto"></div>
                    </ThemedTableCell>
                  </ThemedTableRow>
                ))
              ) : activeStages.length === 0 ? (
                <ThemedTableRow>
                  <ThemedTableCell colSpan={5} className="text-center">
                    <div className="flex flex-col items-center gap-2 py-2">
                      <span className="text-white/70">No {activeTab} stages available</span>
                      <p className="text-white/50 text-xs max-w-md text-center mb-2">
                        The stages should be loaded automatically. If you don't see any stages, try refreshing using the button above.
                      </p>
                      <div className="space-x-2">
                        <ThemedButton
                          variant="secondary"
                          onClick={() => {
                            toast.loading('Fetching stages...');
                            Promise.all([refetchStages(), refetchStatuses()]).then(() => {
                              toast.success('Data refreshed');
                            }).catch(err => {
                              console.error('Failed to refresh:', err);
                              toast.error('Failed to refresh data');
                            });
                          }}
                        >
                          Refresh Stages
                        </ThemedButton>
                        
                        {/* Force initialize button */}
                        <ThemedButton
                          variant="primary"
                          onClick={() => {
                            toast.loading('Force initializing stages system...');

                            // Call API endpoint directly
                            fetch('/api/approval-init')
                              .then(response => response.json())
                              .then(data => {
                                console.log('Initialization response:', data);

                                if (data.success) {
                                  toast.success('Stages system initialized');
                                  // Refresh data
                                  Promise.all([refetchStages(), refetchStatuses()]).then(() => {
                                    // Finally, initialize this entity's approvals
                                    if (mainStages.length > 0 && statuses.length > 0) {
                                      setInitialized(true); // Mark as initialized BEFORE calling the mutation

                                      // Dismiss any pending loading toasts first
                                      toast.dismiss();

                                      setTimeout(() => {
                                        initializeApprovalsMutation.mutate({});
                                      }, 0);
                                    }
                                  });
                                } else {
                                  toast.error('Failed to initialize stages system');
                                }
                              })
                              .catch(err => {
                                console.error('Error initializing:', err);
                                toast.error('Failed to initialize stages system');
                              });
                          }}
                        >
                          Force Initialize
                        </ThemedButton>
                        
                        <ThemedButton
                          variant="secondary"
                          onClick={() => {
                            // Show help info
                            toast.info(
                              'If stages are not loading, the database may need to be initialized. Try running the SQL script at the command line.',
                              { duration: 5000 }
                            );
                          }}
                        >
                          Help
                        </ThemedButton>
                      </div>
                    </div>
                  </ThemedTableCell>
                </ThemedTableRow>
              ) : (
                activeStages.map((stage, index) => {
                  const approval = getCurrentApproval(stage.id);
                  const status = getApprovalStatus(approval);
                  
                  return (
                    <ThemedTableRow key={stage.id} alternate={index % 2 === 1}>
                      <ThemedTableCell>
                        {stage.name}
                      </ThemedTableCell>
                      <ThemedTableCell>
                        {status ? (
                          <ApprovalStatusBadge status={status} />
                        ) : (
                          <span className="text-white/50 text-xs">Not set</span>
                        )}
                      </ThemedTableCell>
                      <ThemedTableCell>
                        {approval?.approver || '-'}
                      </ThemedTableCell>
                      <ThemedTableCell>
                        {approval ? formatDate(approval.updated_at) : '-'}
                      </ThemedTableCell>
                      <ThemedTableCell className="text-right">
                        <ThemedButton
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditStage(stage)}
                          icon={<FileEdit className="h-4 w-4" />}
                        >
                          <span className="sr-only">Edit {stage.name} status</span>
                        </ThemedButton>
                        
                        {approval?.comments && (
                          <ThemedButton
                            variant="secondary"
                            className="h-8 w-8 p-0 ml-1"
                            onClick={() => toast.info(approval.comments)}
                            icon={<Eye className="h-4 w-4" />}
                          >
                            <span className="sr-only">View comments</span>
                          </ThemedButton>
                        )}
                      </ThemedTableCell>
                    </ThemedTableRow>
                  );
                })
              )}
            </ThemedTableBody>
          </ThemedTable>
        </div>
      </div>
      
      {/* Edit dialog */}
      {selectedStage && (
        <ApprovalEditDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          stage={selectedStage}
          currentApproval={selectedStage ? getCurrentApproval(selectedStage.id) : null}
          onSave={handleSaveApproval}
        />
      )}
      
      {/* Add stage dialog */}
      <AddStageDialog
        isOpen={isAddStageDialogOpen}
        onClose={() => setIsAddStageDialogOpen(false)}
        stageType={activeTab}
        onSave={handleAddStage}
      />
    </div>
  );
}
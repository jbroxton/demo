import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Plus, FileEdit, X } from 'lucide-react';
import { ApprovalStage, ApprovalStatus, EntityApproval } from '@/types/models';
import { useApprovalStagesQuery } from '@/hooks/use-approval-stages-query';
import { useApprovalStatusesQuery } from '@/hooks/use-approval-statuses-query';
import { useEntityApprovalsQuery } from '@/hooks/use-entity-approvals-query';
import { ApprovalStatusBadge } from './approval-status-badge';
import { ApprovalEditDialog } from './approval-edit-dialog';
import { AddStageDialog } from './add-stage-dialog';
import { toast } from 'sonner';

interface StagesApprovalTableProps {
  entityId: string;
  entityType: 'feature' | 'release';
  onToggle?: (isVisible: boolean) => void;
  shouldInitialize?: boolean;
}

export function StagesApprovalTable({
  entityId,
  entityType,
  onToggle,
  shouldInitialize = false
}: StagesApprovalTableProps) {
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
  
  // Initialize approvals if they don't exist yet
  useEffect(() => {
    // Initialize when either:
    // 1. First mount and hasApprovals is false, or
    // 2. Parent explicitly requests initialization via prop
    if ((!isLoadingApprovals && !hasApprovals && !initialized) || 
        (shouldInitialize && !hasApprovals && mainStages.length > 0 && statuses.length > 0)) {
      
      setInitialized(true);
      console.log('Initializing approvals for', entityType, entityId);
      
      if (mainStages.length > 0 && statuses.length > 0) {
        console.log('Calling mutate with entityId:', entityId, 'entityType:', entityType);
        initializeApprovalsMutation.mutate({});
      } else {
        console.warn('Cannot initialize approvals: stages or statuses missing');
      }
    }
  }, [
    hasApprovals, 
    isLoadingApprovals, 
    initialized,
    shouldInitialize,
    entityId,
    entityType,
    mainStages.length, 
    statuses.length, 
    initializeApprovalsMutation
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
  
  // Handler to remove approval tracking
  const handleRemoveApprovals = () => {
    if (confirm('Are you sure you want to remove all approval tracking for this item?')) {
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
  
  console.log('StagesApprovalTable - Data loaded:', {
    mainStagesCount: mainStages.length,
    launchStagesCount: launchStages.length,
    statusesCount: statuses.length,
    approvalsCount: Object.keys(approvals).length
  });
  
  // Get the stages for the active tab
  const activeStages = activeTab === 'main' ? mainStages : launchStages;
  
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'main' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('main')}
            className={
              activeTab === 'main' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white'
            }
          >
            Main Stages
          </Button>
          <Button
            variant={activeTab === 'launch' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('launch')}
            className={
              activeTab === 'launch' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white'
            }
          >
            Launch Phases
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
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
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-[#a0a0a0] mr-2"
          >
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddStageDialogOpen(true)}
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white mr-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Custom Stage
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveApprovals}
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Remove Tracking
          </Button>
        </div>
      </div>
      
      <div className="border border-[#2a2a2c] rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-[#232326]">
            <TableRow className="hover:bg-[#2a2a2c] border-[#2a2a2c]">
              <TableHead className="text-[#a0a0a0] w-1/4">Stage</TableHead>
              <TableHead className="text-[#a0a0a0] w-1/5">Status</TableHead>
              <TableHead className="text-[#a0a0a0] w-1/6">Approver</TableHead>
              <TableHead className="text-[#a0a0a0] w-1/6">Updated</TableHead>
              <TableHead className="text-[#a0a0a0] w-1/6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-[#2a2a2c] border-[#2a2a2c]">
                  <TableCell>
                    <div className="h-4 w-3/4 bg-[#232326] rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-1/2 bg-[#232326] rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-1/2 bg-[#232326] rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-1/2 bg-[#232326] rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-6 w-8 bg-[#232326] rounded animate-pulse ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : activeStages.length === 0 ? (
              <TableRow className="hover:bg-[#2a2a2c] border-[#2a2a2c]">
                <TableCell colSpan={5} className="text-center">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-[#a0a0a0]">No {activeTab} stages available</span>
                    <p className="text-[#a0a0a0] text-xs max-w-md text-center mb-2">
                      The stages should be loaded automatically. If you don't see any stages, try refreshing using the button above.
                    </p>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] mr-2"
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
                      </Button>
                      
                      {/* Force initialize button */}
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          toast.loading('Force initializing approval system...');
                          
                          // Call API endpoint directly
                          fetch('/api/approval-init')
                            .then(response => response.json())
                            .then(data => {
                              console.log('Initialization response:', data);
                              
                              if (data.success) {
                                toast.success('Approval system initialized');
                                // Refresh data
                                Promise.all([refetchStages(), refetchStatuses()]).then(() => {
                                  // Finally, initialize this entity's approvals
                                  if (mainStages.length > 0 && statuses.length > 0) {
                                    initializeApprovalsMutation.mutate({});
                                  }
                                });
                              } else {
                                toast.error('Failed to initialize approval system');
                              }
                            })
                            .catch(err => {
                              console.error('Error initializing:', err);
                              toast.error('Failed to initialize approval system');
                            });
                        }}
                      >
                        Force Initialize
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                        onClick={() => {
                          // Show help info
                          toast.info(
                            'If stages are not loading, the database may need to be initialized. Try running the SQL script at the command line.',
                            { duration: 5000 }
                          );
                        }}
                      >
                        Help
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activeStages.map(stage => {
                const approval = getCurrentApproval(stage.id);
                const status = getApprovalStatus(approval);
                
                return (
                  <TableRow key={stage.id} className="hover:bg-[#2a2a2c] border-[#2a2a2c]">
                    <TableCell className="font-medium text-white">
                      {stage.name}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <ApprovalStatusBadge status={status} />
                      ) : (
                        <span className="text-[#a0a0a0] text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#a0a0a0]">
                      {approval?.approver || '-'}
                    </TableCell>
                    <TableCell className="text-[#a0a0a0]">
                      {approval ? formatDate(approval.updated_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStage(stage)}
                        className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2c]"
                      >
                        <FileEdit className="h-4 w-4" />
                        <span className="sr-only">Edit {stage.name} status</span>
                      </Button>
                      
                      {approval?.comments && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info(approval.comments)}
                          className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2c]"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View comments</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
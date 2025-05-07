import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ApprovalStage, ApprovalStatus, EntityApproval } from '@/types/models';
import { useApprovalStatusesQuery } from '@/hooks/use-approval-statuses-query';

interface ApprovalEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stage: ApprovalStage;
  currentApproval: EntityApproval | null;
  onSave: (approvalData: Partial<EntityApproval>) => void;
}

export function ApprovalEditDialog({
  isOpen,
  onClose,
  stage,
  currentApproval,
  onSave
}: ApprovalEditDialogProps) {
  const { statuses, isLoading: isLoadingStatuses } = useApprovalStatusesQuery();
  
  // Form state
  const [statusId, setStatusId] = useState<string>('');
  const [approver, setApprover] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  
  // Initialize form with current approval data when available
  useEffect(() => {
    if (currentApproval) {
      setStatusId(currentApproval.status_id);
      setApprover(currentApproval.approver || '');
      setComments(currentApproval.comments || '');
    } else {
      // Reset form if no current approval
      setStatusId('');
      setApprover('');
      setComments('');
    }
  }, [currentApproval, isOpen]);
  
  const handleSave = () => {
    if (!statusId) return;
    
    onSave({
      stage_id: stage.id,
      status_id: statusId,
      approver: approver || undefined,
      comments: comments || undefined
    });
    
    onClose();
  };
  
  // Find status object for the selected ID
  const selectedStatus = statuses.find(status => status.id === statusId);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e20] border-[#2a2a2c] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Update {stage.name} Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium text-[#a0a0a0]">
              Status
            </label>
            {isLoadingStatuses ? (
              <div className="h-10 w-full bg-[#232326] rounded-md animate-pulse" />
            ) : (
              <Select
                value={statusId}
                onValueChange={setStatusId}
              >
                <SelectTrigger 
                  id="status"
                  className="bg-[#232326] border-[#2a2a2c] h-10"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                  {statuses.map(status => (
                    <SelectItem 
                      key={status.id} 
                      value={status.id}
                    >
                      <div className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="approver" className="text-sm font-medium text-[#a0a0a0]">
              Approver
            </label>
            <Input
              id="approver"
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              placeholder="Who approved this stage?"
              className="bg-[#232326] border-[#2a2a2c] h-10"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="comments" className="text-sm font-medium text-[#a0a0a0]">
              Comments
            </label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add comments about this status..."
              className="bg-[#232326] border-[#2a2a2c] min-h-24"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!statusId}
            className={selectedStatus?.color ? 'text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            style={selectedStatus?.color ? {
              backgroundColor: selectedStatus.color,
            } : {}}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
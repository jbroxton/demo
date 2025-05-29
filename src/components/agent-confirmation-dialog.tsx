"use client"

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Trash2, 
  Edit3,
  Plus,
  Eye
} from 'lucide-react';
import type { AgentConfirmation, AgentAction } from '@/types/models/ai-chat';

interface AgentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  confirmation?: AgentConfirmation | null;
  action?: AgentAction | null;
  onConfirm: (confirmationId: string, response: 'confirmed' | 'rejected' | 'cancelled', details?: any) => Promise<void>;
  isProcessing?: boolean;
}

/**
 * Agent Confirmation Dialog Component
 * 
 * Displays confirmation dialogs for agent operations requiring user approval
 */
export function AgentConfirmationDialog({
  isOpen,
  onClose,
  confirmation,
  action,
  onConfirm,
  isProcessing = false
}: AgentConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseDetails, setResponseDetails] = useState<string>('');

  if (!confirmation || !action) {
    return null;
  }

  const handleResponse = async (response: 'confirmed' | 'rejected' | 'cancelled') => {
    if (isSubmitting || isProcessing) return;

    try {
      setIsSubmitting(true);
      
      const details = responseDetails.trim() ? { note: responseDetails } : undefined;
      await onConfirm(confirmation.id, response, details);
      
      // Reset state
      setResponseDetails('');
      onClose();
    } catch (error) {
      console.error('Error handling confirmation response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationBadgeVariant = (operationType: string) => {
    switch (operationType) {
      case 'create':
        return 'default' as const;
      case 'update':
        return 'secondary' as const;
      case 'delete':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const isDestructive = action.operationType === 'delete';
  const isHighImpact = action.operationType === 'update' || action.operationType === 'delete';

  const formatParameterValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'Not specified';
    return JSON.stringify(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {!isDestructive && <CheckCircle className="h-5 w-5 text-blue-500" />}
            <DialogTitle>{confirmation.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {confirmation.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Operation Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getOperationIcon(action.operationType)}
                <span className="font-medium">Operation Details</span>
              </div>
              <Badge variant={getOperationBadgeVariant(action.operationType)}>
                {action.operationType.toUpperCase()} {action.entityType.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Function:</span>
                <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                  {action.functionName}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Entity Type:</span>
                <div className="capitalize">{action.entityType}</div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          {action.functionParameters && Object.keys(action.functionParameters).length > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Parameters</span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(action.functionParameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm font-medium text-right max-w-xs break-words">
                      {formatParameterValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for destructive operations */}
          {isDestructive && (
            <div className="rounded-lg border-red-200 bg-red-50 p-4 border">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Destructive Operation Warning</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                This action will permanently delete data and cannot be undone. 
                Please confirm that you want to proceed.
              </p>
            </div>
          )}

          {/* High impact warning */}
          {isHighImpact && !isDestructive && (
            <div className="rounded-lg border-orange-200 bg-orange-50 p-4 border">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">High Impact Operation</span>
              </div>
              <p className="text-sm text-orange-600 mt-2">
                This action will modify existing data. Please review the parameters carefully.
              </p>
            </div>
          )}

          {/* Additional Details */}
          {confirmation.details && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Additional Information</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {typeof confirmation.details === 'string' 
                  ? confirmation.details 
                  : JSON.stringify(confirmation.details, null, 2)
                }
              </div>
            </div>
          )}

          <Separator />

          {/* Response Note (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add a note (optional):
            </label>
            <textarea
              value={responseDetails}
              onChange={(e) => setResponseDetails(e.target.value)}
              placeholder="Add any notes about your decision..."
              className="w-full p-2 border rounded-md text-sm resize-none h-20"
              disabled={isSubmitting || isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleResponse('cancelled')}
            disabled={isSubmitting || isProcessing}
          >
            Cancel
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleResponse('rejected')}
            disabled={isSubmitting || isProcessing}
            className="text-red-600 hover:text-red-700"
          >
            Reject
          </Button>
          
          <Button
            onClick={() => handleResponse('confirmed')}
            disabled={isSubmitting || isProcessing}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isSubmitting ? 'Processing...' : isDestructive ? 'Confirm Delete' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
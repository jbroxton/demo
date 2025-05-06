import React from 'react';
import { ApprovalStatus } from '@/types/models';
import { cn } from '@/lib/utils';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  // Default style for badge
  const baseStyle = "text-xs font-medium inline-flex items-center px-2 py-1 rounded-md";
  
  // Custom style based on status color
  let customStyle = {
    backgroundColor: `${status.color}20`, // 20% opacity version of the status color
    color: status.color,
  };
  
  // Special styling for common status names
  if (status.name === 'Approved' || status.name === 'Completed') {
    customStyle = {
      backgroundColor: 'rgba(40, 167, 69, 0.2)',
      color: '#28a745',
    };
  } else if (status.name === 'Rejected') {
    customStyle = {
      backgroundColor: 'rgba(220, 53, 69, 0.2)',
      color: '#dc3545',
    };
  } else if (status.name === 'Pending Approval') {
    customStyle = {
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      color: '#ffc107',
    };
  } else if (status.name === 'Blocked') {
    customStyle = {
      backgroundColor: 'rgba(253, 126, 20, 0.2)',
      color: '#fd7e14',
    };
  } else if (status.name === 'Not Started' || status.name === 'Not Needed') {
    customStyle = {
      backgroundColor: 'rgba(108, 117, 125, 0.2)',
      color: '#6c757d',
    };
  }
  
  return (
    <span 
      className={cn(baseStyle, className)} 
      style={customStyle}
    >
      {status.name}
    </span>
  );
}
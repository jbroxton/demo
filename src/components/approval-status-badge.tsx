import React from 'react';
import { ApprovalStatus } from '@/types/models';
import { cn } from '@/lib/utils';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus | string;
  className?: string;
}

// Define roadmap status types
type RoadmapStatusKey = 'Backlog' | 'Not Started' | 'In Progress' | 'Launched' | 'Completed' | 'Blocked' | 'Not Needed';
type StatusStyle = { bg: string; color: string };

// Roadmap status styles
const roadmapStatusStyles: Record<RoadmapStatusKey, StatusStyle> = {
  'Backlog': { bg: 'bg-purple-100', color: 'text-purple-500' },
  'Not Started': { bg: 'bg-gray-100', color: 'text-gray-500' },
  'In Progress': { bg: 'bg-blue-100', color: 'text-blue-500' },
  'Launched': { bg: 'bg-green-100', color: 'text-green-500' },
  'Completed': { bg: 'bg-green-100', color: 'text-green-500' },
  'Blocked': { bg: 'bg-orange-100', color: 'text-orange-500' },
  'Not Needed': { bg: 'bg-gray-100', color: 'text-gray-500' }
};

// Default style for unknown status
const defaultStatusStyle: StatusStyle = { bg: 'bg-gray-100', color: 'text-gray-500' };

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  // Default style for badge
  const baseStyle = "text-xs font-medium inline-flex items-center px-2 py-1 rounded-md";

  // Handle string status (roadmap status)
  if (typeof status === 'string') {
    const statusName = status;
    const roadmapStyle = (roadmapStatusStyles as Record<string, StatusStyle>)[statusName] || defaultStatusStyle;

    return (
      <span
        className={cn(baseStyle, roadmapStyle.bg, roadmapStyle.color, className)}
      >
        {statusName}
      </span>
    );
  }
  
  // Custom style based on status color for ApprovalStatus objects
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
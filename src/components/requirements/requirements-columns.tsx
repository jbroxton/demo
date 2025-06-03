'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Interface for requirement row data
export interface RequirementRow {
  id: string
  title: string
  status: string
  priority: string
  jiraId: string
  assignedTo: string | null
  createdAt: string
}

// Get status badge styling
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    case 'in_progress': 
    case 'in progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'completed': 
    case 'complete': return 'bg-green-500/20 text-green-300 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

// Get priority badge styling
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

// Format status text
const formatStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'in_progress': return 'In Progress'
    case 'completed': return 'Completed'
    default: return status
  }
}

// Format priority text
const formatPriority = (priority: string) => {
  switch (priority) {
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    default: return priority
  }
}

export const getRequirementsColumns = (
  onDelete?: (requirementId: string) => void,
  isEditable: boolean = true
): ColumnDef<RequirementRow>[] => {
  const columns: ColumnDef<RequirementRow>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const title = row.getValue('title') as string
        return (
          <div className="min-w-[200px]">
            <span className="font-medium text-white">{title}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge 
            variant="outline" 
            className={`${getStatusColor(status)} whitespace-nowrap`}
          >
            {formatStatus(status)}
          </Badge>
        )
      },
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        return (
          <Badge 
            variant="outline" 
            className={`${getPriorityColor(priority)} whitespace-nowrap`}
          >
            {formatPriority(priority)}
          </Badge>
        )
      },
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'jiraId',
      header: 'Jira',
      cell: ({ row }) => {
        const jiraId = row.getValue('jiraId') as string
        
        if (!jiraId) {
          return <span className="text-white/60 text-sm">-</span>
        }
        
        return (
          <a 
            href={`https://jira.com/browse/${jiraId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            {jiraId}
            <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
      enableSorting: true,
    },
  ]

  // Add actions column only if editable
  if (isEditable && onDelete) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-[#161618] border-white/10 text-white"
            >
              <DropdownMenuItem 
                onClick={() => onDelete(row.original.id)}
                className="hover:bg-white/10 focus:bg-white/10 text-red-400 hover:text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
    })
  }

  return columns
}
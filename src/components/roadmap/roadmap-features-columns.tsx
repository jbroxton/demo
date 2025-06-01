'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Page } from '@/types/models/Page'

// Interface for roadmap feature row data
export interface RoadmapFeatureRow {
  id: string
  name: string
  status: string
  priority: string
  assignees: string[]
  page: Page // Reference to full page object
}

// Get status badge styling
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'planning': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    case 'in progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'complete': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'on hold': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
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

export const getRoadmapFeaturesColumns = (
  onOpenFeature?: (featureId: string) => void
): ColumnDef<RoadmapFeatureRow>[] => [
  {
    accessorKey: 'name',
    header: 'Feature Name',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="font-medium text-white">{name}</span>
          {onOpenFeature && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
              onClick={() => onOpenFeature(row.original.id)}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
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
          {status}
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
          {priority}
        </Badge>
      )
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'assignees',
    header: 'Assigned To',
    cell: ({ row }) => {
      const assignees = row.getValue('assignees') as string[]
      
      if (assignees.length === 0) {
        return <span className="text-white/60 text-sm">Unassigned</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1 min-w-[120px]">
          {assignees.slice(0, 2).map((assignee, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs border-white/20 text-white/80 bg-white/5"
            >
              {assignee}
            </Badge>
          ))}
          {assignees.length > 2 && (
            <Badge
              variant="outline"
              className="text-xs border-white/20 text-white/60 bg-white/5"
            >
              +{assignees.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      const assignees = row.getValue(id) as string[]
      return assignees.some(assignee => 
        assignee.toLowerCase().includes(value.toLowerCase())
      )
    },
  },
  {
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
              onClick={() => onOpenFeature?.(row.original.id)}
              className="hover:bg-white/10 focus:bg-white/10"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Feature
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
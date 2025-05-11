'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApprovalStatusBadge } from '@/components/approval-status-badge'
import { MinusCircle, Calendar } from 'lucide-react'
import { RoadmapFeatureSelectDialog } from './roadmap-feature-select-dialog'
import { Feature } from '@/types/models'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/requirements/data-table'
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query'

interface RoadmapFeaturesTableProps {
  roadmapId: string
}

export function RoadmapFeaturesTable({ roadmapId }: RoadmapFeaturesTableProps) {
  const [statusFilter, setStatusFilter] = useState('All')

  const {
    getRoadmapFeaturesQuery,
    removeFeatureFromRoadmap,
    isRemoving
  } = useRoadmapsQuery()

  // Use the query to get features
  const {
    data: features = [],
    isLoading: isLoadingFeatures,
    error
  } = getRoadmapFeaturesQuery(
    roadmapId,
    statusFilter !== 'All' ? statusFilter : undefined
  )

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  // Handle removing a feature from roadmap
  const handleRemoveFeature = async (featureId: string) => {
    try {
      await removeFeatureFromRoadmap(featureId)
    } catch (error) {
      console.error('Error removing feature from roadmap:', error)
    }
  }

  // Define columns for the data table
  const columns: ColumnDef<Feature>[] = [
    {
      accessorKey: 'name',
      header: 'Feature',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>
    },
    {
      accessorKey: 'releaseId',
      header: 'Release',
      cell: ({ row }) => {
        const releaseName = row.original.releaseName || '-'
        return (
          <div className="flex items-center">
            {row.original.releaseId && <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />}
            <span>{releaseName}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'roadmap_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('roadmap_status') as string || 'Not Started'
        return <ApprovalStatusBadge status={status} />
      }
    },
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = row.getValue('updated_at') as string
        return date ? new Date(date).toLocaleDateString() : '-'
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRemoveFeature(row.original.id)}
          disabled={isRemoving}
          className="h-8 px-2"
        >
          <MinusCircle className="h-4 w-4 mr-2" /> Remove
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs defaultValue="All" onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Backlog">Backlog</TabsTrigger>
            <TabsTrigger value="Not Started">Not Started</TabsTrigger>
            <TabsTrigger value="In Progress">In Progress</TabsTrigger>
            <TabsTrigger value="Launched">Launched</TabsTrigger>
            <TabsTrigger value="Blocked">Blocked</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <RoadmapFeatureSelectDialog
          roadmapId={roadmapId}
          onFeaturesAdded={() => {
            // Refresh features list when new features are added
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={features}
        isLoading={isLoadingFeatures}
      />
    </div>
  )
}
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
    data,
    isLoading: isLoadingFeatures,
    error
  } = getRoadmapFeaturesQuery(
    roadmapId,
    statusFilter !== 'All' ? statusFilter : undefined
  )

  // Type guard to safely check if data is a Feature array
  const isFeatureArray = (value: unknown): value is Feature[] =>
    Array.isArray(value) && (value.length === 0 || (typeof value[0] === 'object' && value[0] !== null && 'id' in value[0]));

  // Use type guard for safe type narrowing
  const features = isFeatureArray(data) ? data : [];

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
          <TabsList className="bg-[#0a0a0a] border border-[#2a2a2c] h-12 rounded-xl shadow-lg shadow-black/20">
            <TabsTrigger value="All" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">All</TabsTrigger>
            <TabsTrigger value="Backlog" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">Backlog</TabsTrigger>
            <TabsTrigger value="Not Started" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">Not Started</TabsTrigger>
            <TabsTrigger value="In Progress" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">In Progress</TabsTrigger>
            <TabsTrigger value="Launched" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">Launched</TabsTrigger>
            <TabsTrigger value="Blocked" className="data-[state=active]:bg-[#121212] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-[#8b8b90] border-r border-[#2a2a2c] last:border-r-0 transition-all duration-300 rounded-lg hover:text-[#e1e1e6]">Blocked</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <RoadmapFeatureSelectDialog
          roadmapId={roadmapId}
          onFeaturesAdded={() => {
            // Refresh features list when new features are added
          }}
        />
      </div>

      <div className="bg-transparent">
        <DataTable
          columns={columns}
          data={features}
          isLoading={isLoadingFeatures}
        />
      </div>
    </div>
  )
}
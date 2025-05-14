'use client'

import { useState } from 'react'
import { useRequirementsQuery } from '@/hooks/use-requirements-query'
import { Requirement } from '@/types/models'
import { DataTable } from './data-table'
import { getColumns } from './columns'
import { Button } from '@/components/ui/button'
import { NewRequirementRow } from './new-requirement-row'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

interface RequirementsTableProps {
  featureId?: string
  releaseId?: string
  onAddRequirement?: () => void
  showAddRow?: boolean
  onAddRowCancel?: () => void
  onRowClick?: (requirementId: string, requirementName: string) => void
}

export function RequirementsTable({
  featureId,
  releaseId,
  showAddRow = false,
  onAddRowCancel,
  onRowClick
}: RequirementsTableProps) {
  // Use the appropriate query based on provided props
  const requirementsHook = useRequirementsQuery()
  
  let requirementsData = requirementsHook.requirements
  let isLoading = requirementsHook.isLoading
  let error = requirementsHook.error
  
  if (featureId) {
    const featureQuery = requirementsHook.getRequirementsByFeatureId(featureId)
    requirementsData = featureQuery.data || []
    isLoading = featureQuery.isLoading
    error = featureQuery.error
  } else if (releaseId) {
    const releaseQuery = requirementsHook.getRequirementsByReleaseId(releaseId)
    requirementsData = releaseQuery.data || []
    isLoading = releaseQuery.isLoading
    error = releaseQuery.error
  }

  // Handle adding a new requirement
  const handleAddRequirement = async (newRequirement: Omit<Requirement, 'id'>) => {
    try {
      await requirementsHook.addRequirement(newRequirement)
      return true
    } catch (error) {
      console.error('Failed to add requirement:', error)
      return false
    }
  }

  // Handle deleting selected requirements
  const handleDeleteRequirements = async (selectedRows: any[]) => {
    const promises = selectedRows.map((row: Requirement) => 
      requirementsHook.deleteRequirement(row.id, row.featureId, row.releaseId)
    )
    
    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to delete requirements:', error)
    }
  }

  // Handle row selection
  const handleRowSelection = (selectedRows: any[]) => {
    // You can do something with selected rows if needed
    console.log('Selected rows:', selectedRows)
  }

  // Get columns for the data table
  const columns = getColumns()
  
  // Create table instance - used in both rendering paths to avoid hook order issues
  const table = useReactTable({
    data: requirementsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 text-red-400 rounded-md">
        <p>Error loading requirements: {error.message}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => requirementsHook.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  // Show the new requirement form inline if showAddRow is true
  if (showAddRow) {
    return (
      <div className="space-y-0">
        {/* Regular data table */}
        <div className="rounded-md border border-[#2a2a2c]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {/* Insert the new requirement row first */}
              <NewRequirementRow 
                featureId={featureId || ''}
                onSave={async (req) => {
                  await handleAddRequirement(req)
                  if (onAddRowCancel) onAddRowCancel()
                }}
                onCancel={() => {
                  if (onAddRowCancel) onAddRowCancel()
                }}
                columnCount={columns.length}
              />
              
              {/* Show regular rows after */}
              {requirementsData.length > 0 ? (
                requirementsData.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`border-b border-[#2a2a2c] transition-colors hover:bg-[#232326] ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row.id, row.name)}
                  >
                    <TableCell className="p-2" key="select" onClick={(e) => e.stopPropagation()}>
                      <div className="w-4 h-4"></div>
                    </TableCell>
                    <TableCell className="p-2" key="id">
                      <div className="w-[80px]">{row.id}</div>
                    </TableCell>
                    <TableCell className="p-2" key="name">
                      {row.name}
                      {onRowClick && (
                        <span className="text-xs text-blue-400 ml-2 opacity-0 group-hover:opacity-100">
                          (click to open editor)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-2" key="description">
                      {row.description || '-'}
                    </TableCell>
                    <TableCell className="p-2" key="owner">
                      {row.owner || '-'}
                    </TableCell>
                    <TableCell className="p-2" key="priority">
                      <div className="w-[80px]">
                        {row.priority ? (
                          <span className={getPriorityClass(row.priority)}>{row.priority}</span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2" colSpan={columns.length - 6} key="actions" onClick={(e) => e.stopPropagation()}></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-4">
                    No existing requirements yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <DataTable
        columns={columns}
        data={requirementsData}
        isLoading={isLoading}
        onRowSelectionChange={handleRowSelection}
      />
    </div>
  )
}

/**
 * Helper function to get the appropriate CSS class for priority badge
 */
function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'High':
      return 'inline-flex px-2 py-1 rounded text-xs bg-red-900/30 text-red-400'
    case 'Med':
      return 'inline-flex px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400'
    case 'Low':
      return 'inline-flex px-2 py-1 rounded text-xs bg-green-900/30 text-green-400'
    default:
      return 'inline-flex px-2 py-1 rounded text-xs bg-gray-900/30 text-gray-400'
  }
}
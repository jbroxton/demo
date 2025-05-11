'use client'

import { useState } from 'react'
import { useRequirementsQuery } from '@/hooks/use-requirements-query'
import { Requirement } from '@/types/models'
import { ThemedDataTable } from './themed-data-table'
import { getColumns } from './columns'
import { useTableTheme } from '@/providers/table-theme-provider'
import { 
  ThemedTable, 
  ThemedTableBody, 
  ThemedTableCell, 
  ThemedTableHead, 
  ThemedTableHeader, 
  ThemedTableRow,
  ThemedTableEmpty,
  ThemedTableStatus
} from '@/components/ui/themed-table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ThemedButton } from '@/components/ui/themed-button'
import { ThemedNewRequirementRow } from './themed-new-requirement-row'

interface ThemedRequirementsTableProps {
  featureId?: string
  releaseId?: string
  onAddRequirement?: () => void
  showAddRow?: boolean
  onAddRowCancel?: () => void
}

export function ThemedRequirementsTable({ 
  featureId, 
  releaseId,
  showAddRow = false,
  onAddRowCancel
}: ThemedRequirementsTableProps) {
  const theme = useTableTheme();
  
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
      <div className="p-4 bg-red-950/30 text-red-300 rounded-md border border-red-900/40">
        <p>Error loading requirements: {error.message}</p>
        <ThemedButton
          variant="primary"
          className="mt-2"
          onClick={() => requirementsHook.refetch()}
        >
          Retry
        </ThemedButton>
      </div>
    )
  }

  // Show the new requirement form inline if showAddRow is true
  if (showAddRow) {
    return (
      <div className="space-y-0">
        {/* Regular data table with new themed components */}
        <ThemedTable>
          <ThemedTableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <ThemedTableRow key={headerGroup.id} isHeader>
                {headerGroup.headers.map((header) => (
                  <ThemedTableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </ThemedTableHead>
                ))}
              </ThemedTableRow>
            ))}
          </ThemedTableHeader>
          <ThemedTableBody>
            {/* Insert the new requirement row first */}
            <ThemedNewRequirementRow 
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
              requirementsData.map((row, index) => (
                <ThemedTableRow
                  key={row.id}
                  alternate={index % 2 === 1}
                >
                  <ThemedTableCell key="select">
                    <div className="w-4 h-4"></div>
                  </ThemedTableCell>
                  <ThemedTableCell key="id">
                    <div className="w-[80px]">{row.id}</div>
                  </ThemedTableCell>
                  <ThemedTableCell key="name">
                    {row.name}
                  </ThemedTableCell>
                  <ThemedTableCell key="description">
                    {row.description || '-'}
                  </ThemedTableCell>
                  <ThemedTableCell key="owner">
                    {row.owner || '-'}
                  </ThemedTableCell>
                  <ThemedTableCell key="priority">
                    <div className="w-[80px]">
                      {row.priority ? (
                        <ThemedTableStatus priority={row.priority}>
                          {row.priority}
                        </ThemedTableStatus>
                      ) : (
                        '-'
                      )}
                    </div>
                  </ThemedTableCell>
                  <ThemedTableCell colSpan={columns.length - 6} key="actions"></ThemedTableCell>
                </ThemedTableRow>
              ))
            ) : (
              <ThemedTableEmpty colSpan={columns.length} message="No existing requirements yet." />
            )}
          </ThemedTableBody>
        </ThemedTable>
      </div>
    )
  }

  // This function will be called from the toolbar's Add Requirement button
  const handleAddRow = () => {
    if (onAddRowCancel) {
      // onAddRowCancel is actually handleAddToggle in the parent which toggles showAddRow
      onAddRowCancel();
    }
  };

  return (
    <div className="space-y-0">
      <ThemedDataTable
        columns={columns}
        data={requirementsData}
        isLoading={isLoading}
        onRowSelectionChange={handleRowSelection}
        onAddRow={handleAddRow}
      />
    </div>
  )
}
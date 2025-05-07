'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Requirement } from '@/types/models'
import { useRequirementsQuery } from '@/hooks/use-requirements-query'
import { EditableCell } from './cell-renderers/editable-cell'

/**
 * Column definitions for the requirements table
 */
export const getColumns = (): ColumnDef<Requirement>[] => {
  const {
    updateRequirementName,
    updateRequirementDescription,
    updateRequirementOwner,
    updateRequirementCuj,
    updateRequirementAcceptanceCriteria,
  } = useRequirementsQuery()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue('name')}
          row={row}
          column={{ id: 'name' }}
          onSave={async (value) => {
            console.log(`Updating name for ${row.original.id}:`, value)
            await updateRequirementName(row.original.id, value)
          }}
        />
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue('description') || ''}
          row={row}
          column={{ id: 'description' }}
          onSave={async (value) => {
            console.log(`Updating description for ${row.original.id}:`, value)
            await updateRequirementDescription(row.original.id, value)
          }}
        />
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue('owner') || ''}
          row={row}
          column={{ id: 'owner' }}
          onSave={async (value) => {
            console.log(`Updating owner for ${row.original.id}:`, value)
            await updateRequirementOwner(row.original.id, value)
          }}
        />
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        return (
          <div className="w-[80px]">
            {priority ? (
              <span className={getPriorityClass(priority)}>{priority}</span>
            ) : (
              '-'
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'cuj',
      header: 'CUJ',
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue('cuj') || ''}
          row={row}
          column={{ id: 'cuj' }}
          onSave={async (value) => {
            console.log(`Updating CUJ for ${row.original.id}:`, value)
            await updateRequirementCuj(row.original.id, value)
          }}
        />
      ),
    },
    {
      accessorKey: 'acceptanceCriteria',
      header: 'Acceptance Criteria',
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue('acceptanceCriteria') || ''}
          row={row}
          column={{ id: 'acceptanceCriteria' }}
          onSave={async (value) => {
            console.log(`Updating acceptance criteria for ${row.original.id}:`, value)
            await updateRequirementAcceptanceCriteria(row.original.id, value)
          }}
        />
      ),
    },
  ]
}

/**
 * Helper function to get the appropriate CSS class for priority badge
 */
function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'High':
      return 'inline-flex px-2 py-1 rounded text-xs bg-red-900/30 text-red-400 border border-red-900/50'
    case 'Med':
      return 'inline-flex px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-900/50'
    case 'Low':
      return 'inline-flex px-2 py-1 rounded text-xs bg-green-900/30 text-green-400 border border-green-900/50'
    default:
      return 'inline-flex px-2 py-1 rounded text-xs bg-gray-900/30 text-gray-400 border border-gray-800'
  }
}
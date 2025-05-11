'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  ThemedTable,
  ThemedTableBody,
  ThemedTableCell,
  ThemedTableHead,
  ThemedTableHeader,
  ThemedTableRow,
  ThemedTableEmpty,
  ThemedTableLoading
} from '@/components/ui/themed-table'
import { ThemedDataTablePagination } from './themed-data-table-pagination'
import { ThemedDataTableToolbarWithAddBtn } from './themed-data-table-toolbar-with-add-btn'
import { useTableTheme } from '@/providers/table-theme-provider'

interface ThemedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  onAddRow?: () => void
}

export function ThemedDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  onRowSelectionChange,
  onAddRow,
}: ThemedDataTableProps<TData, TValue>) {
  const theme = useTableTheme();
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Call the onRowSelectionChange callback when row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Render loading state if data is loading
  if (isLoading) {
    return <ThemedTableLoading message="Loading requirements..." />
  }

  return (
    <div className="space-y-4">
      <ThemedDataTableToolbarWithAddBtn
        table={table}
        onAddRequirement={onAddRow}
      />
      <div className="bg-[#0A0A0A]">
        <ThemedTable>
        <ThemedTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <ThemedTableRow key={headerGroup.id} isHeader>
              {headerGroup.headers.map((header) => {
                return (
                  <ThemedTableHead
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </ThemedTableHead>
                )
              })}
            </ThemedTableRow>
          ))}
        </ThemedTableHeader>
        <ThemedTableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <ThemedTableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                alternate={index % 2 === 1}
              >
                {row.getVisibleCells().map((cell) => (
                  <ThemedTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </ThemedTableCell>
                ))}
              </ThemedTableRow>
            ))
          ) : (
            <ThemedTableEmpty colSpan={columns.length} message="No requirements found." />
          )}
        </ThemedTableBody>
      </ThemedTable>
      </div>
      <ThemedDataTablePagination table={table} />
    </div>
  )
}
'use client'

import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Trash, Plus, ListFilter, X } from 'lucide-react'
import { useTableTheme } from '@/providers/table-theme-provider'
import { useAppTheme } from '@/providers/sidenav-theme-provider'
import { ThemedButton } from '@/components/ui/themed-button'
import { ThemedInput } from '@/components/ui/themed-input'
import { Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Using our new ThemedInput component

interface ThemedDataTableToolbarProps<TData> {
  table: Table<TData>
  onDeleteSelected?: (selectedRows: TData[]) => void
}

export function ThemedDataTableToolbar<TData>({
  table,
  onDeleteSelected,
}: ThemedDataTableToolbarProps<TData>) {
  const theme = useTableTheme();
  const appTheme = useAppTheme();
  const isFiltered = table.getState().columnFilters.length > 0
  const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0

  const handleDelete = () => {
    if (onDeleteSelected) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(
        (row) => row.original
      )
      onDeleteSelected(selectedRows)
    }
  }

  // Define button classes directly in each button for clarity
  
  return (
    <div className={theme.components.tableActionBar}>
      <div className={theme.components.tableActionBarLeft}>
        {/* Themed filter input */}
        <ThemedInput
          placeholder="Filter requirements..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="w-[220px] lg:w-[270px]"
          icon={<Search className="h-4 w-4" />}
        />
        
        {/* Reset filter button */}
        {isFiltered && (
          <ThemedButton
            variant="primary"
            onClick={() => table.resetColumnFilters()}
            icon={<X className="h-4 w-4" />}
          >
            Reset
          </ThemedButton>
        )}
        
        {/* Column visibility dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ThemedButton
              variant="primary"
              icon={<ListFilter className="h-4 w-4" />}
            >
              Columns
            </ThemedButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#0F0F0F] border border-white/[0.03] rounded-md shadow-md py-1 text-white/80 text-sm mt-1 overflow-hidden min-w-[160px]"
          >
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== 'undefined' &&
                  column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize py-1.5 pl-8 pr-3 cursor-pointer hover:bg-[#121218] focus:bg-[#121218] focus:outline-none transition-colors text-white/80"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Add row button has been moved from here to the component header */}
      </div>
      
      <div className={theme.components.tableActionBarRight}>
        {/* Delete selected button */}
        {hasSelection && onDeleteSelected && (
          <ThemedButton
            variant="danger"
            onClick={handleDelete}
            icon={<Trash className="h-4 w-4" />}
          >
            Delete
          </ThemedButton>
        )}
      </div>
    </div>
  )
}
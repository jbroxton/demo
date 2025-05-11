'use client'

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react'
import { Table } from '@tanstack/react-table'
import { useTableTheme } from '@/providers/table-theme-provider'
import { useAppTheme } from '@/providers/sidenav-theme-provider'
import { ThemedButton } from '@/components/ui/themed-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemedDataTablePaginationProps<TData> {
  table: Table<TData>
}

export function ThemedDataTablePagination<TData>({
  table,
}: ThemedDataTablePaginationProps<TData>) {
  const theme = useTableTheme();
  const appTheme = useAppTheme();
  
  // Current page size from table state
  const currentPageSize = table.getState().pagination.pageSize;

  // Handle page size change
  const handlePageSizeChange = (value: number) => {
    table.setPageSize(value);
  }

  return (
    <div className={theme.components.tablePagination}>
      <div className="flex-1 text-sm text-white/60">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Rows per page dropdown using ThemedButton */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/70">Rows per page</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ThemedButton
                variant="primary"
                className="h-8 w-[70px] px-2 py-0 justify-between items-center"
              >
                <span>{currentPageSize}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
              </ThemedButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0F0F0F] border border-white/[0.03] rounded-md shadow-md py-1 text-white/80 text-sm mt-1 min-w-[80px]"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <DropdownMenuItem
                  key={pageSize}
                  className={`capitalize py-1.5 px-3 cursor-pointer hover:bg-[#121218] focus:bg-[#121218] focus:outline-none transition-colors text-white/80 ${currentPageSize === pageSize ? 'bg-[#121218] text-white' : ''}`}
                  onClick={() => handlePageSizeChange(pageSize)}
                >
                  {pageSize}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Page indicator */}
        <div className="flex min-w-[100px] items-center justify-center text-sm font-medium text-white/70">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        
        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          <ThemedButton
            variant="primary"
            className="hidden h-8 w-8 p-0 lg:flex justify-center items-center"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            icon={<ChevronsLeft className="h-4 w-4" />}
          >
            <span className="sr-only">Go to first page</span>
          </ThemedButton>
          <ThemedButton
            variant="primary"
            className="h-8 w-8 p-0 justify-center items-center"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            <span className="sr-only">Go to previous page</span>
          </ThemedButton>
          <ThemedButton
            variant="primary"
            className="h-8 w-8 p-0 justify-center items-center"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            icon={<ChevronRight className="h-4 w-4" />}
          >
            <span className="sr-only">Go to next page</span>
          </ThemedButton>
          <ThemedButton
            variant="primary"
            className="hidden h-8 w-8 p-0 lg:flex justify-center items-center"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            icon={<ChevronsRight className="h-4 w-4" />}
          >
            <span className="sr-only">Go to last page</span>
          </ThemedButton>
        </div>
      </div>
    </div>
  )
}
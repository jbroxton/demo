"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Define the table theme variables with comprehensive form controls styling
const tableTheme = {
  // Base colors - match our established theme
  colors: {
    // Background colors - subtle elevation hierarchy
    bgBase: 'bg-[#080809]',           // Base app background
    bgContainer: 'bg-[#0C0C0C]',      // Container background - slightly elevated
    bgHeader: 'bg-[#0E0E0E]',         // Header background - more elevated
    bgRow: 'bg-[#0C0C0C]',            // Default row background
    bgRowAlt: 'bg-[#0D0D0D]',         // Alternating row background
    bgRowHover: 'bg-[#121218]',       // Row hover state - matches our button hover
    bgRowSelected: 'bg-[#14141A]',    // Selected row state
    bgInput: 'bg-[#0F0F0F]',          // Input field background - stands out subtly
    
    // Border colors
    borderBase: 'border-white/[0.02]',     // Default border - matches tabs
    borderHeader: 'border-white/[0.03]',   // Header border - slightly more visible
    borderRow: 'border-white/[0.02]',      // Row border
    borderInput: 'border-white/[0.04]',    // Input field border - more visible
    
    // Text colors - readability differentiation
    textPrimary: 'text-white/90',          // Primary content - high visibility
    textSecondary: 'text-white/75',        // Secondary content
    textTertiary: 'text-white/60',         // Less important text
    textHeader: 'text-white/70',           // Header text
    textPlaceholder: 'text-white/40',      // Placeholder text
  },
  
  // Component styling
  components: {
    // Main table wrapper
    tableWrapper: `
      w-full
      overflow-hidden
      rounded-md
      border border-white/[0.02]
      shadow-sm shadow-black/10
    `,
    
    // Table element
    table: `
      w-full 
      caption-bottom 
      text-sm
    `,
    
    // Table header
    tableHeader: `
      bg-[#0E0E0E]
      border-b border-white/[0.03]
      sticky top-0
      z-10
      shadow-sm shadow-black/10
    `,
    
    // Table header row
    tableHeaderRow: `
      border-b border-white/[0.03]
    `,
    
    // Table header cell
    tableHeaderCell: `
      h-10 
      px-3 
      py-2
      text-left 
      align-middle 
      font-medium 
      text-white/70
      tracking-tight
      [&:has([role=checkbox])]:pr-0
      transition-colors
      hover:text-white/80
    `,
    
    // Table body
    tableBody: `
      [&_tr:last-child]:border-0
    `,
    
    // Table row
    tableRow: `
      border-b border-white/[0.02]
      transition-colors duration-150
      hover:bg-[#121218]
      data-[state=selected]:bg-[#14141A]
      data-[state=selected]:hover:bg-[#151520]
    `,
    
    // Table row alternating (zebra striping)
    tableRowAlt: `
      bg-[#0D0D0D]
    `,
    
    // Table cell
    tableCell: `
      p-3
      align-middle
      text-white/85
      [&:has([role=checkbox])]:pr-0
      transition-colors duration-150
    `,
    
    // Table cell with editing capabilities
    tableCellEditable: `
      p-2
      align-middle
      text-white/90
      [&:has([role=checkbox])]:pr-0
      transition-colors
      hover:bg-[#101014]
    `,

    // Form controls within tables - used for filtering, editing, etc.
    tableFormControls: `
      flex flex-col gap-1
    `,
    
    // Table footer
    tableFooter: `
      border-t
      border-white/[0.03]
      bg-[#0E0E0E]
      font-medium
      [&>tr]:last:border-b-0
    `,
    
    // Table caption
    tableCaption: `
      mt-4
      text-sm
      text-white/60
    `,
    
    // Input controls within tables
    tableInput: `
      w-full
      bg-[#0F0F0F]
      border border-white/[0.04]
      text-white/90
      text-sm
      rounded-sm
      px-2
      py-1
      h-8
      focus:outline-none
      focus:ring-1
      focus:ring-white/10
      focus:border-white/10
      placeholder:text-white/40
    `,

    // Select controls within tables
    tableSelect: `
      bg-[#0F0F0F]
      border border-white/[0.04]
      text-white/90
      text-sm
      rounded-sm
      px-1.5
      py-1
      h-8
      focus:outline-none
      focus:ring-1
      focus:ring-white/10
      focus:border-white/10
    `,

    // Dropdown content styling
    tableDropdownContent: `
      bg-[#0F0F0F]
      border border-white/[0.03]
      rounded-md
      shadow-md
      py-1
      text-white/80
      text-sm
      mt-1
      overflow-hidden
    `,

    // Dropdown items
    tableDropdownItem: `
      py-1.5
      pl-8
      pr-3
      cursor-pointer
      hover:bg-[#121218]
      focus:bg-[#121218]
      focus:outline-none
      transition-colors
      text-white/80
    `,
    
    // Checkbox styling
    tableCheckbox: `
      h-4
      w-4
      rounded-sm
      border border-white/[0.08]
      bg-[#0F0F0F]
      text-white
      focus:outline-none
      focus:ring-1
      focus:ring-white/10
      focus:ring-offset-0
    `,
    
    // Status indicators
    tableStatusHigh: `
      inline-flex 
      px-2 
      py-1 
      rounded-sm 
      text-xs
      font-medium
      bg-red-950/40
      text-red-300/90
      border border-red-900/40
    `,
    
    tableStatusMed: `
      inline-flex 
      px-2 
      py-1 
      rounded-sm 
      text-xs
      font-medium
      bg-yellow-950/30
      text-yellow-300/90
      border border-yellow-900/40
    `,
    
    tableStatusLow: `
      inline-flex 
      px-2 
      py-1 
      rounded-sm 
      text-xs
      font-medium
      bg-green-950/30
      text-green-300/90
      border border-green-900/40
    `,
    
    // Empty state styling
    tableEmpty: `
      h-16
      text-center
      text-white/50
      py-4
    `,

    // Loading state
    tableLoading: `
      w-full
      min-h-[100px]
      flex
      items-center
      justify-center
      text-white/50
    `,

    // Action bar styles
    tableActionBar: `
      flex
      items-center
      justify-between
      mb-2
      py-2
    `,

    // Action bar left section
    tableActionBarLeft: `
      flex
      items-center
      gap-3
    `,

    // Action bar right section
    tableActionBarRight: `
      flex
      items-center
      gap-3
    `,

    // Pagination styles
    tablePagination: `
      flex
      items-center
      justify-between
      py-2
      mt-2
    `,
  }
};

// Create a context for the theme
const TableThemeContext = createContext(tableTheme);

// Custom hook to use the table theme
export const useTableTheme = () => {
  const context = useContext(TableThemeContext);
  if (context === undefined) {
    throw new Error('useTableTheme must be used within a TableThemeProvider');
  }
  return context;
};

// Provider component
export function TableThemeProvider({ children }: { children: ReactNode }) {
  return (
    <TableThemeContext.Provider value={tableTheme}>
      {children}
    </TableThemeContext.Provider>
  );
}
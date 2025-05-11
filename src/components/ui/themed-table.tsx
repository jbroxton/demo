import * as React from "react"
import { cn } from "@/lib/utils"
import { useTableTheme } from "@/providers/table-theme-provider"

// Themed table components with appropriate design system integration
const ThemedTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <div className={theme.components.tableWrapper}>
      <table
        ref={ref}
        className={cn(theme.components.table, className)}
        {...props}
      />
    </div>
  );
});
ThemedTable.displayName = "ThemedTable";

const ThemedTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <thead 
      ref={ref} 
      className={cn(theme.components.tableHeader, className)} 
      {...props} 
    />
  );
});
ThemedTableHeader.displayName = "ThemedTableHeader";

const ThemedTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <tbody
      ref={ref}
      className={cn(theme.components.tableBody, className)}
      {...props}
    />
  );
});
ThemedTableBody.displayName = "ThemedTableBody";

const ThemedTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <tfoot
      ref={ref}
      className={cn(theme.components.tableFooter, className)}
      {...props}
    />
  );
});
ThemedTableFooter.displayName = "ThemedTableFooter";

interface ThemedTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  alternate?: boolean;
  isHeader?: boolean;
}

const ThemedTableRow = React.forwardRef<
  HTMLTableRowElement,
  ThemedTableRowProps
>(({ className, alternate = false, isHeader = false, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <tr
      ref={ref}
      className={cn(
        isHeader 
          ? theme.components.tableHeaderRow
          : theme.components.tableRow, 
        alternate && !isHeader ? theme.components.tableRowAlt : "",
        className
      )}
      {...props}
    />
  );
});
ThemedTableRow.displayName = "ThemedTableRow";

const ThemedTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <th
      ref={ref}
      className={cn(theme.components.tableHeaderCell, className)}
      {...props}
    />
  );
});
ThemedTableHead.displayName = "ThemedTableHead";

interface ThemedTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  editable?: boolean;
}

const ThemedTableCell = React.forwardRef<
  HTMLTableCellElement,
  ThemedTableCellProps
>(({ className, editable = false, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <td
      ref={ref}
      className={cn(
        editable ? theme.components.tableCellEditable : theme.components.tableCell, 
        className
      )}
      {...props}
    />
  );
});
ThemedTableCell.displayName = "ThemedTableCell";

// Status badge component for consistent styling
interface ThemedTableStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: 'High' | 'Med' | 'Low' | string;
}

const ThemedTableStatus = React.forwardRef<
  HTMLSpanElement,
  ThemedTableStatusProps
>(({ className, priority, ...props }, ref) => {
  const theme = useTableTheme();
  
  const getStatusClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return theme.components.tableStatusHigh;
      case 'Med':
        return theme.components.tableStatusMed;
      case 'Low':
        return theme.components.tableStatusLow;
      default:
        return theme.components.tableStatusLow;
    }
  };
  
  return (
    <span
      ref={ref}
      className={cn(getStatusClass(priority), className)}
      {...props}
    />
  );
});
ThemedTableStatus.displayName = "ThemedTableStatus";

// Input component specifically styled for table contexts
const ThemedTableInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <input
      ref={ref}
      className={cn(theme.components.tableInput, className)}
      {...props}
    />
  );
});
ThemedTableInput.displayName = "ThemedTableInput";

// Select component specifically styled for table contexts
const ThemedTableSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <select
      ref={ref}
      className={cn(theme.components.tableSelect, className)}
      {...props}
    />
  );
});
ThemedTableSelect.displayName = "ThemedTableSelect";

const ThemedTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <caption
      ref={ref}
      className={cn(theme.components.tableCaption, className)}
      {...props}
    />
  );
});
ThemedTableCaption.displayName = "ThemedTableCaption";

// Empty state component for consistent styling
interface ThemedTableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
  colSpan: number;
  message?: string;
}

const ThemedTableEmpty = React.forwardRef<
  HTMLTableRowElement,
  ThemedTableEmptyProps
>(({ className, colSpan, message = "No data available", ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <tr ref={ref} className={className} {...props}>
      <td colSpan={colSpan} className={theme.components.tableEmpty}>
        {message}
      </td>
    </tr>
  );
});
ThemedTableEmpty.displayName = "ThemedTableEmpty";

// Loading state component
interface ThemedTableLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

const ThemedTableLoading = React.forwardRef<
  HTMLDivElement,
  ThemedTableLoadingProps
>(({ className, message = "Loading data...", ...props }, ref) => {
  const theme = useTableTheme();
  
  return (
    <div 
      ref={ref} 
      className={cn(theme.components.tableLoading, className)}
      {...props}
    >
      <div className="animate-pulse">{message}</div>
    </div>
  );
});
ThemedTableLoading.displayName = "ThemedTableLoading";

export {
  ThemedTable,
  ThemedTableHeader,
  ThemedTableBody,
  ThemedTableFooter,
  ThemedTableHead,
  ThemedTableRow,
  ThemedTableCell,
  ThemedTableCaption,
  ThemedTableStatus,
  ThemedTableInput,
  ThemedTableSelect,
  ThemedTableEmpty,
  ThemedTableLoading,
};